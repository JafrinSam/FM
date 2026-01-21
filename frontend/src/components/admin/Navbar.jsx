import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useStationStats } from '../../hooks/useStationStats'; // Import Hook
import GlassSurface from '../utlis/GlassSurface'; 
import { Radio, Sun, Moon, Menu, Settings } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { themeName, toggleTheme } = useTheme();
  const { isLive, listeners } = useStationStats(); // Get stats
  const isDark = themeName === 'dark';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={0}
        isDark={isDark}
        blur={20}
        opacity={isDark ? 0.7 : 0.85}
        borderWidth={0}
        className="border-b border-white/10"
      >
        <div className="w-full h-full px-4 lg:px-6 flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-secondary hover:text-accent transition-colors"
            >
              <Menu size={24} />
            </button>

            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                 <Radio size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-primary font-magilio">
                Blaze<span className="text-accent">Up</span>
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* DYNAMIC LIVE BADGE */}
            {isLive ? (
              <span className="hidden sm:inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-600 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2"></span>
                LIVE ({listeners})
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                AutoDJ ({listeners})
              </span>
            )}

            <div className="h-6 w-px bg-primary/10 mx-1"></div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-primary/5 text-secondary hover:text-primary transition-colors"
            >
              {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <Link to="/admin/settings" className="p-2 rounded-full hover:bg-primary/5 text-secondary hover:text-primary transition-colors">
               <Settings size={20} />
            </Link>
            
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-accent to-purple-500 ml-2 border-2 border-surface shadow-sm"></div>
          </div>

        </div>
      </GlassSurface>
    </header>
  );
}