import React, { createContext, useContext, useEffect, useState } from 'react';


const ThemeContext = createContext();


export const ThemeProvider = ({ children }) => {
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const savedTheme = localStorage.getItem('theme');
    
    return savedTheme === 'dark' ? true : false;
  });

  useEffect(() => {
    
    if (typeof window === 'undefined') {
      return;
    }
    
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    
    if (typeof window === 'undefined') {
      return;
    }
    
    
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    
    const htmlElement = document.documentElement;
    
    if (isDarkMode) {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
      
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      
      htmlElement.style.colorScheme = 'light';
    }
    
    
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


export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
