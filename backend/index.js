import express from "express"
import dotenv from "dotenv";
import cors from "cors"
import http from 'http';
import { Worker } from 'worker_threads'; 
import { initWebSocket, broadcastToClients } from './utils/websocket.js';
dotenv.config()

import { connectDB } from './config/mongoConnect.js'; 
import { scheduler } from './Scheduler/Scheduler.js'; 
import api from "./routes/index.js"

const app = express();
const server = http.createServer(app);
app.use(express.json());

// 1. Initialize WebSockets on the HTTP server
initWebSocket(server);

const PORT = process.env.PORT || 3000; // Good practice to have a fallback

// =========================================================
// 💡 FIX 1: Declare the variable globally here
// =========================================================
let currentTrackCache = { title: "Offline", artist: "Radio Station" };

// 3. Start the Worker Thread
function startNowPlayingWorker() {
  const worker = new Worker('./workers/nowPlayingWorker.js');

  worker.on('message', (message) => {
    if (message.type === 'UPDATE_TRACK') {
      const trackData = message.data || { title: "Offline", artist: "Radio Station" };
      
      // Now this variable exists!
      currentTrackCache = trackData;
      
      console.log(`📡 Broadcasting update: ${trackData.title}`);
      broadcastToClients("NOW_PLAYING", trackData);
    }
  });

  worker.on('error', (err) => console.error('Worker Error:', err));
  worker.on('exit', (code) => {
    if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
  });
}

async function initializeApp() {
  try {
    await connectDB(); 
    scheduler.start(); 

    app.use(cors());

    startNowPlayingWorker();

    // 4. REST API for initial load
    app.get('/api/now-playing', (req, res) => {
      res.json(currentTrackCache);
    });

    app.use('/api', api);
    
    // =========================================================
    // 💡 FIX 2: Use server.listen, NOT app.listen
    // (Required for WebSockets to work on the same port)
    // =========================================================
    server.listen(PORT, () => {
      console.log(`🌐 API Server & WebSockets running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Application failed to start during initialization:', error);
    process.exit(1);
  }
}

initializeApp();