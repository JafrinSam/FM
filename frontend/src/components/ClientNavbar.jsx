import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Home, Info, Radio, Menu, X, PlayCircle } from 'lucide-react';

export default function ClientNavbar() {
  const { themeName, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation(); 

  const closeMenu = () => setIsOpen(false);

  // Helper function to determine active state styles
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all group";
    
    return isActive 
      ? `${baseClass} text-accent bg-accent/10 font-bold shadow-sm` 
      : `${baseClass} text-secondary hover:text-accent hover:bg-background`;
  };

  // Mobile specific class helper
  const getMobileLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors";
    
    return isActive
      ? `${baseClass} text-accent bg-accent/10 font-bold border-l-4 border-accent`
      : `${baseClass} text-secondary hover:text-accent hover:bg-background`;
  };

  return (
    <nav className="bg-surface text-primary shadow-xl sticky top-0 z-50 border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* --- BRANDING / LOGO --- */}
          <Link to="/" onClick={closeMenu} className="flex-shrink-0 flex items-center gap-3 group cursor-pointer z-50">
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
                    {/* Fallback Image if video fails */}
                    <img src="/logo/logo.png" alt="BlazeUp" className="w-full h-full object-contain" /> 
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

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={getLinkClass('/')}>
              <Home size={18} className={location.pathname === '/' ? "text-accent" : "group-hover:text-accent transition-colors"} />
              Home
            </Link>

            {/* 🟢 NEW: Live Link */}
            <Link to="/live" className={getLinkClass('/live')}>
              <Radio size={18} className={location.pathname === '/live' ? "text-accent" : "group-hover:text-accent transition-colors"} />
              Live Stream
            </Link>
            
            <Link to="/about" className={getLinkClass('/about')}>
              <Info size={18} className={location.pathname === '/about' ? "text-accent" : "group-hover:text-accent transition-colors"} />
              About
            </Link>

            <div className="w-px h-6 bg-border mx-2"></div>

            {/* Listen Badge (Visual Only) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-pulse cursor-default select-none">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>ON AIR</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-full bg-background border border-border text-primary hover:text-accent hover:border-accent transition-all shadow-sm flex items-center justify-center"
              title="Toggle Theme"
            >
              {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>

          {/* --- MOBILE CONTROLS --- */}
          <div className="flex md:hidden items-center gap-4">
            {/* Mobile On-Air Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span>ON AIR</span>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-secondary hover:text-accent hover:bg-background focus:outline-none transition-colors"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE DROPDOWN MENU --- */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-border bg-surface ${
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 border-none"
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
          
          <Link 
            to="/" 
            onClick={closeMenu}
            className={getMobileLinkClass('/')}
          >
            <Home size={18} />
            Home
          </Link>

          {/* 🟢 NEW: Mobile Live Link */}
          <Link 
            to="/live" 
            onClick={closeMenu}
            className={getMobileLinkClass('/live')}
          >
            <Radio size={18} />
            Live Stream
          </Link>
          
          <Link 
            to="/about" 
            onClick={closeMenu}
            className={getMobileLinkClass('/about')}
          >
            <Info size={18} />
            About
          </Link>

          <div className="flex items-center justify-between px-3 py-3 mt-2 border-t border-border">
             <span className="text-sm text-secondary font-medium">Appearance</span>
             <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border text-primary hover:border-accent transition-all"
            >
              {themeName === 'light' ? (
                <>
                   <Moon size={16} /> <span>Dark Mode</span>
                </>
              ) : (
                <>
                   <Sun size={16} /> <span>Light Mode</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}