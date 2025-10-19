import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds (2 minutes) - needed for first AI model prediction
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

export const diagnosisAPI = {
  submit: (diagnosisData) => api.post('/diagnosis/submit', diagnosisData),
  getHistory: () => api.get('/diagnosis/history'),
  getPending: () => api.get('/diagnosis/pending'),
  getAll: () => api.get('/diagnosis/all'),
  getSession: (sessionId) => api.get(`/diagnosis/${sessionId}`),
  reviewSession: (sessionId, reviewData) => api.put(`/diagnosis/${sessionId}/review`, reviewData),
  getStats: () => api.get('/diagnosis/stats/overview'),
};

export const userAPI = {
  getPatients: () => api.get('/users/patients'),
  getPatient: (patientId) => api.get(`/users/patients/${patientId}`),
  searchPatients: (query) => api.get(`/users/search/patients?q=${query}`),
  getActivity: (userId) => api.get(`/users/activity/${userId || ''}`),
};

export default api;

