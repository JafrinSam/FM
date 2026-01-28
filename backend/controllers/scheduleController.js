import WeeklySchedule from '../models/WeeklySchedule.js';
import Show from '../models/Show.js';
import mongoose from 'mongoose';
import { logAudit } from '../services/auditService.js'; // ✅ Audit Service
import { getChanges } from '../utils/diffHelper.js';     // ✅ Diff Utility

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * CREATE SCHEDULE
 */
export const createSchedule = async (req, res) => {
  console.log(`\n[INFO] [ScheduleCtrl] Create Schedule Request by: ${req.user?._id}`);

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
      return slotStart < endMin && slotEnd > startMin; // Overlap check
    });

    if (hasConflict) {
      console.warn(`[WARN] [ScheduleCtrl] Conflict detected on ${day}`);
      return res.status(409).json({ 
        success: false, 
        message: `Conflict detected! Another show is scheduled on ${day}s during this date/time range.` 
      });
    }

    // 3. Save Schedule
    if (show && !isValidId(show)) throw new Error("Invalid Show ID");
    
    const scheduleData = {
      startTime, endTime, day, 
      startDate: newStart, 
      endDate: newEnd, 
      exceptionDates: exceptionDates || [],
      show, rj,
      createdBy: req.user._id // ✅ Track Creator
    };

    const newSchedule = new WeeklySchedule(scheduleData);
    const savedSchedule = await newSchedule.save(); 

    // 4. Link to Show
    if (show) {
      await Show.findByIdAndUpdate(show, 
        { $push: { weekly_schedules: savedSchedule._id } }
      );
    }

    console.log(`[INFO] [ScheduleCtrl] Schedule Created ID: ${savedSchedule._id}`);

    // 🛡️ Audit Log (Create)
    logAudit({
      req,
      action: 'CREATE',
      entityType: 'WeeklySchedule',
      entityId: savedSchedule._id,
      entityName: `${day} ${startTime}-${endTime}`,
      changes: { initialData: scheduleData }
    });

    res.status(201).json({ success: true, data: savedSchedule });

  } catch (err) {
    console.error(`[ERROR] [ScheduleCtrl] Create Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET ALL SCHEDULES
 */
export const getAllSchedules = async (req, res) => {
  console.log(`\n[INFO] [ScheduleCtrl] Get All Schedules`);
  try {
    const schedules = await WeeklySchedule.find().populate('show', 'title');
    console.log(`[INFO] [ScheduleCtrl] Found ${schedules.length} schedules`);
    res.status(200).json({ success: true, count: schedules.length, data: schedules });
  } catch (err) {
    console.error(`[ERROR] [ScheduleCtrl] GetAll Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * DELETE SCHEDULE
 */
export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  console.log(`\n[INFO] [ScheduleCtrl] Delete Schedule: ${id}`);

  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Schedule ID" });

    const scheduleToDelete = await WeeklySchedule.findById(id);
    if (!scheduleToDelete) {
        console.warn(`[WARN] [ScheduleCtrl] Schedule not found: ${id}`);
        return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    // Snapshot for Audit
    const snapshot = scheduleToDelete.toObject();

    // Unlink from Show
    if (scheduleToDelete.show) {
      await Show.findByIdAndUpdate(scheduleToDelete.show, {
        $pull: { weekly_schedules: id }
      });
    }

    await WeeklySchedule.findByIdAndDelete(id);

    console.log(`[INFO] [ScheduleCtrl] Schedule Deleted`);

    // 🛡️ Audit Log (Delete)
    logAudit({
      req,
      action: 'DELETE',
      entityType: 'WeeklySchedule',
      entityId: id,
      entityName: `${snapshot.day} ${snapshot.startTime}`,
      changes: { snapshot }
    });

    res.status(200).json({ success: true, message: "Schedule deleted and unlinked successfully" });
  } catch (err) {
    console.error(`[ERROR] [ScheduleCtrl] Delete Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * UPDATE SCHEDULE
 */
export const updateSchedule = async (req, res) => {
  const { id } = req.params;
  console.log(`\n[INFO] [ScheduleCtrl] Update Schedule: ${id}`);

  try {
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Schedule ID" });

    const existingSchedule = await WeeklySchedule.findById(id);
    if (!existingSchedule) return res.status(404).json({ success: false, message: "Schedule entry not found" });

    // Calculate Diff
    const allowed = ['startTime', 'endTime', 'day', 'startDate', 'endDate', 'show', 'rj', 'exceptionDates'];
    const changes = getChanges(existingSchedule, req.body, allowed);

    // Apply updates
    const updatedSchedule = await WeeklySchedule.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    console.log(`[INFO] [ScheduleCtrl] Schedule Updated`);

    // 🛡️ Audit Log (Update)
    if (Object.keys(changes).length > 0) {
        logAudit({
            req,
            action: 'UPDATE',
            entityType: 'WeeklySchedule',
            entityId: updatedSchedule._id,
            entityName: `${updatedSchedule.day} ${updatedSchedule.startTime}`,
            changes
        });
    }

    res.status(200).json({ success: true, data: updatedSchedule });
  } catch (err) {
    console.error(`[ERROR] [ScheduleCtrl] Update Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

/**
 * GET PUBLIC SCHEDULES (For Client Website)
 * Populates Show + RJ details fully
 */
export const getPublicSchedules = async (req, res) => {
  console.log(`\n[INFO] [ScheduleCtrl] Get Public Schedules`);
  try {
    const schedules = await WeeklySchedule.find()
      .populate({
        path: 'show',
        select: 'title tagline description coverImage isLive isHit guestName', // Select only needed fields
        populate: {
          path: 'rjs', // Deep populate RJs assigned to the Show
          select: 'name photo bio instagram'
        }
      })
      .populate('rj', 'name photo bio instagram'); // Populate RJ if assigned specifically to the slot

    console.log(`[INFO] [ScheduleCtrl] Sent ${schedules.length} public schedules`);
    
    res.status(200).json({ 
      success: true, 
      count: schedules.length, 
      data: schedules 
    });

  } catch (err) {
    console.error(`[ERROR] [ScheduleCtrl] Public Get Error: ${err.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};