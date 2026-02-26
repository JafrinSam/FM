import React, { useState, useEffect, useCallback } from 'react';
import { Zap, ChevronLeft, ChevronRight, Calendar, Info, Radio, Play, Clock, Mic } from 'lucide-react';
import useFetch from '../../hooks/useFetch'; 
import ShowDetailsModal from '../schedule/ShowDetailsModal';
import { formatTime } from '../../utils/scheduleHelpers';

const StationEvents = () => {
    const { get, loading } = useFetch();
    const [events, setEvents] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // --- HELPER: Transform Raw Show Data for the UI/Modal ---
    const transformFeaturedData = (rawShow) => {
        // Safe access to nested arrays
        const schedule = rawShow.weekly_schedules?.[0] || {}; 
        const rj = rawShow.rjs?.[0] || {};

        return {
            id: rawShow._id,
            title: rawShow.title,
            subtitle: rawShow.tagline,
            description: rawShow.description,
            // 1. Fix Image Key (Modal expects 'image', Backend gives 'coverImage')
            image: rawShow.coverImage, 
            coverImage: rawShow.coverImage, 
            
            // 2. Flatten Schedule Info
            day: schedule.day || "Coming Soon",
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            
            // 3. Flatten RJ Info
            rjName: rj.name || "ByteCast Team",
            rjImage: rj.photo?.[0], // Get first photo
            rjBio: rj.bio,
            rjInstagram: rj.instagram,

            // 4. Other flags
            isLive: rawShow.isLive,
            isHit: rawShow.hit,
            isLiveFormat: rawShow.isLive, // Assuming 'isLive' flag means studio live format
            guest: rawShow.guestName,
            
            // Keep original arrays just in case
            weekly_schedules: rawShow.weekly_schedules
        };
    };

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchSpecials = async () => {
            try {
                const res = await get('/shows/featured');
                if (res.success) {
                    let rawData = [];
                    if (Array.isArray(res.data)) rawData = res.data;
                    else if (res.data?.data) rawData = res.data.data;
                    
                    // ✅ Apply Transformation Here
                    const transformedData = rawData.map(transformFeaturedData);
                    setEvents(transformedData);
                }
            } catch (err) {
                console.error("Fetch error", err);
            }
        };
        fetchSpecials();
    }, [get]);

    // --- CAROUSEL LOGIC ---
    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % events.length);
    }, [events.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    };

    useEffect(() => {
        if (!isHovered && !selectedEvent && events.length > 1) {
            const timer = setInterval(nextSlide, 6000);
            return () => clearInterval(timer);
        }
    }, [isHovered, selectedEvent, events.length, nextSlide]);

    if (!events || events.length === 0) return null;

    return (
        <section className="py-16 relative overflow-hidden">
            
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                
                {/* --- HEADER --- */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-[var(--accent-color)] mb-2 animate-pulse">
                            <Zap size={18} fill="currentColor" />
                            <span className="text-xs font-bold uppercase tracking-[0.25em]">Don't Miss Out</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight">
                            Station <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-color)] to-orange-500">Specials</span>
                        </h2>
                    </div>

                    {/* Navigation Buttons */}
                    {events.length > 1 && (
                        <div className="flex gap-3">
                            <NavButton onClick={prevSlide} icon={<ChevronLeft size={24} />} />
                            <NavButton onClick={nextSlide} icon={<ChevronRight size={24} />} />
                        </div>
                    )}
                </div>

                {/* --- CINEMATIC SLIDER --- */}
                <div 
                    className="relative w-full aspect-video md:aspect-[21/9] lg:aspect-[2.4/1] min-h-[400px] md:min-h-[500px]"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {events.map((show, idx) => {
                        let position = "hidden";
                        if (idx === currentIndex) position = "active";
                        else if (idx === (currentIndex + 1) % events.length) position = "next";
                        else if (idx === (currentIndex - 1 + events.length) % events.length) position = "prev";

                        return (
                            <CinematicCard 
                                key={show.id} 
                                show={show} 
                                position={position} 
                                onClick={() => setSelectedEvent(show)} 
                            />
                        );
                    })}
                </div>

                {/* Progress Indicators */}
                {events.length > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {events.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    idx === currentIndex ? 'w-8 bg-[var(--accent-color)]' : 'w-2 bg-[var(--border-color)] hover:bg-[var(--text-secondary)]'
                                }`}
                            />
                        ))}
                    </div>
                )}

            </div>

            {/* ✅ Render Modal */}
            {selectedEvent && (
                <ShowDetailsModal 
                    event={selectedEvent} 
                    onClose={() => setSelectedEvent(null)} 
                />
            )}
        </section>
    );
};

// --- HELPER COMPONENTS ---

const NavButton = ({ onClick, icon }) => (
    <button 
        onClick={onClick}
        className="w-12 h-12 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-md text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--accent-color)] hover:border-[var(--accent-color)] hover:text-white transition-all duration-300 active:scale-95 shadow-lg group"
    >
        {icon}
    </button>
);

const CinematicCard = ({ show, position, onClick }) => {
    const styles = {
        active: "opacity-100 translate-x-0 scale-100 z-20 shadow-2xl pointer-events-auto cursor-pointer",
        prev: "opacity-40 -translate-x-[15%] scale-90 z-10 blur-[2px] pointer-events-none hidden md:block",
        next: "opacity-40 translate-x-[15%] scale-90 z-10 blur-[2px] pointer-events-none hidden md:block",
        hidden: "opacity-0 scale-75 z-0 pointer-events-none hidden",
    };

    const dateLabel = show.day ? `${show.day}s` : "Special Event";
    const timeLabel = show.startTime ? formatTime(show.startTime) : "TBA";

    return (
        <div 
            onClick={onClick} 
            className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${styles[position]}`}
        >
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative border border-white/10 bg-black group">
                
                {/* 1. SMART BACKGROUND */}
                <div className="absolute inset-0 overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-2xl scale-125 opacity-60"
                        style={{ backgroundImage: `url(${show.image})` }}
                    />
                    <img 
                        src={show.image} 
                        alt={show.title} 
                        className="relative w-full h-full object-cover z-10 transition-transform duration-[10s] ease-linear group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent z-20" />
                </div>

                {/* 2. CONTENT */}
                <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end z-30">
                    <div className="max-w-3xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        
                        <div className="flex flex-wrap gap-3 mb-6">
                             {/* Badge logic */}
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg ${show.isLive ? 'bg-red-500 animate-pulse' : 'bg-[var(--accent-color)]'}`}>
                                {show.isLive ? 'LIVE NOW' : 'FEATURED'}
                            </span>
                        </div>

                        <h3 className="text-5xl md:text-7xl font-black text-white leading-[0.9] mb-4 drop-shadow-xl tracking-tight">
                            {show.title}
                        </h3>

                        <p className="text-lg md:text-xl text-gray-200 line-clamp-2 max-w-2xl mb-8 font-medium drop-shadow-md">
                            {show.subtitle || show.description}
                        </p>

                        {/* Footer (Details Button) */}
                        <div className="flex items-center gap-6  transition-opacity duration-500 delay-100">
                            <button className="h-12 px-8 rounded-full bg-[var(--accent-color)] text-white font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wider">
                                <Info size={18} /> Show Details
                            </button>
                            
                            <div className="h-12 px-6 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center gap-4 text-white font-mono text-sm">
                                <span className="flex items-center gap-2 text-[var(--accent-color)]">
                                    <Calendar size={16} /> {dateLabel}
                                </span>
                                <span className="w-px h-4 bg-white/20" />
                                <span className="flex items-center gap-2">
                                    <Clock size={16} /> {timeLabel}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default StationEvents;