import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  // Time Slots (HH:mm)
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },
  
  // Recurrence Pattern
  day: { 
    type: String, 
    required: true, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
  },

  // --- NEW ENTERPRISE FIELDS ---
  startDate: { type: Date, required: true }, // When does this rule start applying?
  endDate: { type: Date, required: true },   // When does it stop?
  exceptionDates: [{ type: Date }],          // Specific dates to SKIP this rule (e.g. Holidays)

  // Relations
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show' },
  rj: { type: mongoose.Schema.Types.ObjectId, ref: 'Rj' }
}, { timestamps: true });

// Index for faster conflict lookups
scheduleSchema.index({ day: 1, startDate: 1, endDate: 1 });

export default mongoose.model('WeeklySchedule', scheduleSchema);