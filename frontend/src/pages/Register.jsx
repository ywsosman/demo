import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);

    if (result.success) {
      // Navigate to landing page after registration to show welcome animation
      navigate('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="card p-7 sm:p-9">
          {/* Brand */}
          <div className="text-center">
            <span className="icon-chip icon-chip--brand mx-auto w-14 h-14">
              <HeartIcon />
            </span>
            <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Join MediDiagnose for smarter symptom insights
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${errors.firstName ? 'form-input--error' : ''}`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${errors.lastName ? 'form-input--error' : ''}`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Role selection */}
            <div>
              <label htmlFor="role" className="form-label">
                I am a
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`form-input ${errors.role ? 'form-input--error' : ''}`}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
              {errors.role && (
                <p className="form-error">{errors.role}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input pr-11 ${errors.password ? 'form-input--error' : ''}`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input pr-11 ${errors.confirmPassword ? 'form-input--error' : ''}`}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and conditions */}
            <label htmlFor="terms" className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <span>
                I agree to the{' '}
                <a href="#" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  Privacy Policy
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
