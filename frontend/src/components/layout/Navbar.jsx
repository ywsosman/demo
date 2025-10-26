import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  HeartIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import StaggeredMenu from './StaggeredMenu';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safely get auth context with fallbacks
  let user = null;
  let logout = () => {};
  let loading = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout || (() => {});
    loading = authContext.loading || false;
  } catch (error) {
    console.warn('Auth context not available:', error);
  }
  
  // Safely get theme context with fallbacks
  let isDarkMode = false;
  let toggleTheme = () => {};
  
  try {
    const themeContext = useTheme();
    isDarkMode = themeContext.isDarkMode || false;
    toggleTheme = themeContext.toggleTheme || (() => {});
  } catch (error) {
    console.warn('Theme context not available:', error);
  }

  const handleLogout = () => {
    logout();
  };

  const handleMenuOpen = () => {
    document.body.classList.add('menu-open');
  };

  const handleMenuClose = () => {
    document.body.classList.remove('menu-open');
  };

  useEffect(() => {
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, []);

  // Build menu items for StaggeredMenu
  const getMenuItems = () => {
    const items = [
      { 
        label: 'Home', 
        ariaLabel: 'Go to home page', 
        link: '/',
        onClick: () => navigate('/')
      }
    ];

    if (!user) {
      items.push(
        { 
          label: 'Login', 
          ariaLabel: 'Login to your account', 
          link: '/login',
          onClick: () => navigate('/login')
        },
        { 
          label: 'Get Started', 
          ariaLabel: 'Register a new account', 
          link: '/register',
          onClick: () => navigate('/register')
        }
      );
    }

    if (user && user.role === 'patient') {
      items.push(
        { 
          label: 'Dashboard', 
          ariaLabel: 'View your dashboard', 
          link: '/patient/dashboard',
          onClick: () => navigate('/patient/dashboard')
        },
        { 
          label: 'Symptom Checker', 
          ariaLabel: 'Check your symptoms', 
          link: '/patient/symptom-checker',
          onClick: () => navigate('/patient/symptom-checker')
        },
        { 
          label: 'History', 
          ariaLabel: 'View diagnosis history', 
          link: '/patient/history',
          onClick: () => navigate('/patient/history')
        },
        { 
          label: 'Profile', 
          ariaLabel: 'View your profile', 
          link: '/patient/profile',
          onClick: () => navigate('/patient/profile')
        }
      );
    }

    if (user && user.role === 'doctor') {
      items.push(
        { 
          label: 'Dashboard', 
          ariaLabel: 'View your dashboard', 
          link: '/doctor/dashboard',
          onClick: () => navigate('/doctor/dashboard')
        },
        { 
          label: 'Patients', 
          ariaLabel: 'View your patients', 
          link: '/doctor/patients',
          onClick: () => navigate('/doctor/patients')
        },
        { 
          label: 'Profile', 
          ariaLabel: 'View your profile', 
          link: '/doctor/profile',
          onClick: () => navigate('/doctor/profile')
        }
      );
    }

    // Add logout for authenticated users
    if (user) {
      items.push({
        label: 'Logout',
        ariaLabel: 'Logout from your account',
        link: '#',
        onClick: (e) => {
          e?.preventDefault();
          handleLogout();
        }
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  // Ref to access the StaggeredMenu's close function
  const menuRef = useRef(null);

  // Custom logo component for the menu
  const LogoComponent = ({ onLogoClick }) => (
            <Link
              to="/"
      className="flex items-center space-x-2 group"
      onClick={(e) => {
        // Close menu if it's open
        if (onLogoClick) {
          onLogoClick();
        }
      }}
    >
      <HeartIcon className="h-8 w-8 text-medical-600 dark:text-medical-400 group-hover:scale-110 transition-transform duration-200" />
      <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-medical-600 dark:group-hover:text-medical-400 transition-colors duration-200">
        MediDiagnose
                  </span>
                    </Link>
                  );

  return (
    <StaggeredMenu
      ref={menuRef}
      items={menuItems}
      displaySocials={false}
      displayItemNumbering={false}
      logoComponent={<LogoComponent />}
      onLogoClick={handleMenuClose}
      menuButtonColor={isDarkMode ? '#f9fafb' : '#111827'}
      openMenuButtonColor="#ffffff"
      accentColor="#ef4444"
      changeMenuColorOnOpen={true}
      colors={isDarkMode ? ['#1f2937', '#111827'] : ['#374151', '#1f2937']}
      onMenuOpen={handleMenuOpen}
      onMenuClose={handleMenuClose}
      user={user}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    />
  );
};

export default Navbar;

