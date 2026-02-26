import React from 'react';
import { X, Share2, Calendar, Clock, Mic, User, Copy, Check, Instagram, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatTime } from '../../utils/scheduleHelpers';
import { toast } from 'sonner';

const ShowDetailsModal = ({ event, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    if (!event) return null;

    const handleShare = (e) => {
        e.stopPropagation();
        // Adds showId params to current URL
        const url = `${window.location.origin}${window.location.pathname}?showId=${event.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border-color)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* --- SCROLLABLE CONTENT AREA --- */}
                <div className="overflow-y-auto custom-scrollbar">

                    {/* Header Image */}
                    <div className="relative h-48 md:h-64 w-full shrink-0">
                        <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-[var(--danger-color)] transition-all hover:scale-110 active:scale-95 z-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 md:p-8 -mt-12 relative z-10">

                        {/* Top Actions */}
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[var(--accent-color)] text-white shadow-lg">
                                {event.isLiveFormat ? 'Studio Live' : 'Recorded'}
                            </span>

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] text-xs font-medium shadow-sm"
                            >
                                {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
                                {copied ? 'Copied' : 'Share'}
                            </button>
                        </div>

                        {/* Show Details */}
                        <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-primary)] mb-3 leading-tight">
                            {event.title}
                        </h2>
                        <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed mb-8">
                            {event.description || "Tune in for an amazing session of music and talk."}
                        </p>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            <InfoBox icon={Calendar} label="Day" value={event.day} />
                            <InfoBox icon={Clock} label="Time" value={`${formatTime(event.startTime)} - ${formatTime(event.endTime)}`} />
                            {event.guest && <InfoBox icon={User} label="Guest" value={event.guest} fullWidthMobile />}
                        </div>

                        {/* --- RJ PROFILE SECTION --- */}
                        <div className="bg-[var(--bg-secondary)]/50 rounded-2xl p-5 border border-[var(--border-color)]">
                            <div className="flex items-start gap-4">
                                {/* RJ Image */}
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full shrink-0 border-2 border-[var(--accent-color)] p-0.5 shadow-lg bg-[var(--bg-card)] overflow-hidden">
                                    {event.rjImage ? (
                                        <img src={event.rjImage} alt={event.rjName} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--bg-secondary)] flex items-center justify-center rounded-full">
                                            <Mic size={24} className="text-[var(--text-secondary)] opacity-50" />
                                        </div>
                                    )}
                                </div>

                                {/* RJ Info */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-color)] mb-0.5">Hosted By</p>
                                            <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] truncate">{event.rjName}</h3>
                                        </div>

                                        {/* Social Link */}
                                        {event.rjInstagram && (
                                            <a
                                                href={event.rjInstagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-full bg-[var(--bg-card)] hover:text-pink-500 hover:bg-pink-500/10 transition-colors border border-[var(--border-color)]"
                                                title="Visit Instagram"
                                            >
                                                <Instagram size={18} />
                                            </a>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    {event.rjBio && (
                                        <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
                                            {event.rjBio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Helper Component for consistency
const InfoBox = ({ icon: Icon, label, value, fullWidthMobile }) => (
    <div className={`p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] ${fullWidthMobile ? 'col-span-2 md:col-span-1' : ''}`}>
        <div className="flex items-center gap-2 text-[var(--accent-color)] mb-1">
            <Icon size={14} /> <span className="text-xs font-bold uppercase">{label}</span>
        </div>
        <p className="text-[var(--text-primary)] font-medium text-sm md:text-base truncate">{value}</p>
    </div>
);

export default ShowDetailsModal;
