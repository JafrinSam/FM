import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import apiClient, { setAuthToken } from '../services/apiClient';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. BOOTSTRAP: Check Session on App Load ---
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        
        if (!storedToken) {
          console.log("ℹ️ No session token found.");
          setAuthToken(null);
          setUser(null);
          setLoading(false);

          if (location.pathname.startsWith('/admin')) {
             navigate('/login', { replace: true });
          }
          return;
        }

        setAuthToken(storedToken);
        
        const userRes = await apiClient.get('/users/me');
        
        setUser(userRes.data.data);
        console.log("✅ Session restored successfully");

      } catch (error) {
        console.log("ℹ️ Session invalid or expired");
        
        setAuthToken(null); 
        setUser(null);
        localStorage.removeItem('accessToken'); 
        
        if (location.pathname.startsWith('/admin')) {
            navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []); 

  // --- 2. LOGIN ACTION ---
  const login = async (credentials) => {
    try {
      const { data } = await apiClient.post('/users/login', credentials);
      const { token, ...userData } = data.data;

      setAuthToken(token); 
      setUser(userData);
      
      return { success: true };

    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      return { success: false, error: msg };
    }
  };

  // --- 3. LOGOUT ACTION ---
  const logout = async () => {
    try {
      await apiClient.post('/users/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setAuthToken(null); 
      setUser(null);
      toast.info("Logged out successfully");
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      role: user?.role || null, // 👈 Added explicit role return
      loading, 
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      login, 
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};