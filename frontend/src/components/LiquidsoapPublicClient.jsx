import React, { useState, useEffect } from "react";
// 1. Import Lucide Icons
import { 
  Radio, 
  Users, 
  Music, 
  Mic2, 
  Activity, 
  Volume2, 
  AlertCircle 
} from 'lucide-react';

/* ================= CONFIG ================= */
// Adjust this to your actual public IP or domain in production
const ICECAST_STATUS_URL = "http://localhost:8000/status-json.xsl"; 
const STREAM_URL = "http://localhost:8000/radio.mp3";
const POLLING_INTERVAL = 5000;

export default function LiquidsoapPublicClient() {
  const [metadata, setMetadata] = useState({
    title: "Loading Stream...",
    artist: "",
    listeners: 0,
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ================= METADATA FETCH ================= */
  const fetchMetadata = async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);

    try {
      const response = await fetch(ICECAST_STATUS_URL);
      if (!response.ok) throw new Error("Failed to fetch Icecast status");

      const data = await response.json();
      const sources = Array.isArray(data.icestats.source)
        ? data.icestats.source
        : [data.icestats.source];

      const stream = sources.find(
        (s) => s?.listenurl && s.listenurl.endsWith("radio.mp3")
      );

      if (!stream) {
        setMetadata({
          title: "Stream Offline",
          artist: "Stay tuned...",
          listeners: 0,
        });
        return;
      }

      const fullTitle = stream.title || "Unknown Track";
      let artist = "";
      let title = fullTitle;

      if (fullTitle.includes(" - ")) {
        [artist, title] = fullTitle.split(" - ").map((s) => s.trim());
      }

      setMetadata((prev) => {
        if (
          prev.title === title &&
          prev.artist === artist &&
          prev.listeners === (stream.listeners || 0)
        ) {
          return prev;
        }
        return { title, artist, listeners: stream.listeners || 0 };
      });

      setError(null);
    } catch (err) {
      console.warn("Metadata fetch error:", err); // Warn instead of Error to keep console clean
      setError("Stream Offline or Unreachable");
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  /* ================= POLLING ================= */
  useEffect(() => {
    fetchMetadata(true);
    const interval = setInterval(() => fetchMetadata(false), POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  /* ================= UI ================= */
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 font-sans">
      
      {/* HERO SECTION */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-surface rounded-full mb-6 shadow-lg animate-fade-in-down">
            <Radio size={48} className="text-accent" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl md:text-6xl font-magilio text-primary tracking-wide mb-4">
          BlazeUp <span className="text-accent">Live</span>
        </h1>
        <p className="text-lg text-secondary max-w-lg mx-auto">
          Streaming the best beats directly to your browser via Liquidsoap & Icecast.
        </p>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 flex items-center justify-center gap-2">
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
        </div>
      )}

      {/* MAIN PLAYER CARD */}
      <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative group">
        
        {/* Visualizer / Background Effect (Optional decorative element) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

        <div className="p-8 md:p-12 flex flex-col items-center">
            
            {/* Status Indicator */}
            <div className="mb-6">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border ${
                    !error 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}>
                    <span className={`h-2 w-2 rounded-full ${!error ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                    {!error ? "ON AIR" : "OFFLINE"}
                </span>
            </div>

            {/* Song Info */}
            <div className="text-center mb-10 space-y-2">
                {initialLoading ? (
                    <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-8 w-64 bg-surface rounded"></div>
                        <div className="h-5 w-40 bg-surface rounded"></div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl md:text-4xl font-bold text-primary flex items-center justify-center gap-3">
                            <Music size={28} className="text-accent hidden md:block" />
                            {metadata.title}
                        </h2>
                        <p className="text-xl text-secondary font-medium flex items-center justify-center gap-2">
                            <Mic2 size={18} className="opacity-70" />
                            {metadata.artist || "Unknown Artist"}
                        </p>
                    </>
                )}
            </div>

            {/* Audio Element */}
            <div className="w-full max-w-md bg-surface p-4 rounded-2xl shadow-inner border border-border">
                <audio
                    controls
                    src={STREAM_URL}
                    preload="none"
                    className="w-full h-10 accent-accent"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                >
                    Your browser does not support the audio element.
                </audio>
            </div>
            
            <p className="text-xs text-secondary mt-4 flex items-center gap-1 opacity-70">
                <Volume2 size={12} />
                High Quality MP3 Stream (128kbps)
            </p>
        </div>

        {/* Footer Stats Strip */}
        <div className="bg-surface border-t border-border p-4 md:px-12 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-primary font-medium">
                <Users size={18} className="text-accent" />
                <span>{metadata.listeners} Listening</span>
            </div>
            
            <div className="flex items-center gap-2 text-secondary">
                <Activity size={18} className={isPlaying ? "text-green-500 animate-pulse" : "text-gray-500"} />
                <span>Stream Health: {error ? "Critical" : "Good"}</span>
            </div>
        </div>
      </div>

    </div>
  );
}