import React from 'react';

import RadioHero from '../components/client/RadioHero';
import ScheduleWidget from '../components/client/ScheduleWidget';

export default function Live() {
  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">

      <main>
        {/* 2. Main Player Section */}
        <RadioHero />
        
        {/* 3. Schedule Section (Overlapping for style) */}
        <div className="relative z-20 -mt-10">
           <ScheduleWidget />
        </div>
        
        {/* 4. Call to Action (Club Recruitment) */}
        <section className="py-20 text-center bg-surface border-t border-border">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
              Want to host your own show?
            </h2>
            <p className="text-secondary mb-8 text-lg">
              Join the BlazeUp Radio Club! We are recruiting RJs, sound engineers, and content writers for the upcoming semester.
            </p>
            <button className="bg-primary text-background px-8 py-3 rounded-full font-bold hover:bg-accent hover:text-white transition-all transform hover:-translate-y-1 shadow-lg">
              Apply Now
            </button>
          </div>
        </section>
      </main>


    </div>
  );
}