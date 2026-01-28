import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // --- 1. Basic Identity ---
  name: { 
    type: String, 
    required: [true, "Name is required"], 
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 
      "Please provide a valid email address"
    ]
  },
  
  // Security: Exclude password by default
  password: { 
    type: String, 
    select: false,
    minlength: [8, "Password must be at least 8 characters long"] 
    // Note: Not 'required' to allow Google-only logins
  },

  // --- NEW: Profile Image ---
  avatar: { 
    type: String, 
    default: "",
    trim: true,
/*     validate: {
      validator: function(v) {
        // Validates only if a value is provided (allows empty default)
        if (!v) return true;
        return /^(http?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: "Please provide a valid image URL"
    } */
  },
  
  // --- 3. Roles & Permissions ---
  role: { 
    type: String, 
    enum: {
      values: ['super_admin', 'admin', 'event_manager', 'user'],
      message: '{VALUE} is not a valid role'
    }, 
    default: 'user' 
  },

  // --- 4. Logic Flags ---
  mustChangePassword: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  
  authProvider: { 
    type: String, 
    enum: ['local', 'google', 'hybrid'], 
    default: 'local' 
  },
  
  isActive: { type: Boolean, default: true },
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }

}, { timestamps: true });

export default mongoose.model('User', userSchema);