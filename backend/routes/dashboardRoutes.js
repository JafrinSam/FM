// backend/routes/dashboardRoutes.js
import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js'; // The controller we wrote earlier
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/stats', verifyToken, getDashboardStats);

export default router;