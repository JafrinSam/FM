import React from 'react';

export const FeaturedSkeleton = () => (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-white/5 border border-white/5 h-[500px] animate-pulse">
        <div className="absolute bottom-0 left-0 p-12 w-full space-y-4">
            <div className="h-6 w-32 bg-white/10 rounded-full"></div>
            <div className="h-16 w-3/4 bg-white/10 rounded"></div>
            <div className="h-4 w-1/2 bg-white/10 rounded"></div>
            <div className="flex gap-4 pt-4"><div className="h-12 w-40 bg-white/10 rounded-full"></div></div>
        </div>
    </div>
);

export const RowSkeleton = () => (
    <div className="h-36 bg-white/5 rounded-2xl border border-white/5 flex items-center p-6 animate-pulse">
         <div className="h-20 w-20 bg-white/10 rounded-xl mr-6"></div>
         <div className="flex-1 space-y-3">
             <div className="h-4 w-24 bg-white/10 rounded"></div>
             <div className="h-8 w-64 bg-white/10 rounded"></div>
             <div className="h-4 w-40 bg-white/10 rounded"></div>
         </div>
    </div>
);