import express from 'express';
import createUploader from '../middlewares/uploadMiddleware.js';
import * as showController from '../controllers/showController.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';

const router = express.Router();
const upload = createUploader();

// --- PUBLIC ROUTES ---
router.get('/', showController.getAllShows);

// ✅ NEW: Specific route for featured shows
// MUST be defined BEFORE router.get('/:id')
router.get('/featured', showController.getFeaturedShows);

router.get('/:id', showController.getShowById);

// --- PROTECTED ROUTES (Admin Only) ---
router.post(
  '/', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  upload.single('CoverImage'), 
  showController.createShow
);

router.put(
  '/:id', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  upload.single('CoverImage'), 
  showController.updateShow
);

router.delete(
  '/:id', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  showController.deleteShow
);

export default router;