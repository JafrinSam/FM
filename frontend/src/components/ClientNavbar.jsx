import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
// 1. Import Lucide Icons
import { Sun, Moon, Home, Info, Radio } from 'lucide-react';

export default function ClientNavbar() {
  const { themeName, toggleTheme } = useTheme();

  return (
    <nav className="bg-surface text-primary shadow-xl sticky top-0 z-10 border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Branding / Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 group cursor-pointer">
            <div className="h-12 w-12 relative overflow-hidden flex items-center justify-center">
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
            
            <div className="flex flex-col">
              <h1 className="text-3xl tracking-wide text-accent font-magilio leading-none">
                BlazeUp
              </h1>
              <span className="text-xs text-secondary font-medium tracking-widest uppercase">
                Live Radio
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:text-accent hover:bg-background transition-colors group"
            >
              <Home size={16} className="group-hover:text-accent transition-colors" />
              Home
            </Link>
            
            <Link 
              to="/about" 
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:text-accent hover:bg-background transition-colors group"
            >
              <Info size={16} className="group-hover:text-accent transition-colors" />
              About
            </Link>

            {/* Listen Button (Visual CTA) */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold animate-pulse">
                <Radio size={14} />
                <span>LIVE</span>
            </div>

            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-full bg-background border border-border text-primary hover:text-accent hover:border-accent transition-all shadow-sm flex items-center justify-center"
              title="Toggle Theme"
            >
              {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}