import Rj from '../models/Rj.js';
import mongoose from 'mongoose';
import MinioService from '../services/minioService.js';

// Helper to check for valid ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * CREATE RJ
 * Handles multipart/form-data. Expects 'photo' (array) and text fields.
 */
export const createRj = async (req, res) => {
  try {
    // 1. Upload Photos to MinIO (if any)
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      // Upload all files in parallel
      const uploadPromises = req.files.map(file => 
        MinioService.uploadBuffer(file, 'rjs')
      );
      photoUrls = await Promise.all(uploadPromises);
    }

    // 2. Validate Requirement (Schema says photo is required)
    if (photoUrls.length === 0) {
      return res.status(400).json({ success: false, message: "At least one photo is required." });
    }

    // 3. Create RJ Object
    // req.body contains text fields (name, Bio, instagram, show ID)
    const rjData = {
      ...req.body,
      photo: photoUrls // Link the uploaded URLs to the schema
    };

    const newRj = new Rj(rjData);
    const savedRj = await newRj.save();
    
    res.status(201).json({
      success: true,
      data: savedRj,
      message: "RJ profile created successfully"
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET ALL RJs
 */
export const getAllRjs = async (req, res) => {
  try {
    const rjs = await Rj.find().populate('show', 'title tagline'); // Populate show title/tagline
    res.status(200).json({ success: true, count: rjs.length, data: rjs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET SINGLE RJ
 */
export const getRjById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid RJ ID format" });

    const rj = await Rj.findById(id).populate('show');
    if (!rj) return res.status(404).json({ success: false, message: "RJ not found" });

    res.status(200).json({ success: true, data: rj });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * UPDATE RJ
 * Can handle text updates AND new file uploads.
 * Logic:
 * - If 'replacePhotos' is "true": Deletes old photos from MinIO and saves ONLY new ones.
 * - Otherwise: Appends new photos to the existing list.
 */
export const updateRj = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid RJ ID format" });

    // 1. Find existing RJ first
    const existingRj = await Rj.findById(id);
    if (!existingRj) return res.status(404).json({ success: false, message: "RJ not found" });

    // 2. Prepare Update Data
    let updateData = { ...req.body };

    // 3. Handle New Files (if any)
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        MinioService.uploadBuffer(file, 'rjs')
      );
      const newPhotoUrls = await Promise.all(uploadPromises);

      // Determine strategy: Replace or Append?
      if (req.body.replacePhotos === 'true') {
        // DELETE OLD FILES from MinIO to save space
        if (existingRj.photo && existingRj.photo.length > 0) {
            existingRj.photo.forEach(url => MinioService.deleteFile(url).catch(e => console.error("Cleanup error:", e)));
        }
        updateData.photo = newPhotoUrls; // Set new list
      } else {
        // Append new photos to old list
        updateData.photo = [...existingRj.photo, ...newPhotoUrls];
      }
    }

    // 4. Perform Update
    const updatedRj = await Rj.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedRj, message: "RJ updated successfully" });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * DELETE RJ
 * Automatically cleans up linked images from MinIO storage.
 */
export const deleteRj = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid RJ ID format" });

    // 1. Find the RJ to get photo URLs
    const rjToDelete = await Rj.findById(id);
    if (!rjToDelete) return res.status(404).json({ success: false, message: "RJ not found" });

    // 2. Cleanup MinIO Files
    if (rjToDelete.photo && rjToDelete.photo.length > 0) {
      // Loop through all photos and delete them from storage bucket
      rjToDelete.photo.forEach(async (url) => {
        await MinioService.deleteFile(url).catch(e => console.error("MinIO delete error:", e));
      });
    }

    // 3. Delete from DB
    await Rj.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "RJ deleted and images cleaned up successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};