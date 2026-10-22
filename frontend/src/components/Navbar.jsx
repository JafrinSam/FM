import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Music, 
  Settings, 
  Radio, 
  Sun, 
  Moon, 
  CalendarClock, 
  ListMusic,
  Menu, // New
  X     // New
} from 'lucide-react';

export default function Navbar() {
  const { themeName, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsOpen(false);

  // Helper for Desktop Link Styles
  const getLinkClass = (path) => {
    // Check if current path matches the link path
    // For root "/admin", we want exact match to avoid highlighting it on subpages
    const isActive = path === '/admin' 
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

    const baseClass = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all group";
    
    return isActive 
      ? `${baseClass} text-accent bg-accent/10 font-bold shadow-sm` 
      : `${baseClass} text-secondary hover:text-accent hover:bg-background`;
  };

  // Helper for Mobile Link Styles
  const getMobileLinkClass = (path) => {
    const isActive = path === '/admin' 
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

    const baseClass = "flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors";
    
    return isActive
      ? `${baseClass} text-accent bg-accent/10 font-bold border-l-4 border-accent`
      : `${baseClass} text-secondary hover:text-accent hover:bg-background`;
  };

  // Helper to color icons based on active state
  const getIconClass = (path) => {
    const isActive = path === '/admin' 
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);
      
    return isActive ? "text-accent" : "group-hover:text-accent transition-colors";
  };

  return (
    <nav className="bg-surface text-primary shadow-xl sticky top-0 z-50 border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* --- BRANDING / LOGO --- */}
          <Link to="/admin" onClick={closeMenu} className="flex-shrink-0 flex items-center gap-3 group cursor-pointer z-50">
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
          </Link>

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden lg:flex items-center space-x-2">
            
            <Link to="/admin" className={getLinkClass('/admin')}>
              <Radio size={16} className={getIconClass('/admin')} />
              Commander
            </Link>

            <Link to="/admin/queue" className={getLinkClass('/admin/queue')}>
              <ListMusic size={16} className={getIconClass('/admin/queue')} />
              Queue
            </Link>

            <Link to="/admin/scheduler" className={getLinkClass('/admin/scheduler')}>
              <CalendarClock size={16} className={getIconClass('/admin/scheduler')} />
              Scheduler
            </Link>

            <Link to="/admin/music" className={getLinkClass('/admin/music')}>
              <Music size={16} className={getIconClass('/admin/music')} />
              Library
            </Link>
            
            <Link to="/admin/settings" className={getLinkClass('/admin/settings')}>
              <Settings size={16} className={getIconClass('/admin/settings')} />
              Settings
            </Link>

            {/* Theme Toggle */}
             <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-full bg-background border border-border text-primary hover:text-accent hover:border-accent transition-all shadow-sm flex items-center justify-center"
              title="Toggle Theme"
            >
              {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>

          {/* --- MOBILE CONTROLS --- */}
          <div className="flex lg:hidden items-center gap-4">
            
            {/* Status Badge (Visible on Mobile Header) */}
            <span className="hidden sm:inline-flex items-center rounded-full bg-green-900/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              Online
            </span>

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
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-border bg-surface ${
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 border-none"
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
          
          <Link to="/admin" onClick={closeMenu} className={getMobileLinkClass('/admin')}>
            <Radio size={18} /> Commander
          </Link>

          <Link to="/admin/queue" onClick={closeMenu} className={getMobileLinkClass('/admin/queue')}>
            <ListMusic size={18} /> Queue
          </Link>

          <Link to="/admin/scheduler" onClick={closeMenu} className={getMobileLinkClass('/admin/scheduler')}>
            <CalendarClock size={18} /> Scheduler
          </Link>

          <Link to="/admin/music" onClick={closeMenu} className={getMobileLinkClass('/admin/music')}>
            <Music size={18} /> Library
          </Link>

          <Link to="/admin/settings" onClick={closeMenu} className={getMobileLinkClass('/admin/settings')}>
            <Settings size={18} /> Settings
          </Link>

          {/* Mobile Theme Toggle Row */}
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
          
          {/* Mobile Status Row */}
          <div className="flex items-center justify-center pt-2 sm:hidden">
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