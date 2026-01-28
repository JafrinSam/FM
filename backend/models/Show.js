import mongoose from 'mongoose';

const showSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tagline: { type: String, required: true },
  description: { type: String, required: true }, // Rich text stored as HTML string
  coverImage: { type: String, required: true },
  isLive: { type: Boolean, default: false },
  guestName: { type: String },
  hit: { type: Boolean, default: false },
  
  // Relations
  rjs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rj' }], // OneToMany
  weekly_schedules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WeeklySchedule' }],

  // ✅ Audit Field
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  }
}, { timestamps: true });

export default mongoose.model('Show', showSchema);