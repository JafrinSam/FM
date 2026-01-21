import Show from '../models/Show.js';
import mongoose from 'mongoose';
import MinioService from '../services/minioService.js';

// Helper to check for valid ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * CREATE SHOW
 * Handles multipart/form-data.
 */
export const createShow = async (req, res) => {
  try {
    let coverImageUrl = null;
    
    // 1. Upload Image
    if (req.file) {
      coverImageUrl = await MinioService.uploadBuffer(req.file, 'shows');
    }

    if (!coverImageUrl) {
      return res.status(400).json({ success: false, message: "CoverImage is required." });
    }

    // 2. Parse RJs from JSON string (Fixes empty array issue)
    let rjIds = [];
    if (req.body.rjs) {
      try {
        rjIds = JSON.parse(req.body.rjs);
      } catch (e) {
        // Fallback if it's already an array
        rjIds = req.body.rjs;
      }
    }

    // 3. Construct Data
    const showData = {
      title: req.body.title,
      tagline: req.body.tagline,
      description: req.body.description,
      coverImage: coverImageUrl,
      
      // Handle Booleans (FormData sends them as strings "true"/"false")
      isLive: req.body.IsLive === 'true', 
      
      // --- FEATURED SHOW LOGIC ---
      hit: req.body.hit === 'true', 
      
      rjs: rjIds // Assign parsed IDs
    };

    const newShow = new Show(showData);
    const savedShow = await newShow.save();
    
    res.status(201).json({ 
      success: true, 
      data: savedShow, 
      message: "Show created successfully" 
    });

  } catch (err) {
    console.error("Create Show Error:", err); 
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
  try {
    const shows = await Show.find()
      .populate('rjs', 'name photo') 
      .populate({
        path: 'weekly_schedules',
        populate: { path: 'rj', select: 'name' }
      })
      .sort({ createdAt: -1 }); // Sort by newest first
      
    res.status(200).json({ success: true, count: shows.length, data: shows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET SINGLE SHOW
 */
export const getShowById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Show ID" });

    const show = await Show.findById(id)
      .populate('rjs', 'name photo') 
      .populate({
        path: 'weekly_schedules',
        populate: { path: 'rj', select: 'name' }
      });

    if (!show) return res.status(404).json({ success: false, message: "Show not found" });

    res.status(200).json({ success: true, data: show });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * UPDATE SHOW
 */
export const updateShow = async (req, res) => {
  try {
    const { id } = req.params;
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
    
    // --- FEATURED SHOW UPDATE ---
    if (req.body.hit !== undefined) updateData.hit = req.body.hit === 'true';

    // 3. Handle File Update
    if (req.file) {
      const newCoverUrl = await MinioService.uploadBuffer(req.file, 'shows');
      
      if (existingShow.coverImage) {
        await MinioService.deleteFile(existingShow.coverImage).catch(e => console.error(e));
      }
      updateData.coverImage = newCoverUrl; 
    }

    const updatedShow = await Show.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedShow, message: "Show updated successfully" });

  } catch (err) {
    console.error("Update Show Error:", err);
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
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Show ID" });

    const showToDelete = await Show.findById(id);
    if (!showToDelete) return res.status(404).json({ success: false, message: "Show not found" });

    if (showToDelete.coverImage) {
      await MinioService.deleteFile(showToDelete.coverImage).catch(e => console.error("MinIO delete error:", e));
    }

    await Show.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Show deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};