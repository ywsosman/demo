import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { usePageLoading } from '../contexts/LoadingOverlayContext';
import {
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
      setRecentActivity(response.data.recentActivity);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const map = {
      LOGIN: 'badge--info',
      USER_CREATED: 'badge--success',
      USER_UPDATED: 'badge--warning',
      USER_DELETED: 'badge--danger',
      PASSWORD_RESET: 'badge--neutral',
    };
    return map[action] || 'badge--neutral';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  usePageLoading(loading);

  if (loading) {
    return null;
  }

  const statCards = [
    { label: 'Total Doctors', value: stats?.totalDoctors || 0, Icon: UsersIcon, chip: 'icon-chip--info' },
    { label: 'Total Patients', value: stats?.totalPatients || 0, Icon: UserGroupIcon, chip: 'icon-chip--brand' },
    { label: 'Total Diagnoses', value: stats?.totalDiagnoses || 0, Icon: DocumentTextIcon, chip: 'icon-chip--neutral' },
    { label: 'Recent (7 days)', value: stats?.recentDiagnoses || 0, Icon: ArrowTrendingUpIcon, chip: 'icon-chip--warning' },
  ];

  const quickActions = [
    { title: 'Manage Doctors', desc: 'View, add, edit, and remove doctor accounts', to: '/admin/users?role=doctor' },
    { title: 'Manage Patients', desc: 'View, add, edit, and remove patient accounts', to: '/admin/users?role=patient' },
    { title: 'All Users', desc: 'View and manage all user accounts', to: '/admin/users' },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Manage users, view statistics, and monitor system activity
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {statCards.map(({ label, value, Icon, chip }) => (
            <div key={label} className="stat-card">
              <span className={`icon-chip ${chip}`}>
                <Icon />
              </span>
              <div>
                <p className="stat-card-label">{label}</p>
                <p className="stat-card-value">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {quickActions.map(({ title, desc, to }) => (
            <button
              key={title}
              onClick={() => navigate(to)}
              className="card card-hover p-6 text-left group flex items-center justify-between gap-4"
            >
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {desc}
                </p>
              </div>
              <ChevronRightIcon className="w-5 h-5 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200" />
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            {recentActivity.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50"
                  >
                    <span className={`badge ${getActionBadge(activity.action)} shrink-0`}>
                      {activity.action.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-white">
                        {activity.details}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : 'System'}
                        </p>
                        <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
