import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Assuming this is your themable Navbar
import Footer from '../components/Footer'; // Assuming this is your themable Footer

export default function AdminLayout() {
  return (
    // 💡 THEME UPDATE:
    // 1. bg-surface: Sets the app background to Light Grey (Light Mode) or Dark Grey (Dark Mode)
    // 2. text-primary: Sets the default text color
    // 3. transition-colors: Ensures a smooth fade when toggling the theme
    <div className="flex flex-col min-h-screen bg-surface text-primary transition-colors duration-300">
      
      <Navbar />
      
      {/* Outlet renders the specific component for the current route */}
      <main className="flex-grow"> 
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}