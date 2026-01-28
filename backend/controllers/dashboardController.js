import User from '../models/User.js';
import CollegeEvent from '../models/CollegeEvent.js';
import Show from '../models/Show.js'; 
import RJ from '../models/Rj.js';
import Schedule from '../models/WeeklySchedule.js'; 

/**
 * @desc    Get Dashboard Statistics based on User Role
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res) => {
  console.log(`\n[INFO] [DashboardCtrl] Stats Request by: ${req.user?._id} (${req.user?.role})`);

  try {
    const { role, _id } = req.user;
    let stats = {};

    // 1. SUPER ADMIN (System Oversight)
    if (role === 'super_admin') {
      console.log(`[INFO] [DashboardCtrl] Fetching Super Admin Stats...`);
      
      const [userCount, adminCount, eventMgrCount, totalEvents] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'event_manager' }),
        CollegeEvent.countDocuments()
      ]);
      
      stats = { userCount, adminCount, eventMgrCount, totalEvents };
    } 
    
    // 2. ADMIN (Broadcasting + Events)
    else if (role === 'admin') {
      console.log(`[INFO] [DashboardCtrl] Fetching Admin Station Stats...`);
      
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      const [activeRJs, totalShows, scheduledToday, openEvents] = await Promise.all([
        RJ.countDocuments(),                       
        Show.countDocuments(),                     
        Schedule.countDocuments({ day: today }),   
        CollegeEvent.countDocuments({ registrationStatus: 'Open' }) 
      ]);
      
      stats = { activeRJs, totalShows, scheduledToday, openEvents };
    } 
    
    // 3. EVENT MANAGER (Events Only) - ✅ UPDATED WITH AGGREGATION
    else if (role === 'event_manager') {
      console.log(`[INFO] [DashboardCtrl] Fetching Event Manager Stats (Aggregation)...`);
      
      const eventStats = await CollegeEvent.aggregate([
        // 1. Filter: Only match events created by THIS user
        
        // 2. Group & Calculate
        {
            $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                pendingEvents: { $sum: { $cond: [{ $eq: ["$creationStatus", "pending"] }, 1, 0] } },
                completedEvents: { $sum: { $cond: [{ $eq: ["$creationStatus", "completed"] }, 1, 0] } },
                // New: Count events where date is in the future
                upcomingEvents: { $sum: { $cond: [{ $gt: ["$date", new Date()] }, 1, 0] } } 
            }
        }
      ]);

      // If no events found, default to zeros
      stats = eventStats[0] || { 
          totalEvents: 0, 
          pendingEvents: 0, 
          completedEvents: 0, 
          upcomingEvents: 0 
      };
    }

    // 4. Fallback for unexpected roles
    else {
        console.warn(`[WARN] [DashboardCtrl] Unrecognized role: ${role}`);
        return res.status(403).json({ success: false, message: "Dashboard access denied for this role" });
    }

    console.log(`[INFO] [DashboardCtrl] Stats fetched successfully`);
    
    res.status(200).json({ 
        success: true, 
        role, 
        stats 
    });

  } catch (error) {
    console.error(`[ERROR] [DashboardCtrl] Stats Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};