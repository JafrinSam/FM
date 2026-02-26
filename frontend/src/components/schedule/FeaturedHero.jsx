import React from 'react';
import { Star, Radio, Clock, Mic, Play, User, Headphones } from 'lucide-react';
import { formatTime, checkIsOnAir } from '../../utils/scheduleHelpers';

const FeaturedHero = ({ event, onClick }) => {
    const isOnAir = checkIsOnAir(event.day, event.startTime, event.endTime);

    let labelIcon = <Star size={12} fill="currentColor" />;
    let labelText = "Featured Show";

    if (event.isHit) { labelText = "Trending Hit"; labelIcon = <Star size={12} fill="currentColor" />; }
    else if (isOnAir) { labelText = "On Air Now"; labelIcon = <Radio size={12} className="animate-pulse" />; }
    else { labelText = "Up Next"; labelIcon = <Clock size={12} />; }

    return (
        <div
            onClick={() => onClick && onClick(event.id)}
            className="relative h-[500px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl group border border-white/10 cursor-pointer"
        >
            {/* 1. BACKGROUND IMAGE (Full Bleed - No Gaps) */}
            <div className="absolute inset-0 z-0">
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-[20s] ease-linear group-hover:scale-110"
                    loading="lazy"
                />
                {/* Dark Gradient Overlay - Essential for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
            </div>

            {/* 2. CONTENT CONTAINER */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 flex flex-col justify-end h-full items-start">
                <div className="max-w-4xl space-y-5 animate-fade-in-up">

                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border shadow-lg ${event.isHit ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]' : 'bg-white/10 text-white border-white/20'}`}>
                            {labelIcon} {labelText}
                        </span>
                        {event.isLiveFormat && <span className="flex items-center gap-1.5 bg-blue-600/90 text-white border border-blue-400/30 text-[11px] px-3 py-1.5 rounded-full font-bold backdrop-blur-md shadow-lg"><Mic size={11} fill="currentColor" /> STUDIO LIVE</span>}
                    </div>

                    {/* Main Title */}
                    <h2 className="text-5xl md:text-7xl font-serif text-white leading-[0.95] tracking-tight drop-shadow-xl">
                        {event.title}
                    </h2>

                    {/* 3. NEW: RJ & Guest Details (The "Necessary Details") */}
                    <div className="flex items-center gap-4 text-white/90 text-sm md:text-base font-medium">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                                <Headphones size={14} />
                            </div>
                            <span>Host: <span className="text-[var(--accent-color)] font-bold">{event.rjName}</span></span>
                        </div>

                        {event.guest && (
                            <>
                                <span className="w-1 h-1 bg-white/50 rounded-full" />
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-500/20 rounded-full backdrop-blur-sm border border-purple-500/30">
                                        <User size={14} className="text-purple-300" />
                                    </div>
                                    <span>Feat. {event.guest}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Subtitle/Description */}
                    <p className="text-white/80 text-lg md:text-xl line-clamp-2 font-light max-w-2xl drop-shadow-md">
                        {event.subtitle}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-[var(--accent-color)] hover:text-white transition-all transform hover:scale-105 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_35px_rgba(var(--accent-rgb),0.6)] active:scale-95">
                            {isOnAir ? <><Play size={20} fill="currentColor" /> Listen Live</> : <><Clock size={20} /> Show Details</>}
                        </button>

                        {/* Time Info Pill */}
                        <div className="px-6 py-4 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl text-white font-mono text-sm flex items-center gap-3 hover:bg-black/70 transition-colors">
                            <span className="opacity-70 text-gray-300">{event.day}</span>
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
                            <span className="text-[var(--accent-color)] font-bold tracking-wide">{formatTime(event.startTime)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedHero;