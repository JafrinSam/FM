import rjroute from './rjRoutes.js';
import showroute from './showRoutes.js';
import scheduleRoute from './scheduleRoutes.js';
import {skipSong} from '../controllers/stationController.js';
import userRoutes from './userRoutes.js';
import eventRoutes from './eventRoutes.js';
import authRoutes from './authRoutes.js';


import express from 'express';

const router = express.Router();

router.use('/rjs', rjroute);
router.use('/shows', showroute);
router.use('/weekly-schedules', scheduleRoute);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/auth', authRoutes);
router.post('/station/skip', skipSong);

export default router;