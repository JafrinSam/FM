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
  getMe,
  updateProfile, 
  uploadAvatar
} from '../controllers/userController.js';

import { verifyToken, verifyRole } from '../middlewares/auth.js';
import createUploader from '../middlewares/uploadMiddleware.js';

const router = express.Router();
const upload = createUploader();

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logoutUser);

// --- Protected Routes (Login Required) ---
router.get('/me', verifyToken, getMe);
router.post('/onboard', verifyToken, completeOnboarding);

// ✅ SPECIFIC ROUTES MUST COME FIRST (Before /:id)
router.put('/profile', verifyToken, updateProfile);
router.put('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

// --- Management Routes (RBAC) ---
router.post('/staff', 
  verifyToken, 
  verifyRole('super_admin'), 
  createStaff
);

router.get('/', 
  verifyToken, 
  verifyRole('super_admin', 'admin'), 
  getAllUsers
);

// ✅ DYNAMIC ROUTES (:id) MUST BE LAST
router.patch('/:id/status', 
  verifyToken, 
  verifyRole('super_admin'), 
  updateUserStatus
);

router.put('/:id', 
  verifyToken, 
  verifyRole('super_admin'), 
  updateUser
);

router.delete('/:id', 
  verifyToken, 
  verifyRole('super_admin'), 
  deleteUser
);

export default router;