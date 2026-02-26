import React from 'react';
import { usePlayer } from '../context/PlayerContext';

// Custom Components
import HeroSection from '../components/home/HeroSection';
import StationEvents from '../components/home/StationEvents';
import CampusEvents from '../components/home/CampusEvents';
import FeaturesSection from '../components/home/FeaturesSection';
import RJsSection from '../components/home/RJsSection';
import RequestShowSection from '../components/home/RequestShowSection';

export default function Home() {
  const { playMusic } = usePlayer();

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white transition-colors duration-300 pb-32">

      <main>
        {/* ================= 1. HERO SECTION ================= */}
        <HeroSection playMusic={playMusic} />

        {/* ================= 2. UPCOMING FM EVENTS ================= */}
        <StationEvents />

        {/* ================= 3. UPCOMING CAMPUS EVENTS ================= */}
        <CampusEvents />

        {/* ================= 4. FEATURES SECTION ================= */}
        <FeaturesSection />

        {/* ================= 5. RJS SECTION ================= */}
        <RJsSection />

        {/* ================= 6. REQUEST SHOW ================= */}
        <RequestShowSection />

      </main>

    </div>
  );
}