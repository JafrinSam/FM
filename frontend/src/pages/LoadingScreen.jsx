import React, { useState, useEffect } from 'react';
import { Flame, Radio } from 'lucide-react';

const loadingMessages = [
  "Igniting frequencies...",
  "Fueling the mic...",
  "Gathering sparks...",
  "Connecting to the vibe...",
  "Soundcheck in progress..."
];

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through loading messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    // Full screen overlay with high z-index to cover everything
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-hidden">
      
      {/* --- Background Atmosphere Effects --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div> {/* Optional: Add a subtle noise texture png for a gritty feel */}


      {/* --- Central Animation Container --- */}
      <div className="relative flex justify-center items-center mb-12">
        
        {/* Radiating Sound Ripples */}
        {/* We create multiple absolute divs that scale up and fade out */}
        <div className="absolute w-32 h-32 border-2 border-accent/40 rounded-full animate-ripple" style={{ animationDelay: '0s' }}></div>
        <div className="absolute w-32 h-32 border-2 border-accent/30 rounded-full animate-ripple" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-32 h-32 border-2 border-accent/20 rounded-full animate-ripple" style={{ animationDelay: '2s' }}></div>

        {/* Central Glowing Core */}
        <div className="relative z-10 animate-float-slow">
           {/* Intense glow behind the icon */}
          <div className="absolute inset-0 bg-accent blur-2xl opacity-50 scale-150 rounded-full"></div>
          
          {/* The Icon Group */}
          <div className="bg-surface p-6 rounded-full border-2 border-accent/50 shadow-[0_0_30px_-5px_rgba(var(--accent-rgb),0.5)] relative flex items-center justify-center">
             {/* Combining Radio and Flame for a unique logo feel */}
             <Radio size={48} className="text-accent opacity-50 absolute scale-125" strokeWidth={1.5} />
             <Flame size={56} className="text-accent fill-accent animate-pulse relative z-20" />
          </div>
        </div>
      </div>


      {/* --- Typography --- */}
      <div className="text-center relative z-10 space-y-4">
        {/* Main Brand Name */}
        <h1 className="text-5xl font-magilio text-primary tracking-wider drop-shadow-lg">
          Blaze<span className="text-accent">Up</span>
        </h1>
        
        {/* Dynamic Loading Message */}
        {/* We use a key on the paragraph to trigger a slight fade animation on change */}
        <p 
          key={messageIndex}
          className="text-xl text-secondary uppercase tracking-[0.2em] font-medium animate-[pulse_1s_ease-in-out]"
        >
          {loadingMessages[messageIndex]}
        </p>
      </div>

      {/* Bottom progress bar indicator (Optional) */}
       <div className="absolute bottom-20 w-64 h-1 bg-secondary/20 rounded-full overflow-hidden">
          <div className="h-full bg-accent animate-[loadingBar_2s_ease-in-out_infinite_alternate] w-full origin-left scale-x-0"></div>
       </div>

    </div>
  );
}