import express from 'express';
const router = express.Router();
import {createRj, getAllRjs, getRjById, updateRj, deleteRj} from '../controllers/rjController.js';
import createUploader from '../middlewares/uploadMiddleware.js';

const upload = createUploader(); // Your memoryStorage middleware

router.post('/', upload.array('photo', 10), createRj);
router.put('/:id', upload.array('photo', 10), updateRj); // Important for edits
router.delete('/:id', deleteRj);
router.get('/:id', getRjById);
router.get('/', getAllRjs);
export default router;