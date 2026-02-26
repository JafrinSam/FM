import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, ChevronDown } from 'lucide-react';
import LottieAnimation from '../utils/LottieAnimation';
import studioAnimation from '../../assets/animations/radio-studio.json';

const HeroSection = ({ playMusic }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2070&auto=format&fit=crop"
                    alt="SRM Studio Background"
                    className="w-full h-full object-cover opacity-60 dark:opacity-40 scale-105 animate-slow-zoom transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent dark:from-background dark:via-background/95 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/50 to-transparent transition-colors duration-300" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid md:grid-cols-12 gap-12 items-center pt-20">

                {/* Left Content */}
                <div className="md:col-span-7 space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold tracking-widest uppercase text-[10px] backdrop-blur-sm dark:backdrop-blur-md transition-all duration-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </span>
                        Live from Irungalur Campus
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight">
                        The Voice of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-500">
                            SRM Trichy
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-secondary max-w-xl leading-relaxed">
                        Welcome to <span className="text-primary font-bold">ByteCast FM</span>.
                        Bridging technology, culture, and campus life.
                        Streaming 24/7 for the students, by the students.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={playMusic}
                            className="group relative px-8 py-4 bg-accent text-white font-bold rounded-full overflow-hidden shadow-xl shadow-accent/20 hover:shadow-accent/40 transition-all transform hover:-translate-y-1 cursor-pointer"
                        >
                            <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12 origin-left" />
                            <span className="relative flex items-center gap-3">
                                <Play size={20} fill="currentColor" /> Start Listening
                            </span>
                        </button>

                        <Link to="/schedule" className="px-8 py-4 bg-surface/70 dark:bg-surface/50 backdrop-blur-sm dark:backdrop-blur-md border border-border/30 dark:border-white/10 text-primary font-bold rounded-full hover:bg-surface transition-all duration-300 flex items-center gap-2">
                            Show Schedule <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

                {/* Right Content: LOTTIE ANIMATION */}
                <div className="hidden md:block md:col-span-5 relative perspective-1000">
                    <div className="absolute top-10 -right-10 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-pulse"></div>

                    <div className="relative transform rotate-y-12 transition-transform hover:rotate-0 duration-500">
                        <div className="bg-card/60 dark:bg-card/30 backdrop-blur-lg dark:backdrop-blur-2xl border border-border/30 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl transition-all duration-300 min-h-[400px] flex flex-col justify-center items-center">

                            <div className="w-full h-64 mb-4">
                                <LottieAnimation
                                    animationData={studioAnimation}
                                    width="100%"
                                    height="100%"
                                />
                            </div>

                            <div className="text-center">
                                <span className="text-xs font-bold text-accent tracking-widest uppercase mb-1 block">Now Live</span>
                                <h3 className="text-2xl font-bold text-primary">ByteCast Studio</h3>
                                <p className="text-secondary text-sm mt-2">Connecting Campus Minds</p>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-20 opacity-70">
                <div className="flex flex-col items-center gap-2 text-secondary">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Explore</span>
                    <ChevronDown size={24} />
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
