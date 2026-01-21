import express from 'express';
const router = express.Router();
import * as scheduleController from '../controllers/scheduleController.js';

router.post('/', scheduleController.createSchedule);
router.get('/', scheduleController.getAllSchedules);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

export default router;