import express from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get('/', scheduleController.getAllSchedules);

router.get('/public', scheduleController.getPublicSchedules);

// --- PROTECTED ROUTES (Admin Only) ---
router.post(
  '/', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  scheduleController.createSchedule
);

router.put(
  '/:id', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  scheduleController.updateSchedule
);

router.delete(
  '/:id', 
  verifyToken, 
  verifyRole('admin', 'super_admin'), 
  scheduleController.deleteSchedule
);

export default router;