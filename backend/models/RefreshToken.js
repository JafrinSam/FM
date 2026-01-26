import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  tokenVersion: {
    type: Number,
    default: 0 // <--- Add this!
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 🛡️ SECURITY: Device Binding
  deviceId: { type: String, required: true }, // UUID from frontend
  
  // 📊 SESSION MANAGEMENT (Fingerprint)
  browser: { type: String },  // e.g., "Chrome"
  os: { type: String },       // e.g., "Windows 10"
  device: { type: String },   // e.g., "Desktop"
  cpu: { type: String },      // e.g., "amd64"
  
  createdByIp: { type: String },
  
  // Auto-delete after 7 days
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: '7d' 
  }
});

export default mongoose.model('RefreshToken', refreshTokenSchema);