import CollegeEvent from '../models/CollegeEvent.js';
import MinioService from '../services/minioService.js';
import mongoose from 'mongoose';

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
  console.log(`[EventCtrl] 📦 Body:`, JSON.stringify(req.body, null, 2));

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
  console.log(`\n[EventCtrl] 🖼️ UPLOAD Thumbnail Request`);
  console.log(`[EventCtrl] 🆔 Event ID: ${eventId}`);
  console.log(`[EventCtrl] 📨 Content-Type: ${req.headers['content-type']}`);
  
  try {
    if (!req.file) {
        console.warn("[EventCtrl] ⚠️ No file provided in request. Check 'thumbnail' key in FormData.");
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    console.log(`[EventCtrl] 📁 File Received: ${req.file.originalname} (${req.file.size} bytes)`);

    const event = await CollegeEvent.findById(eventId);
    if (!event) {
        console.warn(`[EventCtrl] ❌ Event not found: ${eventId}`);
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Upload
    console.log("[EventCtrl] ☁️ Uploading to MinIO...");
    const fileUrl = await MinioService.uploadBuffer(req.file, 'events');
    console.log(`[EventCtrl] ✅ MinIO Upload Success: ${fileUrl}`);

    // Cleanup old image
    if (event.thumbnail && !event.thumbnail.includes('default-event.jpg')) {
      console.log(`[EventCtrl] 🗑️ Deleting old thumbnail: ${event.thumbnail}`);
      await MinioService.deleteFile(event.thumbnail);
    }

    // Update
    event.thumbnail = fileUrl;
    if (event.creationStatus === 'pending') {
        event.creationStatus = 'completed'; 
        console.log(`[EventCtrl] 🚀 Status updated to 'completed'`);
    }
    event.updatedBy = req.user._id;
    await event.save();

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
  console.log(`\n[EventCtrl] 🔍 GET ALL Events`);
  console.log(`[EventCtrl] ❓ Query Params:`, req.query);

  try {
    const { category, search, page = 1, limit = 10, sort = 'asc' } = req.query;
    const query = {};

    if (category && category !== 'All') {
        query.category = category;
    }
    
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }
    
    // Auth Check
    if (!req.user) { 
       console.log(`[EventCtrl] 🔒 Guest User. Filtering for 'completed' events only.`);
       query.creationStatus = 'completed'; 
    } else {
       console.log(`[EventCtrl] 🔓 Authenticated User (${req.user.role}). Showing all events.`);
    }

    console.log(`[EventCtrl] 🛠️ DB Query:`, JSON.stringify(query));

    const sortOrder = sort === 'desc' ? -1 : 1;

    const events = await CollegeEvent.find(query)
      .sort({ date: sortOrder }) 
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await CollegeEvent.countDocuments(query);

    console.log(`[EventCtrl] ✅ Found ${events.length} events (Total matches: ${total})`);

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
  console.log(`\n[EventCtrl] 🔎 GET SINGLE Event: ${identifier}`);
  
  try {
    let query = mongoose.Types.ObjectId.isValid(identifier) 
      ? { _id: identifier } 
      : { slug: identifier };

    const event = await CollegeEvent.findOne(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!event) {
        console.warn(`[EventCtrl] ❌ Event not found: ${identifier}`);
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    console.log(`[EventCtrl] ✅ Event found: "${event.title}"`);
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
  console.log(`[EventCtrl] 📦 Update Data:`, req.body);

  try {
    const event = await CollegeEvent.findById(eventId);
    if (!event) {
        console.warn(`[EventCtrl] ❌ Event not found for update`);
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const allowedUpdates = [
        'title', 'description', 'summary', 'category', 
        'date', 'time', 'endDate', 'endTime', 
        'location', 'organizers', 
        'registrationLink', 'capacity', 'registrationStatus', 'isFeatured'
    ];

    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
            event[field] = req.body[field];
        }
    });

    event.updatedBy = req.user._id;
    await event.save(); 

    console.log(`[EventCtrl] ✅ Event Updated Successfully`);
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
        console.warn(`[EventCtrl] ❌ Event not found for deletion`);
        return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.thumbnail && !event.thumbnail.includes('default-event.jpg')) {
      console.log(`[EventCtrl] 🗑️ Removing thumbnail from MinIO: ${event.thumbnail}`);
      await MinioService.deleteFile(event.thumbnail);
    }

    await event.deleteOne();
    console.log(`[EventCtrl] ✅ Event Deleted Successfully`);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// =======================================================
// GET STATS
// =======================================================
export const getEventStats = async (req, res) => {
    console.log(`\n[EventCtrl] 📊 GET STATS requested`);
    try {
        const stats = await CollegeEvent.aggregate([
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    pendingEvents: { $sum: { $cond: [{ $eq: ["$creationStatus", "pending"] }, 1, 0] } },
                    completedEvents: { $sum: { $cond: [{ $eq: ["$creationStatus", "completed"] }, 1, 0] } }
                }
            }
        ]);
        
        console.log(`[EventCtrl] ✅ Stats Generated:`, stats[0]);
        res.status(200).json({ success: true, data: stats[0] || {} });
    } catch (error) {
        handleError(res, error);
    }
};