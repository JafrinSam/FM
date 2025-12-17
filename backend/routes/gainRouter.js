import { Router } from 'express';
import { 
  setGain, 
  getGainStatus,
} from '../controller/gainController.js'; // Ensure the path is correct

const router = Router();


// --- Gain Control ---
router.post('/set/:type', setGain);  // Set specific gain (music, mic, master)
router.get('/status', getGainStatus); // Get all current gain levels


export default router;