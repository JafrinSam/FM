import { Schedule } from '../models/Schedule.js'; 
import { sendCommand } from '../commander/liquidsoapCommander.js'; 

const POLLING_INTERVAL = 5000; 

class LiquidsoapScheduler {
  constructor() {
    this.interval = null;
    this.telnetConfig = { host: "127.0.0.1", port: 1234 };
  }

  start() {
    if (this.interval) return;
    this.checkSchedules();
    this.interval = setInterval(() => this.checkSchedules(), POLLING_INTERVAL);
    console.log("📅 Date-aware Scheduler started.");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async checkSchedules() {
    const now = new Date();

    try {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const schedulesToRun = await Schedule.find({
        scheduledTime: { 
            $lte: now,
            $gte: oneDayAgo 
        },
        isPlayed: false
      });

      for (const schedule of schedulesToRun) {
        await this.executeSchedule(schedule);
      }
    } catch (error) {
      console.error("Scheduler Error:", error);
    }
  }

  async executeSchedule(schedule) {
    const { localDate, localHour, localMinute, filename } = schedule;
    
    console.log(`\n▶️ ATTEMPTING: ${localDate} ${localHour}:${localMinute} - ${filename}`);

    // Note: No "/radio/" prefix because Liquidsoap config adds it.
    // Quotes are handled by Liquidsoap config logic now.
    const relativePath = `scheduled/${filename}`;
    
    // We wrap relativePath in quotes here just to be safe for the telnet command syntax
    const command = `play_scheduled "${relativePath}"`; 

    try {
      // 1. Send Command to Liquidsoap
      const response = await sendCommand(command, this.telnetConfig);
      console.log(`   Liquidsoap Response: "${response}"`);

      // 2. 🟢 VERIFICATION CHECK
      // We check if the response indicates success. 
      // Our Liquidsoap function returns strings starting with "Scheduled ..."
      if (response && response.includes("Scheduled")) {
          
          // 3. Mark as Played ONLY if verified
          schedule.isPlayed = true;
          await schedule.save();
          console.log("   ✅ Success: Verified by Liquidsoap & Marked as played in DB.");

      } else {
          // If response is weird or empty, do NOT mark as played.
          // It will retry in the next loop (5 seconds later).
          console.warn(`   ⚠️ Warning: Liquidsoap did not return a success message. Response: ${response}`);
          console.warn("   ❌ Schedule NOT marked as played. Will retry.");
      }

    } catch (error) {
      console.error(`   ❌ Failed to send command: ${error.message}`);
      // Do not mark as played; allow retry
    }
  }
}

export const scheduler = new LiquidsoapScheduler();