import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { diagnosisAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { usePageLoading } from '../contexts/LoadingOverlayContext';
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
import {
  normalizeStatus,
  statusLabel,
  statusColorClass,
  SESSION_STATUS,
  isReviewed,
  isAwaitingDoctor
} from '../utils/diagnosisStatus';

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
    finalDiagnosis: '',
    medications: '',
    instructions: '',
    agreedWithAi: true,
    action: 'finalize'
  });
  const [locking, setLocking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Trigger fade-in animation immediately on mount
    setTimeout(() => setIsVisible(true), 50);
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
      const reviewed = allSessions.filter(s => isReviewed(s.status));
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
      await diagnosisAPI.reviewSession(sessionId, {
        doctorNotes: reviewData.doctorNotes,
        finalDiagnosis: reviewData.finalDiagnosis,
        medications: reviewData.medications,
        instructions: reviewData.instructions,
        agreedWithAi: reviewData.agreedWithAi,
        action: reviewData.action,
        outcome: reviewData.action === 'needs_more_info' ? 'needs_more_info' : 'confirmed'
      });
      toast.success(
        reviewData.action === 'needs_more_info'
          ? 'Requested additional information from patient'
          : 'Diagnosis finalized — patient notified'
      );
      await fetchDashboardData();
      setSelectedSession(null);
      setReviewData({
        doctorNotes: '',
        finalDiagnosis: '',
        medications: '',
        instructions: '',
        agreedWithAi: true,
        action: 'finalize'
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit review. Please try again.';
      toast.error(errorMessage);
    }
  };

  const openReviewModal = async (session) => {
    setLocking(true);
    try {
      const lockRes = await diagnosisAPI.acquireLock(session.id || session._id);
      const locked = lockRes.data.session;
      setSelectedSession(locked);
      const top = locked.aiPrediction?.[0]?.condition || locked.predictedDisease || '';
      setReviewData({
        doctorNotes: locked.doctorNotes || '',
        finalDiagnosis: top,
        medications: '',
        instructions: '',
        agreedWithAi: true,
        action: 'finalize'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not acquire review lock');
    } finally {
      setLocking(false);
    }
  };

  const closeReviewModal = async () => {
    if (selectedSession) {
      try {
        await diagnosisAPI.releaseLock(selectedSession.id || selectedSession._id);
      } catch {
        /* ignore */
      }
    }
    setSelectedSession(null);
    setReviewData({
      doctorNotes: '',
      finalDiagnosis: '',
      medications: '',
      instructions: '',
      agreedWithAi: true,
      action: 'finalize'
    });
  };

  const renderWordImportance = (items) => {
    if (!items?.length) return null;
    const maxImp = Math.max(...items.map((w) => Math.abs(w.importance || 0)), 0.001);
    return (
      <div className="mt-3">
        <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SHAP / LIME word importance
        </h4>
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 12).map((w, i) => {
            const intensity = Math.min(1, Math.abs(w.importance) / maxImp);
            return (
              <span
                key={i}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: `rgba(34, 168, 74, ${0.15 + intensity * 0.55})`,
                  color: intensity > 0.5 ? '#fff' : 'inherit'
                }}
                title={`importance: ${w.importance?.toFixed(3)}`}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>
    );
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

  usePageLoading(loading);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div 
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 800ms ease-out, transform 800ms ease-out'
          }}
        >
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="page-title">
              Welcome, Dr. {user.firstName}
            </h1>
            <p className="page-subtitle">
              Review patient diagnoses and provide professional medical guidance
            </p>
          </div>

          {/* Stats Overview */}
          <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="stat-card">
              <span className="icon-chip icon-chip--info">
                <ClipboardDocumentListIcon />
              </span>
              <div>
                <p className="stat-card-label">Total Sessions</p>
                <p className="stat-card-value">{stats.totalSessions}</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="icon-chip icon-chip--warning">
                <ClockIcon />
              </span>
              <div>
                <p className="stat-card-label">Pending Review</p>
                <p className="stat-card-value">{stats.pendingSessions}</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="icon-chip icon-chip--brand">
                <CheckCircleIcon />
              </span>
              <div>
                <p className="stat-card-label">Reviewed</p>
                <p className="stat-card-value">{stats.reviewedSessions}</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="icon-chip icon-chip--neutral">
                <UserGroupIcon />
              </span>
              <div>
                <p className="stat-card-label">Total Patients</p>
                <p className="stat-card-value">{stats.totalPatients}</p>
              </div>
            </div>
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
            <div className="animate-fadeIn">
                {pendingSessions.length === 0 ? (
                  <div className="card p-12 text-center">
                    <span className="icon-chip icon-chip--brand mx-auto w-14 h-14">
                      <CheckCircleIcon />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">All caught up!</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      No pending diagnosis sessions to review at this time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="card card-hover p-3 sm:p-4 md:p-6"
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
                        disabled={locking}
                        className="btn-primary w-full sm:w-auto"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        {locking ? 'Acquiring lock…' : 'Acquire lock & review'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
                  </div>
                )}
              </div>
          )}

          {/* Reviewed Tab Content */}
          {activeTab === 'reviewed' && (
            <div className="animate-fadeIn">
                {reviewedSessions.length === 0 ? (
                  <div className="card p-12 text-center">
                    <span className="icon-chip icon-chip--neutral mx-auto w-14 h-14">
                      <ClipboardDocumentListIcon />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No reviewed sessions yet</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Sessions you review will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewedSessions.map((session) => (
                    <div 
                      key={session.id || session._id} 
                      className="card card-hover p-3 sm:p-4 md:p-6"
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
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColorClass(session.status)}`}>
                                {statusLabel(session.status)}
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
          )}
          </div>
        </div>

        {/* Review Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-2 sm:p-4">
            <div className="relative top-4 sm:top-10 md:top-20 mx-auto p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 w-full sm:w-11/12 md:w-3/4 lg:w-1/2 max-w-2xl shadow-2xl rounded-2xl bg-white dark:bg-slate-800 mb-4 animate-fadeIn">
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
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">AI Predictions (Top 3):</h4>
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
                      {renderWordImportance(selectedSession.wordImportance)}
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="finalDiagnosis" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Final diagnosis
                    </label>
                    <input
                      id="finalDiagnosis"
                      type="text"
                      value={reviewData.finalDiagnosis}
                      onChange={(e) => setReviewData(prev => ({ ...prev, finalDiagnosis: e.target.value }))}
                      className="form-input text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label htmlFor="doctorNotes" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                      Clinical notes
                    </label>
                    <textarea
                      id="doctorNotes"
                      rows={3}
                      value={reviewData.doctorNotes}
                      onChange={(e) => setReviewData(prev => ({ ...prev, doctorNotes: e.target.value }))}
                      className="form-input text-sm sm:text-base"
                      placeholder="Assessment, recommendations, and sign-off notes..."
                    />
                  </div>
                  <div>
                    <label htmlFor="medications" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prescription / medications
                    </label>
                    <textarea
                      id="medications"
                      rows={2}
                      value={reviewData.medications}
                      onChange={(e) => setReviewData(prev => ({ ...prev, medications: e.target.value }))}
                      className="form-input text-sm sm:text-base"
                      placeholder="Medications and dosage..."
                    />
                  </div>
                  <div>
                    <label htmlFor="instructions" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Patient instructions
                    </label>
                    <textarea
                      id="instructions"
                      rows={2}
                      value={reviewData.instructions}
                      onChange={(e) => setReviewData(prev => ({ ...prev, instructions: e.target.value }))}
                      className="form-input text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label htmlFor="action" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Review action
                    </label>
                    <select
                      id="action"
                      value={reviewData.action}
                      onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                      className="form-input text-sm sm:text-base"
                    >
                      <option value="finalize">Finalize & deliver to patient (PDF)</option>
                      <option value="needs_more_info">Request more information</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={reviewData.agreedWithAi}
                      onChange={(e) => setReviewData(prev => ({ ...prev, agreedWithAi: e.target.checked }))}
                    />
                    I agree with the AI top prediction
                  </label>
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
