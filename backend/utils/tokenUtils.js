import jwt from 'jsonwebtoken';

export const generateAccessToken = (user, tokenVersion = 0, browserInfo = {}) => {
  return jwt.sign(
    { 
      id: user._id, 
      version: tokenVersion,
      // 🛡️ BINDING: Embed browser info directly in the token
      browser: browserInfo.browser,
      os: browserInfo.os
    }, 
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};