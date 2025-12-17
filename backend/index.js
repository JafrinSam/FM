import express from "express"
import dotenv from "dotenv";
import cors from "cors"
dotenv.config()

import { connectDB } from './config/mongoConnect.js'; // Assuming you kept the connectDB module
import { scheduler } from './Scheduler/Scheduler.js'; // 💡 Import the scheduler
import api from "./routes/index.js"

const app = express();

app.use(express.json());


const PORT = process.env.PORT;

async function initializeApp() {
  try {
    // 1. Connect to MongoDB
    await connectDB(); 

    // 2. Start the Liquidsoap Scheduler 
    // This starts the 5-second polling cycle that checks the database
    scheduler.start(); 

    app.use(cors());


    // 3. Define Express Routes (e.g., app.use('/api/telnet', telnetRoutes);)
    app.use('/api',api);
    
    app.listen(PORT, () => {
      console.log(`🌐 API Server running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Application failed to start during initialization:', error);
    process.exit(1);
  }
}

initializeApp();