import express from 'express';
import { changePassword, revokeSessions } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();
// ... other auth routes (login/register) ...

router.post('/change-password', verifyToken, changePassword);
router.post('/revoke-sessions', verifyToken, revokeSessions);

export default router;