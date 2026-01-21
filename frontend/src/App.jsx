import React, { useState, useEffect } from 'react'; // 1. Import hooks
import { 
  BrowserRouter, 
  Routes, 
  Route 
} from 'react-router-dom';
import { Toaster } from 'sonner';

//💡 Import the Theme Provider
import { ThemeProvider } from './context/ThemeContext';
import { PlayerProvider } from './context/PlayerContext';

// Layouts
import AdminLayout from './layout/AdminLayout'; 
import ClientLayout from './layout/ClientLayout';

// Components
import LoadingScreen from './pages/LoadingScreen'; // 2. Import your new Loading Screen (adjust path if needed)

// Views - Admin
import DashboardHome from './pages/admin/DashboardHome';
import RjManager from './pages/admin/RjManager';
import ShowManager from './pages/admin/ShowManager';

// Views - Client


import AboutView from './pages/AboutView';

import Home from './pages/Home';
import Live from './pages/Live';
import NotFound from './pages/NotFound';
import Schedule from './pages/Schedule';
import GlobalPlayer from './components/client/GlobalPlayer';
import EventsView from './pages/EventsView';

//import CommanderView from './pages/CommanderView'; 

// Placeholders
const PlaceholderLogs = () => <div className="p-8 text-center text-secondary"><h2>System Logs View (Coming Soon)</h2></div>;
const PlaceholderSettings = () => <div className="p-8 text-center text-secondary"><h2>Settings View (Coming Soon)</h2></div>;

function App() {
  // 3. Create state to manage loading status
  const [isLoading, setIsLoading] = useState(true);

  // 4. Simulate a loading delay (e.g., 3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Adjust time as needed

    return () => clearTimeout(timer); // Cleanup
  }, []);

  return (
    // 💡 Wrap everything in ThemeProvider so LoadingScreen gets the correct colors
    <ThemeProvider>
      <PlayerProvider>
      
      {/* 5. Show LoadingScreen if loading is true. 
          Since it has 'fixed z-50', it will overlay on top of everything. */}
      {isLoading && <LoadingScreen />}
      <Toaster position="bottom-right" theme="dark" /> 

      <BrowserRouter>
        <Routes>
          
          {/* ======================= 1. PUBLIC ROUTES (ClientLayout) ======================= */}
          <Route path="/" element={<ClientLayout />}>
            {/* Main public listening page */}
            <Route index element={<Home/>} /> 
            <Route path="live" element={<Live/>} />
            <Route path="about" element={<AboutView/>} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="events" element={<EventsView />} />

            <Route path="*" element={<NotFound />} />
            
            {/* Note: You had a duplicate 'about' route here. I removed the placeholder one. */}
          </Route>

          {/* ======================= 2. ADMIN ROUTES (AdminLayout) ======================= */}
          <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="rjs" element={<RjManager />} />
              <Route path="show" element={<ShowManager />} /> 

               {/* 404 Not Found Page */}
              <Route path="*" element={<NotFound />} />
          </Route>

          {/* 404 Not Found Page */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      <GlobalPlayer />
      </BrowserRouter>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default App;