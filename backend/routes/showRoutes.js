import express from 'express';
import createUploader from '../middlewares/uploadMiddleware.js';
import * as showController from '../controllers/showController.js';

const router = express.Router();
const upload = createUploader(); // Uses memoryStorage

// 'CoverImage' must match the FormData key sent from React
router.post('/', upload.single('CoverImage'), showController.createShow);
router.put('/:id', upload.single('CoverImage'), showController.updateShow);
router.delete('/:id', showController.deleteShow);
router.get('/:id', showController.getShowById);
router.get('/', showController.getAllShows);

export default router;