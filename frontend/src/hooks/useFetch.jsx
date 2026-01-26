import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';

/**
 * Custom Hook for API calls with built-in Toast, Loading state & Smart Error Handling
 */
const useFetch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (method, url, payload = null, options = {}) => {
    const { 
      showToast = true, 
      successMessage = "Operation successful", 
      errorMessage = null, 
      headers = {} 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const config = {
        method,
        url,
        data: payload,
        headers: { ...headers }
      };

      // ✅ CRITICAL FIX: 
      // We must explicitly set this to undefined.
      // This tells Axios: "Ignore your default application/json header for this request."
      // The browser will then automatically detect FormData and add the correct boundary.
      if (payload instanceof FormData) {
        config.headers['Content-Type'] = undefined;
      }

      const response = await apiClient(config);
      const result = response.data;

      setData(result);
      
      if (showToast && method !== 'GET') {
        toast.success(successMessage || result.message);
      }

      return { success: true, data: result };

    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || "Something went wrong";
      const displayMsg = errorMessage || serverMsg; 

      setError(displayMsg);

      // Smart Toast Logic: Avoid double toasts if Interceptor handles session death
      const isSessionDeath = status === 401 || (status === 403 && !serverMsg.toLowerCase().includes("access denied"));

      if (showToast && !isSessionDeath) {
        toast.error(displayMsg);
      }

      return { success: false, error: displayMsg };

    } finally {
      setLoading(false);
    }
  }, []);

  // Helpers
  const get = useCallback((url, options) => execute('GET', url, null, { showToast: false, ...options }), [execute]);
  const post = useCallback((url, data, options) => execute('POST', url, data, options), [execute]);
  const put = useCallback((url, data, options) => execute('PUT', url, data, options), [execute]);
  const del = useCallback((url, options) => execute('DELETE', url, null, options), [execute]);

  return { 
    data, 
    loading, 
    error, 
    execute, 
    get, 
    post, 
    put, 
    del 
  };
};

export default useFetch;