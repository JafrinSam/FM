import 'dotenv/config'; // Always good to have this at the very top
import express from "express";
import cors from "cors";
import http from 'http';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/mongoConnect.js'; 
import { initMinio } from './config/minio.js'; // <--- Import the function
import api from "./routes/index.js";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(express.json());
// ✅ UPDATE THIS SECTION
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // 1. Headers the Client is allowed to SEND to the Server
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'], 
  
  // 2. Headers the Client is allowed to READ from the Server Response
  // 🚨 THIS WAS MISSING. Without this, your frontend cannot see the new token.
  exposedHeaders: ['x-new-access-token'] 
}));
app.use(cookieParser());


// =========================================================
// 🚀 INITIALIZATION FLOW
// =========================================================
async function initializeApp() {
  try {
    // 1. Connect Database
    await connectDB(); 

    // 2. Connect Storage (Manual Call)
    await initMinio();

    // 3. Start Server
    app.use('/api', api);
    
    server.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Application failed to start:', error.message);
    process.exit(1);
  }
}

initializeApp();