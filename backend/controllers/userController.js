import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js'; // ✅ Correct Import

// Import shared utilities
import { 
  generateAccessToken, 
  generateRefreshToken, 
  refreshTokenCookieOptions 
} from '../utils/tokenUtils.js';

// --- 1. Configuration ---
const PEPPER = process.env.PEPPER_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET; 

if (!PEPPER || !REFRESH_SECRET) {
  console.error("❌ CRITICAL: Security secrets missing in .env");
  process.exit(1);
}

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1
};

/**
 * @desc    Public Registration
 * @route   POST /api/users/register
 */
export const registerUser = async (req, res) => {
  console.log(`[UserCtrl] 📝 Register attempt for: ${req.body.email}`);
  try {
    const { name, email, password, avatar } = req.body;

    if (await User.findOne({ email })) {
      console.warn(`[UserCtrl] ⚠️ Register failed: Email exists (${email})`);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await argon2.hash(password + PEPPER, ARGON_OPTIONS);

    // ✅ FIX: Explicitly set tokenVersion to 0 to prevent "undefined" bugs
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar,
      role: 'user',
      authProvider: 'local',
      tokenVersion: 0 
    });

    // Generate Tokens (Pass 0 explicitly)
    const accessToken = generateAccessToken(user, 0, {}); 
    const refreshToken = generateRefreshToken(user._id);

    // Save Refresh Token
    await RefreshToken.create({ 
      token: refreshToken, 
      user: user._id, 
      createdByIp: req.ip 
    });

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
    
    console.log(`[UserCtrl] ✅ Registered successfully: ${user.email}`);
    
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: accessToken
      }
    });

  } catch (err) {
    console.error(`[UserCtrl] 🔥 Register Error: ${err.message}`);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Login User
 * @route   POST /api/users/login
 */
export const loginUser = async (req, res) => {
  console.log(`[UserCtrl] 🔑 Login attempt for: ${req.body.email}`);
  try {
    const { email, password } = req.body;
    
    // 1. Validate User & Password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        console.warn(`[UserCtrl] ❌ Login failed: User not found`);
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (!user.isActive) {
        console.warn(`[UserCtrl] ⛔ Login failed: Account disabled`);
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await argon2.verify(user.password, password + process.env.PEPPER_SECRET);
    if (!isMatch) {
        console.warn(`[UserCtrl] ❌ Login failed: Wrong password`);
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 2. 🛡️ Check Device ID
    const deviceId = req.headers['x-device-id'];
    console.log(`[UserCtrl] 📱 Device ID present: ${!!deviceId}`);
    
    if (!deviceId) return res.status(400).json({ success: false, message: "Device ID missing" });

    // 3. 📊 Parse Browser Fingerprint
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();

    // ✅ PREPARE BROWSER INFO OBJECT
    const browserInfo = {
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown'
    };

    // 4. Generate Tokens (Safe Version Check)
    const tokenVersion = user.tokenVersion || 0; // ✅ Fallback to 0 if undefined
    const accessToken = generateAccessToken(user, tokenVersion, browserInfo);
    
    const refreshToken = generateRefreshToken(user._id);

    // 5. Save Refresh Token to DB
    await RefreshToken.create({ 
      token: refreshToken, 
      user: user._id, 
      deviceId: deviceId, 
      browser: browserInfo.browser,
      os: browserInfo.os,
      device: result.device.type || 'Desktop',
      cpu: result.cpu.architecture,
      createdByIp: req.ip 
    });

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
    
    console.log(`[UserCtrl] ✅ Login success: ${user.name} (${user.role})`);
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        role: user.role,
        token: accessToken 
      }
    });
  } catch (err) {
    console.error(`[UserCtrl] 🔥 Login Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Refresh Token Endpoint (Manual)
 * NOTE: Middleware usually handles this, but this exists for manual calls.
 */
export const refreshAccessToken = async (req, res) => {
  console.log(`[UserCtrl] 🔄 Manual Refresh Requested`);
  const incomingRefreshToken = req.cookies.refreshToken;
  const incomingDeviceId = req.headers['x-device-id'];
  const { oldAccessToken } = req.body; 

  if (!incomingRefreshToken) return res.status(401).json({ message: "No refresh token" });
  if (!oldAccessToken) return res.status(400).json({ message: "Old Access Token missing" });

  try {
    const decodedRefresh = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    const decodedAccess = jwt.verify(oldAccessToken, process.env.JWT_ACCESS_SECRET, { ignoreExpiration: true });

    if (decodedRefresh.id !== decodedAccess.id) {
        console.warn(`[UserCtrl] 🚨 Identity Mismatch during refresh`);
        res.clearCookie('refreshToken', refreshTokenCookieOptions);
        return res.status(403).json({ message: "Identity mismatch. Session revoked." });
    }

    const tokenDoc = await RefreshToken.findOne({ token: incomingRefreshToken });
    if (!tokenDoc) {
      console.warn(`[UserCtrl] ❌ Refresh Token not found in DB`);
      res.clearCookie('refreshToken', refreshTokenCookieOptions);
      return res.status(403).json({ message: "Invalid session" });
    }

    if (tokenDoc.deviceId !== incomingDeviceId) {
      console.warn(`[UserCtrl] 🚨 Device ID Mismatch during refresh`);
      await tokenDoc.deleteOne();
      res.clearCookie('refreshToken', refreshTokenCookieOptions);
      return res.status(403).json({ message: "Unrecognized Device" });
    }

    const parser = new UAParser(req.headers['user-agent']);
    const current = parser.getResult();
    
    if (tokenDoc.browser !== current.browser.name || tokenDoc.os !== current.os.name) {
       console.warn(`[UserCtrl] 🚨 Browser/OS Mismatch during refresh`);
       await tokenDoc.deleteOne();
       res.clearCookie('refreshToken', refreshTokenCookieOptions);
       return res.status(403).json({ message: "Browser/OS Mismatch" });
    }

    const user = await User.findById(decodedRefresh.id);
    if (!user || !user.isActive) return res.status(403).json({ message: "Account disabled" });

    // Generate New Token (Pass browser info if possible, or empty)
    const browserInfo = { browser: current.browser.name || 'Unknown', os: current.os.name || 'Unknown' };
    const newAccessToken = generateAccessToken(user, user.tokenVersion || 0, browserInfo);

    console.log(`[UserCtrl] ✅ Manual Refresh Success`);
    res.status(200).json({ success: true, accessToken: newAccessToken });

  } catch (error) {
    console.error(`[UserCtrl] 🔥 Refresh Error: ${error.message}`);
    res.clearCookie('refreshToken', refreshTokenCookieOptions);
    return res.status(403).json({ message: "Session invalid" });
  }
};

/**
 * @desc    Logout
 */
export const logoutUser = async (req, res) => {
  console.log(`[UserCtrl] 👋 Logout requested`);
  const token = req.cookies.refreshToken;
  if (token) {
    await RefreshToken.deleteOne({ token });
  }
  res.clearCookie('refreshToken', refreshTokenCookieOptions);
  res.status(200).json({ success: true, message: "Logged out" });
};

/**
 * @desc    Create Internal Staff
 */
export const createStaff = async (req, res) => {
  console.log(`[UserCtrl] 👨‍💼 Create Staff attempt by: ${req.user.email}`);
  try {
    const { name, email, password, role, avatar } = req.body;

    if (req.user.role === 'admin' && (role === 'super_admin' || role === 'admin')) {
      console.warn(`[UserCtrl] ⛔ Admin tried to create another Admin/SuperAdmin`);
      return res.status(403).json({ success: false, message: "Admins cannot create other Admins" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await argon2.hash(password + PEPPER, ARGON_OPTIONS);

    // ✅ FIX: Set tokenVersion
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      avatar,
      createdBy: req.user._id,
      mustChangePassword: true,
      tokenVersion: 0 
    });

    console.log(`[UserCtrl] ✅ Staff Created: ${newUser.email}`);
    res.status(201).json({
      success: true,
      message: "Staff created. Password reset required on login.",
      data: { id: newUser._id, email: newUser.email, role: newUser.role }
    });

  } catch (err) {
    console.error(`[UserCtrl] 🔥 CreateStaff Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Complete Onboarding
 */
export const completeOnboarding = async (req, res) => {
  console.log(`[UserCtrl] 🚀 Onboarding attempt: ${req.user.email}`);
  try {
    const { newPassword, googleId, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.mustChangePassword) {
      return res.status(400).json({ success: false, message: "Onboarding already completed" });
    }

    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ message: "Password too short" });
      user.password = await argon2.hash(newPassword + PEPPER, ARGON_OPTIONS);
      user.mustChangePassword = false;
      await user.save();
      console.log(`[UserCtrl] ✅ Onboarding: Password set`);
      return res.json({ success: true, message: "Password updated" });
    }

    if (googleId && email) {
      if (email.toLowerCase() !== user.email.toLowerCase()) {
        return res.status(400).json({ message: "Email mismatch" });
      }
      user.googleId = googleId;
      user.authProvider = 'hybrid';
      user.mustChangePassword = false;
      await user.save();
      console.log(`[UserCtrl] ✅ Onboarding: Google linked`);
      return res.json({ success: true, message: "Account linked to Google" });
    }

    res.status(400).json({ success: false, message: "Invalid action" });

  } catch (err) {
    console.error(`[UserCtrl] 🔥 Onboarding Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get All Users
 */
export const getAllUsers = async (req, res) => {
  console.log(`[UserCtrl] 👥 Fetching users (Req by: ${req.user.role})`);
  try {
    const { role, search } = req.query;
    let query = {};
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === 'admin') {
      query.role = { $ne: 'super_admin' };
    }

    const users = await User.find(query)
      .select('-password') 
      .populate('createdBy', 'name') 
      .sort({ createdAt: -1 });

    console.log(`[UserCtrl] ✅ Found ${users.length} users`);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error(`[UserCtrl] 🔥 GetAllUsers Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update Status
 */
export const updateUserStatus = async (req, res) => {
  console.log(`[UserCtrl] 🚦 Update Status for ID: ${req.params.id}`);
  try {
    const { isActive } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (targetUser.role === 'super_admin') return res.status(403).json({ message: "Cannot change Super Admin status" });

    targetUser.isActive = isActive;
    await targetUser.save();
    console.log(`[UserCtrl] ✅ Status updated to: ${isActive}`);
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error(`[UserCtrl] 🔥 UpdateStatus Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Delete User
 */
export const deleteUser = async (req, res) => {
  console.log(`[UserCtrl] 🗑️ Delete User ID: ${req.params.id}`);
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (targetUser._id.equals(req.user._id)) return res.status(400).json({ message: "Cannot delete yourself" });

    await targetUser.deleteOne();
    console.log(`[UserCtrl] ✅ User deleted`);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(`[UserCtrl] 🔥 DeleteUser Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get Me
 */
// --- GET CURRENT USER (For Profile Tab) ---
export const getMe = async (req, res) => {
  console.log(`\n[UserCtrl] 👤 Get Me Profile Requested by: ${req.user?._id}`);
  
  try {
    const user = await User.findById(req.user._id).select('name email avatar role createdAt');
    
    if (!user) {
        console.warn(`[UserCtrl] ❌ User not found in DB`);
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`[UserCtrl] ✅ Profile fetched: ${user.email}`);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`[UserCtrl] 🔥 GetMe Error:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- UPDATE PROFILE DETAILS ---
export const updateProfile = async (req, res) => {
  console.log(`\n[UserCtrl] ✏️ Update Profile Request: ${req.user?._id}`);
  console.log(`[UserCtrl] 📦 Body:`, req.body);

  try {
    const { name } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { name }, 
      { new: true, runValidators: true }
    ).select('name email avatar role');

    console.log(`[UserCtrl] ✅ Profile updated: "${name}"`);
    res.status(200).json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    console.error(`[UserCtrl] 🔥 UpdateProfile Error:`, error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// --- UPLOAD AVATAR ---
export const uploadAvatar = async (req, res) => {
  console.log(`\n[UserCtrl] 🖼️ Upload Avatar Request: ${req.user?._id}`);

  try {
    if (!req.file) {
        console.warn(`[UserCtrl] ⚠️ No file provided`);
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    console.log(`[UserCtrl] 📁 File: ${req.file.originalname} (${req.file.size} bytes)`);

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Upload to MinIO
    console.log(`[UserCtrl] ☁️ Uploading to MinIO...`);
    const fileUrl = await MinioService.uploadBuffer(req.file, 'avatars');
    console.log(`[UserCtrl] ✅ Upload Success: ${fileUrl}`);

    // 2. Cleanup old avatar
    if (user.avatar && !user.avatar.includes('default-avatar')) {
      console.log(`[UserCtrl] 🗑️ Deleting old avatar`);
      await MinioService.deleteFile(user.avatar);
    }

    // 3. Save new URL
    user.avatar = fileUrl;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Avatar updated', 
      data: { avatar: fileUrl } 
    });

  } catch (error) {
    console.error("[UserCtrl] 🔥 Avatar Upload Error:", error);
    res.status(500).json({ success: false, message: 'Avatar upload failed' });
  }
};

/**
 * @desc    Update User Details
 */
export const updateUser = async (req, res) => {
  console.log(`[UserCtrl] ✏️ Update User ID: ${req.params.id}`);
  try {
    const { name, email, role, password, isActive } = req.body;
    const userId = req.params.id;

    // 1. Find the target user
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Safety Check
    if (req.user._id.equals(userToUpdate._id) && role && role !== 'super_admin') {
      return res.status(400).json({ success: false, message: "You cannot demote yourself." });
    }

    // 3. Handle Email Update
    if (email && email !== userToUpdate.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      userToUpdate.email = email;
    }

    // 4. Update Fields
    if (name) userToUpdate.name = name;
    if (role) userToUpdate.role = role;
    if (typeof isActive !== 'undefined') userToUpdate.isActive = isActive;

    // 5. Handle Password Reset
    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
      }
      userToUpdate.password = await argon2.hash(password + PEPPER, ARGON_OPTIONS);
      
      // OPTIONAL: Reset tokens on password change (Kill Switch)
      // userToUpdate.tokenVersion = (userToUpdate.tokenVersion || 0) + 1;
    }

    await userToUpdate.save();

    console.log(`[UserCtrl] ✅ Update success: ${userToUpdate.email}`);
    res.json({ 
      success: true, 
      message: "User updated successfully",
      data: {
        _id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        role: userToUpdate.role,
        isActive: userToUpdate.isActive
      }
    });

  } catch (err) {
    console.error(`[UserCtrl] 🔥 UpdateUser Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};