import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // WHO: The user who performed the action
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // WHAT: The type of action
  action: { 
    type: String, 
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'REVOKE_SESSION', 'STATUS_CHANGE'] 
  },

  // WHERE: Which entity was affected
  entityType: { 
    type: String, 
    required: true,
    enum: ['User', 'CollegeEvent', 'Show', 'RJ', 'WeeklySchedule'] 
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  entityName: { type: String }, // Store a snapshot of the title/name for easier reading

  // DETAILS: Specific changes (Old value vs New value)
  changes: { type: Object }, // Flexible JSON object to store the diff
  
  // META: IP address, User Agent (optional but recommended)
  ipAddress: String,
  userAgent: String

}, { timestamps: { createdAt: true, updatedAt: false } }); // Only need creation time

// Index for fast searching by entity or user
auditLogSchema.index({ entityId: 1, entityType: 1 });
auditLogSchema.index({ user: 1 });

export default mongoose.model('AuditLog', auditLogSchema);