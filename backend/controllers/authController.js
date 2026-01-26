import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import argon2 from 'argon2'; // ✅ Replaced bcrypt

const PEPPER = process.env.PEPPER_SECRET;
const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1
};

// --- CHANGE PASSWORD ---
export const changePassword = async (req, res) => {
  console.log(`\n[AuthCtrl] 🔑 Change Password Request: ${req.user?._id}`);
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 1. Verify Current Password (Argon2)
    const isMatch = await argon2.verify(user.password, currentPassword + PEPPER);
    
    if (!isMatch) {
      console.warn(`[AuthCtrl] ❌ Incorrect current password`);
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // 2. Hash New Password
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password too short' });
    }

    user.password = await argon2.hash(newPassword + PEPPER, ARGON_OPTIONS);
    
    // Optional: Revoke all other sessions for security
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    
    await user.save();

    console.log(`[AuthCtrl] ✅ Password changed successfully`);
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(`[AuthCtrl] 🔥 ChangePassword Error:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- REVOKE ALL SESSIONS ---
export const revokeSessions = async (req, res) => {
  console.log(`\n[AuthCtrl] 🚨 Revoke All Sessions Request: ${req.user?._id}`);
  
  try {
    const userId = req.user._id;

    // 1. Increment Token Version (Invalidates Access Tokens)
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });

    // 2. Delete All Refresh Tokens
    const result = await RefreshToken.deleteMany({ user: userId }); // Note: Field is likely 'user' not 'userId' based on typical schema

    console.log(`[AuthCtrl] ✅ Revoked ${result.deletedCount} sessions`);
    
    res.status(200).json({ success: true, message: 'All devices signed out successfully.' });
  } catch (error) {
    console.error("[AuthCtrl] 🔥 RevokeSessions Error:", error);
    res.status(500).json({ success: false, message: 'Failed to revoke sessions' });
  }
};