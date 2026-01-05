import { Router } from 'express';
import {getNextSong} from '../controller/webHook/getNextSong.js';
import { metaData } from '../controller/webHook/metaData.js';

const router = Router();

router.get('/next-song', getNextSong);
router.post('/metadata', metaData);


export default router;
