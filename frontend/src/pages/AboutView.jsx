import React from 'react';
import { 
  Radio, 
  Mic2, 
  Users, 
  Cpu, 
  Globe, 
  Signal, 
  Headphones 
} from 'lucide-react';

export default function AboutView() {
  return (
    <div className="min-h-screen bg-background text-primary font-sans transition-colors duration-300">
      
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden py-24 px-6 text-center">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up">
          <div className="mb-8 p-6 bg-surface/50 backdrop-blur-md rounded-full shadow-2xl border border-white/10 inline-flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <Radio size={56} className="text-accent relative z-10" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-magilio text-primary tracking-tight mb-6 leading-tight">
            Connect. <span className="text-accent">Broadcast.</span> Inspire.
          </h1>
          
          <p className="text-xl md:text-2xl text-secondary font-light max-w-3xl mx-auto leading-relaxed">
            The digital heartbeat of <span className="font-bold text-primary">SRM IST Trichy</span>. <br className="hidden md:block" />
            We are <span className="font-magilio text-accent text-2xl font-bold">ByteCast FM</span> — bridging the gap between engineering, medicine, and the arts.
          </p>
        </div>
      </section>

      {/* --- MISSION GRID --- */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Technology */}
          <div className="bg-card border border-border/50 dark:border-white/5 p-8 rounded-[2rem] shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-300 group hover:-translate-y-1">
            <div className="mb-6 p-4 bg-surface rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-inner">
              <Cpu size={32} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-primary tracking-wide">Tech & Innovation</h3>
            <p className="text-secondary leading-relaxed text-sm md:text-base">
              Rooted in a campus known for technical excellence, we stream the latest in tech news, hackathon updates, and future-forward discussions.
            </p>
          </div>

          {/* Card 2: Voice */}
          <div className="bg-card border border-border/50 dark:border-white/5 p-8 rounded-[2rem] shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-300 group relative overflow-hidden hover:-translate-y-1">
            {/* Subtle gradient for the middle card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full z-0 pointer-events-none"></div>
            
            <div className="mb-6 p-4 bg-surface rounded-2xl w-fit group-hover:scale-110 transition-transform relative z-10 shadow-inner">
              <Mic2 size={32} className="text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-primary tracking-wide relative z-10">Unfiltered Voices</h3>
            <p className="text-secondary leading-relaxed relative z-10 text-sm md:text-base">
              From the bustling corridors of the Main Block to the quiet of the library, we amplify the diverse stories, talents, and opinions of the SRM student body.
            </p>
          </div>

          {/* Card 3: Community */}
          <div className="bg-card border border-border/50 dark:border-white/5 p-8 rounded-[2rem] shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-300 group hover:-translate-y-1">
            <div className="mb-6 p-4 bg-surface rounded-2xl w-fit group-hover:scale-110 transition-transform shadow-inner">
              <Globe size={32} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-primary tracking-wide">Campus Culture</h3>
            <p className="text-secondary leading-relaxed text-sm md:text-base">
              More than just music. We are the hub for cultural fests, club activities, and the vibrant life that happens outside the classroom at Irungalur.
            </p>
          </div>

        </div>
      </section>

      {/* --- STATS / COMMUNITY SECTION --- */}
      <section className="py-24 bg-surface border-y border-border/50 dark:border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
          
          <div className="flex flex-col items-center gap-3 group">
            <Signal size={36} className="text-accent mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-4xl md:text-5xl font-black text-primary">24/7</span>
            <span className="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Online Stream</span>
          </div>

          <div className="flex flex-col items-center gap-3 group">
            <Users size={36} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-4xl md:text-5xl font-black text-primary">100%</span>
            <span className="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Student Run</span>
          </div>

          <div className="flex flex-col items-center gap-3 group">
            <Mic2 size={36} className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-4xl md:text-5xl font-black text-primary">50+</span>
            <span className="text-xs uppercase tracking-[0.2em] text-secondary font-bold">RJs & Creators</span>
          </div>

          <div className="flex flex-col items-center gap-3 group">
            <Headphones size={36} className="text-green-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-4xl md:text-5xl font-black text-primary">∞</span>
            <span className="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Campus Vibes</span>
          </div>

        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">
            Join the Frequency
          </h2>
          <p className="text-secondary text-lg mb-10 leading-relaxed">
            ByteCast FM is always looking for new voices. Whether you want to host a show, 
            manage our tech stack, or design our socials — there is a place for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button className="px-8 py-4 bg-accent text-white font-bold rounded-full shadow-xl shadow-accent/20 hover:bg-accent/90 hover:scale-105 transition-all duration-300 flex items-center gap-3">
              <Mic2 size={20} />
              Apply as RJ
            </button>
            <button className="px-8 py-4 bg-card border border-border text-primary font-bold rounded-full hover:bg-surface transition-all duration-300 flex items-center gap-3">
              <Users size={20} />
              Join Tech Team
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}