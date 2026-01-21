import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useStationStats } from '../../hooks/useStationStats'; // Import the hook
import GlassSurface from '../utlis/GlassSurface';
import { 
  LayoutDashboard, 
  ListMusic, 
  CalendarClock, 
  Music, 
  Settings,
  Mic2,
  Users
} from 'lucide-react';

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();
  const { themeName } = useTheme();
  const { listeners, isLive, error } = useStationStats(); // Get live stats
  const isDark = themeName === 'dark';

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/scheduler', icon: CalendarClock, label: 'Scheduler' },
    { path: '/admin/show', icon: Music, label: 'Music Library' },
    { path: '/admin/rjs', icon: Mic2, label: 'RJs & Shows' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const getLinkClass = (path) => {
    const isActive = path === '/admin' 
      ? location.pathname === '/admin' 
      : location.pathname.startsWith(path);

    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      isActive 
        ? 'bg-accent/10 text-accent font-bold border-r-2 border-accent' 
        : 'text-secondary hover:text-primary hover:bg-primary/5'
    }`;
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      <aside 
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={0}
          isDark={isDark}
          blur={20}
          opacity={isDark ? 0.7 : 0.9}
          borderWidth={0}
          className="border-r border-white/5"
        >
          <div className="flex flex-col h-full py-6 px-3">
            
            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
              <div className="px-4 mb-4 text-xs font-bold text-secondary/50 uppercase tracking-widest">
                Main Menu
              </div>
              
              {menuItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={closeSidebar}
                  className={getLinkClass(item.path)}
                >
                  <item.icon size={20} className={location.pathname.startsWith(item.path) ? "animate-pulse" : ""} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* DYNAMIC STATION WIDGET */}
            <div className="mt-auto px-4 pt-6 border-t border-primary/5">
              <div className="bg-gradient-to-br from-accent/20 to-purple-500/10 rounded-2xl p-4 border border-accent/10">
                <h4 className="text-sm font-bold text-primary mb-1">Station Status</h4>
                
                {/* Listener Count */}
                <div className="flex justify-between text-xs text-secondary mb-2">
                  <span>Listeners:</span>
                  <span className="font-bold text-primary">{error ? 'Offline' : listeners}</span>
                </div>

                {/* Live Indicator */}
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                   <span className="text-xs font-bold text-primary">
                     {isLive ? '🔴 RJ LIVE' : '🟢 AutoDJ Active'}
                   </span>
                </div>
                
                {/* Visual Bar (Just for looks) */}
                <div className="w-full bg-surface/50 rounded-full h-1 mt-3 overflow-hidden">
                  <div className="bg-accent h-full w-[45%] rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

          </div>
        </GlassSurface>
      </aside>
    </>
  );
}