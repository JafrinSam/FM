import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // WHO
  actor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // WHAT
  action: { 
    type: String, 
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] 
  },
  
  // WHERE (Target Resource)
  entity: { type: String, required: true }, // e.g., 'Show', 'Schedule', 'RJ'
  entityId: { type: mongoose.Schema.Types.ObjectId }, // The specific ID of the item
  
  // DETAILS (Human readable)
  description: { type: String }, // e.g., "Updated Show Name from X to Y"

  // TECHNICAL DIFF (For "Compare Versions" feature)
  metadata: {
    before: { type: Object }, // Snapshot of data BEFORE update
    after: { type: Object },  // Snapshot of data AFTER update
    ipAddress: String,
    userAgent: String
  }
}, { 
  timestamps: true // Handles WHEN
});

// Enterprise Tip: Indexing for fast search
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);