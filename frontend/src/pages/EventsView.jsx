import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, ArrowRight, Search, X,
  ExternalLink, Filter, Tag, Loader2, Maximize2, User, Phone, Mail, Users
} from 'lucide-react';
import useFetch from '../hooks/useFetch';

// --- SKELETONS ---
const EventCardSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden h-[24rem] relative animate-pulse">
    <div className="absolute inset-0 bg-surface/50" />
    <div className="absolute top-6 left-6 right-6 flex justify-between">
      <div className="w-16 h-16 bg-white/5 rounded-2xl"></div>
      <div className="w-24 h-8 bg-white/5 rounded-full"></div>
    </div>
    <div className="absolute bottom-4 left-4 right-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
      <div className="h-6 w-3/4 bg-white/10 rounded-md mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-4 w-1/3 bg-white/10 rounded-md"></div>
        <div className="h-8 w-8 bg-white/10 rounded-full"></div>
      </div>
    </div>
  </div>
);

import EventModal from '../components/events/EventModal';


// --- MAIN PAGE COMPONENT ---
export default function EventsView() {
  const { get, loading: fetchLoading } = useFetch();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await get('/events?sort=asc');

        if (res.success) {
          let rawData = [];
          if (Array.isArray(res.data)) rawData = res.data;
          else if (res.data && Array.isArray(res.data.data)) rawData = res.data.data;

          const formatted = rawData.map(item => {
            const d = new Date(item.date);

            return {
              id: item._id,
              title: item.title,
              dateObj: d,
              date: d.getDate(),
              month: d.toLocaleString('default', { month: 'short' }),
              fullDate: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),

              time: item.time ? item.time.slice(0, 5) : "TBA",
              category: item.category || "General",
              image: item.thumbnail,
              description: item.description,
              summary: item.summary, // ✅ Added Summary
              capacity: item.capacity, // ✅ Added Capacity
              location: item.location,
              status: item.registrationStatus,
              registrationLink: item.registrationLink,
              organizers: item.organizers // ✅ Added Organizers
            };
          })
            .filter(e => e.dateObj >= new Date().setHours(0, 0, 0, 0))
            .sort((a, b) => a.dateObj - b.dateObj);

          setEvents(formatted);
        }
      } catch (err) {
        console.error("Error loading events:", err);
      }
    };
    fetchEvents();
  }, [get]);

  const filteredEvents = events.filter(event => {
    const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Tech', 'Cultural', 'Academic', 'Sports'];

  return (
    <div className="min-h-screen bg-background text-primary pt-28 pb-20">

      {/* PAGE HEADER */}
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <span className="text-accent text-xs font-bold tracking-[0.2em] uppercase mb-3 block">ByteCast Calendar</span>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">Upcoming Events</h1>
        <p className="text-secondary max-w-lg mx-auto text-lg leading-relaxed">
          Don't miss out on workshops, hackathons, and cultural fests happening at SRM Trichy.
        </p>
      </div>

      {/* CONTROLS */}
      <div className="max-w-7xl mx-auto px-6 mb-12 sticky top-24 z-30">
        <div className="bg-surface/80 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${activeCategory === cat
                    ? 'bg-primary text-background border-primary shadow-lg scale-105'
                    : 'bg-transparent text-secondary border-transparent hover:bg-white/5 hover:text-primary'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-accent transition-colors" size={18} />
            <input
              type="text"
              placeholder="Find an event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 rounded-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none w-full md:w-72 transition-all text-sm shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-6">
        {fetchLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <EventCardSkeleton key={i} />)}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="group relative h-[24rem] rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 cursor-pointer hover:-translate-y-2 bg-card active:scale-[0.98]"
              >
                <div className="absolute inset-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                </div>
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-center min-w-[70px] text-white shadow-lg">
                    <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">{event.month}</span>
                    <span className="block text-2xl font-black leading-none mt-1">{event.date}</span>
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-accent/20 border border-white/10">
                    {event.category}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] text-white transition-all duration-300 group-hover:bg-white/20">
                  <h4 className="text-xl font-bold mb-2 leading-tight line-clamp-2">{event.title}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70 flex items-center gap-2 font-medium">
                      <Clock size={14} /> {event.time}
                    </p>
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-all duration-300 opacity-100 translate-x-0 md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
            <Filter size={64} className="mb-4 text-secondary" />
            <h3 className="text-2xl font-bold text-primary">No events found</h3>
            <p className="text-secondary">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>

      <EventModal
        isOpen={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

    </div>
  );
}