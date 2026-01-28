import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      entityType, 
      action, 
      userId,   // Intended target user (for Super Admin filtering)
      startDate, 
      endDate 
    } = req.query;

    const currentUser = req.user;
    const query = {};

    // --- 1. ACCESS CONTROL LOGIC ---
    if (currentUser.role === 'super_admin') {
      // Super Admin can see ALL logs.
      // If they provided a specific 'userId' to filter by, use it.
      if (userId) {
        query.user = userId;
      }
    } else {
      // Everyone else (Admin, Event Manager, etc.) 
      // is STRICTLY limited to their own actions.
      query.user = currentUser._id;
    }

    // --- 2. FILTERS ---
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;

    // Date Range Filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // --- 3. PAGINATION & QUERY ---
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role avatar') // Show who performed the action
      .sort({ createdAt: -1 }) // Newest actions first
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const totalDocs = await AuditLog.countDocuments(query);

    // --- 4. RESPONSE ---
    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        totalDocs,
        limit: parseInt(limit),
        totalPages: Math.ceil(totalDocs / limit),
        page: parseInt(page),
        hasNextPage: page * limit < totalDocs,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error(`[AuditCtrl] 🔥 Error fetching logs: ${error.message}`);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};