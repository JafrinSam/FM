import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../styles/themeConstants';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check localStorage for saved preference, default to 'dark'
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  // Function to apply CSS variables to the document root
  const applyTheme = (themeKey) => {
    const theme = themes[themeKey];
    const root = document.documentElement;

    for (const [key, value] of Object.entries(theme)) {
      root.style.setProperty(key, value);
    }
  };

  // Effect to apply theme whenever it changes
  useEffect(() => {
    applyTheme(themeName);
    localStorage.setItem('app-theme', themeName);
  }, [themeName]);

  const toggleTheme = () => {
    setThemeName((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook for easy usage
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};