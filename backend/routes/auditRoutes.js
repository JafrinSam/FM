import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';

const router = express.Router();

// Allow Super Admin, Admin, and Event Manager to see logs
// (The controller handles WHOSE logs they see)
router.get(
  '/', 
  verifyToken, 
  verifyRole('super_admin', 'admin', 'event_manager'), 
  getAuditLogs
);

export default router;