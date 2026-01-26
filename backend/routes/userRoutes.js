import express from 'express';
import { 
  registerUser, 
  loginUser, 
  refreshAccessToken, 
  logoutUser, 
  createStaff, 
  completeOnboarding, 
  getAllUsers, 
  updateUserStatus,
  updateUser, 
  deleteUser, 
  getMe ,
  updateProfile, 
  uploadAvatar
} from '../controllers/userController.js';

// Import Middleware
import { verifyToken, verifyRole } from '../middlewares/auth.js';
// Optional: If you implemented Rate Limiting from previous steps
// import { loginLimiter } from '../middleware/rateLimiter.js'; 
import createUploader from '../middlewares/uploadMiddleware.js';

const router = express.Router();
const upload = createUploader()

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser); // Add loginLimiter here if used
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logoutUser);

// --- Protected Routes (Login Required) ---
router.get('/me', verifyToken, getMe);
router.post('/onboard', verifyToken, completeOnboarding);

// --- Management Routes (RBAC) ---

// 1. Create Staff (Super Admin & Admin only)
// Note: Controller handles "Admin cannot create Super Admin" logic
router.post('/staff', 
  verifyToken, 
  verifyRole('super_admin'), 
  createStaff
);

// 2. View All Users (Super Admin & Admin)
router.get('/', 
  verifyToken, 
  verifyRole('super_admin', 'admin'), 
  getAllUsers
);

// 3. User Lifecycle (Super Admin Only)
router.patch('/:id/status', 
  verifyToken, 
  verifyRole('super_admin'), 
  updateUserStatus
);

// 4. Update User Details (Super Admin Only) 🆕
router.put('/:id', 
  verifyToken, 
  verifyRole('super_admin'), // Restricted to Super Admin
  updateUser
);

router.delete('/:id', 
  verifyToken, 
  verifyRole('super_admin'), 
  deleteUser
);

router.put('/profile', verifyToken, updateProfile);
router.put('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

export default router;