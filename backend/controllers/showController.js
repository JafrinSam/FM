import Show from '../models/Show.js';
import mongoose from 'mongoose';
import MinioService from '../services/minioService.js';
import { logAudit } from '../services/auditService.js'; // ✅ Audit Service
import { getChanges } from '../utils/diffHelper.js';     // ✅ Diff Utility

// Helper to check for valid ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * CREATE SHOW
 * Handles multipart/form-data.
 */
export const createShow = async (req, res) => {
  console.log(`\n[INFO] [ShowCtrl] Create Show Request by: ${req.user?._id}`);
  
  try {
    let coverImageUrl = null;
    
    // 1. Upload Image
    if (req.file) {
      console.log(`[INFO] [ShowCtrl] Uploading cover image...`);
      coverImageUrl = await MinioService.uploadBuffer(req.file, 'shows');
    }

    if (!coverImageUrl) {
      console.warn(`[WARN] [ShowCtrl] Creation failed: No cover image`);
      return res.status(400).json({ success: false, message: "CoverImage is required." });
    }

    // 2. Parse RJs from JSON string
    let rjIds = [];
    if (req.body.rjs) {
      try {
        rjIds = JSON.parse(req.body.rjs);
      } catch (e) {
        rjIds = req.body.rjs;
      }
    }

    // 3. Construct Data
    const showData = {
      title: req.body.title,
      tagline: req.body.tagline,
      description: req.body.description,
      coverImage: coverImageUrl,
      isLive: req.body.IsLive === 'true', 
      hit: req.body.hit === 'true', 
      rjs: rjIds,
      createdBy: req.user._id // ✅ Track Creator
    };

    const newShow = new Show(showData);
    const savedShow = await newShow.save();
    
    console.log(`[INFO] [ShowCtrl] Show Created: "${savedShow.title}"`);

    // 🛡️ Audit Log (Create)
    logAudit({
      req,
      action: 'CREATE',
      entityType: 'Show',
      entityId: savedShow._id,
      entityName: savedShow.title,
      changes: { initialData: showData }
    });
    
    res.status(201).json({ 
      success: true, 
      data: savedShow, 
      message: "Show created successfully" 
    });

  } catch (err) {
    console.error(`[ERROR] [ShowCtrl] Create Error: ${err.message}`); 
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET ALL SHOWS
 */
export const getAllShows = async (req, res) => {
  console.log(`\n[INFO] [ShowCtrl] Get All Shows`);
  try {
    const shows = await Show.find()
      .populate('rjs', 'name photo') 
      .populate({
        path: 'weekly_schedules',
        populate: { path: 'rj', select: 'name' }
      })
      .sort({ createdAt: -1 });
      
    console.log(`[INFO] [ShowCtrl] Found ${shows.length} shows`);
    res.status(200).json({ success: true, count: shows.length, data: shows });
  } catch (err) {
    console.error(`[ERROR] [ShowCtrl] GetAll Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET SINGLE SHOW
 */
export const getShowById = async (req, res) => {
  const { id } = req.params;
  console.log(`\n[INFO] [ShowCtrl] Get Show: ${id}`);

  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Show ID" });

    const show = await Show.findById(id)
      .populate('rjs', 'name photo') 
      .populate({
        path: 'weekly_schedules',
        populate: { path: 'rj', select: 'name' }
      });

    if (!show) {
        console.warn(`[WARN] [ShowCtrl] Show not found: ${id}`);
        return res.status(404).json({ success: false, message: "Show not found" });
    }

    res.status(200).json({ success: true, data: show });
  } catch (err) {
    console.error(`[ERROR] [ShowCtrl] GetById Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * UPDATE SHOW
 */
export const updateShow = async (req, res) => {
  const { id } = req.params;
  console.log(`\n[INFO] [ShowCtrl] Update Show: ${id}`);

  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Show ID" });

    const existingShow = await Show.findById(id);
    if (!existingShow) return res.status(404).json({ success: false, message: "Show not found" });

    let updateData = {
      title: req.body.title,
      tagline: req.body.tagline,
      description: req.body.description,
    };
    
    // 1. Parse RJs Update
    if (req.body.rjs) {
      try {
        updateData.rjs = JSON.parse(req.body.rjs);
      } catch (e) {
        updateData.rjs = req.body.rjs;
      }
    }

    // 2. Handle Booleans
    if (req.body.IsLive !== undefined) updateData.isLive = req.body.IsLive === 'true';
    if (req.body.hit !== undefined) updateData.hit = req.body.hit === 'true';

    // 3. Handle File Update
    if (req.file) {
      console.log(`[INFO] [ShowCtrl] Updating cover image...`);
      const newCoverUrl = await MinioService.uploadBuffer(req.file, 'shows');
      
      if (existingShow.coverImage) {
        await MinioService.deleteFile(existingShow.coverImage).catch(e => console.error(e));
      }
      updateData.coverImage = newCoverUrl; 
    }

    // 4. Calculate Changes
    const allowed = ['title', 'tagline', 'description', 'rjs', 'isLive', 'hit', 'coverImage'];
    const changes = getChanges(existingShow, updateData, allowed);

    // 5. Apply Updates
    const updatedShow = await Show.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    console.log(`[INFO] [ShowCtrl] Show Updated: "${updatedShow.title}"`);

    // 🛡️ Audit Log (Update)
    if (Object.keys(changes).length > 0) {
        logAudit({
            req,
            action: 'UPDATE',
            entityType: 'Show',
            entityId: updatedShow._id,
            entityName: updatedShow.title,
            changes
        });
    }

    res.status(200).json({ success: true, data: updatedShow, message: "Show updated successfully" });

  } catch (err) {
    console.error(`[ERROR] [ShowCtrl] Update Error: ${err.message}`);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * DELETE SHOW
 */
export const deleteShow = async (req, res) => {
  const { id } = req.params;
  console.log(`\n[INFO] [ShowCtrl] Delete Show: ${id}`);

  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Show ID" });

    const showToDelete = await Show.findById(id);
    if (!showToDelete) return res.status(404).json({ success: false, message: "Show not found" });

    // Snapshot for Audit
    const snapshot = showToDelete.toObject();

    if (showToDelete.coverImage) {
      console.log(`[INFO] [ShowCtrl] Deleting cover image...`);
      await MinioService.deleteFile(showToDelete.coverImage).catch(e => console.error("MinIO delete error:", e));
    }

    await Show.findByIdAndDelete(id);

    console.log(`[INFO] [ShowCtrl] Show Deleted`);

    // 🛡️ Audit Log (Delete)
    logAudit({
      req,
      action: 'DELETE',
      entityType: 'Show',
      entityId: id,
      entityName: snapshot.title,
      changes: { snapshot }
    });

    res.status(200).json({ success: true, message: "Show deleted successfully" });
  } catch (err) {
    console.error(`[ERROR] [ShowCtrl] Delete Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};