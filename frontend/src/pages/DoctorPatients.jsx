import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { usePageLoading } from '../contexts/LoadingOverlayContext';
import toast from 'react-hot-toast';
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const DoctorPatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/patients');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'recent':
        return new Date(b.lastVisit || b.createdAt) - new Date(a.lastVisit || a.createdAt);
      case 'status':
        return a.status?.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'badge--success';
      case 'pending':
        return 'badge--warning';
      case 'completed':
        return 'badge--info';
      default:
        return 'badge--neutral';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  usePageLoading(loading);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {}
        <div className="mb-6 sm:mb-8">
          <h1 className="page-title">My Patients</h1>
          <p className="page-subtitle">
            Manage and view patients you have reviewed or taken requests from
          </p>
        </div>

        {}
        <div className="card p-4 sm:p-5 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-11"
                />
              </div>
            </div>

            {}
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {}
        <div className="card overflow-hidden">
          {sortedPatients.length === 0 ? (
            <div className="text-center py-12">
              <span className="icon-chip icon-chip--neutral mx-auto w-14 h-14">
                <UserIcon />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No patients found</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'You haven\'t reviewed any patients yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th className="hidden md:table-cell">Contact</th>
                    <th>Status</th>
                    <th className="hidden lg:table-cell">Last Visit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map((patient) => (
                    <tr key={patient._id}>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="icon-chip icon-chip--brand w-9 h-9 sm:w-10 sm:h-10 rounded-full">
                            <UserIcon />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white max-w-[120px] sm:max-w-none truncate">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              ID: {patient._id?.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{patient.email}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{patient.phone || 'N/A'}</div>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`badge ${getStatusBadge(patient.status)} capitalize`}>
                          {patient.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap hidden lg:table-cell">
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          <CalendarIcon className="h-4 w-4 text-slate-400 mr-1.5 shrink-0" />
                          {formatDate(patient.lastVisit)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <button
                          aria-label="View patient details"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10 transition-colors"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {}
        {sortedPatients.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <span className="icon-chip icon-chip--info">
                <UserIcon />
              </span>
              <div>
                <p className="stat-card-label">Total Patients</p>
                <p className="stat-card-value">{patients.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="icon-chip icon-chip--warning">
                <ClockIcon />
              </span>
              <div>
                <p className="stat-card-label">Pending Reviews</p>
                <p className="stat-card-value">
                  {patients.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <span className="icon-chip icon-chip--brand">
                <CalendarIcon />
              </span>
              <div>
                <p className="stat-card-label">Active Patients</p>
                <p className="stat-card-value">
                  {patients.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;
