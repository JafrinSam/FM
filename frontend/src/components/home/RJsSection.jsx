import React from 'react';

const RJS = [
    { id: 1, name: "RJ Sarah", show: "Morning Coffee", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
    { id: 2, name: "RJ Arjun", show: "Tech Talk", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
    { id: 3, name: "RJ Priya", show: "Late Night Lo-Fi", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" },
    { id: 4, name: "RJ Mike", show: "Campus Sports", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" },
];

const RJsSection = () => {
    return (
        <section className="py-24 bg-surface border-t border-border/50 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16"><span className="text-accent font-bold tracking-[0.2em] uppercase text-sm">The Voices</span><h2 className="text-4xl font-bold text-primary mt-2">Meet Your RJs</h2></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {RJS.map((rj) => (
                        <div key={rj.id} className="group text-center">
                            <div className="relative w-40 h-40 mx-auto rounded-full p-1 border-2 border-dashed border-accent/30 group-hover:border-accent transition-colors duration-500 mb-6">
                                <div className="w-full h-full rounded-full overflow-hidden relative"><img src={rj.image} alt={rj.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                            </div>
                            <h3 className="text-xl font-bold text-primary">{rj.name}</h3><p className="text-sm text-secondary font-medium mt-1">{rj.show}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RJsSection;
