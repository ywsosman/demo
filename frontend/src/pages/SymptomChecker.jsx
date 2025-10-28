import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosisAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HeartIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const SymptomChecker = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    symptoms: '',
    severity: 5,
    duration: '',
    additionalInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const severityLabels = {
    1: 'Very Mild',
    2: 'Mild',
    3: 'Mild-Moderate',
    4: 'Moderate',
    5: 'Moderate',
    6: 'Moderate-Severe',
    7: 'Severe',
    8: 'Very Severe',
    9: 'Extremely Severe',
    10: 'Emergency'
  };

  const severityColors = {
    1: 'text-green-600',
    2: 'text-green-600',
    3: 'text-green-500',
    4: 'text-yellow-500',
    5: 'text-yellow-500',
    6: 'text-yellow-600',
    7: 'text-orange-500',
    8: 'text-red-500',
    9: 'text-red-600',
    10: 'text-red-700'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symptoms.trim()) {
      newErrors.symptoms = 'Please describe your symptoms';
    } else if (formData.symptoms.trim().length < 10) {
      newErrors.symptoms = 'Please provide more details about your symptoms';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'Please specify how long you have had these symptoms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await diagnosisAPI.submit(formData);
      setResult(response.data);
      toast.success('Diagnosis analysis completed!');
    } catch (error) {
      console.error('Diagnosis submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit diagnosis');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setFormData({
      symptoms: '',
      severity: 5,
      duration: '',
      additionalInfo: ''
    });
    setResult(null);
    setErrors({});
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (result) {
    return (
      <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Diagnosis Results</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              AI-powered analysis of your symptoms
            </p>
          </div>

          {/* Warning Banner */}
          <div className="mb-4 sm:mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 sm:p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="ml-2 sm:ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Important Medical Disclaimer
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                  This AI analysis is for informational purposes only and should not replace professional medical advice. 
                  Please consult with a healthcare professional for proper diagnosis and treatment.
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4 sm:space-y-6">
            {/* AI Predictions */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                AI Analysis Results
              </h2>
              
              {result.aiPrediction && result.aiPrediction.predictions.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {result.aiPrediction.predictions.map((prediction, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                          {prediction.condition}
                        </h3>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getConfidenceColor(prediction.confidence)} dark:bg-opacity-20 self-start sm:self-auto whitespace-nowrap`}>
                          {Math.round(prediction.confidence * 100)}% confidence
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {prediction.description}
                      </p>
                      
                      {prediction.matchedSymptoms && prediction.matchedSymptoms.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Matched Symptoms:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {prediction.matchedSymptoms.map((symptom, idx) => (
                              <span key={idx} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {prediction.recommendations && prediction.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Recommendations:
                          </h4>
                          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            {prediction.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No clear predictions found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Please consult with a healthcare professional for proper evaluation.
                  </p>
                </div>
              )}
            </div>

            {/* AI Explanation */}
            {result.aiPrediction && result.aiPrediction.explanation && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Analysis Explanation
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {result.aiPrediction.explanation}
                </p>
              </div>
            )}

            {/* SHAP Word Importance Visualization */}
            {result.aiPrediction && result.aiPrediction.wordImportance && result.aiPrediction.wordImportance.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  AI Explainability: Key Symptom Words
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  The following words from your symptom description had the most influence on the AI&apos;s prediction. 
                  Words highlighted in <span className="text-red-600 font-medium">red/pink</span> contributed positively to the diagnosis.
                </p>
                
                <div className="space-y-3">
                  {result.aiPrediction.wordImportance.map((item, idx) => {
                    // Calculate color intensity based on importance value
                    const absImportance = Math.abs(item.importance);
                    const maxImportance = Math.max(...result.aiPrediction.wordImportance.map(w => Math.abs(w.importance)));
                    const intensity = Math.min((absImportance / maxImportance) * 100, 100);
                    
                    // Positive importance = red/pink, Negative = blue (less relevant)
                    const bgColor = item.importance > 0 
                      ? `rgba(239, 68, 68, ${intensity / 100 * 0.3 + 0.1})`  // Red with varying opacity
                      : `rgba(59, 130, 246, ${intensity / 100 * 0.2})`;  // Blue with low opacity
                    
                    const textColor = item.importance > 0 ? 'text-red-900' : 'text-blue-900';
                    const borderColor = item.importance > 0 ? 'border-red-200' : 'border-blue-200';
                    
                    return (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${borderColor}`}
                        style={{ backgroundColor: bgColor }}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`text-lg font-medium ${textColor}`}>
                            &ldquo;{item.word}&rdquo;
                          </span>
                          {item.importance > 0 && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                              Key symptom
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Impact: {(item.importance * 100).toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>How to read this:</strong> The AI model analyzed each word in your symptom description. 
                    Words with higher positive impact scores were more influential in predicting the disease. 
                    This visualization uses SHAP (SHapley Additive exPlanations) to make the AI&apos;s decision-making process transparent.
                  </p>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Next Steps
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Doctor Review Pending
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Your case has been submitted for professional medical review. 
                      You will be notified when a doctor reviews your case.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Track Your Session
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Session ID: #{result.sessionId}. You can view this session in your history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/patient/history')}
              className="btn-primary flex-1 text-sm sm:text-base"
            >
              View All Sessions
            </button>
            <button
              onClick={handleStartNew}
              className="btn-secondary flex-1 text-sm sm:text-base"
            >
              New Symptom Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <HeartIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-medical-600 mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Symptom Checker</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 px-4">
            Describe your symptoms and get AI-powered health insights
          </p>
        </div>

        {/* Form */}
        <div className="card p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Symptoms Description */}
            <div>
              <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe your symptoms *
              </label>
              <textarea
                id="symptoms"
                name="symptoms"
                rows={4}
                value={formData.symptoms}
                onChange={handleChange}
                className={`form-input ${errors.symptoms ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Please describe your symptoms in detail. For example: 'I have a headache, feel nauseous, and have been experiencing fatigue for the past 2 days...'"
              />
              {errors.symptoms && (
                <p className="mt-1 text-sm text-red-600">{errors.symptoms}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Be as specific as possible. Include when symptoms started, how they feel, and any patterns you notice.
              </p>
            </div>

            {/* Severity Scale */}
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Level: {formData.severity}/10
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  id="severity"
                  name="severity"
                  min="1"
                  max="10"
                  value={formData.severity}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>1 - Mild</span>
                  <span className={`font-medium ${severityColors[formData.severity]}`}>
                    {severityLabels[formData.severity]}
                  </span>
                  <span>10 - Emergency</span>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How long have you had these symptoms? *
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={`form-input ${errors.duration ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="">Select duration</option>
                <option value="Less than 1 hour">Less than 1 hour</option>
                <option value="1-6 hours">1-6 hours</option>
                <option value="6-24 hours">6-24 hours</option>
                <option value="1-3 days">1-3 days</option>
                <option value="3-7 days">3-7 days</option>
                <option value="1-2 weeks">1-2 weeks</option>
                <option value="2-4 weeks">2-4 weeks</option>
                <option value="More than 1 month">More than 1 month</option>
              </select>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
              )}
            </div>

            {/* Additional Information */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={3}
                value={formData.additionalInfo}
                onChange={handleChange}
                className="form-input"
                placeholder="Any additional context, recent travel, medications, allergies, or other relevant information..."
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Include any relevant medical history, current medications, or recent changes in your health.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-medical ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing Symptoms with AI Model...
                    </div>
                    <span className="text-xs mt-1 opacity-90">
                      First prediction may take 20-30 seconds (loading model)
                    </span>
                  </div>
                ) : (
                  'Analyze Symptoms'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Medical Disclaimer
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                This tool provides AI-generated health insights for informational purposes only. 
                It does not replace professional medical advice, diagnosis, or treatment. 
                Always consult with qualified healthcare professionals for medical concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
