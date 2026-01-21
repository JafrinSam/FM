import React, { useState } from 'react';
import { useStationStats } from '../../hooks/useStationStats';
import { usePlayer } from '../../context/PlayerContext'; // Import your Player Context
import axios from 'axios'; // For the Skip API
import { Play, Pause, SkipForward, Activity, Users, Radio, Clock, Mic2 } from 'lucide-react';

export default function DashboardHome() {
  const { 
    currentSong, 
    artist, 
    coverArt, 
    listeners, 
    isLive, 
    streamerName,
    error 
  } = useStationStats();

  // 1. Get Player Controls
  const { isPlaying, play, pause } = usePlayer(); 
  
  // 2. Local state for Skip loading
  const [isSkipping, setIsSkipping] = useState(false);

  // LOGIC: Tune In / Pause
  const handleTuneIn = () => {
    if (isPlaying) {
      pause();
    } else {
      play(); // This should trigger your GlobalPlayer to play the stream url
    }
  };

  // LOGIC: Skip Song
  const handleSkip = async () => {
    if(!window.confirm("Are you sure you want to skip the current song?")) return;

    try {
      setIsSkipping(true);
      // Call your Node.js backend, which then talks to AzuraCast
      await axios.post('http://localhost:5000/api/station/skip');
      
      // Optional: Add a toast notification here
      alert("Skipped! It may take a few seconds to reflect.");
    } catch (err) {
      alert("Failed to skip song. Check console.");
      console.error(err);
    } finally {
      setIsSkipping(false);
    }
  };

  const cardBaseClass = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
      
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Station Commander</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">System overview and live control.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* HERO CARD */}
        <div className="xl:col-span-2 w-full">
          <div className={`${cardBaseClass} rounded-[30px] h-full min-h-[320px] relative overflow-hidden group w-full`}>
            <div 
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110 group-hover:scale-125 transition-transform duration-[20s]"
              style={{ backgroundImage: `url(${coverArt || '/default-album-art.png'})` }}
            />
            
            <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-end">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 bg-gray-100 dark:bg-gray-900 relative">
                  <img src={coverArt || '/placeholder.png'} alt="Art" className="w-full h-full object-cover" />
                  
                  {/* Overlay Play Button on Album Art */}
                  <button 
                    onClick={handleTuneIn}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black pl-1">
                      {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
                    </div>
                  </button>
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                      {isLive ? 'Live Broadcast' : 'Now Playing'}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-2 truncate">
                    {currentSong || "Loading..."}
                  </h2>
                  <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 font-medium truncate">{artist || "Please Wait"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 lg:gap-6">
          
          {/* ... Stats Cards ... */}
          <div className={`${cardBaseClass} rounded-3xl p-6 flex items-center justify-between w-full`}>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase">Total Listeners</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{listeners}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
              <Users size={24} />
            </div>
          </div>

          <div className={`${cardBaseClass} rounded-3xl p-6 flex items-center justify-between w-full`}>
             <div>
              <p className="text-gray-400 text-xs font-bold uppercase">Stream Status</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{error ? 'Offline' : 'Excellent'}</h3>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${error ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
              <Radio size={24} />
            </div>
          </div>

          {/* --- FUNCTIONAL BUTTONS --- */}
          <div className={`${cardBaseClass} rounded-3xl p-1 flex w-full`}>
             
             {/* Tune In Button */}
             <button 
               onClick={handleTuneIn}
               className="flex-1 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
             >
               {isPlaying ? <Pause size={20} /> : <Play size={20} />}
               <span className="text-xs font-bold">{isPlaying ? 'Pause' : 'Tune In'}</span>
             </button>
             
             <div className="w-px bg-gray-200 dark:bg-gray-700 my-2"></div>
             
             {/* Skip Button */}
             <button 
               onClick={handleSkip}
               disabled={isSkipping}
               className={`flex-1 p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${
                 isSkipping 
                   ? 'opacity-50 cursor-not-allowed text-gray-300' 
                   : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-blue-500'
               }`}
             >
               <SkipForward size={20} className={isSkipping ? 'animate-pulse' : ''} />
               <span className="text-xs font-bold">{isSkipping ? 'Skipping...' : 'Skip'}</span>
             </button>
          </div>

        </div>
      </div>
      
      {/* ... Secondary Row (same as before) ... */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Up Next List */}
         <div className={`${cardBaseClass} rounded-3xl p-6 min-h-[200px] w-full`}>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-blue-500"/> Up Next
             </h3>
             <div className="space-y-3">
                 {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border border-transparent">
                       <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {i}
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Future Song Title {i}</p>
                          <p className="text-xs text-gray-500 truncate">Upcoming Artist</p>
                       </div>
                       <span className="ml-auto text-xs font-mono text-gray-400 whitespace-nowrap">1{i}:00 PM</span>
                    </div>
                 ))}
             </div>
         </div>

         {/* RJ Action Card */}
         <div className={`${cardBaseClass} rounded-3xl p-6 min-h-[200px] flex items-center justify-center text-center w-full`}>
             <div className="max-w-xs">
                <div className="inline-flex p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 mb-4 ring-4 ring-blue-50 dark:ring-blue-900/10">
                    <Mic2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">RJ Takeover</h3>
                <p className="text-sm text-gray-500 mb-5">
                    Take control of the stream manually. This will interrupt AutoDJ immediately.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95">
                    Go Live Now
                </button>
             </div>
         </div>
      </div>
    </div>
  );
}