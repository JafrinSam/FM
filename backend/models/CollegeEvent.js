import mongoose from 'mongoose';
import slugify from 'slugify';

const collegeEventSchema = new mongoose.Schema({
  // --- 1. Basic Info ---
  title: {
    type: String,
    required: [true, "Event title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  slug: { 
    type: String, 
    unique: true, 
    lowercase: true,
    index: true 
  },
  
  // --- 2. Creation Workflow Status ---
  creationStatus: {
    type: String,
    enum: ['pending', 'completed'], 
    default: 'pending', // Starts as pending until thumbnail is uploaded
    index: true
  },

  // --- 3. Media ---
  thumbnail: { 
    type: String, 
    default: "default-event.jpg" 
  },
  
  description: { type: String, required: true, trim: true },
  summary: { type: String, maxlength: 200, trim: true },

  // --- 4. Categorization ---
  category: {
    type: String,
    enum: ['Tech', 'Cultural', 'Academic', 'Sports', 'Workshop'],
    default: 'Academic',
    required: true,
    index: true 
  },
  
  // --- 5. Date & Time ---
  date: { type: Date, required: true },
  time: { type: String, required: true },
  endDate: { type: Date },
  endTime: { type: String },
  location: { type: String, required: true, trim: true },

  // --- 6. Organizers ---
  organizers: {
    type: [{
      name: { type: String, required: true },
      role: { type: String, enum: ['Student', 'Professor', 'External'], default: 'Student' },
      phone: String,
      email: String,
      image: String
    }],
    validate: {
      validator: v => Array.isArray(v) && v.length > 0,
      message: 'You must provide at least one organizer.'
    }
  },

  // --- 7. Registration Logic ---
  registrationStatus: {
    type: String,
    enum: ['Open', 'Closed', 'Filling Fast', 'Waitlist', 'Coming Soon'], 
    default: 'Open' 
  },
  registrationStartDate: { type: Date, default: Date.now },
  registrationEndDate: { type: Date },
  registrationLink: { type: String, trim: true },
  capacity: { type: Number, min: 0, default: 0 },

  // --- 8. System Flags ---
  isFeatured: { type: Boolean, default: false },
  
  // ✅ Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    immutable: true 
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ FIXED: Slugify Middleware (Async Syntax)
// Using async function removes the need for 'next()', fixing the crash.
collegeEventSchema.pre('save', async function() {
  // If title hasn't changed, skip slug generation
  if (!this.isModified('title')) return;

  // Generate slug
  this.slug = slugify(this.title, { lower: true, strict: true });
});

// Smart Status Virtual
collegeEventSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (now > this.date) return 'Closed';
  if (this.creationStatus === 'pending') return 'Draft'; // Show Draft if incomplete
  if (this.registrationStartDate && now < this.registrationStartDate) return 'Coming Soon';
  if (this.registrationEndDate && now > this.registrationEndDate) return 'Registration Closed';
  return this.registrationStatus;
});

const CollegeEvent = mongoose.model('CollegeEvent', collegeEventSchema);
export default CollegeEvent;