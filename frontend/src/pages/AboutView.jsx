import React from 'react';
import { 
  Flame, 
  Zap, 
  Mic2, 
  Users, 
  Radio, 
  Heart, 
  Sparkles 
} from 'lucide-react';

export default function AboutView() {
  return (
    <div className="min-h-screen bg-background text-primary font-sans transition-colors duration-300">
      
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden py-20 px-6 text-center">
        {/* Decorative Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="mb-6 p-4 bg-surface rounded-full shadow-xl border border-border inline-flex items-center justify-center">
            <Flame size={48} className="text-accent fill-current opacity-90" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-magilio text-primary tracking-wide mb-6">
            Ignite. <span className="text-accent">Express.</span> Rise.
          </h1>
          
          <p className="text-xl md:text-2xl text-secondary font-light max-w-2xl mx-auto leading-relaxed">
            The spark behind student voices. <br className="hidden md:block" />
            We are <span className="font-magilio text-accent text-2xl">BlazeUp</span> — a platform designed to fuel conversations and lift minds.
          </p>
        </div>
      </section>

      {/* --- MISSION GRID --- */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-card border border-border p-8 rounded-3xl shadow-lg hover:shadow-2xl hover:border-accent/50 transition-all duration-300 group">
            <div className="mb-4 p-3 bg-surface rounded-2xl w-fit group-hover:scale-110 transition-transform">
              <Zap size={32} className="text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-magilio tracking-wide">Where Ideas Catch Fire</h3>
            <p className="text-secondary leading-relaxed">
              We provide the spark. You provide the fuel. From hot takes on campus culture to brilliant musical discoveries, this is the place where energy meets expression.
            </p>
          </div>

          {/* Card 2 - FIX APPLIED HERE */}
          <div className="bg-card border border-border p-8 rounded-3xl shadow-lg hover:shadow-2xl hover:border-accent/50 transition-all duration-300 group relative overflow-hidden">
            {/* Subtle gradient for the middle card */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full z-0"></div>
            
            {/* Removed 'z-10', kept 'relative' to maintain stacking above the gradient but below navbar */}
            <div className="mb-4 p-3 bg-surface rounded-2xl w-fit group-hover:scale-110 transition-transform relative">
              <Mic2 size={32} className="text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-magilio tracking-wide relative">Fueling Voices</h3>
            <p className="text-secondary leading-relaxed relative">
              Every voice deserves to be heard loud and clear. We amplify the stories, the music, and the personalities that define our generation. No filters, just raw energy.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-card border border-border p-8 rounded-3xl shadow-lg hover:shadow-2xl hover:border-accent/50 transition-all duration-300 group">
            <div className="mb-4 p-3 bg-surface rounded-2xl w-fit group-hover:scale-110 transition-transform">
              <Sparkles size={32} className="text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-magilio tracking-wide">Lifting Minds</h3>
            <p className="text-secondary leading-relaxed">
              Radio isn't just about sound; it's about a higher state of mind. Tune in to elevate your day, find your rhythm, and connect with a community that rises together.
            </p>
          </div>

        </div>
      </section>

      {/* --- STATS / COMMUNITY SECTION --- */}
      <section className="py-20 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          
          <div className="flex flex-col items-center gap-2">
            <Radio size={40} className="text-accent mb-2 opacity-80" />
            <span className="text-4xl font-bold text-primary">24/7</span>
            <span className="text-sm uppercase tracking-widest text-secondary font-medium">Live Broadcast</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Users size={40} className="text-blue-500 mb-2 opacity-80" />
            <span className="text-4xl font-bold text-primary">100%</span>
            <span className="text-sm uppercase tracking-widest text-secondary font-medium">Student Driven</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Flame size={40} className="text-orange-500 mb-2 opacity-80" />
            <span className="text-4xl font-bold text-primary">High</span>
            <span className="text-sm uppercase tracking-widest text-secondary font-medium">Energy Only</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Heart size={40} className="text-red-500 mb-2 opacity-80" />
            <span className="text-4xl font-bold text-primary">∞</span>
            <span className="text-sm uppercase tracking-widest text-secondary font-medium">Passion</span>
          </div>

        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-magilio text-primary mb-6">
          Ready to pass the mic?
        </h2>
        <p className="text-secondary text-lg max-w-xl mx-auto mb-10">
          Whether you want to host a show, curate a playlist, or just vibe with us — the station is yours.
        </p>
        <button className="px-8 py-4 bg-accent text-white font-bold rounded-full shadow-lg hover:bg-accent-hover hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto">
          <Mic2 size={20} />
          Join the Team
        </button>
      </section>

    </div>
  );
}