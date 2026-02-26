import React from 'react';
import { Mic2, Radio, Cpu, Activity } from 'lucide-react';

const FeaturesSection = () => {
    return (
        <section className="py-24 bg-background transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                <div className="relative order-2 md:order-1">
                    <div className="absolute top-8 left-8 w-full h-full border-2 border-accent/20 rounded-[2rem] -z-10"></div>
                    <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&auto=format&fit=crop" alt="Students" className="rounded-[2rem] shadow-2xl z-10 w-full grayscale-[20%] hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute -bottom-8 -right-8 bg-card p-6 rounded-2xl shadow-xl border border-border/50 dark:border-white/5 z-20 flex items-center gap-5 animate-float transition-colors duration-300">
                        <div className="bg-gradient-to-br from-accent to-orange-500 p-4 rounded-full text-white shadow-lg"><Mic2 size={24} /></div>
                        <div><p className="text-xs text-secondary font-bold uppercase tracking-wider">Community</p><p className="text-2xl font-black text-primary">100% Student Run</p></div>
                    </div>
                </div>
                <div className="order-1 md:order-2">
                    <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">Not Just Radio.<br /><span className="text-accent">It's a Movement.</span></h2>
                    <p className="text-secondary text-lg leading-relaxed mb-10">ByteCast FM is the official student-run radio station of <strong>SRM IST Trichy</strong>.</p>
                    <div className="space-y-6">
                        <FeatureItem icon={<Radio size={20} />} title="24/7 Music & Podcasts" desc="From Lo-Fi study beats to high-energy exam motivators." />
                        <FeatureItem icon={<Cpu size={20} />} title="Tech & Innovation" desc="Weekly spotlights on student projects and hackathon winners." />
                        <FeatureItem icon={<Activity size={20} />} title="Campus Updates" desc="Real-time announcements for exams, fests, and holidays." />
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeatureItem = ({ icon, title, desc }) => (
    <div className="flex items-start gap-5 p-4 rounded-2xl hover:bg-surface border border-transparent hover:border-border/50 dark:hover:border-white/5 transition-all duration-300 group">
        <div className="mt-1 p-3 rounded-xl bg-surface group-hover:bg-accent group-hover:text-white text-accent transition-colors shadow-sm duration-300">{icon}</div>
        <div><h4 className="font-bold text-primary text-lg mb-1">{title}</h4><p className="text-secondary text-sm leading-relaxed">{desc}</p></div>
    </div>
);

export default FeaturesSection;
