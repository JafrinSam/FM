import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, Share2, Check, ExternalLink, User } from 'lucide-react';
import { toast } from 'sonner';

// Helper to format full date "Friday, October 24, 2025"
const formatFullDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
};

const EventDetailsModal = ({ event, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!event) return null;

    const handleShare = () => {
        // Generates link like: domain.com/?eventId=123
        const url = `${window.location.origin}${window.location.pathname}?eventId=${event.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Event link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-3xl bg-[var(--bg-card)] rounded-[2rem] shadow-2xl overflow-hidden border border-[var(--border-color)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* --- 1. Header Image --- */}
                <div className="relative h-56 md:h-72 w-full shrink-0">
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-[var(--danger-color)] transition-colors hover:scale-110 active:scale-95 z-50"
                    >
                        <X size={20} />
                    </button>

                    {/* Category Badge */}
                    <div className="absolute bottom-4 left-6 md:left-8">
                        <span className="px-3 py-1.5 rounded-full bg-[var(--accent-color)] text-white text-xs font-bold uppercase tracking-widest shadow-lg">
                            {event.category}
                        </span>
                    </div>
                </div>

                {/* --- 2. Content Scroll Area --- */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-10">

                    {/* Title & Share */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] leading-tight flex-1">
                            {event.title}
                        </h2>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors text-[var(--text-secondary)] text-sm font-medium shrink-0"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                            {copied ? 'Copied' : 'Share'}
                        </button>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <InfoCard icon={Calendar} label="Date" value={formatFullDate(event.date)} />
                        <InfoCard icon={Clock} label="Time" value={event.time} />
                        <InfoCard icon={MapPin} label="Location" value={event.location} />
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">About Event</h3>
                        <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                            {event.description}
                        </p>
                    </div>

                    {/* Organizers Section */}
                    {event.organizers && event.organizers.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Organizers</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {event.organizers.map((org, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                                        <div className="h-10 w-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center border border-[var(--border-color)]">
                                            <User size={20} className="text-[var(--text-secondary)]" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-[var(--text-primary)] truncate">{org.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">{org.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Registration Footer */}
                    {event.registrationLink && (
                        <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${event.registrationStatus === 'Open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                    Registration: <span className="text-[var(--text-primary)]">{event.registrationStatus}</span>
                                </span>
                            </div>

                            <a
                                href={event.registrationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-lg transition-transform hover:-translate-y-1 active:scale-95
                                    ${event.registrationStatus === 'Open' ? 'bg-[var(--accent-color)] hover:brightness-110' : 'bg-gray-500 cursor-not-allowed'}
                                `}
                                onClick={(e) => event.registrationStatus !== 'Open' && e.preventDefault()}
                            >
                                {event.registrationStatus === 'Open' ? 'Register Now' : 'Closed'} <ExternalLink size={18} />
                            </a>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};

// Simple reusable card for grid info
const InfoCard = ({ icon: Icon, label, value }) => (
    <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-[var(--accent-color)] mb-1">
            <Icon size={16} />
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
        </div>
        <p className="font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
);

export default EventDetailsModal;
