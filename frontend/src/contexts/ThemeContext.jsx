import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme Context
const ThemeContext = createContext();

// Theme Provider
export const ThemeProvider = ({ children }) => {
  // Initialize state - default to light mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const savedTheme = localStorage.getItem('theme');
    // Default to light mode (false) unless explicitly set to dark
    return savedTheme === 'dark' ? true : false;
  });

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    // Check localStorage on mount - default to light if not set
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Set default to light mode if nothing saved
      localStorage.setItem('theme', 'light');
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
    const htmlElement = document.documentElement;
    
    if (isDarkMode) {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
      // Set color-scheme for better mobile support
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      // Set color-scheme for better mobile support
      htmlElement.style.colorScheme = 'light';
    }
    
    // Force a reflow to ensure changes are applied on mobile
    htmlElement.offsetHeight;
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
