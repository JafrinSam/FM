import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, X, ExternalLink, 
  Tag, Loader2, Maximize2, User, Phone, Users 
} from 'lucide-react';

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)] transition-colors">
        <div className="text-[var(--accent-color)] mt-0.5 opacity-90">{icon}</div>
        <div>
            <span className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-0.5">{label}</span>
            <span className="block text-sm font-semibold text-[var(--text-primary)]">{value || "TBA"}</span>
        </div>
    </div>
);

const EventModal = ({ event, isOpen, onClose }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        setImageLoaded(false);
        setIsFullScreen(false);
    }, [event]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (isFullScreen) setIsFullScreen(false);
                else onClose();
            }
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, isFullScreen]);

    if (!isOpen || !event) return null;

    // --- LOGIC: Format Date & Time Ranges ---
    const displayDate = (event.fullEndDate && event.fullEndDate !== event.fullDate)
        ? `${event.fullDate} - ${event.fullEndDate}`
        : event.fullDate;

    const displayTime = (event.endTime && event.endTime !== event.time)
        ? `${event.time} - ${event.endTime}`
        : event.time;

    return (
        <>
            {/* --- MAIN MODAL BACKDROP --- */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                    onClick={onClose}
                />

                {/* --- MODAL CONTAINER --- */}
                <div className="relative w-full max-w-6xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[85vh] md:h-[800px]">

                    {/* CLOSE BUTTON */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 p-2.5 bg-black/20 text-[var(--text-primary)] rounded-full hover:bg-[var(--danger-color)] hover:text-white transition-all backdrop-blur-md border border-[var(--border-color)] group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* --- LEFT: IMAGE SLIDER --- */}
                    <div className="w-full md:w-[45%] bg-[var(--bg-secondary)] relative flex items-center justify-center p-8 overflow-hidden group">
                        
                        {/* Ambient Blur */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center blur-[80px] opacity-40 scale-150 transition-opacity duration-700"
                            style={{ backgroundImage: `url(${event.image})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-[var(--bg-secondary)]/50" />

                        {/* Card */}
                        <div className="relative w-full aspect-square max-w-[400px] perspective-1000 z-10">
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center z-0">
                                    <Loader2 className="w-10 h-10 text-[var(--accent-color)] animate-spin" />
                                </div>
                            )}
                            <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl border border-[var(--border-color)] transform transition-transform duration-500 hover:scale-[1.02] bg-[var(--bg-card)]">
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setImageLoaded(true)}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <button 
                                        onClick={() => setIsFullScreen(true)}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 hover:bg-[var(--accent-color)] backdrop-blur-md border border-white/20 text-white font-medium transition-all transform scale-90 group-hover:scale-100 shadow-lg"
                                    >
                                        <Maximize2 size={18} /> View Full
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: DETAILS --- */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-card)] relative">
                        <div className="p-8 md:p-12 pb-24">
                            
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-3 mb-6 overflow-x-auto scrollbar-hide pb-2">
                                <span className="shrink-0 bg-[var(--bg-secondary)] text-[var(--accent-color)] border border-[var(--border-color)] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                                    {event.category}
                                </span>
                                {event.status && (
                                    <span className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border flex items-center gap-2 ${
                                        event.status.toLowerCase() === 'open' 
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                        : 'bg-[var(--danger-color)]/10 text-[var(--danger-color)] border-[var(--danger-color)]/20'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${event.status.toLowerCase() === 'open' ? 'bg-green-500 animate-pulse' : 'bg-[var(--danger-color)]'}`} />
                                        {event.status}
                                    </span>
                                )}
                                {event.capacity > 0 && (
                                    <span className="shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Users size={12} /> {event.capacity} Seats
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4 leading-[1.1] tracking-tight">
                                {event.title}
                            </h2>
                            
                            {event.summary && (
                                <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed mb-8 border-l-4 border-[var(--accent-color)] pl-6 py-1">
                                    "{event.summary}"
                                </p>
                            )}

                            {/* Info Grid (Updated Logic) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                <InfoItem 
                                    icon={<Calendar size={18} />} 
                                    label={event.fullEndDate ? "Date Range" : "Date"} 
                                    value={displayDate} 
                                />
                                <InfoItem 
                                    icon={<Clock size={18} />} 
                                    label={event.endTime ? "Time Duration" : "Time"} 
                                    value={displayTime} 
                                />
                                <InfoItem icon={<MapPin size={18} />} label="Location" value={event.location} />
                                <InfoItem icon={<Tag size={18} />} label="Category" value={event.category} />
                            </div>

                            <hr className="border-[var(--border-color)] mb-10 opacity-50" />

                            {/* Description */}
                            <div className="mb-12">
                                <h4 className="text-[var(--text-primary)] font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2 opacity-80">
                                    <span className="w-1.5 h-4 bg-[var(--accent-color)] rounded-full"></span> 
                                    About Event
                                </h4>
                                <div className="prose prose-invert max-w-none text-[var(--text-secondary)] text-base leading-7 whitespace-pre-line">
                                    {event.description}
                                </div>
                            </div>

                            {/* Organizers */}
                            {event.organizers && event.organizers.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-[var(--text-primary)] font-bold mb-5 uppercase tracking-widest text-xs flex items-center gap-2 opacity-80">
                                        <User size={14} /> Event Organizers
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {event.organizers.map((org, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-all group/org">
                                                <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center font-bold text-lg text-[var(--accent-color)] shadow-sm">
                                                    {org.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{org.name}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide truncate">{org.role}</p>
                                                </div>
                                                {org.phone && (
                                                    <a 
                                                        href={`tel:${org.phone}`} 
                                                        className="p-2.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--accent-color)] hover:text-white transition-all shadow-sm border border-[var(--border-color)]" 
                                                        title="Call Organizer"
                                                    >
                                                        <Phone size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- STICKY FOOTER --- */}
                        <div className="sticky bottom-0 left-0 right-0 p-6 bg-[var(--bg-card)]/95 backdrop-blur-xl border-t border-[var(--border-color)] flex items-center justify-between gap-6 z-20">
                            <div className="hidden md:block">
                                <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Registration</p>
                                <p className={`text-sm font-bold ${event.registrationLink ? 'text-green-500' : 'text-[var(--danger-color)]'}`}>
                                    {event.registrationLink ? 'Open Now' : 'Closed'}
                                </p>
                            </div>

                            {event.registrationLink ? (
                                <a
                                    href={event.registrationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 md:flex-none md:w-64 bg-[var(--accent-color)] text-white py-4 rounded-2xl font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] flex items-center justify-center gap-3 group"
                                >
                                    Register Now <ExternalLink size={18} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                            ) : (
                                <button disabled className="flex-1 md:flex-none md:w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] py-4 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2 opacity-70">
                                    Registration Closed
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LIGHTBOX --- */}
            {isFullScreen && (
                <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
                    <button
                        onClick={() => setIsFullScreen(false)}
                        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={event.image}
                        alt="Full View"
                        className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-lg animate-in zoom-in-90 duration-300"
                    />
                </div>
            )}
        </>
    );
};

export default EventModal;