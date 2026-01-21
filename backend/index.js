import 'dotenv/config'; // Always good to have this at the very top
import express from "express";
import cors from "cors";
import http from 'http';

import { connectDB } from './config/mongoConnect.js'; 
import { initMinio } from './config/minio.js'; // <--- Import the function
import api from "./routes/index.js";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

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