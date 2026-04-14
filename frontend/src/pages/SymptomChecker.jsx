import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosisAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HeartIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Searchable multi-select symptom dropdown
// ---------------------------------------------------------------------------

const SymptomDropdown = ({ symptoms, selected, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query
    ? symptoms.filter(
        (s) =>
          s.label.toLowerCase().includes(query.toLowerCase()) ||
          s.id.toLowerCase().includes(query.toLowerCase())
      )
    : symptoms;

  const toggle = (symptom) => {
    if (selected.find((s) => s.id === symptom.id)) {
      onChange(selected.filter((s) => s.id !== symptom.id));
    } else {
      onChange([...selected, symptom]);
    }
  };

  const remove = (symptom) => {
    onChange(selected.filter((s) => s.id !== symptom.id));
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-medical-100 text-medical-800 dark:bg-medical-900/40 dark:text-medical-200"
            >
              {s.label}
              <button
                type="button"
                onClick={() => remove(s)}
                className="hover:text-red-600 transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search symptoms..."
          className="form-input pl-9 pr-9"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Dropdown list */}
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 text-sm">
          {filtered.length === 0 ? (
            <li className="px-4 py-2 text-gray-500">No symptoms found</li>
          ) : (
            filtered.map((s) => {
              const isSelected = selected.some((sel) => sel.id === s.id);
              return (
                <li
                  key={s.id}
                  onClick={() => toggle(s)}
                  className={`cursor-pointer select-none px-4 py-2 flex items-center justify-between hover:bg-medical-50 dark:hover:bg-gray-700 ${
                    isSelected
                      ? 'bg-medical-50 dark:bg-gray-700 font-medium'
                      : ''
                  }`}
                >
                  <span className="text-gray-900 dark:text-white">
                    {s.label}
                  </span>
                  {isSelected && (
                    <CheckCircleIcon className="h-4 w-4 text-medical-600" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Unified AI Explainability visualization
// ---------------------------------------------------------------------------

const SymptomImportanceChart = ({ wordImportance }) => {
  if (!wordImportance || wordImportance.length === 0) return null;

  const maxVal = Math.max(...wordImportance.map((w) => Math.abs(w.importance)));

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        AI Explainability: Key Symptom Analysis
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        The AI model analysed your symptoms and ranked each term by its influence on the prediction.
        Words in <span className="text-red-600 font-medium">red</span> strongly support the diagnosis,
        while words in <span className="text-blue-600 font-medium">blue</span> had a lesser or opposing effect.
      </p>

      <div className="space-y-2.5">
        {wordImportance.map((item, idx) => {
          const absVal = Math.abs(item.importance);
          const intensity = maxVal > 0 ? Math.min((absVal / maxVal) * 100, 100) : 0;
          const isPositive = item.importance > 0;
          const barWidth = Math.max(intensity, 8);

          return (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-32 sm:w-40 text-sm font-medium text-gray-900 dark:text-white text-right truncate">
                {item.word}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-7 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                      isPositive
                        ? 'bg-gradient-to-r from-red-300 to-red-500 dark:from-red-700 dark:to-red-500'
                        : 'bg-gradient-to-r from-blue-200 to-blue-400 dark:from-blue-800 dark:to-blue-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  >
                    {intensity > 25 && (
                      <span className="text-xs font-medium text-white whitespace-nowrap">
                        {(absVal * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                {intensity <= 25 && (
                  <span className="text-xs text-gray-500 w-10">{(absVal * 100).toFixed(0)}%</span>
                )}
                {isPositive && idx < 3 && (
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded whitespace-nowrap">
                    Key
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>How to read this:</strong> The importance score reflects how much each symptom
          term influenced the AI&apos;s prediction. The analysis combines multiple explainability
          techniques to provide a robust and reliable assessment.
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SymptomChecker = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    symptoms: '',
    selectedSymptoms: [],
    severity: 5,
    duration: '',
    additionalInfo: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [symptomOptions, setSymptomOptions] = useState([]);

  // Fetch symptom vocabulary on mount
  useEffect(() => {
    diagnosisAPI
      .getSymptoms()
      .then((res) => setSymptomOptions(res.data.symptoms || []))
      .catch(() => {
        /* vocabulary unavailable — free-text still works */
      });
  }, []);

  const severityLabels = {
    1: 'Very Mild', 2: 'Mild', 3: 'Mild-Moderate', 4: 'Moderate',
    5: 'Moderate', 6: 'Moderate-Severe', 7: 'Severe', 8: 'Very Severe',
    9: 'Extremely Severe', 10: 'Emergency',
  };

  const severityColors = {
    1: 'text-green-600', 2: 'text-green-600', 3: 'text-green-500',
    4: 'text-yellow-500', 5: 'text-yellow-500', 6: 'text-yellow-600',
    7: 'text-orange-500', 8: 'text-red-500', 9: 'text-red-600', 10: 'text-red-700',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const hasDropdown = formData.selectedSymptoms.length > 0;
    const hasText = formData.symptoms.trim().length >= 5;

    if (!hasDropdown && !hasText) {
      newErrors.symptoms =
        'Please select symptoms from the dropdown or describe them in the text area (at least 5 characters)';
    }
    if (!formData.duration.trim()) {
      newErrors.duration = 'Please specify how long you have had these symptoms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        symptoms: formData.symptoms,
        selectedSymptoms: formData.selectedSymptoms.map((s) => s.id),
        severity: Number(formData.severity),
        duration: formData.duration,
        additionalInfo: formData.additionalInfo,
      };
      const response = await diagnosisAPI.submit(payload);
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
      selectedSymptoms: [],
      severity: 5,
      duration: '',
      additionalInfo: '',
    });
    setResult(null);
    setErrors({});
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // -----------------------------------------------------------------------
  // Results view
  // -----------------------------------------------------------------------

  if (result) {
    const ai = result.aiPrediction;
    return (
      <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Diagnosis Results
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              AI-powered analysis of your symptoms
            </p>
          </div>

          {/* Warning */}
          <div className="mb-4 sm:mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 sm:p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="ml-2 sm:ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Important Medical Disclaimer
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                  This AI analysis is for informational purposes only and should not replace
                  professional medical advice. Please consult with a healthcare professional.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Matched symptoms */}
            {ai?.matchedSymptoms && ai.matchedSymptoms.length > 0 && (
              <div className="card p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Recognised Symptoms
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ai.matchedSymptoms.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex px-2.5 py-1 text-xs bg-medical-100 text-medical-800 dark:bg-medical-900/40 dark:text-medical-200 rounded-full"
                    >
                      {typeof s === 'string' ? s : s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Predictions */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                AI Analysis Results
              </h2>

              {ai && ai.predictions.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {ai.predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                          {prediction.condition}
                        </h3>
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getConfidenceColor(
                            prediction.confidence
                          )} dark:bg-opacity-20 self-start sm:self-auto whitespace-nowrap`}
                        >
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
                              <span
                                key={idx}
                                className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                              >
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
            {ai?.explanation && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Analysis Explanation
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {ai.explanation}
                </p>
              </div>
            )}

            {/* AI Explainability */}
            {ai?.wordImportance?.length > 0 && (
              <SymptomImportanceChart wordImportance={ai.wordImportance} />
            )}

            {/* Precautions */}
            {ai?.precautions && ai.precautions.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Precautions
                </h2>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  {ai.precautions.map((p, idx) => (
                    <li key={idx} className="flex items-start">
                      <InformationCircleIcon className="h-4 w-4 text-medical-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="capitalize">{p}</span>
                    </li>
                  ))}
                </ul>
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
                      Session ID: #{result.sessionId}. You can view this in your history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button onClick={() => navigate('/patient/history')} className="btn-primary flex-1 text-sm sm:text-base">
              View All Sessions
            </button>
            <button onClick={handleStartNew} className="btn-secondary flex-1 text-sm sm:text-base">
              New Symptom Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Form view
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <HeartIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-medical-600 mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Symptom Checker
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 px-4">
            Select your symptoms from the dropdown or describe them for AI-powered health insights
          </p>
        </div>

        {/* Form */}
        <div className="card p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Symptom Dropdown */}
            {symptomOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Symptoms (Recommended)
                </label>
                <SymptomDropdown
                  symptoms={symptomOptions}
                  selected={formData.selectedSymptoms}
                  onChange={(selected) =>
                    setFormData((prev) => ({ ...prev, selectedSymptoms: selected }))
                  }
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Using the dropdown gives more accurate predictions. You can select multiple symptoms.
                </p>
              </div>
            )}

            {/* Free-text symptoms */}
            <div>
              <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {symptomOptions.length > 0
                  ? 'Additional Details (Optional if symptoms selected above)'
                  : 'Describe your symptoms *'}
              </label>
              <textarea
                id="symptoms"
                name="symptoms"
                rows={3}
                value={formData.symptoms}
                onChange={handleChange}
                className={`form-input ${errors.symptoms ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Describe any additional symptoms or context..."
              />
              {errors.symptoms && <p className="mt-1 text-sm text-red-600">{errors.symptoms}</p>}
            </div>

            {/* Severity */}
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
              {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
            </div>

            {/* Additional Info */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={2}
                value={formData.additionalInfo}
                onChange={handleChange}
                className="form-input"
                placeholder="Medical history, medications, allergies, recent travel..."
              />
            </div>

            {/* Submit */}
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
                      Analysing Symptoms with AI Model...
                    </div>
                    <span className="text-xs mt-1 opacity-90">
                      First prediction may take 20-30 seconds (loading model)
                    </span>
                  </div>
                ) : (
                  'Analyse Symptoms'
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
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
