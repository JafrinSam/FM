import { createUploader } from "../utils/createUploader.js";
import { MusicAsset } from "../models/MusicAsset.js"; 
import fs from "fs";
import path from "path";
// 1. Import the metadata parser
import { parseFile } from 'music-metadata';

const MUSIC_DIR = process.env.MUSIC_DIR || "radio/music";

const uploadMusic = createUploader({
  uploadDir: MUSIC_DIR,
  fieldName: "musicFiles",
  mode: "multiple",
  maxFiles: 10,
  maxFileSizeMB: 50,
  allowedExtensions: [".mp3"],
  allowedMimeTypes: ["audio/mpeg"]
});

export const uploadMusicFiles = async (req, res) => {
  uploadMusic(req, res, async (err) => {
    let successfulRegistrations = [];
    let registrationErrors = [];

    if (err) return res.status(400).json({ error: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    // 2. check for manual overrides from the form (e.g. if uploading a single file)

    const manualArtist = req.body.artist || null;
    const manualTitle = req.body.title || null;
    const manualType = req.body.type || "Music"; // <--- NEW

    const uploadedFiles = req.files;

    for (const file of uploadedFiles) {
      const fullPath = path.resolve(process.cwd(), MUSIC_DIR, file.filename);

      try {
        if (!fs.existsSync(fullPath)) {
          throw new Error("Uploaded file not found on disk");
        }

        let metadata = { common: {}, format: {} };
        try {
          metadata = await parseFile(fullPath);
        } catch (metaErr) {
          console.warn(`Metadata error: ${metaErr.message}`);
        }

        const isSingleUpload = uploadedFiles.length === 1;

        const asset = await MusicAsset.create({
          filename: file.filename,
          originalName: file.originalname,
          filePath: path.join(MUSIC_DIR, file.filename),
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

        await fs.promises.unlink(fullPath).catch(() => {});
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

// ... (keep your existing list, get, update, delete functions as they were) ...
// The existing updateMusicAsset function is already perfect for editing.

// ===========================================
// READ (Get All & Get Single)
// ===========================================

/**
 * GET /api/assets
 * Retrieves a list of all music assets from the database.
 */
export async function listMusicAssets(req, res) {
  try {
    const assets = await MusicAsset.find().sort({ uploadedAt: -1 });
    res.status(200).json(assets);
  } catch (error) {
    console.error("Error listing assets:", error);
    res.status(500).json({ message: "Failed to retrieve music assets." });
  }
}

/**
 * GET /api/assets/:id
 * Retrieves a single music asset by ID.
 */
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

// ===========================================
// UPDATE (Metadata only)
// ===========================================

/**
 * PUT /api/assets/:id
 * Updates metadata fields (e.g., title, artist) for a music asset.
 * NOTE: This endpoint does NOT change the physical file.
 */
export async function updateMusicAsset(req, res) {
  try {
    const updatedAsset = await MusicAsset.findByIdAndUpdate(
      req.params.id,
      { 
        artist: req.body.artist,
        title: req.body.title,
        originalName: req.body.originalName,
        type: req.body.type // <--- NEW
      },
      { new: true, runValidators: true }
    );

    if (!updatedAsset) return res.status(404).json({ message: "Asset not found." });

    res.status(200).json({ message: "Asset updated.", asset: updatedAsset });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ message: "Failed to update asset." });
  }
}
// ===========================================
// DELETE (DB & File System Synchronization)
// ===========================================

/**
 * DELETE /api/assets/:id
 * Deletes the music asset record from the database AND the file from the disk.
 */
export async function deleteMusicAsset(req, res) {
  try {
    // 1. Find the asset in the database
    const asset = await MusicAsset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: "Music asset not found in database." });
    }

    const fullFilePath = path.join(MUSIC_DIR, asset.filename);
    let fileDeleted = false;

    // 2. Delete the physical file from the disk
    if (fs.existsSync(fullFilePath)) {
      try {
        fs.unlinkSync(fullFilePath);
        fileDeleted = true;
        console.log(`Successfully deleted file: ${fullFilePath}`);
      } catch (fileError) {
        console.error(`Failed to delete physical file: ${fullFilePath}`, fileError);
        // We log the error but continue to delete the DB record.
        // It's safer to delete the DB record and leave an orphaned file than vice-versa.
      }
    } else {
      console.warn(`File not found on disk, deleting DB record only: ${fullFilePath}`);
    }

    // 3. Delete the record from the database
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