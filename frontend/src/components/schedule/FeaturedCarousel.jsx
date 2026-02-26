import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FeaturedHero from './FeaturedHero';

const FeaturedCarousel = ({ items, onShowClick }) => { // 1. Accept Prop
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, [items.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    };

    useEffect(() => {
        const timer = setInterval(() => nextSlide(), 6000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="relative group">
            <div className="transition-opacity duration-500 ease-in-out">
                <FeaturedHero
                    key={items[currentIndex].id}
                    event={items[currentIndex]}
                    onClick={onShowClick} // 2. Pass it down
                />
            </div>

            {/* Nav Arrows */}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-[var(--accent-color)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"><ChevronLeft size={24} /></button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-[var(--accent-color)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"><ChevronRight size={24} /></button>

            {/* Nav Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {items.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all duration-300 shadow-lg ${idx === currentIndex ? 'bg-[var(--accent-color)] w-8' : 'bg-white/50 hover:bg-white w-2'}`} />
                ))}
            </div>
        </div>
    );
};

export default FeaturedCarousel;