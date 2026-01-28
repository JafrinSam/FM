import express from 'express';
import { 
  createRj, 
  getAllRjs, 
  getRjById, 
  updateRj, 
  deleteRj 
} from '../controllers/rjController.js';
import createUploader from '../middlewares/uploadMiddleware.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js'; // Import Auth

const router = express.Router();
const upload = createUploader(); 

// --- PUBLIC ROUTES ---
router.get('/', getAllRjs);
router.get('/:id', getRjById);

// --- PROTECTED ROUTES (Admin Only) ---
// Apply verifyToken first to decode user, then verifyRole to check permissions
router.post(
  '/', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), // Only Admins can create RJs
  upload.array('photo', 10), 
  createRj
);

router.put(
  '/:id', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  upload.array('photo', 10), 
  updateRj
);

router.delete(
  '/:id', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  deleteRj
);

export default router;