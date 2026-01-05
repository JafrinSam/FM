import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const SCHEDULE = [
  { time: "09:00 AM", title: "Morning Coffee Vibes", host: "RJ Sarah", active: false },
  { time: "12:00 PM", title: "Campus News Hour", host: "Journalism Team", active: true },
  { time: "04:00 PM", title: "Indie Rock Sunset", host: "RJ Mike", active: false },
  { time: "08:00 PM", title: "Late Night Lo-Fi", host: "Auto DJ", active: false },
];

export default function ScheduleWidget() {
  return (
    <div className="bg-background py-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="text-accent" size={28} />
          <h2 className="text-3xl font-bold text-primary">Today's Schedule</h2>
        </div>

        <div className="grid gap-4">
          {SCHEDULE.map((show, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] ${
                show.active 
                  ? 'bg-surface border-accent shadow-md' 
                  : 'bg-surface/50 border-border hover:bg-surface'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`p-3 rounded-xl ${show.active ? 'bg-accent text-white' : 'bg-background text-secondary'}`}>
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${show.active ? 'text-primary' : 'text-secondary'}`}>
                    {show.title}
                  </h3>
                  <p className="text-sm text-secondary/70">Hosted by {show.host}</p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`text-lg font-mono font-medium ${show.active ? 'text-accent' : 'text-secondary'}`}>
                  {show.time}
                </span>
                {show.active && (
                  <div className="text-xs text-red-500 font-bold uppercase tracking-wider mt-1 animate-pulse">
                    On Air
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}