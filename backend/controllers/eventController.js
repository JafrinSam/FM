import CollegeEvent from '../models/CollegeEvent.js';
import MinioService from '../services/minioService.js';
import mongoose from 'mongoose';
import { logAudit } from '../services/auditService.js'; // ✅ Import Audit Service
import { getChanges } from '../utils/diffHelper.js';     // ✅ Import Diff Utility

// --- HELPER: Error Handler ---
const handleError = (res, error) => {
  if (error.code === 11000) {
    console.warn(`[EventCtrl] ⚠️ Duplicate Key Error: ${error.message}`);
    return res.status(400).json({ success: false, message: 'Event title already exists.' });
  }
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    console.warn(`[EventCtrl] ⚠️ Validation Error: ${messages.join(', ')}`);
    return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
  }
  console.error("[EventCtrl] 🔥 SERVER ERROR:", error);
  res.status(500).json({ success: false, message: error.message || 'Server Error' });
};

// =======================================================
// STEP 1: CREATE EVENT
// =======================================================
export const createEvent = async (req, res) => {
  console.log(`\n[EventCtrl] 📝 CREATE Event Request`);
  console.log(`[EventCtrl] 👤 User: ${req.user?._id} (${req.user?.role})`);

  try {
    if (!req.user || !req.user._id) {
        console.warn("[EventCtrl] ⛔ Unauthorized create attempt");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { 
      title, description, summary, category, 
      date, time, 
      endDate, endTime, 
      location, organizers, 
      registrationLink, capacity, registrationStatus, isFeatured 
    } = req.body;

    const newEvent = await CollegeEvent.create({
      title, description, summary, category,
      date, time,
      endDate, endTime,
      location, organizers, 
      registrationLink, capacity, registrationStatus, isFeatured,
      createdBy: req.user._id,
      creationStatus: 'pending' 
    });

    console.log(`[EventCtrl] ✅ Draft Created: "${newEvent.title}" (ID: ${newEvent._id})`);

    // 🛡️ Audit Log (Create)
    logAudit({
      req,
      action: 'CREATE',
      entityType: 'CollegeEvent',
      entityId: newEvent._id,
      entityName: newEvent.title,
      changes: { initialData: req.body } // Log what was sent
    });

    res.status(201).json({
      success: true,
      message: 'Event draft created. Please upload thumbnail next.',
      data: newEvent
    });

  } catch (error) {
    handleError(res, error);
  }
};

// =======================================================
// STEP 2: UPLOAD THUMBNAIL
// =======================================================
export const uploadThumbnail = async (req, res) => {
  const eventId = req.params.id;
  console.log(`\n[EventCtrl] 🖼️ UPLOAD Thumbnail Request: ${eventId}`);
  
  try {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const event = await CollegeEvent.findById(eventId);
    if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Capture old value for Audit Diff
    const oldThumbnail = event.thumbnail;

    // Upload
    console.log("[EventCtrl] ☁️ Uploading to MinIO...");
    const fileUrl = await MinioService.uploadBuffer(req.file, 'events');
    
    // Cleanup old image
    if (oldThumbnail && !oldThumbnail.includes('default-event.jpg')) {
      await MinioService.deleteFile(oldThumbnail).catch(e => console.warn("Cleanup failed", e));
    }

    // Update DB
    event.thumbnail = fileUrl;
    if (event.creationStatus === 'pending') {
        event.creationStatus = 'completed'; 
    }
    event.updatedBy = req.user._id;
    await event.save();

    console.log(`[EventCtrl] ✅ Thumbnail Updated`);

    // 🛡️ Audit Log (Update Thumbnail)
    logAudit({
      req,
      action: 'UPDATE',
      entityType: 'CollegeEvent',
      entityId: event._id,
      entityName: event.title,
      changes: {
        thumbnail: { old: oldThumbnail, new: fileUrl }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Thumbnail uploaded successfully!',
      data: { thumbnail: fileUrl, creationStatus: event.creationStatus }
    });

  } catch (error) {
    handleError(res, error);
  }
};

// =======================================================
// GET ALL
// =======================================================
export const getAllEvents = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10, sort = 'asc' } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }
    
    // Guest User Filter
    if (!req.user) { 
       query.creationStatus = 'completed'; 
    }

    const sortOrder = sort === 'desc' ? -1 : 1;
    const events = await CollegeEvent.find(query)
      .sort({ date: sortOrder }) 
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await CollegeEvent.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: events
    });
  } catch (error) {
    handleError(res, error);
  }
};

