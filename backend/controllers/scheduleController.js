import WeeklySchedule from '../models/WeeklySchedule.js';
import Show from '../models/Show.js';
import mongoose from 'mongoose';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const createSchedule = async (req, res) => {
  try {
    const { 
      day, startTime, endTime, startDate, endDate, exceptionDates, show, rj 
    } = req.body;

    // 1. Basic Validation
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Start Date and End Date are required." });
    }
    
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    if (newStart > newEnd) {
      return res.status(400).json({ success: false, message: "Start Date cannot be after End Date." });
    }

    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);

    // 2. CONFLICT DETECTION
    const potentialConflicts = await WeeklySchedule.find({
      day: day,
      $or: [
        { startDate: { $gte: newStart, $lte: newEnd } },
        { endDate: { $gte: newStart, $lte: newEnd } },
        { startDate: { $lte: newStart }, endDate: { $gte: newEnd } }
      ]
    });

    const hasConflict = potentialConflicts.some(existingSlot => {
      const slotStart = toMinutes(existingSlot.startTime);
      const slotEnd = toMinutes(existingSlot.endTime);
      const timeOverlaps = slotStart < endMin && slotEnd > startMin;
      return timeOverlaps;
    });

    if (hasConflict) {
      return res.status(409).json({ 
        success: false, 
        message: `Conflict detected! Another show is scheduled on ${day}s during this date/time range.` 
      });
    }

    // 3. Save Schedule (Without Session)
    if (show && !isValidId(show)) throw new Error("Invalid Show ID");
    
    const newSchedule = new WeeklySchedule({
      startTime, endTime, day, 
      startDate: newStart, 
      endDate: newEnd, 
      exceptionDates: exceptionDates || [],
      show, rj
    });

    const savedSchedule = await newSchedule.save(); // <--- No session passed here

    // 4. Link to Show (Without Session)
    if (show) {
      await Show.findByIdAndUpdate(show, 
        { $push: { weekly_schedules: savedSchedule._id } }
      );
    }

    res.status(201).json({ success: true, data: savedSchedule });

  } catch (err) {
    console.error("Schedule Error:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};
// ... (Keep update/delete logic, ensure they respect the new schema fields)
export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await WeeklySchedule.find().populate('show', 'title');
    res.status(200).json({ success: true, count: schedules.length, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Schedule ID" });

    // Optional: We should also remove this schedule ID from the Show's array
    const scheduleToDelete = await WeeklySchedule.findById(id);
    if (!scheduleToDelete) return res.status(404).json({ success: false, message: "Schedule not found" });

    // Clean up relation in Show collection
    if (scheduleToDelete.show) {
      await Show.findByIdAndUpdate(scheduleToDelete.show, {
        $pull: { weekly_schedules: id }
      });
    }

    await WeeklySchedule.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Schedule deleted and unlink from Show successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Schedule ID" });

    const updatedSchedule = await WeeklySchedule.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedSchedule) return res.status(404).json({ success: false, message: "Schedule entry not found" });

    res.status(200).json({ success: true, data: updatedSchedule });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};