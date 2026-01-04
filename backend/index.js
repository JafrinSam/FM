import express from "express"
import dotenv from "dotenv";
import cors from "cors"
import http from 'http';
import amqp from 'amqplib'; // 📦 New: RabbitMQ Library
import path from 'path'; 

import { initWebSocket, broadcastToClients } from './utils/websocket.js';
dotenv.config()

import { MusicAsset } from './models/MusicAsset.js'; // Ensure path is correct
import { connectDB } from './config/mongoConnect.js'; 
import { scheduler } from './Scheduler/Scheduler.js'; 
import api from "./routes/index.js"

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json()); // Essential for parsing Liquidsoap JSON
app.use(cors());

// 1. Initialize WebSockets
initWebSocket(server);

const PORT = process.env.PORT || 3000;
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Global Cache for "Now Playing"
let currentTrackCache = { title: "Station Idle", artist: "Offline" };
let rabbitChannel = null;

// =========================================================
// 🐰 RABBITMQ CONNECTION (Producer)
// =========================================================
async function connectRabbit() {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue('radio_metadata');
    console.log("🐰 Connected to RabbitMQ");
    
    // Handle connection close
    connection.on("close", () => {
      console.error("🐰 RabbitMQ connection closed. Retrying...");
      setTimeout(connectRabbit, 5000);
    });
  } catch (error) {
    console.error("🐰 RabbitMQ Connection Failed:", error.message);
    console.log("Retrying in 5 seconds...");
    setTimeout(connectRabbit, 5000);
  }
}



// =========================================================
// 🚀 INITIALIZATION
// =========================================================
async function initializeApp() {
  try {
    await connectDB(); 
    
    // Start Internal Scheduler (For your DB playlist generation)
    scheduler.start(); 

    // Start RabbitMQ
    connectRabbit();

    // ❌ REMOVED: startNowPlayingWorker() 
    // We don't need to poll anymore. The Push API above handles it.

    // Public API for fetching current state (Initial Load)
    app.get('/api/now-playing', (req, res) => {
      res.json(currentTrackCache);
    });


    // =========================================================
    // 🎵 LIQUIDSOAP WEBHOOK (Smart Metadata Enrichment)
    // =========================================================
    app.post('/api/webhook/metadata', async (req, res) => {
      try {
        const rawBody = req.body;
        console.log("📦 Raw Webhook Body:", JSON.stringify(rawBody));
        
        // 🟢 FIX: Convert Array-of-Arrays (from Liquidsoap) to a simple Object
        // If it comes in as [['title', 'Song'], ['artist', 'Name']], this makes it { title: 'Song', artist: 'Name' }
        const meta = Array.isArray(rawBody) ? Object.fromEntries(rawBody) : rawBody;
        
        // 1. Initial "Raw" Data from Liquidsoap
        let trackData = {
          title: meta.title || "Unknown Title",
          artist: meta.artist || "Unknown Artist",
          is_live: meta.is_live === "true",
          filename: meta.filename || "", 
          type: "Music", // Default type
          cover: "",     // You can add cover logic later
          timestamp: new Date()
        };

        console.log(`📡 Incoming from Liquidsoap: ${trackData.filename}`);

        // 2. 🔍 INTELLIGENT LOOKUP
        // Only search DB if we have a filename and it's not a live stream
        if (!trackData.is_live && trackData.filename) {
          try {
            // Liquidsoap sends: "/music/1765991124971-song.mp3"
            // DB stores: "1765991124971-song.mp3"
            // We use path.basename to get just the file name
            const cleanFilename = path.basename(trackData.filename);

            console.log(`🔎 Searching DB for: ${cleanFilename}`);

            // Search MongoDB using the clean filename
            const asset = await MusicAsset.findOne({ filename: cleanFilename });

            if (asset) {
              console.log(`✅ Found in DB: "${asset.title}" by ${asset.artist}`);
              
              // Overwrite "Unknown" data with your DB data
              trackData.title = asset.title || trackData.title;
              trackData.artist = asset.artist || trackData.artist;
              trackData.type = asset.type || trackData.type;
              
              // Optional: If you ever add cover art URLs to your DB:
              // trackData.cover = asset.coverUrl || ""; 
            } else {
              console.warn(`⚠️ File not found in DB: ${cleanFilename}`);
            }
          } catch (dbError) {
            console.error("❌ DB Lookup Failed:", dbError);
          }
        }

        // 3. Update Global Cache
        currentTrackCache = trackData;

        // 4. Broadcast to Frontend (WebSockets)
        broadcastToClients("NOW_PLAYING", trackData);

        // 5. Publish to RabbitMQ
        if (rabbitChannel) {
          rabbitChannel.sendToQueue(
            'radio_metadata', 
            Buffer.from(JSON.stringify(trackData))
          );
        }

        // 6. Reply fast to Liquidsoap
        res.status(200).send("OK");
        
      } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Error processing metadata");
      }
    });
    // Mount other routes
    app.use('/api', api);
    
    server.listen(PORT, () => {
      console.log(`🌐 API Server, WebSockets & Webhook listening on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Application failed to start:', error);
    process.exit(1);
  }
}

initializeApp();