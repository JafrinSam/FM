import express from 'express';
import { mixerController } from '../controller/mixerController.js';

const router = express.Router();

// --- Live Mixer Controls ---

// Adjust volume level
// POST /api/mixer/volume
router.post('/volume', mixerController.setVolume);

// Toggle mute/unmute
// POST /api/mixer/mute
router.post('/mute', mixerController.setMute);

export default router;