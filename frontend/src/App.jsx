import React, { useState, useEffect } from 'react'; // 1. Import hooks
import { 
  BrowserRouter, 
  Routes, 
  Route 
} from 'react-router-dom';

//💡 Import the Theme Provider
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import AdminLayout from './layout/AdminLayout'; 
import ClientLayout from './layout/ClientLayout';

// Components
import LoadingScreen from './pages/LoadingScreen'; // 2. Import your new Loading Screen (adjust path if needed)
import LiquidsoapPublicClient from './components/LiquidsoapPublicClient';

// Views - Admin
import SchedulerView from './pages/SchedulerView';   
import MusicManagerView from './pages/MusicManagerView'
import AboutView from './pages/AboutView';
import QueueManager from './pages/QueueManager'
import Home from './pages/Home';
import Live from './pages/Live';
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
      
      {/* 5. Show LoadingScreen if loading is true. 
          Since it has 'fixed z-50', it will overlay on top of everything. */}
      {isLoading && <LoadingScreen />}

      <BrowserRouter>
        <Routes>
          
          {/* ======================= 1. PUBLIC ROUTES (ClientLayout) ======================= */}
          <Route path="/" element={<ClientLayout />}>
            {/* Main public listening page */}
            <Route index element={<Home/>} /> 
            <Route path="live" element={<Live/>} />
            <Route path="about" element={<AboutView/>} />
            
            {/* Note: You had a duplicate 'about' route here. I removed the placeholder one. */}
          </Route>

          {/* ======================= 2. ADMIN ROUTES (AdminLayout) ======================= */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<SchedulerView />} />
            <Route path="music" element={<MusicManagerView />} />
            {/* <Route path="commander" element={<CommanderView />} /> */}
            <Route path='queue' element={<QueueManager/>} />
            <Route path="logs" element={<PlaceholderLogs />} /> 
            <Route path="settings" element={<PlaceholderSettings />} /> 
          </Route>

          {/* 404 Not Found Page */}
          <Route path="*" element={<h1 className="text-center p-10 text-primary">404: Page Not Found</h1>} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;