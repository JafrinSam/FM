import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  // What you see (IST)
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
  // What the Scheduler uses (UTC)
  utcHour: {
    type: Number,
    required: true, 
  },
  utcMinute: {
    type: Number,
    required: true,
  },
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Schedule = mongoose.model('Schedule', ScheduleSchema);