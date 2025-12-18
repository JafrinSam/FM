import { Schedule } from '../models/Schedule.js';
import { sendCommand } from '../commander/liquidsoapCommander.js';

// --- HELPER: Convert IST to UTC ---
function convertToUTC(localHour, localMinute) {
  // 1. Convert everything to minutes
  let totalMinutes = (localHour * 60) + localMinute;
  
  // 2. Subtract IST Offset (5 hours 30 minutes = 330 minutes)
  totalMinutes = totalMinutes - 330;

  // 3. Handle negative values (crossing midnight backwards)
  // e.g., 01:00 AM IST is previous day 19:30 UTC
  if (totalMinutes < 0) {
    totalMinutes += (24 * 60);
  }

  // 4. Convert back to hours/minutes
  const utcHour = Math.floor(totalMinutes / 60);
  const utcMinute = totalMinutes % 60;

  return { utcHour, utcMinute };
}

// --- CONTROLLER FUNCTIONS ---

export async function addSchedule(req, res) {
  // User sends 'hour' and 'minute' as IST
  const { hour, minute, filename } = req.body;

  if (hour === undefined || minute === undefined || !filename) {
    return res.status(400).json({ message: "Missing hour, minute, or filename." });
  }

  // Calculate UTC
  const { utcHour, utcMinute } = convertToUTC(hour, minute);

  try {
    const newSchedule = new Schedule({
      localHour: hour,     // Save IST for display
      localMinute: minute,
      utcHour: utcHour,    // Save UTC for scheduler
      utcMinute: utcMinute,
      filename: filename
    });

    await newSchedule.save();
    
    res.status(201).json({ 
      message: "Schedule added.", 
      debug: `Converted IST ${hour}:${minute} -> UTC ${utcHour}:${utcMinute}`,
      schedule: newSchedule 
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving schedule.", error: error.message });
  }
}

export async function updateSchedule(req, res) {
  const { id } = req.params;
  const { hour, minute, filename } = req.body;

  try {
    // 1. Recalculate UTC if time is being updated
    let updateData = { filename };
    
    if (hour !== undefined && minute !== undefined) {
        const { utcHour, utcMinute } = convertToUTC(hour, minute);
        updateData.localHour = hour;
        updateData.localMinute = minute;
        updateData.utcHour = utcHour;
        updateData.utcMinute = utcMinute;
    }

    // 2. Standard Update
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedSchedule) return res.status(404).json({ message: "Not found" });

    res.status(200).json({ 
        message: "Schedule updated.", 
        schedule: updatedSchedule 
    });

  } catch (error) {
    res.status(500).json({ message: "Update failed.", error: error.message });
  }
}

// Reuse your existing listSchedules and deleteSchedule functions...
export async function listSchedules(req, res) {
  try {
    // We sort by utcHour to keep them in chronological order
    const schedules = await Schedule.find().sort({ utcHour: 1, utcMinute: 1 });
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch schedules.", error: error.message });
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