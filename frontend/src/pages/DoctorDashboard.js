import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { diagnosisAPI, userAPI } from '../services/api';
import {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    pendingSessions: 0,
    reviewedSessions: 0,
    totalPatients: 0
  });
  const [pendingSessions, setPendingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reviewData, setReviewData] = useState({
    doctorNotes: '',
    status: 'reviewed'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, sessionsResponse] = await Promise.all([
        diagnosisAPI.getStats(),
        diagnosisAPI.getPending()
      ]);

      setStats(statsResponse.data);
      setPendingSessions(sessionsResponse.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSession = async (sessionId) => {
    try {
      await diagnosisAPI.reviewSession(sessionId, reviewData);
      // Refresh data
      await fetchDashboardData();
      setSelectedSession(null);
      setReviewData({ doctorNotes: '', status: 'reviewed' });
    } catch (error) {
      console.error('Failed to review session:', error);
    }
  };

  const openReviewModal = (session) => {
    setSelectedSession(session);
    setReviewData({
      doctorNotes: session.doctorNotes || '',
      status: session.status || 'reviewed'
    });
  };

  const closeReviewModal = () => {
    setSelectedSession(null);
    setReviewData({ doctorNotes: '', status: 'reviewed' });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity) => {
    if (severity <= 3) return 'text-green-600 bg-green-50';
    if (severity <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Dr. {user.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Review patient diagnoses and provide professional medical guidance
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Review</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingSessions}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Reviewed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.reviewedSessions}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Pending Diagnosis Reviews</h2>
            {pendingSessions.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingSessions.length} pending
              </span>
            )}
          </div>

          {pendingSessions.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
              <p className="mt-1 text-sm text-gray-500">
                No pending diagnosis sessions to review at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSessions.map((session) => (
                <div key={session.id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {session.patientFirstName} {session.patientLastName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          Session #{session.id}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(session.severity)}`}>
                          Severity: {session.severity}/10
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 mb-3">
                        <p><strong>Submitted:</strong> {format(new Date(session.createdAt), 'MMMM dd, yyyy at h:mm a')}</p>
                        <p><strong>Duration:</strong> {session.duration}</p>
                        {session.age && <p><strong>Age:</strong> {session.age} years old</p>}
                        {session.gender && <p><strong>Gender:</strong> {session.gender}</p>}
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Symptoms:</h4>
                        <p className="text-sm text-gray-900">
                          {session.symptoms}
                        </p>
                      </div>

                      {session.additionalInfo && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Additional Information:</h4>
                          <p className="text-sm text-gray-900">
                            {session.additionalInfo}
                          </p>
                        </div>
                      )}

                      {session.medicalHistory && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Medical History:</h4>
                          <p className="text-sm text-gray-900">
                            {session.medicalHistory}
                          </p>
                        </div>
                      )}

                      {session.allergies && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Allergies:</h4>
                          <p className="text-sm text-gray-900">
                            {session.allergies}
                          </p>
                        </div>
                      )}

                      {session.aiPrediction && session.aiPrediction.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</h4>
                          <div className="space-y-2">
                            {session.aiPrediction.slice(0, 2).map((prediction, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="font-medium text-gray-900">{prediction.condition}</h5>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
                                    {Math.round(prediction.confidence * 100)}% confidence
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{prediction.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => openReviewModal(session)}
                        className="btn-primary flex items-center"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Review Session #{selectedSession.id}
                  </h3>
                  <button
                    onClick={closeReviewModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Patient: {selectedSession.patientFirstName} {selectedSession.patientLastName}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Symptoms:</strong> {selectedSession.symptoms}
                    </p>
                    {selectedSession.additionalInfo && (
                      <p className="text-sm text-gray-600">
                        <strong>Additional Info:</strong> {selectedSession.additionalInfo}
                      </p>
                    )}
                  </div>

                  {selectedSession.aiPrediction && selectedSession.aiPrediction.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">AI Predictions:</h4>
                      <div className="space-y-2">
                        {selectedSession.aiPrediction.map((prediction, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-gray-900">{prediction.condition}</h5>
                              <span className="text-sm text-gray-500">
                                {Math.round(prediction.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{prediction.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="doctorNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Professional Assessment
                    </label>
                    <textarea
                      id="doctorNotes"
                      rows={4}
                      value={reviewData.doctorNotes}
                      onChange={(e) => setReviewData(prev => ({ ...prev, doctorNotes: e.target.value }))}
                      className="form-input"
                      placeholder="Provide your professional assessment, diagnosis, recommendations, and any additional notes..."
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Session Status
                    </label>
                    <select
                      id="status"
                      value={reviewData.status}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                      className="form-input"
                    >
                      <option value="reviewed">Reviewed</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={closeReviewModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReviewSession(selectedSession.id)}
                    disabled={!reviewData.doctorNotes.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Review
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

export default DoctorDashboard;
