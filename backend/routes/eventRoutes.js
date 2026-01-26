import express from 'express';
import { 
  createEvent, 
  getAllEvents, 
  getEvent, 
  updateEvent, 
  deleteEvent,
  uploadThumbnail, // <--- IMPORT THIS
  getEventStats 
} from '../controllers/eventController.js';

import { verifyToken, verifyRole , optionalVerifyToken } from '../middlewares/auth.js';

// --- IMPORTANT: You need a multer middleware for file uploads ---
// If you have a configured upload middleware, import it. 
// Otherwise, here is a basic memory storage setup:
import createUploader from '../middlewares/uploadMiddleware.js';

const router = express.Router();
const upload = createUploader()
// -------------------------------------------------------------

// Public Routes
router.get('/', optionalVerifyToken, getAllEvents);
router.get('/:slug', getEvent);

// Admin / Stats
router.get('/admin/stats', verifyToken, verifyRole('admin', 'super_admin'), getEventStats);

// Create Event (Step 1: Text)
router.post('/', verifyToken, verifyRole('admin', 'super_admin', 'event_manager'), createEvent);

// Update Event (Text) and Delete
router.route('/:id')
  .put(verifyToken, verifyRole('admin', 'super_admin', 'event_manager'), updateEvent)
  .delete(verifyToken, verifyRole('admin', 'super_admin', 'event_manager'), deleteEvent);

// --- NEW ROUTE: Upload/Update Thumbnail ---
// This handles Step 2 of creation AND updating the image later
router.put('/:id/thumbnail', 
    verifyToken, 
    verifyRole('admin', 'super_admin', 'event_manager'), 
    upload.single('thumbnail'), // Ensure this matches frontend key
    uploadThumbnail
);

export default router;