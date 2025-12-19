import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  // 1. Human-readable local time (for UI display)
  localDate: {
    type: String, // Format: "YYYY-MM-DD"
    required: true,
  },
  localHour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  localMinute: {
    type: Number,
    required: true,
    min: 0,
    max: 59,
  },

  // 2. The actual execution timestamp (UTC)
  // This replaces utcHour/utcMinute
  scheduledTime: {
    type: Date,
    required: true,
    index: true // ⚡ Important for performance (we query this often)
  },

  filename: {
    type: String,
    required: true,
    trim: true,
  },

  // 3. Status flag to ensure it plays only once
  isPlayed: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Schedule = mongoose.model('Schedule', ScheduleSchema);