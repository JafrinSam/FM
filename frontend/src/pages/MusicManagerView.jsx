import React, { useState, useEffect, useCallback } from 'react';
import { assetApi } from '../services/assetApi';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Music, Edit2, Trash2, UploadCloud, RefreshCw, 
  FileAudio, Save, X, User, Tag 
} from 'lucide-react';

// --- Helper: Asset Row ---
const AssetRow = ({ asset, onDelete, onEdit }) => {
  const sizeMB = (asset.size / (1024 * 1024)).toFixed(2);
  
  // Color coding for types
  const typeColors = {
    Music: "bg-blue-900/30 text-blue-400 border-blue-500/20",
    Jingle: "bg-purple-900/30 text-purple-400 border-purple-500/20",
    Ad: "bg-yellow-900/30 text-yellow-400 border-yellow-500/20",
    StationID: "bg-green-900/30 text-green-400 border-green-500/20",
    default: "bg-gray-800 text-gray-400 border-gray-700"
  };
  const badgeClass = typeColors[asset.type] || typeColors.default;

  return (
    <tr className="border-b border-border hover:bg-surface transition-colors duration-150 group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface rounded-lg text-accent">
            <FileAudio size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-primary text-base">{asset.title || asset.originalName}</span>
            <span className="text-xs text-secondary">{asset.filename}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <span className={`px-2 py-1 rounded text-s font-bold border ${badgeClass}`}>
          {asset.type || "Music"}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-secondary">
        <div className="flex items-center gap-2">
          {asset.artist && asset.artist !== "Unknown" ? (
            <>
              <User size={14} className="opacity-50" />
              {asset.artist}
            </>
          ) : (
            <span className="italic opacity-50">Unknown</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-secondary font-mono">
        {sizeMB} MB
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => onEdit(asset)}
            className="p-2 text-secondary hover:text-accent hover:bg-background rounded-full transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(asset._id)}
            className="p-2 text-secondary hover:text-red-500 hover:bg-background rounded-full transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function MusicManagerView() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload State (Added 'type')
  const [uploadFiles, setUploadFiles] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ artist: '', title: '', type: 'Music' });

  // Edit State (Added 'type')
  const [editingAsset, setEditingAsset] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', artist: '', type: 'Music' });

  const fetchAssets = useCallback(async () => {
    if (assets.length === 0) setLoading(true);
    try {
      const data = await assetApi.getAll();
      setAssets(data);
    } catch (err) {
      toast.error(`Failed to load library: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [assets.length]);

  useEffect(() => { fetchAssets(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;

    const formData = new FormData();
    Array.from(uploadFiles).forEach((file) => formData.append('musicFiles', file));
    
    // Append Metadata
    if (uploadMeta.artist) formData.append('artist', uploadMeta.artist);
    if (uploadMeta.title) formData.append('title', uploadMeta.title);
    formData.append('type', uploadMeta.type); // <--- Send Type

    const uploadPromise = fetch('http://localhost:5000/api/file/upload', {
        method: 'POST',
        body: formData
    }).then(async (res) => {
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Upload failed');
        }
        return res.json();
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading...',
      success: (res) => {
        setUploadFiles(null);
        setUploadMeta({ artist: '', title: '', type: 'Music' }); // Reset
        document.getElementById('fileInput').value = ""; 
        fetchAssets();
        return `Uploaded successfully!`;
      },
      error: (err) => `Upload failed: ${err.message}`
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete permanently?")) return;
    toast.promise(assetApi.delete(id), {
      loading: 'Deleting...',
      success: () => { fetchAssets(); return 'Deleted'; },
      error: (err) => `Error: ${err.message}`
    });
  };

  const startEdit = (asset) => {
    setEditingAsset(asset);
    setEditForm({
      title: asset.title || asset.originalName,
      artist: asset.artist || '',
      type: asset.type || 'Music' // <--- Load Type
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    toast.promise(assetApi.update(editingAsset._id, editForm), {
      loading: 'Updating...',
      success: () => {
        setEditingAsset(null);
        fetchAssets();
        return 'Updated successfully';
      },
      error: (err) => `Error: ${err.message}`
    });
  };

  return (
    <div className="min-h-full p-8 bg-background text-primary transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />

      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold text-accent flex items-center gap-3">
          <Music size={32} /> Music Library
        </h1>
        {loading && <div className="text-accent animate-pulse font-medium text-sm">Syncing...</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* --- UPLOAD CARD --- */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-lg h-fit">
          <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
            <UploadCloud size={20} /> Upload New Tracks
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-accent transition-colors text-center">
              <input 
                id="fileInput"
                type="file" multiple accept=".mp3,audio/mpeg"
                onChange={(e) => setUploadFiles(e.target.files)}
                className="block w-full text-sm text-secondary file:bg-accent file:text-white file:border-0 file:rounded-full file:px-4 file:py-2 file:mr-4 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-secondary mb-1">Asset Type</label>
                    <select 
                        value={uploadMeta.type}
                        onChange={e => setUploadMeta(p => ({...p, type: e.target.value}))}
                        className="w-full bg-surface border border-border rounded p-2 text-sm text-primary focus:border-accent outline-none"
                    >
                        <option value="Music">Music</option>
                        <option value="Jingle">Jingle</option>
                        <option value="StationID">Station ID</option>
                        <option value="Ad">Advertisement</option>
                        <option value="Show">Prerecorded Show</option>
                    </select>
                </div>
                <div>
                    <input type="text" placeholder="Artist (Optional)" value={uploadMeta.artist}
                        onChange={e => setUploadMeta(p => ({...p, artist: e.target.value}))}
                        className="w-full bg-surface border border-border rounded p-2 text-sm text-primary focus:border-accent outline-none"
                    />
                </div>
                <div>
                    <input type="text" placeholder="Title (Optional)" value={uploadMeta.title}
                        onChange={e => setUploadMeta(p => ({...p, title: e.target.value}))}
                        className="w-full bg-surface border border-border rounded p-2 text-sm text-primary focus:border-accent outline-none"
                    />
                </div>
            </div>

            <button type="submit" disabled={!uploadFiles || uploadFiles.length === 0}
              className="w-full flex justify-center items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              <UploadCloud size={18} /> Upload Tracks
            </button>
          </form>
        </div>

        {/* --- EDIT CARD --- */}
        {editingAsset && (
          <div className="bg-card border border-accent/50 p-6 rounded-xl shadow-lg h-fit lg:col-span-2 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
              <Edit2 size={20} className="text-accent" /> Editing: {editingAsset.filename}
            </h2>
            <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Title</label>
                <input type="text" value={editForm.title}
                  onChange={(e) => setEditForm(p => ({...p, title: e.target.value}))}
                  className="w-full bg-surface border border-border rounded p-2 text-primary focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Artist</label>
                <input type="text" value={editForm.artist}
                  onChange={(e) => setEditForm(p => ({...p, artist: e.target.value}))}
                  className="w-full bg-surface border border-border rounded p-2 text-primary focus:border-accent outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary mb-1">Asset Type</label>
                <select value={editForm.type}
                    onChange={e => setEditForm(p => ({...p, type: e.target.value}))}
                    className="w-full bg-surface border border-border rounded p-2 text-primary focus:border-accent outline-none"
                >
                    <option value="Music">Music</option>
                    <option value="Jingle">Jingle</option>
                    <option value="StationID">Station ID</option>
                    <option value="Ad">Advertisement</option>
                    <option value="Show">Prerecorded Show</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
                <button type="button" onClick={() => setEditingAsset(null)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary hover:text-primary bg-surface rounded border border-border transition-colors"
                >
                  <X size={16} /> Cancel
                </button>
                <button type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded shadow transition-colors"
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- ASSET LIST --- */}
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            Library <span className="text-xs bg-surface text-secondary px-2 py-1 rounded-full">{assets.length} tracks</span>
          </h2>
          <button onClick={() => { fetchAssets(); toast.success('List refreshed'); }} 
            className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface text-secondary text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold">Track Info</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Artist</th>
                <th className="px-6 py-3 font-semibold">Size</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.map(asset => (
                <AssetRow key={asset._id} asset={asset} onDelete={handleDelete} onEdit={startEdit} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}