import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from 'http';
dotenv.config();

import { initWebSocket, broadcastToClients } from './utils/websocket.js';
import { connectDB } from './config/mongoConnect.js'; 
import { scheduler } from './Scheduler/Scheduler.js'; 
import { connectRabbit, consumeQueue } from './config/rabbitmq.js'; // 🟢 Import Module
import api from "./routes/index.js";


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Initialize WebSocket
initWebSocket(server);

// 🟢 GLOBAL STATE (Updated via RabbitMQ)
let currentTrackState = { title: "Waiting for Stream...", artist: "" };

// =========================================================
// 🚀 INITIALIZATION
// =========================================================
async function initializeApp() {
  try {
    // 1. Connect Services
    await connectDB(); 
    //await connectRabbit(); // Connect to RabbitMQ
    
    // 2. Start Scheduler
    scheduler.start(); 

    

    // 4. API Routes
    
    // 🟢 ROUTE: Get data sourced from RabbitMQ
    app.get('/api/now-playing', (req, res) => {
      res.json(currentTrackState);
    });

    app.use('/api', api);
    
    server.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Application failed to start:', error);
    process.exit(1);
  }
}

initializeApp();