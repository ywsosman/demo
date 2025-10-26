import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  IdentificationIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const PatientProfile = () => {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    age: '',
    gender: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    emergencyContact: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.profile) {
        setProfileData({
          age: response.data.profile.age || '',
          gender: response.data.profile.gender || '',
          medicalHistory: response.data.profile.medicalHistory || '',
          allergies: response.data.profile.allergies || '',
          currentMedications: response.data.profile.currentMedications || '',
          emergencyContact: response.data.profile.emergencyContact || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
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

    if (profileData.age && (isNaN(profileData.age) || profileData.age < 1 || profileData.age > 150)) {
      newErrors.age = 'Please enter a valid age between 1 and 150';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await updateProfile(profileData);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your personal information and medical details
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Information (Read-only) */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                  Full Name
                </label>
                <div className="form-input bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {user.firstName} {user.lastName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <EnvelopeIcon className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <div className="form-input bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <IdentificationIcon className="inline h-4 w-4 mr-1" />
                  Account Type
                </label>
                <div className="form-input bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                  {user.role}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Member Since
                </label>
                <div className="form-input bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <form onSubmit={handleSubmit} className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Medical Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="1"
                  max="150"
                  value={profileData.age}
                  onChange={handleChange}
                  className={`form-input ${errors.age ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your age"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <HeartIcon className="inline h-4 w-4 mr-1" />
                  Medical History
                </label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  rows={4}
                  value={profileData.medicalHistory}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Describe any significant medical conditions, surgeries, or chronic illnesses..."
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Include any past medical conditions, surgeries, or chronic illnesses that may be relevant to your care.
                </p>
              </div>

              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
                  Allergies
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  rows={3}
                  value={profileData.allergies}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="List any known allergies to medications, foods, or other substances..."
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Include drug allergies, food allergies, environmental allergies, etc.
                </p>
              </div>

              <div>
                <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Medications
                </label>
                <textarea
                  id="currentMedications"
                  name="currentMedications"
                  rows={3}
                  value={profileData.currentMedications}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="List all current medications, including dosages and frequency..."
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Include prescription medications, over-the-counter drugs, vitamins, and supplements.
                </p>
              </div>

              <div>
                <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <PhoneIcon className="inline h-4 w-4 mr-1" />
                  Emergency Contact
                </label>
                <textarea
                  id="emergencyContact"
                  name="emergencyContact"
                  rows={2}
                  value={profileData.emergencyContact}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Name, relationship, and phone number of emergency contact..."
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Provide the name, relationship, and contact information for someone to reach in case of emergency.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={saving}
                className={`btn-medical flex-1 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>

          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <IdentificationIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Privacy & Security
                </h3>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>Your medical information is encrypted and securely stored. Only you and authorized healthcare professionals can access this information. We follow strict HIPAA guidelines to protect your privacy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
