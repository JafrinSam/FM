import React from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route 
} from 'react-router-dom';

// 💡 Import the Theme Provider
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import AdminLayout from './layout/AdminLayout'; // Ensure paths match your folder structure
import ClientLayout from './layout/ClientLayout';

// Views - Client
import LiquidsoapPublicClient from './components/LiquidsoapPublicClient';

// Views - Admin
import SchedulerView from './pages/SchedulerView';   // 🗓️ The Scheduler Page
import MusicManagerView from './pages/MusicManagerView'
//import CommanderView from './pages/CommanderView';   // 🎛️ The Live Controls Page

// Placeholders for other admin pages
const PlaceholderLogs = () => <div className="p-8 text-center text-secondary"><h2>System Logs View (Coming Soon)</h2></div>;
const PlaceholderSettings = () => <div className="p-8 text-center text-secondary"><h2>Settings View (Coming Soon)</h2></div>;

function App() {
  return (
    // 💡 1. Wrap the entire application in the ThemeProvider
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          
          {/* ======================= 1. PUBLIC ROUTES (ClientLayout) ======================= */}
          <Route path="/" element={<ClientLayout />}>
            {/* Main public listening page */}
            <Route index element={<LiquidsoapPublicClient />} /> 
            
            {/* Example: A public 'About Us' page */}
            <Route path="about" element={<div className="p-10 text-primary"><h1>About This Station</h1></div>} /> 
          </Route>

          {/* ======================= 2. ADMIN ROUTES (AdminLayout) ======================= */}
          {/* All routes here inherit the Admin Theme via AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            
            {/* Path: /admin - Defaults to Scheduler */}
            <Route index element={<SchedulerView />} />

            <Route path="music" element={<MusicManagerView />} />
            
            {/* Path: /admin/commander - Live Controls */}
            {/* <Route path="commander" element={<CommanderView />} /> */}
            
            {/* Path: /admin/logs */}
            <Route path="logs" element={<PlaceholderLogs />} /> 
            
            {/* Path: /admin/settings */}
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