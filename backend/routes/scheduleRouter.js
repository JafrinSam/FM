import { Router } from 'express';
import { 
  listSchedules, 
  addSchedule, 
  updateSchedule, 
  deleteSchedule 
} from '../controller/scheduleController.js'; // Ensure path is correct

const router = Router();

// Routes for CRUD operations on the MongoDB schedule list
router.get('/', listSchedules);
router.post('/', addSchedule);
router.put('/:id', updateSchedule); 
router.delete('/:id', deleteSchedule);

export default router;