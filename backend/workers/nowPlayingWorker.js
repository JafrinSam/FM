import { parentPort } from 'worker_threads';
import mongoose from 'mongoose';
import path from 'path';
import { sendCommand } from '../commander/liquidsoapCommander.js'; 
import { MusicAsset } from '../models/MusicAsset.js'; 

// Configuration
const POLL_INTERVAL = 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/radioDB"; 
const TELNET_CONFIG = { host: "127.0.0.1", port: 1234 };

let lastFilename = "";
let isConnected = false;

// --- Helper: Clean up raw filenames ---
// Turns "1765991124971-My_Cool_Song.mp3" into "My Cool Song"
function cleanDisplayTitle(rawFilename) {
  if (!rawFilename) return "Unknown Track";

  return rawFilename
    .replace(/^\d+-/, '')           // 1. Remove timestamp prefix (digits + dash)
    .replace(/\.[^/.]+$/, "")       // 2. Remove file extension (.mp3)
    .replace(/_/g, " ")             // 3. Replace underscores with spaces
    .replace(/\s+/g, " ")           // 4. Collapse multiple spaces into one
    .trim();                        // 5. Remove leading/trailing whitespace
}

// --- 1. Initialize Worker ---
async function startWorker() {
  try {
    if (!isConnected) {
      console.log("[Worker] Connecting to MongoDB...");
      await mongoose.connect(MONGO_URI);
      isConnected = true;
      console.log("[Worker] ✅ Connected to MongoDB.");
    }

    checkNowPlaying();
    setInterval(checkNowPlaying, POLL_INTERVAL);

  } catch (error) {
    console.error("[Worker] ❌ Startup Error:", error);
  }
}

async function checkNowPlaying() {
  if (!isConnected) return;

  try {
    const rawResponse = await sendCommand("get_filename", TELNET_CONFIG);

    let filename = rawResponse
      ? rawResponse.replace(/[\r\n]*END$/, "").trim()
      : "";

    // --- Dead air ---
    if (!filename || filename === "No file playing") {
      if (lastFilename !== "IDLE") {
        lastFilename = "IDLE";
        parentPort.postMessage({ type: 'UPDATE_TRACK', data: null });
      }
      return;
    }

    // ✅ ALWAYS work with basename
    const cleanFilename = path.basename(filename);

    if (cleanFilename === lastFilename) return;

    console.log(`[Worker] 🎵 Track changed: ${cleanFilename}`);

    let trackDetails;

    try {

      const asset = await MusicAsset.findOne({ filename: cleanFilename }).lean();
      //console.log("asset:",asset)

      if (asset) {
        const finalTitle =
          asset.title && asset.title !== "Untitled Track"
            ? asset.title
            : cleanDisplayTitle(cleanFilename);

        trackDetails = {
          title: finalTitle,
          artist:
            asset.artist && asset.artist !== "Unknown"
              ? asset.artist
              : "BlazeUp Radio",
          album: "BlazeUp Radio",
          duration: asset.duration || 0,
          type: asset.type || "Music",
        };
      } else {
        // --- Fallback ---
        trackDetails = {
          title: cleanDisplayTitle(cleanFilename),
          artist: "BlazeUp Radio",
          type: "Music",
        };
      }
    } catch (dbErr) {
      console.error("[Worker] DB Error:", dbErr.message);
      trackDetails = {
        title: cleanDisplayTitle(cleanFilename),
        artist: "BlazeUp Radio",
        type: "Music",
      };
    }

    parentPort.postMessage({ type: 'UPDATE_TRACK', data: trackDetails });
    lastFilename = cleanFilename;

  } catch (error) {
    console.error("[Worker] Polling Error:", error.message);
  }
}


startWorker();