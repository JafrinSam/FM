import Rj from '../models/Rj.js';
import mongoose from 'mongoose';
import MinioService from '../services/minioService.js';
import { logAudit } from '../services/auditService.js';
import { getChanges } from '../utils/diffHelper.js';

// Helper to check for valid ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * CREATE RJ
 * Handles multipart/form-data. Expects 'photo' (array) and text fields.
 */
export const createRj = async (req, res) => {
  console.log(`[RjCtrl] 📝 Create RJ Request by User: ${req.user?._id}`);
  
  try {
    // 1. Upload Photos to MinIO (if any)
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`[RjCtrl] ☁️ Uploading ${req.files.length} photos...`);
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
    const rjData = {
      ...req.body,
      photo: photoUrls, // Link the uploaded URLs
      createdBy: req.user._id // ✅ Assign Creator
    };

    const newRj = new Rj(rjData);
    const savedRj = await newRj.save();
    
    console.log(`[RjCtrl] ✅ RJ Created: ${savedRj.name} (${savedRj._id})`);

    // 4. 🛡️ Audit Log (Create)
    logAudit({
      req,
      action: 'CREATE',
      entityType: 'RJ',
      entityId: savedRj._id,
      entityName: savedRj.name,
      changes: { initialData: rjData }
    });

    res.status(201).json({
      success: true,
      data: savedRj,
      message: "RJ profile created successfully"
    });

  } catch (err) {
    console.error(`[RjCtrl] 🔥 Create Error: ${err.message}`);
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
  console.log(`[RjCtrl] 🔍 Get All RJs`);
  try {
    // Populate 'shows' (plural) based on new schema
    const rjs = await Rj.find().populate('shows', 'title tagline'); 
    console.log(`[RjCtrl] ✅ Found ${rjs.length} RJs`);
    res.status(200).json({ success: true, count: rjs.length, data: rjs });
  } catch (err) {
    console.error(`[RjCtrl] 🔥 GetAll Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET SINGLE RJ
 */
export const getRjById = async (req, res) => {
  const { id } = req.params;
  console.log(`[RjCtrl] 🔎 Get RJ: ${id}`);
  
  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid RJ ID format" });

    const rj = await Rj.findById(id).populate('shows');
    if (!rj) {
        console.warn(`[RjCtrl] ❌ RJ not found: ${id}`);
        return res.status(404).json({ success: false, message: "RJ not found" });
    }

    res.status(200).json({ success: true, data: rj });
  } catch (err) {
    console.error(`[RjCtrl] 🔥 GetById Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * UPDATE RJ
 */
export const updateRj = async (req, res) => {
  const { id } = req.params;
  console.log(`[RjCtrl] ✏️ Update RJ Request: ${id}`);
  
  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid RJ ID format" });

    // 1. Find existing RJ
    const existingRj = await Rj.findById(id);
    if (!existingRj) return res.status(404).json({ success: false, message: "RJ not found" });

    // 2. Prepare Update Data
    let updateData = { ...req.body };

    // 3. Handle New Files (if any)
    if (req.files && req.files.length > 0) {
      console.log(`[RjCtrl] ☁️ Uploading new photos...`);
      const uploadPromises = req.files.map(file => 
        MinioService.uploadBuffer(file, 'rjs')
      );
      const newPhotoUrls = await Promise.all(uploadPromises);

      if (req.body.replacePhotos === 'true') {
        // DELETE OLD FILES
        console.log(`[RjCtrl] 🗑️ Replacing old photos...`);
        if (existingRj.photo && existingRj.photo.length > 0) {
            existingRj.photo.forEach(url => MinioService.deleteFile(url).catch(e => console.error("Cleanup error:", e)));
        }
        updateData.photo = newPhotoUrls; 
      } else {
        // Append
        console.log(`[RjCtrl] ➕ Appending new photos...`);
        updateData.photo = [...existingRj.photo, ...newPhotoUrls];
      }
    }

    // 4. Calculate Changes (For Audit Log)
    const allowedFields = ['name', 'bio', 'instagram', 'shows', 'photo'];
    const changes = getChanges(existingRj, updateData, allowedFields);

    // 5. Perform Update
    // Manually apply updates to existingRj first to facilitate saving, or use findByIdAndUpdate
    // Since we calculated changes from existingRj, we can proceed with findByIdAndUpdate
    const updatedRj = await Rj.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    console.log(`[RjCtrl] ✅ RJ Updated Successfully`);

    // 6. 🛡️ Audit Log (Update)
    if (Object.keys(changes).length > 0) {
        logAudit({
            req,
            action: 'UPDATE',
            entityType: 'RJ',
            entityId: updatedRj._id,
            entityName: updatedRj.name,
            changes
        });
    }

    res.status(200).json({ success: true, data: updatedRj, message: "RJ updated successfully" });

  } catch (err) {
    console.error(`[RjCtrl] 🔥 Update Error: ${err.message}`);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * DELETE RJ
 */
export const deleteRj = async (req, res) => {
  const { id } = req.params;
  console.log(`[RjCtrl] 🗑️ Delete RJ Request: ${id}`);
  
  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid RJ ID format" });

    // 1. Find the RJ to get photo URLs
    const rjToDelete = await Rj.findById(id);
    if (!rjToDelete) return res.status(404).json({ success: false, message: "RJ not found" });

    // 2. 📸 Snapshot for Audit Log
    const snapshot = rjToDelete.toObject();

    // 3. Cleanup MinIO Files
    if (rjToDelete.photo && rjToDelete.photo.length > 0) {
      console.log(`[RjCtrl] 🗑️ Deleting ${rjToDelete.photo.length} images from MinIO...`);
      rjToDelete.photo.forEach(async (url) => {
        await MinioService.deleteFile(url).catch(e => console.error("MinIO delete error:", e));
      });
    }

    // 4. Delete from DB
    await rjToDelete.deleteOne();

    console.log(`[RjCtrl] ✅ RJ Deleted`);

    // 5. 🛡️ Audit Log (Delete)
    logAudit({
      req,
      action: 'DELETE',
      entityType: 'RJ',
      entityId: id, // Use ID since object is gone
      entityName: rjToDelete.name,
      changes: { snapshot } // Store full backup
    });

    res.status(200).json({ success: true, message: "RJ deleted and images cleaned up successfully" });
  } catch (err) {
    console.error(`[RjCtrl] 🔥 Delete Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};