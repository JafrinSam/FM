import { Schedule } from '../models/Schedule.js'; // Adjust path as necessary
import { sendCommand } from '../commander/liquidsoapCommander.js'; // Adjust path as necessary

const POLLING_INTERVAL = 5000; // 5 seconds
let processedSchedules = new Set(); // Tracks schedules processed in the current minute

class LiquidsoapScheduler {
  constructor() {
    this.interval = null;
    this.telnetConfig = {
      host: "127.0.0.1",
      port: 1234, // Ensure this matches your liquidsoap config
    };
    console.log("Liquidsoap Scheduler initialized.");
  }

  /**
   * Starts the polling loop.
   */
  start() {
    if (this.interval) {
      console.warn("Scheduler is already running.");
      return;
    }
    
    // Run the check immediately, then start the interval
    this.checkSchedules();
    this.interval = setInterval(() => this.checkSchedules(), POLLING_INTERVAL);
    console.log(`Scheduler started, checking every ${POLLING_INTERVAL / 1000} seconds.`);
  }

  /**
   * Stops the polling loop.
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("Scheduler stopped.");
    }
  }

  /**
   * Core logic to check MongoDB for schedules matching the current time.
   */
  async checkSchedules() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Reset the processed list at the start of every new minute
    if (now.getSeconds() < POLLING_INTERVAL / 1000) {
        processedSchedules.clear();
    }
    
    try {
      // Find all schedules matching the current hour and minute
      const schedulesToRun = await Schedule.find({
        hour: currentHour,
        minute: currentMinute,
      });

      for (const schedule of schedulesToRun) {
        // Use the MongoDB _id to ensure we only run the schedule once per minute
        if (!processedSchedules.has(schedule._id.toString())) {
          await this.executeSchedule(schedule);
          processedSchedules.add(schedule._id.toString());
        }
      }
    } catch (error) {
      console.error("Scheduler Error: Could not check MongoDB for schedules.", error);
    }
  }

  /**
   * Executes the Liquidsoap command for a given schedule.
   * @param {object} schedule The schedule document from MongoDB.
   */
  async executeSchedule(schedule) {
    const { hour, minute, filename } = schedule;
    console.log(`\n*** MATCH FOUND: Executing schedule for ${hour}:${minute} - ${filename} ***`);

    // The Liquidsoap command uses your registered 'play_song' function.
    // Liquidsoap command: play_song <filename>
    const command = `play_song ${filename}`; 

    try {
      const response = await sendCommand(command, this.telnetConfig);
      console.log(`Liquidsoap Response for '${command}': ${response}`);
    } catch (error) {
      console.error(`Failed to send command to Liquidsoap: ${error.message}`);
      // The original Telnet module handles connection/timeout errors.
    }
  }
}

// Export and instantiate the scheduler
export const scheduler = new LiquidsoapScheduler();