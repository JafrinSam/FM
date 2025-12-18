import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { scheduleApi } from '../services/scheduleApi';
import { assetApi } from '../services/assetApi'; // 💡 Import Asset API
import toast, { Toaster } from 'react-hot-toast';
import { 
  CalendarClock, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  X, 
  Filter, 
  Music,
  Clock
} from 'lucide-react';

// --- Helper: Schedule Row ---
const ScheduleRow = ({ schedule, onDelete, onEdit }) => {
  const time = `${String(schedule.localHour).padStart(2, '0')}:${String(schedule.localMinute).padStart(2, '0')}`;
  
  return (
    <tr className="border-b border-border hover:bg-surface transition-colors duration-150 group">
      <td className="px-6 py-4 font-mono font-bold text-accent flex items-center gap-2">
        <Clock size={16} />
        {time}
      </td>
      <td className="px-6 py-4 text-primary font-medium">
        {schedule.filename}
      </td>
      <td className="px-6 py-4 text-xs text-secondary">
        {new Date(schedule.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => onEdit(schedule)}
            className="p-2 text-secondary hover:text-accent hover:bg-background rounded-full transition-colors"
            title="Edit Schedule"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(schedule._id)}
            className="p-2 text-secondary hover:text-red-500 hover:bg-background rounded-full transition-colors"
            title="Delete Schedule"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Main Component ---
export default function SchedulerView() {
  // 1. Data State
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]); // 🎵 Store music assets here
  const [loading, setLoading] = useState(false);

  // 2. Form State
  const [formState, setFormState] = useState({ 
    _id: null, 
    hour: '12', 
    minute: '00', 
    filename: '' 
  });
  
  // 3. Filter State for the File Selector
  const [filterType, setFilterType] = useState('All'); 

  const isEditing = !!formState._id;

  // --- API Actions ---

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both Schedules and Assets in parallel
      const [schedulesData, assetsData] = await Promise.all([
        scheduleApi.getAll(),
        assetApi.getAll()
      ]);
      setSchedules(schedulesData);
      setAssets(assetsData);
    } catch (err) {
      toast.error(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Helper: Get Filtered Assets ---
  const filteredAssets = useMemo(() => {
    if (filterType === 'All') return assets;
    return assets.filter(asset => asset.type === filterType);
  }, [assets, filterType]);

  // --- Handlers ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hour = parseInt(formState.hour);
    const minute = parseInt(formState.minute);
    const filename = formState.filename.trim();

    if (isNaN(hour) || isNaN(minute) || !filename) {
      toast.error('Please check time and select a valid file.');
      return;
    }

    const payload = { hour, minute, filename };
    
    const action = isEditing 
      ? scheduleApi.update(formState._id, payload)
      : scheduleApi.create(payload);

    toast.promise(action, {
      loading: isEditing ? 'Updating schedule...' : 'Adding to schedule...',
      success: () => {
        handleCancelEdit();
        fetchData(); // Refresh list to see changes
        return isEditing ? 'Schedule updated!' : 'Track scheduled!';
      },
      error: (err) => `Error: ${err.message}`
    });
  };
  
  const handleEdit = (schedule) => {
    setFormState({
        _id: schedule._id,
        hour: String(schedule.hour).padStart(2, '0'),
        minute: String(schedule.minute).padStart(2, '0'),
        filename: schedule.filename
    });
    // Try to auto-set the filter based on the file type if we can find it
    const foundAsset = assets.find(a => a.filename === schedule.filename);
    if (foundAsset) setFilterType(foundAsset.type || 'All');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormState({ _id: null, hour: '12', minute: '00', filename: '' });
    setFilterType('All');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheduled event?")) return;
    
    toast.promise(scheduleApi.delete(id), {
      loading: 'Deleting...',
      success: () => {
        fetchData();
        return 'Schedule removed.';
      },
      error: (err) => `Failed: ${err.message}`
    });
  };

  return (
    <div className="min-h-full p-8 bg-background text-primary transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
      
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold text-accent flex items-center gap-3">
          <CalendarClock size={32} />
          Scheduler Manager
        </h1>
        {loading && <div className="text-accent animate-pulse font-medium text-sm">Syncing...</div>}
      </div>

      {/* --- 1. Add/Edit Schedule Form --- */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-lg mb-10 transition-colors duration-300">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-primary">
          {isEditing ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
          {isEditing ? 'Edit Scheduled Event' : 'Add New Event'}
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          
          {/* Hour Input */}
          <div className="col-span-6 md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Hour (0-23)</label>
            <input 
              type="number" min="0" max="23" required
              value={formState.hour} 
              onChange={(e) => setFormState(p => ({ ...p, hour: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none"
            />
          </div>
          
          {/* Minute Input */}
          <div className="col-span-6 md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Minute (0-59)</label>
            <input 
              type="number" min="0" max="59" required
              value={formState.minute} 
              onChange={(e) => setFormState(p => ({ ...p, minute: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none"
            />
          </div>

          {/* Type Filter (Helper for Selection) */}
          <div className="col-span-12 md:col-span-3">
            <label className="block text-sm font-medium text-secondary mb-1 flex items-center gap-1">
              <Filter size={12} /> Filter Library
            </label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Music">Music</option>
              <option value="Jingle">Jingles</option>
              <option value="StationID">Station IDs</option>
              <option value="Ad">Advertisements</option>
              <option value="Prerecorded Show">Prerecorded Show</option>
            </select>
          </div>
          
          {/* File Selector */}
          <div className="col-span-12 md:col-span-5">
            <label className="block text-sm font-medium text-secondary mb-1 flex items-center gap-1">
               <Music size={12} /> Select Track ({filteredAssets.length})
            </label>
            <select 
              required
              value={formState.filename} 
              onChange={(e) => setFormState(p => ({ ...p, filename: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-primary focus:border-accent outline-none cursor-pointer"
            >
              <option value="">-- Select a file --</option>
              {filteredAssets.map(asset => (
                <option key={asset._id} value={asset.filename}>
                  {asset.title || asset.filename} {asset.artist !== 'Unknown' ? `by ${asset.artist}` : ''}
                </option>
              ))}
            </select>
            {assets.length === 0 && (
                <p className="text-xs text-red-400 mt-1">No files found. Go to Music Library to upload.</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="col-span-12 flex space-x-3 mt-2">
            <button 
              type="submit" disabled={loading}
              className="flex items-center gap-2 font-bold py-2.5 px-6 rounded-lg shadow-md transition-all duration-200 transform active:scale-95 bg-accent hover:bg-accent-hover text-white"
            >
              <Save size={18} />
              {isEditing ? 'Save Changes' : 'Schedule Track'}
            </button>
            {isEditing && (
              <button 
                type="button" onClick={handleCancelEdit} disabled={loading}
                className="flex items-center gap-2 bg-surface border border-border text-secondary hover:text-primary font-bold py-2.5 px-6 rounded-lg shadow-sm transition-colors"
              >
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- 2. Current Schedule List Table --- */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-lg transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Scheduled Events ({schedules.length})</h2>
        </div>
        
        <div className="overflow-x-auto relative rounded-lg border border-border">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-surface text-secondary border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Time (HH:MM)</th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Track Name</th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Date Added</th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-secondary italic">
                    No events scheduled. Add a track above to start automation.
                  </td>
                </tr>
              ) : (
                schedules.map(schedule => (
                  <ScheduleRow 
                    key={schedule._id} 
                    schedule={schedule} 
                    onDelete={handleDelete} 
                    onEdit={handleEdit} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}