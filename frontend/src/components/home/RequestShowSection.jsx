import React from 'react';
import { Send } from 'lucide-react';
import LottieAnimation from '../utils/LottieAnimation';
import musicNoteAnimation from '../../assets/animations/music-loading.json';

const RequestShowSection = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background to-surface opacity-50 z-0" />
            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 mx-auto mb-2"><LottieAnimation animationData={musicNoteAnimation} width="100%" height="100%" /></div>
                        <h2 className="text-3xl font-bold text-primary">Request a Show</h2>
                    </div>
                    <form className="space-y-4 max-w-md mx-auto">
                        <div className="flex gap-2"><input type="text" placeholder="Show Name" className="w-full px-6 py-4 bg-background/50 border border-border rounded-full" /><button className="bg-accent text-white px-6 rounded-full"><Send size={18} /></button></div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default RequestShowSection;
