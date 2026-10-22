import express from 'express';
import { getSystemStatus } from '../controller/statusService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const status = await getSystemStatus();
  
  // Calculate overall health (true if all are true)
  const isHealthy = Object.values(status).every(val => val === true || typeof val === 'string');
  
  res.json({ 
    healthy: isHealthy, 
    services: status 
  });
});

export default router;