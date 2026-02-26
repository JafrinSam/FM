import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, Clock, Mic2, Calendar, MapPin, Loader2, AlertCircle } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import EventDetailsModal from './EventDetailsModal';

// Helper to format date "MMM DD"
const formatDateBadge = (dateString) => {
    if (!dateString) return { month: '', day: '' };
    const date = new Date(dateString);
    return {
        month: date.toLocaleString('default', { month: 'short' }),
        day: date.getDate()
    };
};

// Helper: Format Time (e.g. 18:00 -> 6:00 PM)
const formatTime12h = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(':');
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const CampusEvents = () => {
    const { get, loading } = useFetch();
    const [events, setEvents] = useState([]);
    
    // --- Modal & Routing State ---
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedEventId = searchParams.get('eventId');
    
    // Derived state for selected event
    const selectedEvent = useMemo(() => {
        return events.find(e => e.id === selectedEventId) || null;
    }, [events, selectedEventId]);

    const openModal = (id) => setSearchParams({ eventId: id });
    const closeModal = () => setSearchParams({});

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch events
                const res = await get('/events?sort=asc'); 
                
                if (res.success) {
                    // 1. Robust Data Extraction (Handle res.data vs res.data.data)
                    let rawData = [];
                    if (Array.isArray(res.data)) {
                        rawData = res.data;
                    } else if (res.data && Array.isArray(res.data.data)) {
                        rawData = res.data.data;
                    }

                    // 2. Filter & Format
                    const now = new Date();
                    now.setHours(0, 0, 0, 0); // Compare dates at midnight

                    const upcoming = rawData
                        .filter(item => {
                            // Filter: Only show events that are TODAY or in the FUTURE
                            const eventDate = new Date(item.date);
                            return eventDate >= now;
                        })
                        .map(item => ({
                            id: item._id || item.id,
                            title: item.title,
                            category: item.category,
                            date: item.date,
                            time: formatTime12h(item.time), // Format time nicely
                            image: item.thumbnail, 
                            description: item.description,
                            summary: item.summary,
                            location: item.location,
                            organizers: item.organizers,
                            registrationLink: item.registrationLink,
                            registrationStatus: item.registrationStatus
                        }))
                        .slice(0, 3); // Limit to 3 cards

                    setEvents(upcoming);
                }
            } catch (err) {
                console.error("Event fetch failed", err);
            }
        };
        fetchEvents();
    }, [get]);

    return (
        <section className="py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-color)] relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-color)]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--accent-color)] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Activity size={16} /> Campus Pulse
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight">
                            Upcoming at SRM
                        </h3>
                    </div>
                    <Link to="/events" className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-all font-medium group text-[var(--text-primary)]">
                        View Full Calendar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[var(--bg-card)] h-[22rem] rounded-[2rem] animate-pulse border border-[var(--border-color)] p-6 flex flex-col justify-end gap-4">
                                <div className="w-3/4 h-8 bg-[var(--bg-secondary)] rounded-lg"></div>
                                <div className="w-1/2 h-4 bg-[var(--bg-secondary)] rounded"></div>
                            </div>
                        ))
                    ) : (
                        <>
                            {events.map(event => {
                                const { month, day } = formatDateBadge(event.date);
                                
                                return (
                                    <div 
                                        key={event.id} 
                                        onClick={() => openModal(event.id)}
                                        className="group relative h-[24rem] rounded-[2.5rem] overflow-hidden shadow-lg cursor-pointer hover:-translate-y-2 transition-transform duration-500 border border-[var(--border-color)]"
                                    >
                                        {/* Image */}
                                        <div className="absolute inset-0">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                                        </div>

                                        {/* Top Badges */}
                                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-center min-w-[70px] text-white shadow-lg">
                                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">{month}</span>
                                                <span className="block text-2xl font-black leading-none mt-1">{day}</span>
                                            </div>
                                            <span className="px-4 py-1.5 rounded-full bg-[var(--accent-color)] text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                                {event.category}
                                            </span>
                                        </div>

                                        {/* Bottom Content */}
                                        <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] text-white transition-all duration-300 group-hover:bg-white/20">
                                            <h4 className="text-xl font-bold mb-2 leading-tight line-clamp-2 drop-shadow-md">{event.title}</h4>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-white/80 flex items-center gap-2 font-medium">
                                                    <Clock size={14} /> {event.time}
                                                </p>
                                                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Empty State Fallback (If no upcoming events) */}
                            {events.length === 0 && (
                                <div className="h-[24rem] rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col items-center justify-center text-center p-8">
                                    <div className="p-4 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] mb-4">
                                        <AlertCircle size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-[var(--text-primary)]">No Upcoming Events</h4>
                                    <p className="text-[var(--text-secondary)] text-sm">Check back later for updates!</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Static 'Join Club' Card (Always visible) */}
                    <div className="relative h-[24rem] rounded-[2.5rem] overflow-hidden flex flex-col justify-end p-8 text-white group shadow-2xl transition-all duration-500 border border-[var(--border-color)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-purple-700 z-0"></div>
                        <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
                            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-700 z-0" alt="Audience" />

                        <div className="relative z-10 mb-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-white border border-white/10">
                                <Mic2 size={24} />
                            </div>
                            <h4 className="text-3xl font-black mb-3 leading-tight">Your Voice <br /> Matters.</h4>
                            <p className="text-white/80 mb-8 text-sm leading-relaxed max-w-[200px]">Join the ByteCast team as an RJ, Sound Engineer, or Content Creator.</p>

                            <Link to="/about" className="inline-flex w-full items-center justify-center gap-2 bg-white text-orange-600 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg">
                                Join the Club <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedEvent && (
                <EventDetailsModal 
                    event={selectedEvent} 
                    onClose={closeModal} 
                />
            )}
        </section>
    );
};

export default CampusEvents;