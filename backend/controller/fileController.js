import { createUploader } from "../utils/createUploader.js";
import { MusicAsset } from "../models/MusicAsset.js"; 
import { azuraClient, STATION_ID } from "../config/azuracast.js";
import fs from "fs";
import path from "path";
import { parseFile } from 'music-metadata';
import NodeID3 from 'node-id3';

// 1. Setup Directories
const TEMP_DIR = "temp_uploads"; 
const COVERS_DIR = path.join(process.cwd(), "public", "covers");

// Ensure directories exist
if (!fs.existsSync(TEMP_DIR)) {
  console.log(`[INIT] Creating Temp Directory: ${TEMP_DIR}`);
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}
if (!fs.existsSync(COVERS_DIR)) {
  console.log(`[INIT] Creating Covers Directory: ${COVERS_DIR}`);
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

// 2. Configure Uploader
const uploadMusic = createUploader({
  uploadDir: TEMP_DIR, 
  fieldName: "musicFiles",
  mode: "multiple",
  maxFiles: 10,
  maxFileSizeMB: 300, 
  allowedExtensions: [".mp3"],
  allowedMimeTypes: ["audio/mpeg"]
});

// Helper: Determine AzuraCast Folder
const getAzuraTargetDir = (type) => {
  return type === "Prerecorded Show" ? "Scheduled" : "Music";
};

// Helper: Extract and Save Cover Art
const extractCoverArt = async (filePath, filenameBase) => {
  console.log(`[COVER-ART] Extracting for: ${filenameBase}`);
  try {
    const metadata = await parseFile(filePath);
    const picture = metadata.common.picture ? metadata.common.picture[0] : null;

    if (picture) {
      const extension = picture.format === 'image/jpeg' ? 'jpg' : 'png';
      const coverFilename = `${filenameBase}.${extension}`;
      const savePath = path.join(COVERS_DIR, coverFilename);

      fs.writeFileSync(savePath, picture.data);
      console.log(`[COVER-ART] Saved to: ${savePath}`);
      return `/covers/${coverFilename}`;
    } else {
      console.log(`[COVER-ART] No picture found in metadata.`);
    }
  } catch (err) {
    console.warn(`[COVER-ART] Extraction Failed: ${err.message}`);
  }
  return null;
};

// ===========================================
// UPLOAD (Extract Art -> Upload to Azura -> DB)
// ===========================================
export const uploadMusicFiles = async (req, res) => {
  console.log("[UPLOAD] Request received...");
  
  uploadMusic(req, res, async (err) => {
    let successfulRegistrations = [];
    let registrationErrors = [];

    if (err) {
      console.error(`[UPLOAD] Multer Error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      console.warn("[UPLOAD] No files received.");
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`[UPLOAD] Processing ${req.files.length} files...`);

    const manualArtist = req.body.artist || null;
    const manualTitle = req.body.title || null;
    const manualType = req.body.type || "Music"; 

    const uploadedFiles = req.files;

    for (const file of uploadedFiles) {
      const tempFilePath = file.path; 
      console.log(`[FILE] Processing: ${file.originalname} (${file.size} bytes)`);

      try {
        // A. Parse Metadata & Extract Cover Art
        let metadata = { common: {}, format: {} };
        let coverArtUrl = null;
        
        try {
          console.log(`[METADATA] Parsing file...`);
          metadata = await parseFile(tempFilePath);
          
          const baseName = path.parse(file.filename).name;
          coverArtUrl = await extractCoverArt(tempFilePath, baseName);
          
        } catch (metaErr) {
          console.warn(`[METADATA] Warning: ${metaErr.message}`);
        }

        // B. Determine AzuraCast Path
        const azuraDir = getAzuraTargetDir(manualType);
        const azuraFilePath = `${azuraDir}/${file.filename}`;
        console.log(`[AZURACAST] Uploading to: ${azuraFilePath}`);

        // C. Upload MP3 to AzuraCast
        const fileStream = fs.createReadStream(tempFilePath);
        
        await azuraClient.post(`/station/${STATION_ID}/files`, fileStream, {
          params: { file: azuraFilePath },
          headers: { 'Content-Type': file.mimetype }
        });
        console.log(`[AZURACAST] Upload Successful.`);

        // D. Create DB Entry
        const isSingleUpload = uploadedFiles.length === 1;
        
        const asset = await MusicAsset.create({
          filename: file.filename,
          originalName: file.originalname,
          filePath: azuraFilePath, 
          coverArt: coverArtUrl, 
          size: file.size,
          title: isSingleUpload && manualTitle 
            ? manualTitle 
            : metadata.common.title || file.originalname.replace(/\.mp3$/i, ''),
          artist: isSingleUpload && manualArtist 
            ? manualArtist 
            : metadata.common.artist || "Unknown Artist",
          album: metadata.common.album || "Unknown Album",
          duration: Number.isFinite(metadata.format.duration) 
            ? Math.round(metadata.format.duration) 
            : 0,
          type: manualType
        });

        console.log(`[DB] Created Asset ID: ${asset._id}`);
        successfulRegistrations.push(asset);

      } catch (uploadError) {
        console.error(`[ERROR] Failed processing ${file.filename}: ${uploadError.message}`);
        // Log AzuraCast response data if available
        if (uploadError.response) {
            console.error(`[AZURA-ERROR] Status: ${uploadError.response.status}, Data:`, uploadError.response.data);
        }
        registrationErrors.push({ filename: file.filename, error: uploadError.message });
      } finally {
        // E. Cleanup Temp MP3
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log(`[CLEANUP] Deleted temp file: ${tempFilePath}`);
        }
      }
    }

    if (successfulRegistrations.length > 0) {
      console.log(`[UPLOAD] Complete. Success: ${successfulRegistrations.length}, Errors: ${registrationErrors.length}`);
      res.status(200).json({
        message: `${successfulRegistrations.length} file(s) processed.`,
        uploaded: successfulRegistrations,
        errors: registrationErrors
      });
    } else {
      console.error(`[UPLOAD] All files failed.`);
      res.status(500).json({
        message: 'No files registered.',
        errors: registrationErrors
      });
    }
  });
};

// ===========================================
// UPDATE (Sync Metadata & DB)
// ===========================================
export async function updateMusicAsset(req, res) {
  const assetId = req.params.id;
  console.log(`[UPDATE] Updating Asset ID: ${assetId}`);

  try {
    const currentAsset = await MusicAsset.findById(assetId);
    if (!currentAsset) {
      console.warn(`[UPDATE] Asset not found: ${assetId}`);
      return res.status(404).json({ message: "Asset not found." });
    }

    const newType = req.body.type;
    const oldType = currentAsset.type;
    
    let updateData = {
      artist: req.body.artist,
      title: req.body.title,
      type: newType,
      album: req.body.album 
    };

    console.log(`[UPDATE] New Data:`, updateData);

    // 1. TRY UPDATING ID3 TAGS
    const volumeRoot = path.join(process.cwd(), 'station_data', 'radio', 'media'); 
    // Fix: Ensure we handle potential slashes correctly or use AzuraCast naming conventions if modified
    const localFilePath = path.join(volumeRoot, currentAsset.filePath); 
    
    console.log(`[ID3] Checking file at: ${localFilePath}`);

    if (fs.existsSync(localFilePath)) {
      const tags = {
        title: req.body.title || currentAsset.title,
        artist: req.body.artist || currentAsset.artist,
        album: req.body.album || currentAsset.album
      };

      const success = NodeID3.update(tags, localFilePath);
      if (success) {
        console.log(`[ID3] Tags Updated Successfully.`);
      } else {
        console.warn(`[ID3] Failed to write tags. Check permissions/file integrity.`);
      }
    } else {
        console.warn(`[ID3] File not found locally. Skipping tag update.`);
    }

    // 2. MOVE FILE IN AZURACAST (If Type Changed)
    let fileMoved = false;
    if (newType && newType !== oldType) {
      console.log(`[MOVE] Type changed from ${oldType} to ${newType}. Moving file...`);
      
      const oldAzuraPath = currentAsset.filePath;
      const newDir = getAzuraTargetDir(newType);
      const newAzuraPath = `${newDir}/${currentAsset.filename}`;

      try {
        await azuraClient.post(`/station/${STATION_ID}/files/batch`, {
          "do": "move",
          "files": [oldAzuraPath],
          "target": newDir
        });

        console.log(`[MOVE] Success: ${oldAzuraPath} -> ${newAzuraPath}`);
        updateData.filePath = newAzuraPath;
        fileMoved = true;
      } catch (moveError) {
        console.error(`[MOVE] Failed: ${moveError.message}`);
        if(moveError.response) console.error(`[AZURA-ERROR]`, moveError.response.data);
      }
    }

    // 3. Update DB
    const updatedAsset = await MusicAsset.findByIdAndUpdate(
      assetId,
      updateData,
      { new: true }
    );
    console.log(`[DB] Updated record saved.`);

    res.status(200).json({ 
      message: "Asset updated successfully.", 
      moved: fileMoved,
      asset: updatedAsset 
    });

  } catch (error) {
    console.error(`[UPDATE] Critical Error: ${error.message}`);
    res.status(500).json({ message: "Failed to update asset." });
  }
}

// ===========================================
// DELETE (Clean up Art, AzuraCast & DB)
// ===========================================
export async function deleteMusicAsset(req, res) {
  const assetId = req.params.id;
  console.log(`[DELETE] Request for Asset ID: ${assetId}`);

  try {
    const asset = await MusicAsset.findById(assetId);
    if (!asset) {
        console.warn(`[DELETE] Asset not found in DB.`);
        return res.status(404).json({ message: "Asset not found." });
    }

    // 1. Delete Cover Art
    if (asset.coverArt) {
      const coverPath = path.join(process.cwd(), 'public', asset.coverArt);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
        console.log(`[DELETE] Cover art removed: ${coverPath}`);
      }
    }

    // 2. Delete from AzuraCast
    try {
      console.log(`[DELETE] Removing from AzuraCast: ${asset.filePath}`);
      await azuraClient.post(`/station/${STATION_ID}/files/batch`, {
        "do": "delete",
        "files": [asset.filePath]
      });
      console.log(`[DELETE] AzuraCast delete successful.`);
    } catch (azuraError) {
      console.error(`[DELETE] AzuraCast Error: ${azuraError.message}`);
    }

    // 3. Delete from DB
    await MusicAsset.findByIdAndDelete(assetId);
    console.log(`[DELETE] DB record removed.`);

    res.status(200).json({
      message: "Music asset deleted successfully.",
      filename: asset.filename
    });

  } catch (error) {
    console.error(`[DELETE] Critical Error: ${error.message}`);
    res.status(500).json({ message: "Failed to delete music asset." });
  }
}

// List Assets
export async function listMusicAssets(req, res) {
  // console.log("[LIST] Fetching all assets..."); // Optional: Commented out to reduce spam on refresh
  try {
    const assets = await MusicAsset.find().sort({ uploadedAt: -1 });
    // console.log(`[LIST] Found ${assets.length} assets.`);
    res.status(200).json(assets);
  } catch (error) {
    console.error(`[LIST] Error: ${error.message}`);
    res.status(500).json({ message: "Failed to retrieve music assets." });
  }
}

// Get Asset By ID
export async function getMusicAssetById(req, res) {
  try {
    const asset = await MusicAsset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found." });
    res.status(200).json(asset);
  } catch (error) {
    console.error(`[GET] Error: ${error.message}`);
    res.status(500).json({ message: "Error retrieving asset." });
  }
}

