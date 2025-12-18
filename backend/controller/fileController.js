import { createUploader } from "../utils/createUploader.js";
import { MusicAsset } from "../models/MusicAsset.js"; 
import fs from "fs";
import path from "path";
import { parseFile } from 'music-metadata';

// Define Directories
const MUSIC_DIR = process.env.MUSIC_DIR || "radio/music";
const SCHEDULED_DIR = "radio/scheduled"; // <--- 1. Define Scheduled Directory

const uploadMusic = createUploader({
  uploadDir: MUSIC_DIR, // Files initially land here
  fieldName: "musicFiles",
  mode: "multiple",
  maxFiles: 10,
  maxFileSizeMB: 300, // Increased limit for longer shows
  allowedExtensions: [".mp3"],
  allowedMimeTypes: ["audio/mpeg"]
});

export const uploadMusicFiles = async (req, res) => {
  uploadMusic(req, res, async (err) => {
    let successfulRegistrations = [];
    let registrationErrors = [];

    if (err) return res.status(400).json({ error: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const manualArtist = req.body.artist || null;
    const manualTitle = req.body.title || null;
    const manualType = req.body.type || "Music"; 

    const uploadedFiles = req.files;

    for (const file of uploadedFiles) {
      // Initial path (where uploader put it)
      const initialFullPath = path.resolve(process.cwd(), MUSIC_DIR, file.filename);
      
      // Variables to track final location
      let finalRelativePath = path.join(MUSIC_DIR, file.filename);
      let finalFullPath = initialFullPath;

      try {
        if (!fs.existsSync(initialFullPath)) {
          throw new Error("Uploaded file not found on disk");
        }

        // 1. Parse Metadata (do this before moving)
        let metadata = { common: {}, format: {} };
        try {
          metadata = await parseFile(initialFullPath);
        } catch (metaErr) {
          console.warn(`Metadata error: ${metaErr.message}`);
        }

        // 2. CHECK TYPE AND MOVE FILE IF NEEDED
        if (manualType === "Prerecorded Show") {
          const scheduledDirAbsolute = path.resolve(process.cwd(), SCHEDULED_DIR);
          
          // Ensure directory exists
          if (!fs.existsSync(scheduledDirAbsolute)) {
            fs.mkdirSync(scheduledDirAbsolute, { recursive: true });
          }

          const newFullPath = path.join(scheduledDirAbsolute, file.filename);
          
          // Move the file
          await fs.promises.rename(initialFullPath, newFullPath);

          // Update tracking variables
          finalFullPath = newFullPath;
          finalRelativePath = path.join(SCHEDULED_DIR, file.filename);
        }

        const isSingleUpload = uploadedFiles.length === 1;

        // 3. Create DB Entry with the CORRECT path
        const asset = await MusicAsset.create({
          filename: file.filename,
          originalName: file.originalname,
          filePath: finalRelativePath, // <--- Saves 'radio/scheduled/file.mp3' or 'radio/music/file.mp3'
          size: file.size,
          title: isSingleUpload && manualTitle
            ? manualTitle
            : metadata.common.title || file.originalname.replace(/\.mp3$/i, ''),
          artist: isSingleUpload && manualArtist
            ? manualArtist
            : metadata.common.artist || "Unknown Artist",
          duration: Number.isFinite(metadata.format.duration)
            ? Math.round(metadata.format.duration)
            : 0,
          type: manualType
        });

        successfulRegistrations.push(asset);

      } catch (dbError) {
        console.error(`Registration failed for ${file.filename}:`, dbError.message);
        registrationErrors.push({ filename: file.filename, error: dbError.message });

        // Clean up: Try to delete file from wherever it ended up
        await fs.promises.unlink(finalFullPath).catch(() => {});
      }
    }

    if (successfulRegistrations.length > 0) {
      return res.status(200).json({
        message: `${successfulRegistrations.length} file(s) processed.`,
        uploaded: successfulRegistrations,
        errors: registrationErrors
      });
    } else {
      return res.status(500).json({
        message: 'No files registered.',
        errors: registrationErrors
      });
    }
  });
};

// ... (list, get, update functions remain the same) ...
export async function listMusicAssets(req, res) {
    try {
      const assets = await MusicAsset.find().sort({ uploadedAt: -1 });
      res.status(200).json(assets);
    } catch (error) {
      console.error("Error listing assets:", error);
      res.status(500).json({ message: "Failed to retrieve music assets." });
    }
  }
  
  export async function getMusicAssetById(req, res) {
    try {
      const asset = await MusicAsset.findById(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Music asset not found." });
      }
      res.status(200).json(asset);
    } catch (error) {
      console.error("Error getting asset by ID:", error);
      res.status(500).json({ message: "Error retrieving asset." });
    }
  }
  

export async function updateMusicAsset(req, res) {
  try {
    // 1. Fetch the existing asset to know its CURRENT state
    const currentAsset = await MusicAsset.findById(req.params.id);
    if (!currentAsset) {
      return res.status(404).json({ message: "Asset not found." });
    }

    const newType = req.body.type;
    const oldType = currentAsset.type;
    
    // Prepare the update object
    let updateData = {
      artist: req.body.artist,
      title: req.body.title,
      originalName: req.body.originalName,
      type: newType
    };

    // 2. Check if we need to move the file
    // Condition A: Moving FROM Music TO Scheduled
    if (newType === "Prerecorded Show" && oldType !== "Prerecorded Show") {
      
      const oldPath = path.resolve(process.cwd(), currentAsset.filePath);
      const newDir = path.resolve(process.cwd(), SCHEDULED_DIR);
      const newPath = path.join(newDir, currentAsset.filename);

      // Ensure destination exists
      if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

      if (fs.existsSync(oldPath)) {
        await fs.promises.rename(oldPath, newPath);
        console.log(`Moved file to Scheduled: ${currentAsset.filename}`);
        
        // Update the DB path
        updateData.filePath = path.join(SCHEDULED_DIR, currentAsset.filename);
      } else {
        console.warn(`File missing at ${oldPath}, skipping move.`);
      }

    // Condition B: Moving FROM Scheduled TO Music (or others)
    } else if (newType !== "Prerecorded Show" && oldType === "Prerecorded Show") {
      
      const oldPath = path.resolve(process.cwd(), currentAsset.filePath);
      const newDir = path.resolve(process.cwd(), MUSIC_DIR);
      const newPath = path.join(newDir, currentAsset.filename);

      // Ensure destination exists
      if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

      if (fs.existsSync(oldPath)) {
        await fs.promises.rename(oldPath, newPath);
        console.log(`Moved file back to Music: ${currentAsset.filename}`);
        
        // Update the DB path
        updateData.filePath = path.join(MUSIC_DIR, currentAsset.filename);
      } else {
        console.warn(`File missing at ${oldPath}, skipping move.`);
      }
    }

    // 3. Perform the Database Update
    const updatedAsset = await MusicAsset.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: "Asset updated successfully.", 
      moved: updateData.filePath !== currentAsset.filePath, // simple flag for frontend
      asset: updatedAsset 
    });

  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ message: "Failed to update asset." });
  }
}
// ===========================================
// DELETE (Updated to check DB path)
// ===========================================

export async function deleteMusicAsset(req, res) {
  try {
    const asset = await MusicAsset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: "Music asset not found in database." });
    }

    // UPDATED: Resolve path based on what is stored in DB (handles both /music and /scheduled)
    const fullFilePath = path.resolve(process.cwd(), asset.filePath);
    
    let fileDeleted = false;

    if (fs.existsSync(fullFilePath)) {
      try {
        fs.unlinkSync(fullFilePath);
        fileDeleted = true;
        console.log(`Successfully deleted file: ${fullFilePath}`);
      } catch (fileError) {
        console.error(`Failed to delete physical file: ${fullFilePath}`, fileError);
      }
    } else {
      console.warn(`File not found on disk, deleting DB record only: ${fullFilePath}`);
    }

    await MusicAsset.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Music asset deleted successfully.",
      dbDeleted: true,
      fileDeleted: fileDeleted,
      filename: asset.filename
    });

  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ message: "Failed to delete music asset." });
  }
}