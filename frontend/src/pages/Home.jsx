import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar, Mic2, ArrowRight, Radio } from 'lucide-react';
import ClientNavbar from '../components/ClientNavbar';
import Footer from '../components/Footer';

// Dummy Data
const UPCOMING_EVENTS = [
  { id: 1, title: "Campus Jazz Fest", date: "Oct 24", time: "6:00 PM" },
  { id: 2, title: "Tech Talk: AI Futures", date: "Oct 25", time: "2:00 PM" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white transition-colors duration-300">

      <main>
        {/* ================= HERO SECTION ================= */}
        <section className="relative h-[85vh] flex items-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop" 
              alt="Radio Studio" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left: Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold tracking-wider uppercase text-xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                On Air 24/7
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
                The Pulse of <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-500">
                  Campus Life
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-secondary max-w-lg leading-relaxed">
                Tune in to BlazeUp for the freshest indie tracks, student podcasts, and live coverage of college events. Your voice, your station.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link to="/live" className="group relative px-8 py-4 bg-accent text-white font-bold rounded-full overflow-hidden shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all transform hover:-translate-y-1">
                  <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12 origin-left" />
                  <span className="relative flex items-center gap-2">
                    <Play size={20} fill="currentColor" /> Listen Live
                  </span>
                </Link>
                
                <Link to="/schedule" className="px-8 py-4 bg-surface border border-border text-primary font-bold rounded-full hover:bg-card transition-colors flex items-center gap-2">
                  View Schedule <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Right: Now Playing Card (Glassmorphism) */}
            <div className="hidden md:block relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-3xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-card/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                   <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">LIVE NOW</div>
                   <Radio className="text-white/50" />
                </div>
                
                <div className="flex items-center gap-6">
                   <img src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=300&auto=format&fit=crop" 
                        alt="Album Art" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
                   <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Morning Coffee</h3>
                      <p className="text-gray-300">RJ Sarah & The Team</p>
                      <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-2/3"></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ================= WHAT'S HAPPENING (Events) ================= */}
        <section className="py-20 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-sm font-bold text-accent uppercase tracking-widest mb-2">Don't Miss Out</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-primary">Upcoming Events</h3>
              </div>
              <Link to="/events" className="hidden md:flex items-center gap-2 text-secondary hover:text-accent font-medium transition-colors">
                All Events <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {/* Event Cards */}
               {UPCOMING_EVENTS.map(event => (
                 <div key={event.id} className="group bg-card border border-border p-6 rounded-3xl hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Calendar size={80} className="text-accent transform rotate-12" />
                    </div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                       <div className="bg-surface border border-border p-3 rounded-2xl text-center min-w-[70px]">
                          <span className="block text-xs font-bold text-accent uppercase">{event.date.split(' ')[0]}</span>
                          <span className="block text-2xl font-black text-primary">{event.date.split(' ')[1]}</span>
                       </div>
                    </div>
                    <h4 className="text-xl font-bold text-primary mb-2 relative z-10">{event.title}</h4>
                    <p className="text-secondary text-sm flex items-center gap-2 relative z-10">
                      <ClockIcon /> {event.time}
                    </p>
                 </div>
               ))}

               {/* "Listen Live" Callout Card */}
               <div className="bg-gradient-to-br from-accent to-orange-600 rounded-3xl p-6 flex flex-col justify-center items-start text-white shadow-lg relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 bg-white/10 w-40 h-40 rounded-full blur-2xl"></div>
                  <h4 className="text-2xl font-bold mb-2 relative z-10">Broadcasting Live?</h4>
                  <p className="text-white/80 mb-6 relative z-10">Click here to jump straight into the stream.</p>
                  <Link to="/live" className="bg-white text-accent px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-md relative z-10 flex items-center gap-2">
                    <Play size={18} fill="currentColor" /> Tune In
                  </Link>
               </div>
            </div>
          </div>
        </section>


        {/* ================= COLLEGE SHOWCASE ================= */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            
            <div className="relative">
               {/* Creative Image Composition */}
               <div className="absolute -top-4 -left-4 w-full h-full border-2 border-accent rounded-[2rem]"></div>
               <img 
                 src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop" 
                 alt="Students working" 
                 className="rounded-[2rem] shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-500"
               />
               <div className="absolute -bottom-6 -right-6 bg-card p-4 rounded-2xl shadow-xl border border-border z-20 flex items-center gap-4">
                  <div className="bg-accent/20 p-3 rounded-full text-accent">
                    <Mic2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-bold uppercase">Community</p>
                    <p className="text-lg font-bold text-primary">50+ Student RJs</p>
                  </div>
               </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-primary mb-6">Voice of the <span className="text-accent">Campus</span></h2>
              <p className="text-secondary text-lg leading-relaxed mb-8">
                BlazeUp isn't just a radio station; it's a creative hub. From engineering students mixing beats to journalism majors breaking news, we are 100% student-run.
              </p>
              
              <div className="space-y-4">
                 <FeatureItem title="Podcast Studio" desc="State of the art recording equipment available for all." />
                 <FeatureItem title="Live Jam Sessions" desc="Weekly spotlight on local college bands." />
                 <FeatureItem title="Tech & Gaming" desc="Dedicated hours for esports and tech reviews." />
              </div>
            </div>

          </div>
        </section>

      </main>

    </div>
  );
}

// Simple Helper Component for the Feature List
const FeatureItem = ({ title, desc }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface transition-colors">
     <div className="mt-1 w-2 h-2 rounded-full bg-accent"></div>
     <div>
       <h4 className="font-bold text-primary text-lg">{title}</h4>
       <p className="text-secondary text-sm">{desc}</p>
     </div>
  </div>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)