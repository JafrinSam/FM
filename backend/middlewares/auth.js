import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { UAParser } from 'ua-parser-js'; 
import { 
  generateAccessToken, 
  generateRefreshToken, 
  refreshTokenCookieOptions 
} from '../utils/tokenUtils.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const verifyToken = async (req, res, next) => {
  console.log(`\n[Auth] 🔵 Verifying Request: ${req.method} ${req.originalUrl}`);

  // 1. Extract Tokens
  const authHeader = req.headers.authorization;
  let accessToken;
  if (authHeader && authHeader.startsWith('Bearer')) {
    accessToken = authHeader.split(' ')[1];
  }
  const refreshToken = req.cookies.refreshToken;
  const deviceId = req.headers['x-device-id'];

  try {
    if (!accessToken) throw new Error('NoToken');

    // 2. Verify Access Token
    const decoded = jwt.verify(accessToken, ACCESS_SECRET);

    // 3. Stateless Browser Check
    const userAgentHeader = req.headers['user-agent'] || '';
    if (decoded.browser && !userAgentHeader.includes(decoded.browser)) {
       const parser = new UAParser(userAgentHeader);
       const ua = parser.getResult();
       const currentBrowser = ua.browser.name || 'Unknown';
       const currentOS = ua.os.name || 'Unknown';

       if (currentBrowser !== decoded.browser || currentOS !== decoded.os) {
          console.warn(`[Auth] 🚨 Browser Mismatch! Token: ${decoded.browser}, Req: ${currentBrowser}`);
          return res.status(403).json({ message: "Security Alert: Browser mismatch" });
       }
    }

    // 4. Fetch User
    req.user = await User.findById(decoded.id)
        .select('name email role isActive tokenVersion')
        .lean();

    if (!req.user) {
        console.warn("[Auth] ❌ User not found in DB.");
        return res.status(403).json({ message: "User not found" });
    }

    if (!req.user.isActive) {
        console.warn("[Auth] ⛔ User is disabled.");
        return res.status(403).json({ message: "User disabled" });
    }

    // ✅ FIX: Handle undefined version (Backward Compatibility)
    const dbVersion = req.user.tokenVersion || 0;
    
    if (decoded.version !== dbVersion) {
        console.warn(`[Auth] 💥 Version Mismatch. Token: ${decoded.version}, DB: ${dbVersion}`);
        return res.status(403).json({ message: "Session revoked" });
    }

    return next();

  } catch (error) {
    // ... (Auto-Refresh Logic remains the same, assuming it works) ...
    // Just ensure you copy the Auto-Refresh logic from the previous working version here
    // or keep the existing catch block if you haven't changed it.
    
    // For brevity, here is the critical fix inside the catch block if you need it:
    if (error.name === 'TokenExpiredError' || error.message === 'NoToken') {
       if (!refreshToken) return res.status(401).json({ message: "Session expired" });
       
       try {
         // ... (Verification logic) ...
         const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET);
         const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
         
         if (!tokenDoc) {
             console.warn("[Auth] 🚨 Refresh Token missing in DB.");
             res.clearCookie('refreshToken', refreshTokenCookieOptions);
             return res.status(403).json({ message: "Invalid session" });
         }

         // Fetch User
         const user = await User.findById(decodedRefresh.id).lean();
         
         // ✅ FIX: Handle undefined version here too
         const userVersion = user.tokenVersion || 0;

         // Issue New Token
         const parser = new UAParser(req.headers['user-agent']);
         const currentUA = parser.getResult();
         const browserInfo = { browser: currentUA.browser.name || 'Unknown', os: currentUA.os.name || 'Unknown' };
         
         const newAccessToken = generateAccessToken(user, userVersion, browserInfo);
         res.setHeader('x-new-access-token', newAccessToken);
         
         req.user = user;
         return next();

       } catch (refreshError) {
         console.error("[Auth] Refresh Failed:", refreshError.message);
         res.clearCookie('refreshToken', refreshTokenCookieOptions);
         return res.status(403).json({ message: "Session invalid" });
       }
    }
    return res.status(403).json({ message: "Invalid token" });
  }
};


/**
 * @desc    Role-Based Access Control (RBAC)
 */
export const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.warn("[Auth] 🛡️ Role Check Failed: User not attached to request.");
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // 🚨 DEBUG: Print the role comparison
    console.log(`[Auth] 🛡️ Role Check | User: '${req.user.role}' | Allowed: [${allowedRoles.join(', ')}]`);

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`[Auth] ⛔ Access Denied. User '${req.user.email}' tried to access protected route.`);
      return res.status(403).json({ 
        success: false, 
        message: `Access denied: Role '${req.user.role}' is not authorized.` 
      });
    }

    next();
  };
};

// ... existing imports (jwt, User, RefreshToken, UAParser, utils) ...

export const optionalVerifyToken = async (req, res, next) => {
  // console.log(`[Auth] ⚪ Optional Auth Check`); 

  const authHeader = req.headers.authorization;
  const refreshToken = req.cookies.refreshToken;
  const deviceId = req.headers['x-device-id'];

  // 1. Try Validating Access Token First
  if (authHeader && authHeader.startsWith('Bearer')) {
    const accessToken = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      
      // Fetch User
      const user = await User.findById(decoded.id)
        .select('name email role isActive tokenVersion')
        .lean();

      // Check if user exists, is active, and token version matches
      if (user && user.isActive) {
         const dbVersion = user.tokenVersion || 0;
         if (decoded.version === dbVersion) {
            req.user = user; // ✅ Valid Access Token: Identity Attached
            return next();
         }
      }
    } catch (err) {
      // Access token invalid or expired. Fall through to Refresh logic...
      // console.log("[Auth] Optional Access Token invalid/expired. Attempting refresh...");
    }
  }

  // 2. Try Refresh Token (If Access Token failed or was missing)
  if (refreshToken) {
    try {
      // A. Verify Signature
      const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // B. Check Database
      const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
      
      if (tokenDoc) {
        // C. Security Check: Device ID
        // If the request has a device ID, it MUST match the token's device ID
        if (deviceId && tokenDoc.deviceId !== deviceId) {
            // console.warn("[Auth] Optional: Device mismatch. Treating as Guest.");
            return next(); 
        }

        // D. Fetch User
        const user = await User.findById(decodedRefresh.id)
             .select('name email role isActive tokenVersion')
             .lean();

        if (user && user.isActive) {
          // ✅ RESTORE IDENTITY
          req.user = user;

          // E. Issue New Access Token (Silent Refresh)
          // We capture the browser info for the new token claim
          const parser = new UAParser(req.headers['user-agent']);
          const result = parser.getResult();
          const browserInfo = {
            browser: result.browser.name || 'Unknown',
            os: result.os.name || 'Unknown'
          };
          
          const userVersion = user.tokenVersion || 0;
          const newAccessToken = generateAccessToken(user, userVersion, browserInfo);
          
          // Send new token to frontend via header
          res.setHeader('x-new-access-token', newAccessToken);
          // console.log("[Auth] 🔄 Optional Auth: Session restored via Refresh Token");
        }
      }
    } catch (refreshErr) {
       // Refresh failed (expired/invalid) -> Proceed as Guest
       // console.warn("[Auth] Optional refresh failed:", refreshErr.message);
    }
  }

  // 3. Proceed (req.user is either set or undefined)
  next();
};