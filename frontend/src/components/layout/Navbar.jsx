import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'patient') {
      return [
        { name: 'Dashboard', href: '/patient/dashboard', icon: ChartBarIcon },
        { name: 'Symptom Checker', href: '/patient/symptom-checker', icon: HeartIcon },
        { name: 'History', href: '/patient/history', icon: ClipboardDocumentListIcon },
        { name: 'Profile', href: '/patient/profile', icon: UserIcon }
      ];
    } else if (user.role === 'doctor') {
      return [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: ChartBarIcon },
        { name: 'Patients', href: '/doctor/patients', icon: UserIcon },
        { name: 'Profile', href: '/doctor/profile', icon: UserCircleIcon }
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <HeartIcon className="h-8 w-8 text-medical-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                MediDiagnose
              </span>
            </Link>
          </div>

          {/* Dark mode toggle - always visible */}
          <div className="hidden md:flex items-center">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-110 transition-all duration-200"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-110 ${
                      isActive(link.href)
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Welcome, {user.firstName || user.name || 'User'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'doctor' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-110 transition-all duration-200"
                  aria-label="Logout from account"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 hover:scale-110"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-medical-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-medical-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600 transition-all duration-200 hover:scale-110"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:scale-110 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-200"
                aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        mobileMenuOpen 
          ? 'max-h-screen opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
            {/* Mobile dark mode toggle - always visible */}
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-110 transition-all duration-200"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 mb-2">
                  Welcome, {user.firstName || user.name || 'User'}
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    user.role === 'doctor' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:shadow-md hover:scale-110 ${
                        isActive(link.href)
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-110 transition-all duration-200"
                  aria-label="Logout from account"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 hover:scale-110"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md bg-medical-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-medical-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600 transition-all duration-200 hover:scale-110"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
    </nav>
  );
};

export default Navbar;

