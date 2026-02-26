import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Radio, Mic, Loader2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch'; 

// --- CONSTANTS & HELPERS ---
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// Helper: Convert "14:30" -> 870 minutes for easy comparison
const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// Check if a show is currently happening
const checkIsOnAir = (startTime, endTime) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = getMinutes(startTime);
  const endMinutes = getMinutes(endTime);

  // Handle overnight shows (e.g., 23:00 to 01:00)
  if (endMinutes < startMinutes) { 
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Transform Backend Data to Widget Format
const transformScheduleData = (item) => {
    const show = item.show || {};
    const rj = item.rj || {};

    return {
        id: item._id,
        title: show.title || "Music Selection",
        isLiveFormat: show.isLive || false,
        guest: show.guestName,
        startTime: item.startTime,
        endTime: item.endTime,
        day: item.day,
        rjName: rj.name || "ByteCast Bot"
    };
};

export default function ScheduleWidget() {
  const { get, loading } = useFetch();
  const [currentShow, setCurrentShow] = useState(null);
  const [nextShows, setNextShows] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const fetchAndProcessSchedule = async () => {
      try {
        // 1. Fetch Public Schedule
        const result = await get('/weekly-schedules/public');
        
        if (result.success && result.data?.data) {
            const allSchedules = result.data.data.map(transformScheduleData);

            // 2. Determine "Today"
            const now = new Date();
            const currentDayIndex = now.getDay(); 
            // Convert JS Day (0=Sun) to Array Index (Mon=0...Sun=6)
            const todayName = DAYS_OF_WEEK[currentDayIndex === 0 ? 6 : currentDayIndex - 1];
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // 3. Filter for Today
            const todaySchedules = allSchedules.filter(s => s.day === todayName);

            // 4. Sort by Start Time
            todaySchedules.sort((a, b) => getMinutes(a.startTime) - getMinutes(b.startTime));

            // 5. Find Current Show
            const live = todaySchedules.find(show => checkIsOnAir(show.startTime, show.endTime));
            setCurrentShow(live || null);

            // 6. Find Upcoming Shows
            const upcoming = todaySchedules.filter(show => {
                const startM = getMinutes(show.startTime);
                // Show must start AFTER current time
                // AND not be the show that is currently live (redundancy check)
                return startM > currentMinutes;
            }).slice(0, 3); // Take next 3

            setNextShows(upcoming);
        }
      } catch (err) {
        console.error("Widget Error:", err);
      } finally {
        setIsDataLoaded(true);
      }
    };

    fetchAndProcessSchedule();
  }, [get]);

  // Loading State
  if (loading || !isDataLoaded) return (
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20 flex justify-center">
          <div className="bg-background border border-border shadow-2xl rounded-3xl p-8 flex items-center gap-2">
              <Loader2 className="animate-spin text-accent" />
              <span className="text-sm font-medium">Loading Schedule...</span>
          </div>
      </div>
  );

  // Empty State (Day Over)
  if (!currentShow && nextShows.length === 0) return (
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-background border border-border shadow-2xl rounded-3xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-secondary">Broadcast Day Concluded</h3>
            <p className="text-sm text-secondary/70 mt-2">Check back tomorrow for more live shows!</p>
        </div>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20">
      <div className="bg-background border border-border shadow-2xl rounded-3xl p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <Calendar size={28} />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-primary">On Air Schedule</h2>
                <p className="text-sm text-secondary font-medium">Live from SRM Trichy</p>
            </div>
          </div>
          {currentShow && (
             <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full animate-pulse border border-red-500/20">
                <Radio size={12} /> LIVE NOW
            </div>
          )}
        </div>

        <div className="space-y-4">
          
          {/* 1. CURRENTLY PLAYING (Highlighted) */}
          {currentShow ? (
            <div className="group p-6 rounded-2xl border bg-surface border-accent/50 shadow-lg shadow-accent/5 flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden transition-all hover:shadow-accent/10">
               {/* Accent Bar */}
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent"></div>

               <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
                        <Radio size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-bold text-accent uppercase tracking-wider">Now Playing</span>
                             {currentShow.isLiveFormat && (
                                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                    <Mic size={8} /> LIVE
                                </span>
                             )}
                        </div>
                        <h3 className="text-2xl font-bold text-primary leading-tight">
                            {currentShow.title}
                        </h3>
                        <p className="text-secondary font-medium mt-1 flex items-center gap-2">
                             with <span className="text-primary font-bold">{currentShow.rjName}</span>
                        </p>
                    </div>
               </div>

               <div className="mt-4 md:mt-0 text-right relative z-10">
                    <div className="text-2xl font-mono font-black text-accent">
                        {formatTime(currentShow.startTime)}
                    </div>
                    <div className="text-xs text-secondary font-mono">
                        Until {formatTime(currentShow.endTime)}
                    </div>
               </div>
            </div>
          ) : (
             // Fallback if nothing is live but shows are coming up
             <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-surface/30 text-center">
                 <p className="text-secondary italic">We are on a break. Music rotation continues.</p>
             </div>
          )}

          {/* 2. UPCOMING LIST */}
          {nextShows.length > 0 && (
             <div className="pt-4">
                 <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-secondary mb-4 ml-2">Up Next</h4>
                 <div className="space-y-3">
                    {nextShows.map((show, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-transparent bg-surface/30 hover:bg-surface hover:border-white/5 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="text-secondary/50 group-hover:text-accent transition-colors">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-primary text-lg">{show.title}</h5>
                                    <p className="text-xs text-secondary">
                                        {show.rjName} {show.guest ? `ft. ${show.guest}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right font-mono text-sm text-secondary font-medium bg-background/50 px-3 py-1 rounded-md border border-white/5">
                                {formatTime(show.startTime)}
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}