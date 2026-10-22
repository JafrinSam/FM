import { Schedule } from '../models/Schedule.js';
import { sendCommand } from '../commander/liquidsoapCommander.js';

// --- HELPER: Create Date Object from IST Input ---
function createScheduledDate(dateStr, hour, minute) {
  // 1. Format numbers to be 2 digits (e.g., 9 -> "09")
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');

  // 2. Create ISO String with IST Offset
  // Format: "YYYY-MM-DDTHH:MM:00+05:30"
  const isoString = `${dateStr}T${hh}:${mm}:00+05:30`;

  // 3. Create Javascript Date (simultaneously converts to UTC)
  return new Date(isoString);
}

export async function addSchedule(req, res) {
  // Input: date ("2025-12-25"), hour (14), minute (30), filename
  const { date, hour, minute, filename } = req.body;

  if (!date || hour === undefined || minute === undefined || !filename) {
    return res.status(400).json({ message: "Missing date, hour, minute, or filename." });
  }

  try {
    // Convert to proper timestamp
    const scheduledTime = createScheduledDate(date, hour, minute);

    // Check if date is valid
    if (isNaN(scheduledTime.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    const newSchedule = new Schedule({
      localDate: date,
      localHour: hour,
      localMinute: minute,
      scheduledTime: scheduledTime, // Saved as UTC automatically
      filename: filename,
      isPlayed: false
    });

    await newSchedule.save();
    
    res.status(201).json({ 
      message: "Schedule added.", 
      debug: `Scheduled for: ${scheduledTime.toISOString()} (UTC)`,
      schedule: newSchedule 
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving schedule.", error: error.message });
  }
}

// Update (Optional: reset isPlayed if user edits the time)
export async function updateSchedule(req, res) {
  const { id } = req.params;
  const { date, hour, minute, filename } = req.body;

  try {
    let updateData = { filename };
    
    // If time/date changes, recalculate timestamp and reset played status
    if (date && hour !== undefined && minute !== undefined) {
        updateData.localDate = date;
        updateData.localHour = hour;
        updateData.localMinute = minute;
        updateData.scheduledTime = createScheduledDate(date, hour, minute);
        updateData.isPlayed = false; // Reset status so it plays again
    }

    const updated = await Schedule.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });

    res.status(200).json({ message: "Updated", schedule: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// List: Sort by the real date
export async function listSchedules(req, res) {
  try {
    const schedules = await Schedule.find().sort({ scheduledTime: 1 });
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteSchedule(req, res) {
  /* ... use your existing delete logic ... */
    const { id } = req.params;
    try {
        const result = await Schedule.findByIdAndDelete(id);
        if(!result) return res.status(404).json({message: "Not found"});
        res.status(200).json({message: "Deleted"});
    } catch(err) {
        res.status(500).json({error: err.message});
    }
}