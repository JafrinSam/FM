import express from "express"
import dotenv from "dotenv";
import cors from "cors"
import http from 'http';
import amqp from 'amqplib'; // 📦 New: RabbitMQ Library
import { initWebSocket, broadcastToClients } from './utils/websocket.js';
dotenv.config()

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
// 🎵 LIQUIDSOAP WEBHOOK (Replaces the Worker Thread)
// =========================================================
// Liquidsoap calls this endpoint via http.post()
app.post('/api/webhook/metadata', (req, res) => {
  try {
    const meta = req.body;
    
    // 1. Normalize Data (Liquidsoap sends everything as strings)
    const trackData = {
      title: meta.title || "Unknown Title",
      artist: meta.artist || "Unknown Artist",
      is_live: meta.is_live === "true", // Convert string "true" to boolean
      cover: meta.cover || "",
      timestamp: new Date()
    };

    console.log(`📡 New Track: ${trackData.title} - ${trackData.artist}`);

    // 2. Update Global Cache (for new API calls)
    currentTrackCache = trackData;

    // 3. Broadcast to Frontend (WebSockets)
    broadcastToClients("NOW_PLAYING", trackData);

    // 4. Publish to RabbitMQ (For other services/workers)
    if (rabbitChannel) {
      rabbitChannel.sendToQueue(
        'radio_metadata', 
        Buffer.from(JSON.stringify(trackData))
      );
    }

    // 5. Reply fast so Liquidsoap doesn't lag
    res.status(200).send("OK");
    
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Error processing metadata");
  }
});


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