import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, Star, AlertCircle, Radio, Mic, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { scheduleApi } from '../services/scheduleApi';
import { getStrapiImage } from '../utlis/strapi';

// --- CONSTANTS & HELPERS (Keep these exactly as they were) ---
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const checkIsOnAir = (targetDay, startTime, endTime) => {
  if (!startTime || !endTime || !targetDay) return false;
  const now = new Date();
  const currentDayIndex = now.getDay(); 
  const adjustedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const todayName = DAYS_OF_WEEK[adjustedIndex];
  if (targetDay !== todayName) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = startTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const [endH, endM] = endTime.split(':').map(Number);
  const endMinutes = endH * 60 + endM;
  if (endMinutes < startMinutes) return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

const transformStrapiData = (item) => {
    if (!item) return null;
    const isScheduleEntry = item.show && item.startTime;
    const show = isScheduleEntry ? item.show : item;
    const scheduleInfo = isScheduleEntry 
        ? { startTime: item.startTime, endTime: item.endTime, day: item.day }
        : (show.weekly_schedules?.[0] || { startTime: "00:00", endTime: "00:00", day: "Daily" });
    const rjsData = show.rjs || [];
    const rjName = rjsData.length > 0 ? rjsData.map(r => r.name).join(" & ") : "ByteCast Bot";

    return {
        id: item.documentId,
        title: show.Title || "Music Selection",
        subtitle: show.Tagline || "Non-stop hits",
        description: show.Description,
        isLiveFormat: show.IsLive,
        isHit: show.Hit,
        guest: show.GuestName,
        startTime: scheduleInfo.startTime,
        endTime: scheduleInfo.endTime,
        day: scheduleInfo.day,
        image: getStrapiImage(show.CoverImage),
        rjName: rjName
    };
};

// --- MAIN COMPONENT ---

export default function Schedule() {
  const [activeDay, setActiveDay] = useState("Monday");
  const [scheduleData, setScheduleData] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 1. NEW: Create a Cache State to store data we already fetched
  // Structure: { "Monday": { schedule: [...], featured: [...] }, "Tuesday": ... }
  const [dataCache, setDataCache] = useState({});

  useEffect(() => {
    const todayIndex = new Date().getDay();
    const dayName = DAYS_OF_WEEK[todayIndex === 0 ? 6 : todayIndex - 1];
    setActiveDay(dayName);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      
      // 2. CHECK CACHE FIRST
      // If we already have data for this day, use it and DO NOT set loading to true
      if (dataCache[activeDay]) {
          setScheduleData(dataCache[activeDay].schedule);
          setFeaturedItems(dataCache[activeDay].featured);
          setLoading(false); // Ensure loading is off
          return; // Stop here, no need to fetch
      }

      // 3. Only show loading skeleton if we DON'T have data
      setLoading(true);

      try {
        const [dayRes, featuredRes] = await Promise.all([
           scheduleApi.getByDay(activeDay),
           scheduleApi.getFeatured() 
        ]);

        const formattedSchedule = dayRes.data.map(transformStrapiData);
        formattedSchedule.sort((a, b) => 
            parseInt(a.startTime.replace(':','')) - parseInt(b.startTime.replace(':',''))
        );
        
        // Featured Logic
        const formattedFeatured = featuredRes.data.map(transformStrapiData);
        const hitShows = formattedFeatured.filter(show => show.isHit);
        
        let calculatedFeatured = [];
        if (hitShows.length > 0) {
            calculatedFeatured = hitShows;
        } else {
            const currentLive = formattedSchedule.find(show => 
                checkIsOnAir(show.day, show.startTime, show.endTime)
            );
            if (currentLive) calculatedFeatured = [currentLive];
            else if (formattedSchedule.length > 0) calculatedFeatured = [formattedSchedule[0]];
        }

        // 4. SAVE TO CACHE
        setDataCache(prev => ({
            ...prev,
            [activeDay]: {
                schedule: formattedSchedule,
                featured: calculatedFeatured
            }
        }));

        setScheduleData(formattedSchedule);
        setFeaturedItems(calculatedFeatured);

      } catch (err) {
        console.error("Schedule Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeDay]); // Dependency ensures this runs when tab changes

  return (
    <div className="min-h-screen bg-background text-primary pt-28 pb-20">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto px-6 text-center mb-16">
        <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
          Live Broadcast Schedule
        </span>
        <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-tight mb-4">
          This Week on Air
        </h1>
        <p className="text-secondary max-w-lg mx-auto">
          Discover new sounds, live sessions, and exclusive guest mixes.
        </p>
      </div>

      {/* FEATURED SECTION */}
      <div className="max-w-5xl mx-auto px-4 mb-20 min-h-[400px]">
         {loading ? (
             <FeaturedSkeleton />
         ) : featuredItems.length > 1 ? (
             <FeaturedCarousel items={featuredItems} />
         ) : featuredItems.length === 1 ? (
             <FeaturedHero event={featuredItems[0]} />
         ) : null}
      </div>

      {/* TABS */}
      <div className="max-w-5xl mx-auto px-4 mb-12">
        <div className="flex overflow-x-auto pb-4 gap-8 md:justify-center border-b border-white/10 scrollbar-hide">
            {DAYS_OF_WEEK.map(day => (
                <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap relative ${
                        activeDay === day 
                        ? 'text-primary' 
                        : 'text-secondary/50 hover:text-primary'
                    }`}
                >
                    {day}
                    {activeDay === day && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* LIST */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <h2 className="text-3xl font-serif mb-8 text-center md:text-left animate-fade-in">
            {activeDay}'s Lineup
        </h2>

        {loading ? (
            [...Array(3)].map((_, i) => <RowSkeleton key={i} />)
        ) : scheduleData.length > 0 ? (
            scheduleData.map((event) => (
                <ScheduleRow key={event.id} event={event} />
            ))
        ) : (
            <div className="py-20 text-center border-y border-dashed border-white/10 text-secondary">
                <AlertCircle className="mx-auto mb-2 opacity-50" />
                No shows scheduled for {activeDay}. AutoDJ is handling the vibe.
            </div>
        )}
      </div>

    </div>
  );
}

// --- SUB-COMPONENTS (Keep Carousel, Hero, and Row EXACTLY as before) ---
// ... (Paste the FeaturedCarousel, FeaturedHero, ScheduleRow, and Skeletons here) ...

function FeaturedCarousel({ items }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, [items.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    };

    useEffect(() => {
        const timer = setInterval(() => nextSlide(), 6000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="relative group">
            <div className="transition-opacity duration-500 ease-in-out">
                <FeaturedHero key={items[currentIndex].id} event={items[currentIndex]} />
            </div>
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-accent text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"><ChevronLeft size={24} /></button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-accent text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"><ChevronRight size={24} /></button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {items.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-accent w-6' : 'bg-white/30 hover:bg-white'}`} />
                ))}
            </div>
        </div>
    );
}

// Inside Schedule.jsx

function FeaturedHero({ event }) {
    const isOnAir = checkIsOnAir(event.day, event.startTime, event.endTime);
    
    // --- SMART LABEL LOGIC ---
    let labelIcon = <Star size={12} fill="currentColor" />;
    let labelText = "Featured Show"; // Default

    if (event.isHit) {
        labelText = "Trending Hit";
        labelIcon = <Star size={12} fill="currentColor" />;
    } else if (isOnAir) {
        labelText = "On Air Now";
        labelIcon = <Radio size={12} className="animate-pulse" />;
    } else {
        labelText = "Up Next";
        labelIcon = <Clock size={12} />;
    }
    // -------------------------

    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-surface border border-white/5 shadow-2xl animate-fade-in-up group">
            <div className="flex flex-col md:flex-row h-full items-stretch">
                <div className="p-8 md:p-12 flex-1 flex flex-col justify-center relative z-10">
                    
                    {/* DYNAMIC LABEL */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 
                            ${event.isHit ? 'text-accent' : 'text-secondary'}`}>
                            {labelIcon} {labelText}
                        </span>

                        {/* Secondary Badges */}
                        {isOnAir && <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold"><Radio size={10} className="animate-pulse" /> LIVE</span>}
                        {event.isLiveFormat && <span className="flex items-center gap-1 bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded shadow-lg shadow-blue-500/20 font-bold tracking-wide"><Mic size={10} fill="currentColor" /> STUDIO LIVE</span>}
                    </div>

                    <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-2">{event.title}</h2>
                    <p className="text-secondary text-sm md:text-base mb-6 line-clamp-2 max-w-md">{event.subtitle}</p>
                    
                    {/* ... rest of the component (Time, Button, Image) remains the same ... */}
                    <div className="flex flex-wrap items-center gap-3 mb-8 text-xs font-bold uppercase tracking-wider text-secondary">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10"><Calendar size={14} /> {event.day}</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10"><Clock size={14} /> {formatTime(event.startTime)}</div>
                    </div>
                    <div className="flex items-center gap-4"><button className="bg-accent text-white px-8 py-3 rounded-lg font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">{isOnAir ? 'Listen Now' : 'Set Reminder'}</button></div>
                </div>
                <div className="w-full md:w-1/2 relative min-h-[320px] md:min-h-0 overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-surface via-surface/80 md:via-surface/50 to-transparent z-10 pointer-events-none" />
                     <img src={event.image || "https://images.unsplash.com/photo-1516280440614-6697288d5d38"} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
            </div>
        </div>
    );
}

function ScheduleRow({ event }) {
    const isOnAir = checkIsOnAir(event.day, event.startTime, event.endTime);
    return (
        <div className={`group flex flex-col md:flex-row items-stretch transition-all duration-300 rounded-2xl overflow-hidden border shadow-md hover:-translate-y-1 ${isOnAir ? 'bg-surface border-accent/50 shadow-accent/10 relative z-10' : 'bg-surface border-white/5 hover:bg-surface/80'}`}>
            <div className={`w-full md:w-32 flex flex-row md:flex-col items-center justify-between md:justify-center p-4 md:p-0 border-b md:border-b-0 md:border-r gap-1 shrink-0 ${isOnAir ? 'bg-accent/5 border-accent/20' : 'bg-white/5 border-white/5'}`}>
                <div className="text-center">
                    <span className={`block text-xl font-black ${isOnAir ? 'text-accent' : 'text-primary'}`}>{formatTime(event.startTime).replace(/ AM| PM/g, '')}</span>
                    <span className={`block text-[10px] font-bold uppercase tracking-widest ${isOnAir ? 'text-accent' : 'text-secondary/60'}`}>{formatTime(event.startTime).slice(-2)}</span>
                </div>
                {isOnAir && <span className="md:hidden text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">ON AIR</span>}
                <div className={`h-8 w-[1px] hidden md:block my-1 ${isOnAir ? 'bg-accent/30' : 'bg-white/10'}`}></div>
                <span className={`text-xs font-mono ${isOnAir ? 'text-accent/70' : 'text-secondary/50'}`}>{formatTime(event.endTime)}</span>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {isOnAir && <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold mr-1"><Radio size={10} className="animate-pulse" />ON AIR NOW</span>}
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary/60 truncate mr-2">{event.rjName}</span>
                    {event.isLiveFormat && <span className="flex items-center gap-1 bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded shadow-lg shadow-blue-500/20 font-bold tracking-wide"><Mic size={10} fill="currentColor" /> STUDIO LIVE</span>}
                    {event.guest && <span className="flex items-center gap-1 bg-purple-600 text-white text-[10px] px-2.5 py-1 rounded shadow-lg shadow-purple-500/20 font-bold tracking-wide"><User size={10} fill="currentColor" /> FEAT. {event.guest.toUpperCase()}</span>}
                </div>
                <h3 className={`text-2xl font-serif mb-1 transition-colors truncate ${isOnAir ? 'text-accent' : 'text-primary group-hover:text-accent'}`}>{event.title}</h3>
                <p className="text-sm text-secondary line-clamp-1">{event.subtitle}</p>
                {isOnAir && <div className="w-full max-w-sm h-0.5 bg-accent/20 rounded-full mt-4 overflow-hidden"><div className="h-full bg-accent animate-pulse w-full origin-left scale-x-75"></div></div>}
            </div>
            <div className="hidden md:flex w-48 relative shrink-0 overflow-hidden">
                <img src={event.image} alt={event.title} className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isOnAir ? 'opacity-100 scale-100' : 'opacity-70 grayscale-[0.3] group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105'}`} />
                <div className={`absolute inset-0 transition-colors duration-300 ${isOnAir ? 'bg-accent/10 mix-blend-overlay' : 'bg-black/30 group-hover:bg-transparent'}`} />
            </div>
        </div>
    );
}

function FeaturedSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-surface/50 border border-white/5 h-[400px] animate-pulse">
            <div className="flex flex-col md:flex-row h-full">
                <div className="p-12 flex-1 space-y-4">
                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                    <div className="h-12 w-3/4 bg-white/10 rounded"></div>
                    <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                    <div className="flex gap-4 pt-4"><div className="h-10 w-32 bg-white/10 rounded"></div></div>
                </div>
                <div className="w-1/2 bg-white/5"></div>
            </div>
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className="h-32 bg-surface/50 rounded-2xl border border-white/5 flex animate-pulse">
             <div className="w-32 border-r border-white/5 bg-white/5"></div>
             <div className="flex-1 p-6 space-y-3">
                 <div className="h-3 w-20 bg-white/10 rounded"></div>
                 <div className="h-6 w-48 bg-white/10 rounded"></div>
                 <div className="h-3 w-32 bg-white/10 rounded"></div>
             </div>
             <div className="w-48 bg-white/5 hidden md:block"></div>
        </div>
    );
}