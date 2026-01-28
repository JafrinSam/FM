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

/**
 * 🛠️ HELPER: Normalize browser names to prevent False Positives
 * Example: "Mobile Chrome" -> "chrome", "Chrome" -> "chrome"
 */
const normalizeBrowser = (name) => {
  if (!name) return 'unknown';
  return name.toLowerCase().replace('mobile ', '').trim();
};

/**
 * @desc    Verify Access Token (Strict Security)
 */
export const verifyToken = async (req, res, next) => {
  // console.log(`\n[Auth] 🔵 Verifying Request: ${req.method} ${req.originalUrl}`);

  // 1. Extract Tokens
  const authHeader = req.headers.authorization;
  let accessToken;
  if (authHeader && authHeader.startsWith('Bearer')) {
    accessToken = authHeader.split(' ')[1];
  }
  const refreshToken = req.cookies.refreshToken;

  try {
    if (!accessToken) throw new Error('NoToken');

    // 2. Verify Access Token
    const decoded = jwt.verify(accessToken, ACCESS_SECRET);

    // 3. 🛡️ SMART BROWSER CHECK
    const userAgentHeader = req.headers['user-agent'] || '';
    
    // Only perform check if the token actually has browser info
    if (decoded.browser) {
       const parser = new UAParser(userAgentHeader);
       const ua = parser.getResult();
       
       const currentBrowser = ua.browser.name || 'Unknown';
       
       // Normalize strings (strip 'Mobile', lowercase)
       const tokenBrowserNorm = normalizeBrowser(decoded.browser);
       const reqBrowserNorm = normalizeBrowser(currentBrowser);

       // Compare Normalized Browser
       // We ignore minor OS differences or "Mobile" prefixes here to prevent DevTools issues
       if (tokenBrowserNorm !== reqBrowserNorm) {
          console.warn(`[Auth] 🚨 Browser Mismatch! Token: ${decoded.browser} (${tokenBrowserNorm}), Req: ${currentBrowser} (${reqBrowserNorm})`);
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

    // ✅ Version Check
    const dbVersion = req.user.tokenVersion || 0;
    if (decoded.version !== dbVersion) {
        console.warn(`[Auth] 💥 Version Mismatch. Token: ${decoded.version}, DB: ${dbVersion}`);
        return res.status(403).json({ message: "Session revoked" });
    }

    return next();

  } catch (error) {
    // --- AUTO REFRESH LOGIC ---
    if (error.name === 'TokenExpiredError' || error.message === 'NoToken') {
       if (!refreshToken) return res.status(401).json({ message: "Session expired" });
       
       try {
         // Verify Refresh Token
         const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET);
         const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
         
         if (!tokenDoc) {
             console.warn("[Auth] 🚨 Refresh Token missing in DB.");
             res.clearCookie('refreshToken', refreshTokenCookieOptions);
             return res.status(403).json({ message: "Invalid session" });
         }

         // Fetch User
         const user = await User.findById(decodedRefresh.id).lean();
         const userVersion = user.tokenVersion || 0;

         // Get Current Browser Info for new token
         const parser = new UAParser(req.headers['user-agent']);
         const currentUA = parser.getResult();
         const browserInfo = { 
            browser: currentUA.browser.name || 'Unknown', 
            os: currentUA.os.name || 'Unknown' 
         };
         
         // Issue New Access Token
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

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`[Auth] ⛔ Access Denied. User '${req.user.email}' (${req.user.role}) tried to access protected route.`);
      return res.status(403).json({ 
        success: false, 
        message: `Access denied: Role '${req.user.role}' is not authorized.` 
      });
    }

    next();
  };
};

/**
 * @desc    Optional Authentication
 * Attaches user to req.user if valid token exists, otherwise proceeds as guest.
 */
export const optionalVerifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const refreshToken = req.cookies.refreshToken;
  const deviceId = req.headers['x-device-id'];

  // 1. Try Validating Access Token First
  if (authHeader && authHeader.startsWith('Bearer')) {
    const accessToken = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(accessToken, ACCESS_SECRET);
      
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
    }
  }

  // 2. Try Refresh Token (Silent Refresh)
  if (refreshToken) {
    try {
      const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET);
      const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
      
      if (tokenDoc) {
        // Device ID Security Check
        if (deviceId && tokenDoc.deviceId !== deviceId) {
            // console.warn("[Auth] Optional: Device mismatch. Treating as Guest.");
            return next(); 
        }

        const user = await User.findById(decodedRefresh.id)
             .select('name email role isActive tokenVersion')
             .lean();

        if (user && user.isActive) {
          req.user = user;

          // Issue New Access Token (Silent Refresh)
          const parser = new UAParser(req.headers['user-agent']);
          const result = parser.getResult();
          const browserInfo = {
            browser: result.browser.name || 'Unknown',
            os: result.os.name || 'Unknown'
          };
          
          const userVersion = user.tokenVersion || 0;
          const newAccessToken = generateAccessToken(user, userVersion, browserInfo);
          
          res.setHeader('x-new-access-token', newAccessToken);
        }
      }
    } catch (refreshErr) {
       // Refresh failed -> Proceed as Guest
    }
  }

  // 3. Proceed (req.user is either set or undefined)
  next();
};