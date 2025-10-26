import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/layout/Navbar';
import AuroraBackground from './components/AuroraBackground';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import SymptomChecker from './pages/SymptomChecker';
import DiagnosisHistory from './pages/DiagnosisHistory';
import PatientProfile from './pages/PatientProfile';
import DoctorProfile from './pages/DoctorProfile';
import DoctorPatients from './pages/DoctorPatients';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen relative transition-colors duration-300 bg-white dark:bg-gray-900">
            {/* Aurora Background */}
            <AuroraBackground />
            
            <Navbar />
            <main className="relative z-0 pt-0">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />

              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Patient routes */}
              <Route 
                path="/patient/dashboard" 
                element={
                  <ProtectedRoute requiredRole="patient">
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patient/symptom-checker" 
                element={
                  <ProtectedRoute requiredRole="patient">
                    <SymptomChecker />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patient/history" 
                element={
                  <ProtectedRoute requiredRole="patient">
                    <DiagnosisHistory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patient/profile" 
                element={
                  <ProtectedRoute requiredRole="patient">
                    <PatientProfile />
                  </ProtectedRoute>
                } 
              />

              {/* Doctor routes */}
              <Route 
                path="/doctor/dashboard" 
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/doctor/profile" 
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/doctor/patients" 
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorPatients />
                  </ProtectedRoute>
                } 
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Toast notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                marginTop: '80px',
              },
              success: {
                duration: 2500,
                style: {
                  background: '#22c55e',
                  marginTop: '80px',
                },
              },
              error: {
                duration: 2500,
                style: {
                  background: '#ef4444',
                  marginTop: '80px',
                },
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

