import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect to role-specific dashboard
      if (user.role === 'patient') {
        navigate('/patient/dashboard', { replace: true });
      } else if (user.role === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
    </div>
  );
};

export default Dashboard;
