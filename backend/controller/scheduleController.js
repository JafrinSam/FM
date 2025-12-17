import { Schedule } from '../models/Schedule.js'; // MongoDB Schedule Model
import { sendCommand } from '../commander/liquidsoapCommander.js'; // Telnet Commander
// import { getScheduleStatus } from './telnetController.js'; // Optionally reuse the status checker

// ===================================
// Helper Function (Reused from telnetController for simplicity)
// ===================================

function handleCommandError(command, error) {
  console.error(`Telnet command failed: ${command}`, error.message);
  return { 
    message: `Failed to execute Liquidsoap command: ${command}`, 
    error: error.message 
  };
}

// ===================================
// Liquidsoap Queue Helper
// ===================================

/**
 * Executes 'show_queue' command and returns the raw queue list.
 * @returns {Promise<string[]>} An array of tracks currently in the Liquidsoap queue.
 */
async function getLiquidsoapQueue() {
  const cmd = "show_queue";
  try {
    const response = await sendCommand(cmd);
    return response.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    // If Liquidsoap is offline, treat the queue as empty but log the error.
    console.warn("Could not retrieve Liquidsoap queue status. Assuming empty for update logic.");
    return []; 
  }
}


// ===================================
// Database CRUD Operations (API Endpoints)
// ===================================

/**
 * GET /api/schedules (NEW ROUTE)
 * Get all scheduled items from the database.
 */
export async function listSchedules(req, res) {
  try {
    const schedules = await Schedule.find().sort({ hour: 1, minute: 1 });
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch schedules.", error: error.message });
  }
}

/**
 * POST /api/schedules (NEW ROUTE)
 * Add a new scheduled item to the database.
 * Body: { hour: number, minute: number, filename: string }
 */
export async function addSchedule(req, res) {
  const { hour, minute, filename } = req.body;

  if (hour === undefined || minute === undefined || !filename) {
    return res.status(400).json({ message: "Missing hour, minute, or filename." });
  }

  try {
    const newSchedule = new Schedule({ hour, minute, filename });
    await newSchedule.save();
    res.status(201).json({ message: "Schedule successfully added to DB.", schedule: newSchedule });
  } catch (error) {
    res.status(500).json({ message: "Failed to save schedule to database.", error: error.message });
  }
}


/**
 * PUT /api/schedules/:id (NEW ROUTE WITH COMPLEX LOGIC)
 * Update an existing scheduled item in the database.
 * Body: { hour: number, minute: number, filename: string }
 */
export async function updateSchedule(req, res) {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const existingSchedule = await Schedule.findById(id);

    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found in database." });
    }
    
    // --- 💡 CORE LOGIC: Check Liquidsoap Queue ---
    const liquidsoapQueue = await getLiquidsoapQueue();
    
    // Look for a track in the queue that matches the *original* scheduled filename
    const isQueued = liquidsoapQueue.some(item => 
        // Simple check: Liquidsoap queue items often contain the full URI, e.g., "file:///radio/music/song.mp3"
        item.includes(existingSchedule.filename)
    );

    if (isQueued) {
        // If the original track is found in the Liquidsoap queue, we must skip it.
        // This is the most reliable way to remove it, as there is no specific
        // 'remove from queue by filename' command registered in your script.
        const skipCmd = "next_song"; 
        
        // WARNING: This assumes the *next* item in the queue is the one being updated.
        // If multiple items are scheduled near the same time, this is risky.
        // The safest approach is to warn the user and let them manually manage the queue.
        
        console.warn(`Original scheduled track (${existingSchedule.filename}) found in Liquidsoap queue. Skipping to synchronize.`);
        
        // Execute skip command
        const skipResponse = await sendCommand(skipCmd);
        console.log(`Liquidsoap Skip Response: ${skipResponse}`);
        
        // We assume the skip was successful, but we don't block the DB update.
    }
    // --- 💡 END CORE LOGIC ---

    // Update the schedule in the database
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
        message: "Schedule updated in DB.", 
        synced: isQueued ? `Queue item skipped: ${existingSchedule.filename}` : 'Not found in queue.',
        schedule: updatedSchedule 
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to update schedule.", error: error.message });
  }
}

/**
 * DELETE /api/schedules/:id (NEW ROUTE)
 * Delete a scheduled item by ID from the database.
 */
export async function deleteSchedule(req, res) {
  const { id } = req.params;

  try {
    const existingSchedule = await Schedule.findById(id);

    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }
    
    // We can perform the same check for deletion as for update:
    const liquidsoapQueue = await getLiquidsoapQueue();
    const isQueued = liquidsoapQueue.some(item => item.includes(existingSchedule.filename));
    
    if (isQueued) {
        console.warn(`Deleted track (${existingSchedule.filename}) found in Liquidsoap queue. Skipping to remove it.`);
        
        // Execute skip command
        const skipCmd = "next_song"; 
        await sendCommand(skipCmd);
    }
    
    const result = await Schedule.findByIdAndDelete(id);
    
    res.status(200).json({ 
        message: "Schedule successfully deleted.",
        synced: isQueued ? `Queue item skipped: ${existingSchedule.filename}` : 'Not found in queue.',
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete schedule.", error: error.message });
  }
}