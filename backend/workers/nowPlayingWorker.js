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
  try {
    // 1. Get the new formatted string from Liquidsoap
    const rawResponse = await sendCommand("get_status", TELNET_CONFIG);
    const cleanResponse = rawResponse ? rawResponse.replace(/[\r\n]*END$/, "").trim() : "";

    if (!cleanResponse || cleanResponse === lastRawString) return;

    // 2. Parse "Title|Artist|IsLive"
    const parts = cleanResponse.split("|");
    const title = parts[0] || "Station Idle";
    const artist = parts[1] || "";
    const isLiveStr = parts[2] || "false";

    console.log(`[Worker] 🎵 Update: ${title} (${isLiveStr === "true" ? "LIVE" : "Track"})`);

    // 3. Build the object
    const trackDetails = {
      title: title,
      artist: artist,
      // 🟢 CRITICAL: This allows the frontend to show the GREEN "ON AIR" button
      type: isLiveStr === "true" ? "Live" : "Track", 
      art: null // You can fetch DB art here if it's a track
    };

    // 4. Send to Main Thread
    parentPort.postMessage({ type: 'UPDATE_TRACK', data: trackDetails });
    lastRawString = cleanResponse;

  } catch (error) {
    console.error("[Worker] Polling Error:", error.message);
  }
}

startWorker();