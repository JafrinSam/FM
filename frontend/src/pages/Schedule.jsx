import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import useFetch from '../hooks/useFetch';

// Imports from separated files
import { DAYS_OF_WEEK, checkIsOnAir, transformScheduleData } from '../utils/scheduleHelpers';
import FeaturedHero from '../components/schedule/FeaturedHero';
import FeaturedCarousel from '../components/schedule/FeaturedCarousel';
import ScheduleRow from '../components/schedule/ScheduleRow';
import { FeaturedSkeleton, RowSkeleton } from '../components/schedule/ScheduleSkeletons';
import ShowDetailsModal from '../components/schedule/ShowDetailsModal';

export default function Schedule() {
  const [activeDay, setActiveDay] = useState("Monday");
  const [allSchedules, setAllSchedules] = useState([]);

  const { get, loading } = useFetch();

  // Routing Logic: Handle URL "?showId=..."
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedShowId = searchParams.get('showId');

  // Find the event to display in modal
  const selectedEvent = useMemo(() => {
    if (!selectedShowId || allSchedules.length === 0) return null;
    return allSchedules.find(s => s.id === selectedShowId);
  }, [selectedShowId, allSchedules]);

  // Handlers
  const openModal = (id) => {
    setSearchParams({ showId: id }); // Adds ?showId=... to URL
  };

  const closeModal = () => {
    setSearchParams({}); // Removes param, closing modal
  };

  // 1. Set Active Day
  useEffect(() => {
    const todayIndex = new Date().getDay();
    const dayName = DAYS_OF_WEEK[todayIndex === 0 ? 6 : todayIndex - 1];
    setActiveDay(dayName);
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchSchedules = async () => {
      const result = await get('/weekly-schedules/public');
      if (result.success && result.data?.data) {
        const transformed = result.data.data.map(transformScheduleData);
        setAllSchedules(transformed);
      }
    };
    fetchSchedules();
  }, [get]);

  // 3. Filter Data
  const dayScheduleData = useMemo(() => {
    const filtered = allSchedules.filter(item => item.day === activeDay);
    return filtered.sort((a, b) =>
      parseInt(a.startTime.replace(':', '')) - parseInt(b.startTime.replace(':', ''))
    );
  }, [allSchedules, activeDay]);

  // 4. Featured Item Logic
  const featuredItems = useMemo(() => {
    const currentLive = allSchedules.find(show =>
      checkIsOnAir(show.day, show.startTime, show.endTime)
    );
    if (currentLive) return [currentLive];
    const hits = dayScheduleData.filter(show => show.isHit);
    if (hits.length > 0) return hits;
    if (dayScheduleData.length > 0) return [dayScheduleData[0]];
    return [];
  }, [allSchedules, dayScheduleData]);

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
        {loading && allSchedules.length === 0 ? (
          <FeaturedSkeleton />
        ) : featuredItems.length > 1 ? (
          <FeaturedCarousel
            items={featuredItems}
            onShowClick={openModal}
          />
        ) : featuredItems.length === 1 ? (
          <FeaturedHero
            event={featuredItems[0]}
            onClick={openModal}
          />
        ) : null}
      </div>

      {/* TABS */}
      <div className="max-w-5xl mx-auto px-4 mb-12">
        <div className="flex overflow-x-auto pb-4 gap-8 md:justify-center border-b border-white/10 scrollbar-hide">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap relative ${activeDay === day
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-serif text-center md:text-left animate-fade-in">
            {activeDay}'s Lineup
          </h2>
          {loading && <Loader2 className="animate-spin text-accent" />}
        </div>

        {loading && allSchedules.length === 0 ? (
          [...Array(3)].map((_, i) => <RowSkeleton key={i} />)
        ) : dayScheduleData.length > 0 ? (
          dayScheduleData.map((event) => (
            <ScheduleRow
              key={event.id}
              event={event}
              onClick={() => openModal(event.id)}
            />
          ))
        ) : (
          <div className="py-20 text-center border-y border-dashed border-white/10 text-secondary">
            <AlertCircle className="mx-auto mb-2 opacity-50" />
            No shows scheduled for {activeDay}. AutoDJ is handling the vibe.
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedEvent && (
        <ShowDetailsModal
          event={selectedEvent}
          onClose={closeModal}
        />
      )}

    </div>
  );
}