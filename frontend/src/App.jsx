import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import { Toaster } from 'sonner';

import { ThemeProvider } from './context/ThemeContext';
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider } from './context/AuthContext';
import AxiosInterceptor from './components/AxiosInterceptor'; // ✅ Import remains same

import AdminLayout from './layout/AdminLayout'; 
import ClientLayout from './layout/ClientLayout';
import LoadingScreen from './pages/LoadingScreen';

// Views
import DashboardHome from './pages/admin/DashboardHome';
import RjManager from './pages/admin/RjManager';
import ShowManager from './pages/admin/ShowManager';
import UserManagement from './pages/admin/UserManagement';
import AboutView from './pages/AboutView';
import Home from './pages/Home';
import Live from './pages/Live';
import NotFound from './pages/NotFound';
import Schedule from './pages/Schedule';
import GlobalPlayer from './components/client/GlobalPlayer';
import EventsView from './pages/EventsView';
import LoginPage from './pages/auth/LoginPage';
import EventManagement from './pages/admin/EventManagement';
import Settings from './pages/admin/Settings';



function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <PlayerProvider>
        <BrowserRouter>
          <AuthProvider>
            
            {isLoading && <LoadingScreen />}
            <Toaster position="bottom-right" theme="dark" /> 

            {/* ✅ FIX: Wrap the Routes with the Interceptor, do NOT put it inside Routes */}
            <AxiosInterceptor>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<ClientLayout />}>
                  <Route index element={<Home/>} /> 
                  <Route path="live" element={<Live/>} />
                  <Route path="about" element={<AboutView/>} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="events" element={<EventsView />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                
                {/* ADMIN ROUTES */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="rjs" element={<RjManager />} />
                    <Route path="show" element={<ShowManager />} /> 
                    <Route path="users" element ={<UserManagement/>} />
                    <Route path="events" element={<EventManagement />} />
                    <Route path='settings' element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
              
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AxiosInterceptor>

            <GlobalPlayer />

          </AuthProvider>
        </BrowserRouter>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default App;