// =======================================================
// GET SINGLE
// =======================================================
export const getEvent = async (req, res) => {
  const identifier = req.params.slug;
  
  try {
    let query = mongoose.Types.ObjectId.isValid(identifier) 
      ? { _id: identifier } 
      : { slug: identifier };

    const event = await CollegeEvent.findOne(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    handleError(res, error);
  }
};

// =======================================================
// UPDATE (Text Details)
// =======================================================
export const updateEvent = async (req, res) => {
  const eventId = req.params.id;
  console.log(`\n[EventCtrl] ✏️ UPDATE Event ID: ${eventId}`);

  try {
    const event = await CollegeEvent.findById(eventId);
    if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const allowedUpdates = [
        'title', 'description', 'summary', 'category', 
        'date', 'time', 'endDate', 'endTime', 
        'location', 'organizers', 
        'registrationLink', 'capacity', 'registrationStatus', 'isFeatured'
    ];

    // ✅ Get Diff (Calculate changes for Audit Log)
    const changes = getChanges(event, req.body, allowedUpdates);

    // Apply updates
    Object.keys(changes).forEach(field => {
        event[field] = req.body[field];
    });

    event.updatedBy = req.user._id;
    await event.save(); 

    console.log(`[EventCtrl] ✅ Event Updated Successfully`);

    // 🛡️ Audit Log (Update) - Only log if there were actual changes
    if (Object.keys(changes).length > 0) {
        logAudit({
            req,
            action: 'UPDATE',
            entityType: 'CollegeEvent',
            entityId: event._id,
            entityName: event.title,
            changes
        });
    }

    res.status(200).json({ success: true, message: 'Event details updated', data: event });
  } catch (error) {
    handleError(res, error);
  }
};

// =======================================================
// DELETE
// =======================================================
export const deleteEvent = async (req, res) => {
  const eventId = req.params.id;
  console.log(`\n[EventCtrl] 🗑️ DELETE Event ID: ${eventId}`);

  try {
    const event = await CollegeEvent.findById(eventId);
    if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // ✅ Snapshot for Audit (Preserve data before deletion)
    const snapshot = event.toObject();

    if (event.thumbnail && !event.thumbnail.includes('default-event.jpg')) {
      console.log(`[EventCtrl] 🗑️ Removing thumbnail from MinIO`);
      await MinioService.deleteFile(event.thumbnail).catch(e => console.warn("Cleanup failed", e));
    }

    await event.deleteOne();
    console.log(`[EventCtrl] ✅ Event Deleted Successfully`);

    // 🛡️ Audit Log (Delete with Snapshot)
    logAudit({
      req,
      action: 'DELETE',
      entityType: 'CollegeEvent',
      entityId: eventId,
      entityName: snapshot.title,
      changes: { snapshot } // Saves the full deleted object
    });

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// =======================================================
// GET STATS
// =======================================================
export const getEventStats = async (req, res) => {
    try {
        const stats = await CollegeEvent.aggregate([
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    pendingEvents: { $sum: { $cond: [{ $eq: ["$creationStatus", "pending"] }, 1, 0] } },
                    completedEvents: { $sum: { $cond: [{ $eq: ["$creationStatus", "completed"] }, 1, 0] } },
                    // New: Count events where date is in the future
                    upcomingEvents: { $sum: { $cond: [{ $gt: ["$date", new Date()] }, 1, 0] } } 
                }
            }
        ]);
        
        res.status(200).json({ success: true, data: stats[0] || {} });
    } catch (error) {
        handleError(res, error);
    }
};