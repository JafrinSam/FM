import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  minute: {
    type: Number,
    required: true,
    min: 0,
    max: 59,
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