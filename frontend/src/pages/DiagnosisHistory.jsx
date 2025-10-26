import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { diagnosisAPI } from '../services/api';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const DiagnosisHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await diagnosisAPI.getHistory();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
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

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (session.aiPrediction && session.aiPrediction.some(pred => 
                           pred.condition.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openSessionDetails = (session) => {
    setSelectedSession(session);
  };

  const closeSessionDetails = () => {
    setSelectedSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Diagnosis History</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            View and manage your past diagnosis sessions
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-11"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>

            {/* New Session Button */}
            <Link
              to="/patient/symptom-checker"
              className="btn-medical flex items-center justify-center whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Check
            </Link>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredSessions.length} of {sessions.length} sessions
          </p>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="card p-12 text-center">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {searchTerm || statusFilter !== 'all' ? 'No matching sessions found' : 'No diagnosis sessions'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by checking your symptoms'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <Link
                  to="/patient/symptom-checker"
                  className="btn-medical"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Start Symptom Check
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div key={session.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Session #{session.id}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {format(new Date(session.createdAt), 'MMMM dd, yyyy at h:mm a')}
                    </div>

                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</h4>
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                        {session.symptoms}
                      </p>
                    </div>

                    {session.aiPrediction && session.aiPrediction.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Prediction:</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.aiPrediction[0].condition}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({Math.round(session.aiPrediction[0].confidence * 100)}% confidence)
                          </span>
                        </div>
                      </div>
                    )}

                    {session.doctorNotes && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor's Notes:</h4>
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                          {session.doctorNotes}
                        </p>
                      </div>
                    )}

                    {session.doctorFirstName && session.doctorLastName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Reviewed by Dr. {session.doctorFirstName} {session.doctorLastName}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => openSessionDetails(session)}
                      className="btn-secondary flex items-center"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Session #{selectedSession.id} Details
                  </h3>
                  <button
                    onClick={closeSessionDetails}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'auto' }}>
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Session Information</h4>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <p><strong>Date:</strong> {format(new Date(selectedSession.createdAt), 'MMMM dd, yyyy at h:mm a')}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSession.status)}`}>
                          {selectedSession.status}
                        </span>
                      </p>
                      <p><strong>Severity:</strong> {selectedSession.severity}/10</p>
                      <p><strong>Duration:</strong> {selectedSession.duration}</p>
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Symptoms</h4>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {selectedSession.symptoms}
                    </p>
                  </div>

                  {/* Additional Info */}
                  {selectedSession.additionalInfo && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Additional Information</h4>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {selectedSession.additionalInfo}
                      </p>
                    </div>
                  )}

                  {/* AI Predictions */}
                  {selectedSession.aiPrediction && selectedSession.aiPrediction.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">AI Analysis</h4>
                      <div className="mt-2 space-y-3">
                        {selectedSession.aiPrediction.map((prediction, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white">{prediction.condition}</h5>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {Math.round(prediction.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{prediction.description}</p>
                            {prediction.recommendations && (
                              <div>
                                <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Recommendations:</h6>
                                <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc list-inside">
                                  {prediction.recommendations.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctor's Review */}
                  {selectedSession.doctorNotes && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Doctor's Review</h4>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {selectedSession.doctorNotes}
                      </p>
                      {selectedSession.doctorFirstName && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Reviewed by Dr. {selectedSession.doctorFirstName} {selectedSession.doctorLastName}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeSessionDetails}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosisHistory;
