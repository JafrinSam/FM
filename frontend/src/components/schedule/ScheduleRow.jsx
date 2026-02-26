import React from 'react';
import { Radio, Play, Clock, Mic, User } from 'lucide-react';
import { formatTime, checkIsOnAir } from '../../utils/scheduleHelpers';

const ScheduleRow = ({ event, onClick }) => {
    const isOnAir = checkIsOnAir(event.day, event.startTime, event.endTime);

    return (
        <div
            onClick={onClick}
            className={`group flex items-stretch overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 h-32 md:h-40 relative cursor-pointer
            ${isOnAir
                    ? 'border-[var(--accent-color)] shadow-lg z-10'
                    : 'border-[var(--border-color)] hover:border-[var(--accent-color)] hover:shadow-md'
                }`}
            // Apply background color via style to ensure it follows the theme exactly
            style={{
                backgroundColor: 'var(--bg-card)',
                boxShadow: isOnAir ? '0 10px 30px -10px rgba(0,0,0,0.3)' : undefined
            }}
        >
            {/* Live Indicator Line (Left Border Highlight) */}
            {isOnAir && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-color)] z-20" />
            )}

            {/* --- COLUMN 1: INFORMATION --- */}
            <div className="flex-1 flex items-center p-4 md:p-6 gap-4 md:gap-8 min-w-0">

                {/* 1A. TIME WIDGET */}
                <div
                    className={`flex flex-col items-center justify-center rounded-xl w-20 h-20 md:w-24 md:h-24 shrink-0 border transition-colors duration-300`}
                    style={{
                        borderColor: isOnAir ? 'var(--accent-color)' : 'var(--border-color)',
                        backgroundColor: isOnAir ? 'var(--accent-color)' : 'var(--bg-secondary)',
                        color: isOnAir ? '#FFFFFF' : 'var(--text-primary)'
                    }}
                >
                    <span className="text-lg md:text-2xl font-bold leading-none">
                        {formatTime(event.startTime).split(' ')[0]}
                    </span>
                    <span
                        className="text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 opacity-80"
                    >
                        {formatTime(event.startTime).split(' ')[1]}
                    </span>
                </div>

                {/* 1B. TEXT DETAILS */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {isOnAir && (
                            <span
                                className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse shadow-sm text-white"
                                style={{ backgroundColor: 'var(--danger-color)' }}
                            >
                                <Radio size={10} /> LIVE
                            </span>
                        )}
                        <span
                            className="text-[10px] md:text-xs font-bold uppercase tracking-widest truncate"
                            style={{ color: isOnAir ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                        >
                            {event.rjName}
                        </span>
                    </div>

                    {/* Titles */}
                    <h3
                        className="text-xl md:text-2xl font-serif truncate transition-colors group-hover:text-[var(--accent-color)]"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {event.title}
                    </h3>

                    <p
                        className="text-xs md:text-sm line-clamp-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {event.subtitle}
                    </p>

                    {/* Meta Icons */}
                    <div
                        className="hidden md:flex items-center gap-4 mt-1 text-[10px] uppercase tracking-wider opacity-70"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {event.isLiveFormat && <span className="flex items-center gap-1"><Mic size={12} /> Studio Live</span>}
                        {event.guest && <span className="flex items-center gap-1"><User size={12} /> Special Guest</span>}
                    </div>
                </div>
            </div>

            {/* --- COLUMN 2: IMAGE (16:9 Landscape) --- */}
            <div className="w-56 md:w-72 relative shrink-0 overflow-hidden border-l bg-black" style={{ borderColor: 'var(--border-color)' }}>

                {/* Layer 1: Blurred Background (Fills the box) */}
                <div
                    className="absolute inset-0 z-0 overflow-hidden"
                >
                    <img
                        src={event.image}
                        alt=""
                        className="w-full h-full object-cover opacity-60 blur-xl scale-125 transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Layer 2: The Clear Image */}
                <div className="absolute inset-0 z-10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                    <img
                        src={event.image}
                        alt={event.title}
                        className={`w-full h-full object-cover drop-shadow-lg ${!isOnAir && 'grayscale-[0.3] group-hover:grayscale-0'} transition-all duration-500`}
                    />
                </div>

                {/* Layer 3: Overlay Gradient (for text contrast if needed, mostly style) */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/10 pointer-events-none z-20" />

                {/* Layer 4: Hover Overlay Action */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-30">
                    <div
                        className="p-3 rounded-full shadow-2xl transform scale-75 group-hover:scale-100 transition-transform text-white border border-white/20"
                        style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                        {isOnAir ? <Play size={24} fill="currentColor" className="ml-1" /> : <Clock size={24} />}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ScheduleRow;