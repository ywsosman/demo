import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  IdentificationIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DoctorProfile = () => {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '',
    hospital: ''
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
          specialization: response.data.profile.specialization || '',
          licenseNumber: response.data.profile.licenseNumber || '',
          yearsOfExperience: response.data.profile.yearsOfExperience || '',
          hospital: response.data.profile.hospital || ''
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

    if (profileData.yearsOfExperience && (isNaN(profileData.yearsOfExperience) || profileData.yearsOfExperience < 0 || profileData.yearsOfExperience > 70)) {
      newErrors.yearsOfExperience = 'Please enter a valid number of years (0-70)';
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

  const specializations = [
    'Anesthesiology',
    'Cardiology',
    'Dermatology',
    'Emergency Medicine',
    'Endocrinology',
    'Family Medicine',
    'Gastroenterology',
    'General Surgery',
    'Hematology',
    'Infectious Disease',
    'Internal Medicine',
    'Nephrology',
    'Neurology',
    'Obstetrics and Gynecology',
    'Oncology',
    'Ophthalmology',
    'Orthopedic Surgery',
    'Otolaryngology',
    'Pathology',
    'Pediatrics',
    'Plastic Surgery',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Rheumatology',
    'Urology',
    'Other'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Manage your professional information and credentials
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Basic Information (Read-only) */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                  Full Name
                </label>
                <div className="form-input bg-gray-50 text-gray-600 dark:text-gray-300">
                  Dr. {user.firstName} {user.lastName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <EnvelopeIcon className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <div className="form-input bg-gray-50 text-gray-600 dark:text-gray-300">
                  {user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <IdentificationIcon className="inline h-4 w-4 mr-1" />
                  Account Type
                </label>
                <div className="form-input bg-gray-50 text-gray-600 dark:text-gray-300 capitalize">
                  {user.role}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Member Since
                </label>
                <div className="form-input bg-gray-50 text-gray-600 dark:text-gray-300">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <form onSubmit={handleSubmit} className="card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Professional Information</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <AcademicCapIcon className="inline h-4 w-4 mr-1" />
                  Medical Specialization
                </label>
                <select
                  id="specialization"
                  name="specialization"
                  value={profileData.specialization}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select your specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select your primary area of medical specialization.
                </p>
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <IdentificationIcon className="inline h-4 w-4 mr-1" />
                  Medical License Number
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={profileData.licenseNumber}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your medical license number"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your professional medical license number for verification purposes.
                </p>
              </div>

              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <ClockIcon className="inline h-4 w-4 mr-1" />
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  min="0"
                  max="70"
                  value={profileData.yearsOfExperience}
                  onChange={handleChange}
                  className={`form-input ${errors.yearsOfExperience ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter years of practice"
                />
                {errors.yearsOfExperience && (
                  <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Total years of medical practice experience.
                </p>
              </div>

              <div>
                <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                  Hospital/Clinic Affiliation
                </label>
                <input
                  type="text"
                  id="hospital"
                  name="hospital"
                  value={profileData.hospital}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your primary hospital or clinic affiliation"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Name of the hospital, clinic, or medical institution where you practice.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={saving}
                className={`btn-primary flex-1 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* Professional Verification Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <IdentificationIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Professional Verification
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Your medical license and credentials are subject to verification. 
                    Please ensure all information is accurate and up-to-date. 
                    Any misrepresentation of medical credentials is strictly prohibited 
                    and may result in account suspension.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Statistics */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Practice Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Sessions Reviewed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Patients Helped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">95%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
