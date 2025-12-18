import { Schedule } from '../models/Schedule.js'; 
import { sendCommand } from '../commander/liquidsoapCommander.js'; 

const POLLING_INTERVAL = 5000; // 5 seconds
let processedSchedules = new Set(); 

class LiquidsoapScheduler {
  constructor() {
    this.interval = null;
    this.telnetConfig = {
      host: "127.0.0.1",
      port: 1234, 
    };
    console.log("Liquidsoap Scheduler initialized.");
  }

  start() {
    if (this.interval) {
      console.warn("Scheduler is already running.");
      return;
    }
    
    this.checkSchedules();
    this.interval = setInterval(() => this.checkSchedules(), POLLING_INTERVAL);
    console.log(`Scheduler started, checking (UTC) every ${POLLING_INTERVAL / 1000} seconds.`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("Scheduler stopped.");
    }
  }

  async checkSchedules() {
    const now = new Date();
    
    // 1. Get current SYSTEM time in UTC
    const currentUTCHour = now.getUTCHours();
    const currentUTCMinute = now.getUTCMinutes();

    if (now.getSeconds() < 5) {
        processedSchedules.clear();
    }
    
    try {
      // 2. Query the DB using the stored UTC fields
      const schedulesToRun = await Schedule.find({
        utcHour: currentUTCHour,     // Match DB UTC with System UTC
        utcMinute: currentUTCMinute, 
      });

      for (const schedule of schedulesToRun) {
        if (!processedSchedules.has(schedule._id.toString())) {
          await this.executeSchedule(schedule);
          processedSchedules.add(schedule._id.toString());
        }
      }
    } catch (error) {
      console.error("Scheduler Error:", error);
    }
  }


  async executeSchedule(schedule) {
    const { hour, minute, filename } = schedule;
    console.log(`\n*** MATCH FOUND (UTC): ${hour}:${minute} - ${filename} ***`);

    // Path logic (adjust if your scheduled files are in /radio/music or /radio/scheduled)
    // If files are in /radio/scheduled, we use "../scheduled/"
    const relativePath = `scheduled/${filename}`;

    // ⚠️ CRITICAL UPDATE: 
    // 1. Use 'play_scheduled' to target the VIP/High-Priority queue.
    // 2. Wrap the path in quotes to handle spaces safely.
    const command = `play_scheduled "${relativePath}"`; 

    try {
      const response = await sendCommand(command, this.telnetConfig);
      console.log(`Liquidsoap Response: ${response}`);
    } catch (error) {
      console.error(`Failed to send command to Liquidsoap: ${error.message}`);
    }
  }
}

export const scheduler = new LiquidsoapScheduler();