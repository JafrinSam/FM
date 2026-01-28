import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  req,
  user,
  action,
  entityType,
  entityId,
  entityName,
  changes = null
}) => {
  // Fire-and-forget wrapper: We start the async operation but catch errors internally
  // so the main API thread isn't blocked or crashed by a logging failure.
  try {
    // 1. Determine Actor
    // Use explicitly passed 'user' OR fall back to req.user._id
    const actor = user || req?.user?._id;
    
    if (!actor) {
        console.warn(`[Audit] ⚠️ Skipped log: No user identified for ${action} on ${entityType}`);
        return; 
    }

    // 2. Extract IP and User Agent safely
    // (req might be undefined if this is run from a background job/script)
    const ipAddress = req?.ip || req?.connection?.remoteAddress || '0.0.0.0';
    const userAgent = req?.headers?.['user-agent'] || 'Unknown';

    // 3. Create Log Entry
    await AuditLog.create({
      user: actor,
      action,
      entityType,
      entityId,
      entityName: entityName || 'Unknown', // Fallback to avoid null errors
      changes,
      ipAddress,
      userAgent
    });
    
    console.log(`[Audit] 📝 Logged: ${action} on ${entityType} (${entityId})`);

  } catch (error) {
    // Silent fail - auditing shouldn't crash the main app flow
    console.error(`[Audit] ❌ Failed to log:`, error.message);
  }
};