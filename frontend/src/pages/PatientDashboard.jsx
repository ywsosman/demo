import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { diagnosisAPI } from '../services/api';
import ScrollReveal from '../components/ScrollReveal';
import {
  HeartIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await diagnosisAPI.getHistory();
      const sessions = response.data.sessions || [];
      
      setRecentSessions(sessions.slice(0, 5)); // Get last 5 sessions
      
      // Calculate stats
      setStats({
        total: sessions.length,
        pending: sessions.filter(s => s.status === 'pending').length,
        reviewed: sessions.filter(s => s.status === 'reviewed').length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'reviewed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal direction="down" delay={0} duration={600}>
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.firstName}!
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Manage your health with our AI-powered diagnosis system
            </p>
          </div>
        </ScrollReveal>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <ScrollReveal direction="up" delay={100} duration={600}>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Quick Actions</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <ScrollReveal direction="up" delay={150} duration={600}>
              <Link
                to="/patient/symptom-checker"
                className="card card-hover p-6 flex items-center space-x-4 group transition-all duration-300 hover:scale-105"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-medical-100 rounded-lg flex items-center justify-center group-hover:bg-medical-200 transition-colors duration-300">
                    <HeartIcon className="w-6 h-6 text-medical-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Symptom Checker</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get AI-powered health insights</p>
                </div>
                <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors duration-300" />
              </Link>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={250} duration={600}>
              <Link
                to="/patient/history"
                className="card card-hover p-6 flex items-center space-x-4 group transition-all duration-300 hover:scale-105"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">View History</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Review past diagnoses</p>
                </div>
              </Link>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={350} duration={600}>
              <Link
                to="/patient/profile"
                className="card card-hover p-6 flex items-center space-x-4 group transition-all duration-300 hover:scale-105"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-300">
                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update medical information</p>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-6 sm:mb-8">
          <ScrollReveal direction="up" delay={100} duration={600}>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Overview</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <ScrollReveal direction="up" delay={150} duration={600}>
              <div className="card p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={250} duration={600}>
              <div className="card p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={350} duration={600}>
              <div className="card p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Reviewed</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.reviewed}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Recent Sessions */}
        <ScrollReveal direction="up" delay={100} duration={600}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Diagnosis Sessions</h2>
              <Link
                to="/patient/history"
                className="text-sm text-medical-600 hover:text-medical-500 font-medium transition-colors duration-300"
              >
                View all
              </Link>
            </div>

          {recentSessions.length === 0 ? (
            <div className="card p-6 text-center">
              <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No diagnosis sessions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by checking your symptoms
              </p>
              <div className="mt-6">
                <Link
                  to="/patient/symptom-checker"
                  className="btn-medical"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Symptom Check
                </Link>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Symptoms
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        AI Prediction
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentSessions.map((session) => (
                      <tr 
                        key={session.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {format(new Date(session.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                          <div className="max-w-[150px] sm:max-w-xs truncate">
                            {session.symptoms}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                          {session.aiPrediction && session.aiPrediction.length > 0 ? (
                            <div>
                              <div className="font-medium max-w-[120px] sm:max-w-none truncate">
                                {session.aiPrediction[0].condition}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {Math.round(session.aiPrediction[0].confidence * 100)}% confidence
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Processing...</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {getStatusIcon(session.status)}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                              {session.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default PatientDashboard;
