import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, MapPin, Edit2, Trash2, Eye, AlertCircle, RotateCw, 
  CheckCircle, Copy, ArrowUpDown, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../services/apiClient';
import EventFormModal from '../../components/admin/event/EventFormModal';
import EventViewModal from '../../components/admin/event/EventViewModal';

// --- HELPER: Category Colors ---
const getCategoryStyle = (category) => {
  const styles = {
    'Tech': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    'Cultural': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    'Academic': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    'Sports': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    'Workshop': 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20',
  };
  return styles[category] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const TableSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-[var(--border-color)] animate-pulse">
        <td className="p-4"><div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" /></td>
        <td className="p-4"><div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800" /></td>
        <td className="p-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" /></td>
        <td className="p-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded" /></td>
        <td className="p-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" /></td>
        <td className="p-4"><div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg ml-auto" /></td>
      </tr>
    ))}
  </>
);

export default function EventManagement() {
  // Data State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState('active'); 
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('asc'); 

  // Selection State (Bulk Actions)
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // --- FETCH DATA ---
  const fetchEvents = useCallback(async (isManual = false) => {
    setLoading(true);
    try {
      const params = { 
        page, 
        limit: 8, 
        sort: sortOrder 
      };
      
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (search) params.search = search;

      const res = await apiClient.get('/events', { params });
      
      setEvents(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      
      if (isManual) toast.success("Events refreshed");
    } catch (error) {
      console.error(error);
      toast.error('Failed to load events');
      setEvents([]); 
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, page, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEvents(), 500);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  // --- ACTIONS ---

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await apiClient.delete(`/events/${id}`);
      toast.success("Event deleted");
      setSelectedIds(prev => prev.filter(item => item !== id));
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  // 🚀 BULK DELETE
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected events?`)) return;
    try {
      await Promise.all(selectedIds.map(id => apiClient.delete(`/events/${id}`)));
      toast.success(`${selectedIds.length} events deleted`);
      setSelectedIds([]);
      fetchEvents();
    } catch (error) {
      toast.error("Bulk delete failed");
    }
  };

  // 🚀 CLONE EVENT
  const handleClone = (event) => {
    const clonedEvent = {
      ...event,
      _id: null, 
      title: `${event.title} (Copy)`,
      creationStatus: 'pending',
      thumbnail: 'default-event.jpg' 
    };
    setSelectedEvent(clonedEvent);
    setIsFormOpen(true);
  };

  // --- SELECTION LOGIC ---
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEvents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEvents.map(e => e._id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // --- RENDER HELPERS ---
  const filteredEvents = events.filter(event => {
    const isClosed = new Date() > new Date(event.date);
    if (viewMode === 'active') return !isClosed;
    if (viewMode === 'past') return isClosed;
    return true;
  });

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Event Manager</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Organize, schedule, and track college activities.
          </p>
        </div>
        
        <div className="flex gap-3">
            {selectedIds.length > 0 && (
                <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-all animate-in fade-in slide-in-from-right-5"
                >
                    <Trash2 size={18} /> Delete ({selectedIds.length})
                </button>
            )}

            <button 
                onClick={() => fetchEvents(true)}
                className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Refresh List"
            >
                <RotateCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
                onClick={() => { setSelectedEvent(null); setIsFormOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-color)] text-white rounded-xl font-medium hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-color)]/20"
            >
                <Plus size={18} /> Create Event
            </button>
        </div>
      </div>

      {/* VIEW TABS */}
      <div className="flex gap-6 border-b border-[var(--border-color)] mb-6">
          <button 
            onClick={() => setViewMode('active')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'active' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent opacity-60'}`}
          >
            Active
            <span className="bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-[10px] px-2 py-0.5 rounded-full">
                {events.filter(e => new Date() <= new Date(e.date)).length}
            </span>
          </button>
          <button 
            onClick={() => setViewMode('past')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'past' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent opacity-60'}`}
          >
            Past
             <span className="bg-gray-500/10 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
                {events.filter(e => new Date() > new Date(e.date)).length}
            </span>
          </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-4 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
          <input 
            type="text" 
            placeholder="Search events..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--accent-color)] text-sm"
          />
        </div>
        
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--accent-color)] text-sm"
        >
          <option value="All">All Categories</option>
          <option value="Tech">Tech</option>
          <option value="Cultural">Cultural</option>
          <option value="Academic">Academic</option>
          <option value="Sports">Sports</option>
          <option value="Workshop">Workshop</option>
        </select>

        <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm"
        >
            <ArrowUpDown size={16} />
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/5 dark:bg-white/5 text-xs uppercase font-semibold opacity-70">
              <tr>
                <th className="p-4 w-10">
                    <input 
                        type="checkbox" 
                        className="rounded border-[var(--border-color)] w-4 h-4 cursor-pointer"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredEvents.length}
                        onChange={toggleSelectAll}
                    />
                </th>
                <th className="p-4">Event Name</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <TableSkeleton /> 
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center opacity-50">
                    <div className="flex flex-col items-center gap-2">
                       <Search size={24} className="opacity-40" />
                       <p className="font-medium">No {viewMode} events found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const isPending = event.creationStatus === 'pending';
                  const isPast = new Date() > new Date(event.date);
                  const isSelected = selectedIds.includes(event._id);
                  
                  return (
                    <tr 
                        key={event._id} 
                        className={`transition-colors group border-l-4 
                        ${isSelected ? 'bg-[var(--accent-color)]/5 border-[var(--accent-color)]' : 'hover:bg-black/5 dark:hover:bg-white/5 border-transparent'}
                        ${isPast ? 'opacity-70 grayscale-[0.5]' : ''}`}
                    >
                      <td className="p-4">
                        <input 
                            type="checkbox" 
                            className="rounded border-[var(--border-color)] w-4 h-4 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(event._id)}
                        />
                      </td>

                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0
                            ${isPending ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'}`}>
                             {isPending ? <AlertCircle size={18}/> : event.title.charAt(0)}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="truncate max-w-[200px]">{event.title}</p>
                              {isPending && (
                                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                  DRAFT
                                </span>
                              )}
                            </div>
                            <p className="text-xs opacity-50 flex items-center gap-1">
                               <MapPin size={10} /> {event.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs opacity-50">{event.time}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getCategoryStyle(event.category)}`}>
                          {event.category}
                        </span>
                      </td>
                      <td className="p-4">
                        {isPast ? (
                             <StatusBadge status="Closed" />
                        ) : (
                             <StatusBadge status={isPending ? 'Pending' : (event.registrationStatus)} />
                        )}
                      </td>
                      {/* ✅ REMOVED HOVER OPACITY CLASSES HERE */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          <button onClick={() => handleClone(event)} className="p-2 text-gray-500 hover:bg-gray-500/10 rounded-lg transition-colors" title="Duplicate Event">
                            <Copy size={16} />
                          </button>

                          <button onClick={() => { setSelectedEvent(event); setIsViewOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="View">
                            <Eye size={16} />
                          </button>
                          
                          <button onClick={() => { setSelectedEvent(event); setIsFormOpen(true); }} className={`p-2 rounded-lg transition-colors ${isPending ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-orange-500 hover:bg-orange-500/10'}`} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          
                          <button onClick={() => handleDelete(event._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-[var(--border-color)] flex justify-between items-center bg-black/5 dark:bg-white/5">
            <span className="text-sm opacity-60">
                Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-white dark:hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-white dark:hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* MODALS */}
      {isFormOpen && (
        <EventFormModal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          eventToEdit={selectedEvent}
          onSuccess={() => fetchEvents()} 
        />
      )}

      {isViewOpen && selectedEvent && (
        <EventViewModal 
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          event={selectedEvent}
        />
      )}
    </div>
  );
}

// Updated Status Badge
const StatusBadge = ({ status }) => {
  const colors = {
    'Open': 'text-green-600 bg-green-500/10 border-green-500/20',
    'Closed': 'text-red-600 bg-red-500/10 border-red-500/20',
    'Coming Soon': 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    'Filling Fast': 'text-orange-600 bg-orange-500/10 border-orange-500/20',
    'Registration Closed': 'text-gray-600 bg-gray-500/10 border-gray-500/20',
    'Pending': 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20' 
  };
  const style = colors[status] || 'text-gray-500 bg-gray-500/10 border-gray-500/20';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${style}`}>
      {status}
    </span>
  );
};