import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { diagnosisAPI } from '../services/api';
import ScrollReveal from '../components/ScrollReveal';
import { usePageLoading } from '../contexts/LoadingOverlayContext';
import {
  HeartIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { normalizeStatus, statusLabel, statusColorClass, SESSION_STATUS, isReviewed } from '../utils/diagnosisStatus';

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
        pending: sessions.filter(s => {
          const st = normalizeStatus(s.status);
          return [SESSION_STATUS.PENDING_DOCTOR_REVIEW, SESSION_STATUS.IN_REVIEW, SESSION_STATUS.NEEDS_MORE_INFO, SESSION_STATUS.AI_PROCESSED].includes(st);
        }).length,
        reviewed: sessions.filter(s => isReviewed(s.status)).length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const s = normalizeStatus(status);
    if (isReviewed(s)) return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    if (s === SESSION_STATUS.NEEDS_MORE_INFO) return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    return <ClockIcon className="h-5 w-5 text-yellow-500" />;
  };

  usePageLoading(loading);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal direction="down" delay={0} duration={600}>
          <div className="mb-6 sm:mb-8">
            <h1 className="page-title">
              Welcome back, {user.firstName}
            </h1>
            <p className="page-subtitle">
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
                className="card card-hover p-5 sm:p-6 flex items-center gap-4 group h-full"
              >
                <span className="icon-chip icon-chip--brand group-hover:scale-105 transition-transform duration-200">
                  <HeartIcon />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Symptom Checker</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Get AI-powered health insights</p>
                </div>
                <PlusIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200" />
              </Link>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={250} duration={600}>
              <Link
                to="/patient/history"
                className="card card-hover p-5 sm:p-6 flex items-center gap-4 group h-full"
              >
                <span className="icon-chip icon-chip--info group-hover:scale-105 transition-transform duration-200">
                  <ClipboardDocumentListIcon />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">View History</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Review past diagnoses</p>
                </div>
              </Link>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={350} duration={600}>
              <Link
                to="/patient/profile"
                className="card card-hover p-5 sm:p-6 flex items-center gap-4 group h-full"
              >
                <span className="icon-chip icon-chip--neutral group-hover:scale-105 transition-transform duration-200">
                  <UserIcon />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Profile</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Update medical information</p>
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
              <div className="stat-card">
                <span className="icon-chip icon-chip--info">
                  <ClipboardDocumentListIcon />
                </span>
                <div>
                  <p className="stat-card-label">Total Sessions</p>
                  <p className="stat-card-value">{stats.total}</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={250} duration={600}>
              <div className="stat-card">
                <span className="icon-chip icon-chip--warning">
                  <ClockIcon />
                </span>
                <div>
                  <p className="stat-card-label">Pending Review</p>
                  <p className="stat-card-value">{stats.pending}</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={350} duration={600}>
              <div className="stat-card">
                <span className="icon-chip icon-chip--brand">
                  <CheckCircleIcon />
                </span>
                <div>
                  <p className="stat-card-label">Reviewed</p>
                  <p className="stat-card-value">{stats.reviewed}</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Recent Sessions */}
        <ScrollReveal direction="up" delay={100} duration={600}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Diagnosis Sessions</h2>
              <Link
                to="/patient/history"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors duration-200"
              >
                View all &rarr;
              </Link>
            </div>

          {recentSessions.length === 0 ? (
            <div className="card p-10 text-center">
              <span className="icon-chip icon-chip--brand mx-auto w-14 h-14">
                <HeartIcon />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No diagnosis sessions yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Get started by checking your symptoms
              </p>
              <div className="mt-6">
                <Link to="/patient/symptom-checker" className="btn-medical">
                  <PlusIcon className="w-4 h-4" />
                  New Symptom Check
                </Link>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Symptoms</th>
                      <th>AI Prediction</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="whitespace-nowrap text-slate-900 dark:text-white">
                          {format(new Date(session.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <div className="max-w-[150px] sm:max-w-xs truncate">
                            {session.symptoms}
                          </div>
                        </td>
                        <td>
                          {session.aiPrediction && session.aiPrediction.length > 0 ? (
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white max-w-[120px] sm:max-w-none truncate">
                                {session.aiPrediction[0].condition}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {Math.round(session.aiPrediction[0].confidence * 100)}% confidence
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Processing...</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(session.status)}
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusColorClass(session.status)}`}>
                              {statusLabel(session.status)}
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
