import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme Context
const ThemeContext = createContext();

// Theme Provider
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    // Check localStorage first, then default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to light mode instead of system preference
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    // Update localStorage when theme changes
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update document class for Tailwind dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark');
  };

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
