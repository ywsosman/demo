import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { diagnosisAPI } from '../services/api';
import toast from 'react-hot-toast';
import SymptomDropdown from '../components/SymptomDropdown';
import '../components/SymptomChecker.css';
import {
  HeartIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const SymptomImportanceChart = ({ wordImportance }) => {
  if (!wordImportance || wordImportance.length === 0) return null;

  const maxVal = Math.max(...wordImportance.map((w) => Math.abs(w.importance)));

  return (
    <div className="symptom-glass-card p-6">
      <h2 className="text-xl font-semibold text-green-950 dark:text-green-50 mb-2">
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

      <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-200/60 dark:border-teal-500/20 rounded-lg">
        <p className="text-xs text-teal-800 dark:text-teal-200">
          <strong>How to read this:</strong> The importance score reflects how much each symptom
          term influenced the AI&apos;s prediction. The analysis combines multiple explainability
          techniques to provide a robust and reliable assessment.
        </p>
      </div>
    </div>
  );
};

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

  
  useEffect(() => {
    diagnosisAPI
      .getSymptoms()
      .then((res) => setSymptomOptions(res.data.symptoms || []))
      .catch(() => {
        
      });
  }, []);

  const severityLabels = {
    1: 'Very Mild', 2: 'Mild', 3: 'Mild-Moderate', 4: 'Moderate',
    5: 'Moderate', 6: 'Moderate-Severe', 7: 'Severe', 8: 'Very Severe',
    9: 'Extremely Severe', 10: 'Emergency',
  };

  const severitySliderPct = `${((formData.severity - 1) / 9) * 100}%`;

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
      toast.success('Your diagnosis will be reviewed soon.');
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

  if (result) {
    const awaitingReview = !result.deliveredToPatient;
    const ai = result.aiPrediction;

    if (awaitingReview) {
      return (
        <div className="min-h-screen py-8 transition-colors duration-300">
          <div className="max-w-2xl mx-auto px-4 card p-8 text-center">
            <CheckCircleIcon className="mx-auto h-14 w-14 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Submission received</h1>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
              Your diagnosis will be reviewed soon.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our AI is analysing your symptoms in the background. A licensed physician will review the
              results before they are released to you. You can track progress in your history.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Session ID: {result.sessionId}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button type="button" onClick={handleStartNew} className="btn-secondary">New check</button>
              <button type="button" onClick={() => navigate('/patient/history')} className="btn-primary">
                View history
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300 font-sans">
        <motion.div
          className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div className="mb-4 sm:mb-6 md:mb-8" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/25 mb-3">
              <SparklesIcon className="h-3.5 w-3.5" />
              Analysis complete
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-950 dark:text-green-50 tracking-tight">
              Diagnosis Results
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 dark:text-green-100/70">
              AI-powered analysis of your symptoms
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mb-4 sm:mb-6 bg-yellow-50/90 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4 backdrop-blur-sm"
          >
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
          </motion.div>

          <motion.div className="space-y-4 sm:space-y-6" variants={stagger}>
            {ai?.matchedSymptoms && ai.matchedSymptoms.length > 0 && (
              <motion.div variants={fadeUp} className="symptom-glass-card p-4 sm:p-6">
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
              </motion.div>
            )}

            <motion.div variants={fadeUp} className="symptom-glass-card p-4 sm:p-6">
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
                                className="inline-flex px-2 py-1 text-xs bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200 rounded"
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
            </motion.div>

            {ai?.explanation && (
              <motion.div variants={fadeUp} className="symptom-glass-card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Analysis Explanation
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {ai.explanation}
                </p>
              </motion.div>
            )}

            {ai?.wordImportance?.length > 0 && (
              <motion.div variants={fadeUp}>
                <SymptomImportanceChart wordImportance={ai.wordImportance} />
              </motion.div>
            )}

            {ai?.precautions && ai.precautions.length > 0 && (
              <motion.div variants={fadeUp} className="symptom-glass-card p-6">
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
              </motion.div>
            )}

            <motion.div variants={fadeUp} className="symptom-glass-card p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Next Steps
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-teal-500 mt-0.5 mr-3 flex-shrink-0" />
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
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <button onClick={() => navigate('/patient/history')} className="symptom-submit-btn flex-1 text-sm sm:text-base">
              View All Sessions
            </button>
            <button onClick={handleStartNew} className="btn-secondary flex-1 text-sm sm:text-base rounded-xl">
              New Symptom Check
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <motion.div
        className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <motion.div className="text-center mb-6 sm:mb-8" variants={fadeUp}>
          <motion.div
            className="mx-auto mb-3 sm:mb-4 inline-flex p-3 rounded-2xl bg-gradient-to-br from-green-500/15 to-green-400/10 border border-green-500/25"
            whileHover={{ scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <HeartIcon className="h-10 w-10 sm:h-11 sm:w-11 text-[#22a84a] dark:text-green-400" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-950 dark:text-green-50 tracking-tight">
            Symptom Checker
          </h1>
          <p className="mt-2 text-sm sm:text-base symptom-text-muted px-4 max-w-md mx-auto">
            Select your symptoms from the dropdown or describe them for AI-powered health insights
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="symptom-glass-card p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {}
            {symptomOptions.length > 0 && (
              <motion.div variants={fadeUp}>
                <label className="block text-sm font-semibold symptom-label-accent mb-2">
                  Select Symptoms (Recommended)
                </label>
                <SymptomDropdown
                  symptoms={symptomOptions}
                  selected={formData.selectedSymptoms}
                  onChange={(selected) =>
                    setFormData((prev) => ({ ...prev, selectedSymptoms: selected }))
                  }
                />
                <p className="mt-2 text-xs symptom-text-muted">
                  Using the dropdown gives more accurate predictions. You can select multiple symptoms.
                </p>
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <label htmlFor="symptoms" className="block text-sm font-semibold symptom-label-accent mb-2">
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
                className={`symptom-field-input min-h-[5rem] ${errors.symptoms ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="Describe any additional symptoms or context..."
              />
              {errors.symptoms && <p className="mt-1 text-sm text-red-600">{errors.symptoms}</p>}
            </motion.div>

            <motion.div variants={fadeUp}>
              <label htmlFor="severity" className="block text-sm font-semibold symptom-label-accent mb-2">
                Severity Level: <span className="text-[#22a84a] dark:text-green-400">{formData.severity}/10</span>
              </label>
              <div className="space-y-3 px-0.5">
                <input
                  type="range"
                  id="severity"
                  name="severity"
                  min="1"
                  max="10"
                  value={formData.severity}
                  onChange={handleChange}
                  className="symptom-severity-slider"
                  style={{ '--slider-pct': severitySliderPct }}
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={formData.severity}
                  aria-label="Symptom severity level"
                />
                <div className="flex justify-between text-xs symptom-severity-label gap-2">
                  <span>1 - Mild</span>
                  <span className="symptom-severity-value text-center flex-1">
                    {severityLabels[formData.severity]}
                  </span>
                  <span>10 - Emergency</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <label htmlFor="duration" className="block text-sm font-semibold symptom-label-accent mb-2">
                How long have you had these symptoms? *
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={`symptom-field-input ${errors.duration ? 'border-red-400 focus:border-red-500' : ''}`}
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
            </motion.div>

            <motion.div variants={fadeUp}>
              <label htmlFor="additionalInfo" className="block text-sm font-semibold symptom-label-accent mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={2}
                value={formData.additionalInfo}
                onChange={handleChange}
                className="symptom-field-input"
                placeholder="Medical history, medications, allergies, recent travel..."
              />
            </motion.div>

            <motion.div variants={fadeUp} className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`symptom-submit-btn ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting your symptoms...
                  </div>
                ) : (
                  'Analyse Symptoms'
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-6 bg-slate-50 dark:bg-green-950/30 border border-slate-200 dark:border-green-800/40 rounded-xl p-4"
        >
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-[#22a84a] dark:text-green-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                Medical Disclaimer
              </h3>
              <p className="mt-1 text-sm symptom-text-muted">
                This tool provides AI-generated health insights for informational purposes only.
                It does not replace professional medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SymptomChecker;
