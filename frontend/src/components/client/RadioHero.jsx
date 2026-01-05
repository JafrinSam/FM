import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, VolumeX, Users, Music } from 'lucide-react';
import StreamVisualizer from "../StreamVisualizer"; 

// Using Env variables or defaults
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000?role=client";
const STREAM_URL = `${import.meta.env.VITE_STREAM_URL || "http://localhost:8000/radio.mp3"}?t=${Date.now()}`;

export default function RadioHero() {
  const [track, setTrack] = useState({ title: "Connecting...", artist: "BlazeUp Radio", is_live: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [listeners, setListeners] = useState(0);
  
  const audioRef = useRef(null);
  const ws = useRef(null);

  // WebSocket Connection Logic
  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL);
      ws.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NOW_PLAYING') setTrack(msg.data);
          if (msg.type === 'LISTENER_COUNT') setListeners(msg.data.count);
        } catch (e) { console.error(e); }
      };
      ws.current.onclose = () => setTimeout(connect, 3000); 
    };
    connect();
    return () => ws.current?.close();
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(e => console.error(e));
    setIsPlaying(!isPlaying);
  };

  const handleVolume = (e) => {
    setVolume(parseFloat(e.target.value));
    if (audioRef.current) audioRef.current.volume = parseFloat(e.target.value);
  };

  return (
    // Uses 'bg-surface' so it changes with your theme
    <div className="relative w-full bg-surface text-primary py-16 md:py-24 overflow-hidden border-b border-border transition-colors duration-300">
      
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        
        {/* Live Status Badge */}
        <div className={`mb-6 px-4 py-1 rounded-full border flex items-center gap-2 text-sm font-bold tracking-wider uppercase transition-colors ${
            track.is_live 
            ? 'border-red-500/50 bg-red-500/10 text-red-500' 
            : 'border-accent/50 bg-accent/10 text-accent'
        }`}>
          <span className={`w-2 h-2 rounded-full ${track.is_live ? 'bg-red-500 animate-pulse' : 'bg-accent'}`} />
          {track.is_live ? "Live Broadcast" : "Auto DJ"}
        </div>

        {/* Visualizer Container */}
        <div className="mb-8 relative group">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-background border-2 border-border shadow-2xl overflow-hidden flex items-center justify-center relative">
             <div className="absolute inset-0 opacity-60">
                <StreamVisualizer audioRef={audioRef} isPlaying={isPlaying} barCount={20} />
             </div>
             <Music size={64} className="text-secondary/20 relative z-10" />
          </div>
        </div>

        {/* Track Metadata */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 text-primary">
          {track.title}
        </h1>
        <p className="text-xl md:text-2xl text-accent font-medium mb-8">
          {track.artist}
        </p>

        {/* Player Controls */}
        <div className="flex items-center gap-6 w-full justify-center max-w-md bg-background/50 p-4 rounded-2xl border border-border backdrop-blur-sm">
           <VolumeX size={20} className="text-secondary" />
           
           <input 
             type="range" min="0" max="1" step="0.01" 
             value={volume} onChange={handleVolume}
             className="w-24 h-1 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-accent"
           />

           <button 
             onClick={togglePlay}
             className="w-14 h-14 bg-primary text-background rounded-full flex items-center justify-center hover:scale-105 hover:bg-accent hover:text-white transition-all duration-300 shadow-lg"
           >
             {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
           </button>

           <div className="flex items-center gap-2 text-xs font-mono text-secondary bg-surface px-3 py-1 rounded-full border border-border">
             <Users size={12} />
             <span>{listeners}</span>
           </div>
        </div>

        <audio ref={audioRef} crossOrigin="anonymous" src={STREAM_URL} />
      </div>
    </div>
  );
}