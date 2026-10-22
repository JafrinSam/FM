import { Router } from 'express';
import { 
  queueAdd, 
  queueSkip, 
  queueStatus,
} from '../controller/queueController.js'; // Ensure the path is correct

const router = Router();

// --- Queue & Control ---
router.post('/add', queueAdd);      // Add song to queue
router.post('/skip', queueSkip);    // Skip current song
router.get('/status', queueStatus); // Get current queue

export default router;