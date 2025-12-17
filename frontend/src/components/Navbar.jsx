import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
// 1. Add Sun and Moon to imports
import { Music, Settings, Radio, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { themeName, toggleTheme } = useTheme();

  return (
    <nav className="bg-surface text-primary shadow-xl sticky top-0 z-10 border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Branding / Logo */}
          <div className="flex-shrink-0 flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 relative overflow-hidden flex items-center justify-center">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-contain"
                >
                    <source src="/logo/logo.webm" type="video/webm" />
                    <source src="/logo/logo.mov" type="video/quicktime" />
                    <img src="/images/fallback-logo.png" alt="BlazeUp" /> 
                </video>
            </div>
            
            <h1 className="text-3xl tracking-wide text-accent font-magilio pt-1">
              BlazeUp
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-2">
            
            {/* Commander Link */}
            <Link 
              to="/admin" 
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-background text-primary border border-border hover:border-accent transition-all group"
            >
              <Radio size={16} className="group-hover:text-accent transition-colors" />
              Commander
            </Link>

            {/* Music Library Link (Fixed Layout) */}
            <Link 
              to="/admin/music" 
              // Added: flex items-center gap-2
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:text-accent hover:bg-background transition-colors group"
            >
              <Music size={16} className="group-hover:text-accent transition-colors" />
              Music Library
            </Link>
            
            {/* Settings Link (Fixed Layout & Icon) */}
            <Link 
              to="/admin/settings" 
              // Added: flex items-center gap-2
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:text-accent hover:bg-background transition-colors group"
            >
              <Settings size={16} className="group-hover:text-accent transition-colors" />
              Settings
            </Link>

            {/* Theme Toggle Button (With Lucide Icons) */}
             <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-full bg-background border border-border text-primary hover:text-accent hover:border-accent transition-all shadow-sm flex items-center justify-center"
              title="Toggle Theme"
            >
              {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex text-sm">
            <span className="inline-flex items-center rounded-full bg-green-900/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Liquidsoap Active
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}