import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Palette, Camera, Save, LogOut, Moon, Sun, 
  AlertTriangle, Loader2, UploadCloud, Eye, EyeOff, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/apiClient';

// --- TABS CONFIG ---
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState({ name: '', email: '', avatar: '' });
  const [loading, setLoading] = useState(true);

  // Load User Data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/users/me'); 
        setUser(res.data.data);
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your account preferences and workspace.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <nav className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                    ${isActive 
                      ? 'bg-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/20 scale-[1.02]' 
                      : 'hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-h-[600px]">
            <div className={`
                border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden
                bg-[var(--bg-card)] backdrop-blur-xl transition-colors duration-300
            `}>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)] z-10">
                  <Loader2 className="animate-spin text-[var(--accent-color)]" size={32} />
                </div>
              ) : (
                <>
                  {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} />}
                  {activeTab === 'security' && <SecuritySettings />}
                  {activeTab === 'appearance' && <AppearanceSettings />}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. PROFILE SETTINGS
// ==========================================
function ProfileSettings({ user, setUser }) {
  const [formData, setFormData] = useState({ name: user?.name || '' });
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error("Only image files are allowed");
    if (file.size > 5 * 1024 * 1024) return toast.error("File size must be under 5MB");

    setUploading(true);
    const data = new FormData();
    data.append('avatar', file);

    try {
      const res = await apiClient.put('/users/avatar', data);
      setUser(prev => ({ ...prev, avatar: res.data.data.avatar }));
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name cannot be empty");
    if (formData.name === user.name) return toast.info("No changes detected");

    setUpdating(true);
    try {
      const res = await apiClient.put('/users/profile', { name: formData.name });
      setUser(prev => ({ ...prev, name: res.data.data.name }));
      toast.success("Profile updated!");
    } catch (error) {
        toast.error("Failed to update profile");
    } finally {
        setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold mb-1">Profile Details</h3>
        <p className="text-sm text-[var(--text-secondary)]">Update your photo and personal details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Area */}
        <div 
            className={`relative group w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 transition-all cursor-pointer flex-shrink-0
            ${isDragging ? 'border-[var(--accent-color)] scale-105' : 'border-[var(--bg-secondary)] hover:border-[var(--accent-color)]'}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            {uploading ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <Loader2 className="animate-spin text-white" size={32} />
                </div>
            ) : (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity z-10">
                    <Camera size={24} />
                    <span className="text-xs font-medium mt-1">Change</span>
                </div>
            )}
            
            {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                    <User size={48} />
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0])} />
        </div>

        {/* Input Area */}
        <div className="flex-1 space-y-6 w-full">
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 ml-1">Full Name</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] outline-none transition-all font-medium"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 ml-1">Email Address</label>
                    <input 
                        type="email" 
                        value={user.email} 
                        disabled 
                        className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] opacity-60 cursor-not-allowed font-medium text-[var(--text-secondary)]"
                    />
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={updating || formData.name === user.name}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent-color)] text-white rounded-xl font-medium hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-color)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updating ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} 
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. SECURITY SETTINGS
// ==========================================
function SecuritySettings() {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error("New passwords do not match");
    if (passwords.new.length < 8) return toast.error("Password must be at least 8 chars");

    setLoading(true);
    try {
        await apiClient.post('/auth/change-password', {
            currentPassword: passwords.current,
            newPassword: passwords.new
        });
        toast.success("Password updated successfully!");
        setPasswords({ current: '', new: '', confirm: '' });
    } catch(e) {
        toast.error(e.response?.data?.message || "Failed to update password");
    } finally {
        setLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    if(!window.confirm("Are you sure? You will be logged out of all devices.")) return;
    try {
        await apiClient.post('/auth/revoke-sessions');
        toast.success("All other sessions revoked");
    } catch(e) {
        toast.error("Failed to revoke sessions");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold mb-1">Security</h3>
        <p className="text-sm text-[var(--text-secondary)]">Manage your password and active sessions.</p>
      </div>

      <form onSubmit={handleChangePass} className="space-y-4 max-w-lg p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)]">Change Password</h4>
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
        </div>
        
        <input 
          type={showPass ? "text" : "password"} 
          placeholder="Current Password"
          value={passwords.current}
          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
          className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] outline-none transition-all"
          required
        />
        <div className="grid grid-cols-2 gap-4">
            <input 
                type={showPass ? "text" : "password"} 
                placeholder="New Password"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] outline-none transition-all"
                required
            />
            <input 
                type={showPass ? "text" : "password"} 
                placeholder="Confirm New"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-color)] outline-none transition-all"
                required
            />
        </div>
        <div className="flex justify-end pt-2">
            <button 
                type="submit" 
                disabled={loading || !passwords.current || !passwords.new}
                className="px-5 py-2 bg-[var(--accent-color)] text-white rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
            >
                {loading ? "Updating..." : "Update Password"}
            </button>
        </div>
      </form>

      <div className="h-px bg-[var(--border-color)] w-full"></div>

      <div>
        <h4 className="font-bold text-sm uppercase tracking-wider text-[var(--text-secondary)] mb-4">Danger Zone</h4>
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:bg-red-500/10 transition-colors">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 shrink-0">
                <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
                <h5 className="font-bold text-red-700 dark:text-red-400">Revoke All Sessions</h5>
                <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1 max-w-md">
                    If you suspect unauthorized access, use this to immediately log out all devices.
                </p>
            </div>
            <button 
                onClick={handleRevokeSessions}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all whitespace-nowrap"
            >
                <LogOut size={16} /> Sign Out All Devices
            </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. APPEARANCE SETTINGS (Updated Toggle)
// ==========================================
function AppearanceSettings() {
  // We destructure ALL possible theme variables to be safe
  const { 
    toggleTheme, 
    resolvedTheme, // From new System-aware Context
    themeName,     // From older Context
    themeMode      // From Context state
  } = useTheme(); 

  // Robust Logic: Check resolvedTheme first, fallback to others
  const effectiveTheme = resolvedTheme || themeName || themeMode;
  const isDark = effectiveTheme === 'dark';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold mb-1">Appearance</h3>
        <p className="text-sm text-[var(--text-secondary)]">Customize the look and feel of your workspace.</p>
      </div>

      {/* Theme Toggle Switch */}
      <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-colors duration-300 ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-orange-500/10 text-orange-500'}`}>
                {isDark ? <Moon size={24} /> : <Sun size={24} />}
            </div>
            <div>
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    {isDark ? "Dark Mode" : "Light Mode"}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {isDark ? "Switch to light mode" : "Switch to dark mode"}
                </p>
            </div>
        </div>

        <button 
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ease-in-out flex items-center px-1
                ${isDark ? 'bg-[var(--accent-color)]' : 'bg-gray-300 dark:bg-gray-600'}
            `}
        >
            <div 
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out
                ${isDark ? 'translate-x-6' : 'translate-x-0'}
            `}/>
        </button>
      </div>
    </div>
  );
}