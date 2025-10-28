import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { diagnosisAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import ScrollReveal from '../components/ScrollReveal';
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
  const [reviewedSessions, setReviewedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'reviewed'
  const [reviewData, setReviewData] = useState({
    doctorNotes: '',
    status: 'reviewed'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, pendingResponse, allSessionsResponse] = await Promise.all([
        diagnosisAPI.getStats(),
        diagnosisAPI.getPending(),
        diagnosisAPI.getAll() // Get all sessions for doctor
      ]);

      setStats(statsResponse.data);
      setPendingSessions(pendingResponse.data.sessions || []);
      
      // Filter for reviewed and closed sessions
      const allSessions = allSessionsResponse.data.sessions || [];
      const reviewed = allSessions.filter(s => s.status === 'reviewed' || s.status === 'closed');
      setReviewedSessions(reviewed);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSession = async (sessionId) => {
    try {
      await diagnosisAPI.reviewSession(sessionId, reviewData);
      toast.success(`Session ${reviewData.status === 'reviewed' ? 'reviewed' : 'closed'} successfully!`);
      // Refresh data
      await fetchDashboardData();
      setSelectedSession(null);
      setReviewData({ doctorNotes: '', status: 'reviewed' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit review. Please try again.';
      toast.error(errorMessage);
    }
  };

  const openReviewModal = (session) => {
    setSelectedSession(session);
    setReviewData({
      doctorNotes: session.doctorNotes || '',
      status: 'reviewed' // Always default to 'reviewed' when opening the modal
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
              Welcome, Dr. {user.firstName}!
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Review patient diagnoses and provide professional medical guidance
            </p>
          </div>
        </ScrollReveal>

        {/* Stats Overview */}
        <div className="mb-8">
          <ScrollReveal direction="up" delay={100} duration={600}>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Overview</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <ScrollReveal direction="up" delay={150} duration={600}>
              <div className="card p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalSessions}</p>
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
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingSessions}</p>
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
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.reviewedSessions}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={450} duration={600}>
              <div className="card p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Patients</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPatients}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Sessions Tabs */}
        <div>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 overflow-x-auto">
              <nav className="-mb-px flex space-x-4 sm:space-x-8">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`${
                    activeTab === 'pending'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center transition-all duration-300`}
                >
                  <span className="hidden sm:inline">Pending Reviews</span>
                  <span className="sm:hidden">Pending</span>
                  {pendingSessions.length > 0 && (
                    <span className="ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 transition-all duration-300">
                      {pendingSessions.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('reviewed')}
                  className={`${
                    activeTab === 'reviewed'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center transition-all duration-300`}
                >
                  <span className="hidden sm:inline">Reviewed & Closed</span>
                  <span className="sm:hidden">Reviewed</span>
                  {reviewedSessions.length > 0 && (
                    <span className="ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 transition-all duration-300">
                      {reviewedSessions.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

          {/* Pending Tab Content */}
          {activeTab === 'pending' && (
            <ScrollReveal direction="up" delay={0} duration={600}>
              <div className="animate-fadeIn">
                {pendingSessions.length === 0 ? (
                  <div className="card p-12 text-center transition-all duration-300 hover:shadow-xl">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">All caught up!</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No pending diagnosis sessions to review at this time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="card p-3 sm:p-4 md:p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                          {session.patientFirstName} {session.patientLastName}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Session #{session.id}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(session.severity)}`}>
                            Severity: {session.severity}/10
                          </span>
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                        <p><strong>Submitted:</strong> {format(new Date(session.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                        <p><strong>Duration:</strong> {session.duration}</p>
                        {session.age && <p><strong>Age:</strong> {session.age} years old</p>}
                        {session.gender && <p><strong>Gender:</strong> {session.gender}</p>}
                      </div>

                      <div className="mb-3">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</h4>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {session.symptoms}
                        </p>
                      </div>

                      {session.additionalInfo && (
                        <div className="mb-3">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Information:</h4>
                          <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                            {session.additionalInfo}
                          </p>
                        </div>
                      )}

                      {session.medicalHistory && (
                        <div className="mb-3">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical History:</h4>
                          <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                            {session.medicalHistory}
                          </p>
                        </div>
                      )}

                      {session.allergies && (
                        <div className="mb-3">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies:</h4>
                          <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                            {session.allergies}
                          </p>
                        </div>
                      )}

                      {session.aiPrediction && session.aiPrediction.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Analysis:</h4>
                          <div className="space-y-2">
                            {session.aiPrediction.slice(0, 2).map((prediction, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3">
                                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                                  <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{prediction.condition}</h5>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)} dark:bg-opacity-20 whitespace-nowrap`}>
                                    {Math.round(prediction.confidence * 100)}% confidence
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{prediction.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full sm:w-auto sm:ml-4 flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                      <button
                        onClick={() => openReviewModal(session)}
                        className="btn-primary flex items-center justify-center transition-all duration-300 hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
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
            </ScrollReveal>
          )}

          {/* Reviewed Tab Content */}
          {activeTab === 'reviewed' && (
            <ScrollReveal direction="up" delay={0} duration={600}>
              <div className="animate-fadeIn">
                {reviewedSessions.length === 0 ? (
                  <div className="card p-12 text-center transition-all duration-300 hover:shadow-xl">
                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reviewed sessions yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Sessions you review will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewedSessions.map((session) => (
                    <div 
                      key={session.id || session._id} 
                      className="card p-3 sm:p-4 md:p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                              {session.patientFirstName} {session.patientLastName}
                            </h3>
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Session #{session.id || session._id}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                session.status === 'reviewed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800 dark:text-gray-200'
                              }`}>
                                {session.status === 'reviewed' ? 'Reviewed' : 'Closed'}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                            <p><strong>Submitted:</strong> {format(new Date(session.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                            {session.updatedAt && session.updatedAt !== session.createdAt && (
                              <p><strong>Reviewed:</strong> {format(new Date(session.updatedAt), 'MMM dd, yyyy h:mm a')}</p>
                            )}
                          </div>

                          <div className="mb-3">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</h4>
                            <p className="text-xs sm:text-sm text-gray-900 dark:text-white">{session.symptoms}</p>
                          </div>

                          {session.doctorNotes && (
                            <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-3">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Assessment:</h4>
                              <p className="text-xs sm:text-sm text-gray-900 dark:text-white">{session.doctorNotes}</p>
                            </div>
                          )}

                          {session.aiPrediction && session.aiPrediction.length > 0 && (
                            <div>
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Analysis:</h4>
                              <div className="space-y-2">
                                {session.aiPrediction.slice(0, 2).map((prediction, index) => (
                                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3">
                                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                                      <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{prediction.condition}</h5>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)} dark:bg-opacity-20 whitespace-nowrap`}>
                                        {Math.round(prediction.confidence * 100)}% confidence
                                      </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{prediction.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Review Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-2 sm:p-4">
            <div className="relative top-4 sm:top-10 md:top-20 mx-auto p-3 sm:p-4 md:p-5 border border-gray-200 dark:border-gray-700 w-full sm:w-11/12 md:w-3/4 lg:w-1/2 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 mb-4">
              <div className="mt-2 sm:mt-3">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                    Review Session #{selectedSession.id}
                  </h3>
                  <button
                    onClick={closeReviewModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 ml-2"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 md:max-h-96 overflow-y-auto mb-4 sm:mb-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'auto' }}>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">
                      Patient: {selectedSession.patientFirstName} {selectedSession.patientLastName}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <strong>Symptoms:</strong> {selectedSession.symptoms}
                    </p>
                    {selectedSession.additionalInfo && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <strong>Additional Info:</strong> {selectedSession.additionalInfo}
                      </p>
                    )}
                  </div>

                  {selectedSession.aiPrediction && selectedSession.aiPrediction.length > 0 && (
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">AI Predictions:</h4>
                      <div className="space-y-2">
                        {selectedSession.aiPrediction.map((prediction, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 bg-gray-50 dark:bg-gray-700">
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                              <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{prediction.condition}</h5>
                              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {Math.round(prediction.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{prediction.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="doctorNotes" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Your Professional Assessment
                    </label>
                    <textarea
                      id="doctorNotes"
                      rows={3}
                      value={reviewData.doctorNotes}
                      onChange={(e) => setReviewData(prev => ({ ...prev, doctorNotes: e.target.value }))}
                      className="form-input text-sm sm:text-base"
                      placeholder="Provide your professional assessment, diagnosis, recommendations, and any additional notes..."
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Session Status
                    </label>
                    <select
                      id="status"
                      value={reviewData.status}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                      className="form-input text-sm sm:text-base"
                    >
                      <option value="reviewed">Reviewed</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={closeReviewModal}
                    className="btn-secondary w-full sm:w-auto text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReviewSession(selectedSession.id)}
                    disabled={!reviewData.doctorNotes.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base"
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
