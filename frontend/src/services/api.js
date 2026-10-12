/**
 * Central API Service Configuration for CareerSense AI
 * Connects React frontend to Flask backend on http://127.0.0.1:5000/api
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
    ? (import.meta.env.VITE_API_BASE_URL.endsWith('/api')
        ? import.meta.env.VITE_API_BASE_URL
        : `${import.meta.env.VITE_API_BASE_URL}/api`)
    : 'http://127.0.0.1:5000/api'
);

import { getAuthToken } from './authService';

/**
 * Standard HTTP request wrapper with bearer token and JSON parsing
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth token if stored in localStorage or sessionStorage
  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Allow browser to set boundary for FormData
  if (options.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  } catch (netErr) {
    const error = new Error('Unable to connect to the server. Please make sure the backend is running.');
    error.status = 0;
    error.isNetworkError = true;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function get(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

export async function post(endpoint, data = {}, options = {}) {
  const isFormData = data instanceof FormData;
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function put(endpoint, data = {}, options = {}) {
  const isFormData = data instanceof FormData;
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function patch(endpoint, data = {}, options = {}) {
  const isFormData = data instanceof FormData;
  return apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: isFormData ? data : JSON.stringify(data),
  });
}

export async function del(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

// Authentication API Services
export async function registerUser(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function loginUser(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  return apiRequest('/auth/me', {
    method: 'GET',
  });
}

export async function logoutUser() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (e) {
    // Graceful logout even if server fails
  } finally {
    localStorage.removeItem('careersense_token');
    localStorage.removeItem('careersense_user');
  }
}

// System Health
export async function checkBackendHealth() {
  return apiRequest('/health', { method: 'GET' });
}

// Database Connection Test
export async function testDatabaseConnection() {
  return apiRequest('/db-test', { method: 'GET' });
}

// Dashboard mock / placeholder API ready for MySQL backend integration
export async function getDashboardData() {
  return {
    metrics: {
      resumeScore: 78,
      jobMatches: 12,
      skillsMatched: 24,
      skillsToImprove: 7,
    },
    careerMatch: {
      overall: 78,
      status: 'GOOD MATCH',
      tfidfSimilarity: 74,
      skillMatch: 82,
      experience: 74,
      education: 90,
    },
    resumeStatus: {
      filename: 'Resume_Manesh_2026.pdf',
      analyzed: true,
      pdfParsed: true,
      nlpReady: true,
    },
    recentMatches: [
      { id: 1, title: 'Frontend Developer', company: 'TechNova Solutions', match: 87, status: 'High Match' },
      { id: 2, title: 'Python Developer', company: 'DataCore Analytics', match: 78, status: 'Good Match' },
      { id: 3, title: 'Full Stack Developer', company: 'Nexus Systems', match: 71, status: 'Good Match' },
      { id: 4, title: 'Java Developer', company: 'Apex Enterprise', match: 62, status: 'Moderate Match' },
    ],
    skills: {
      matched: ['Python', 'React', 'JavaScript', 'HTML', 'CSS', 'Git', 'SQL', 'MongoDB'],
      missing: ['Docker', 'AWS', 'TypeScript', 'System Design'],
    },
    interview: {
      readiness: 72,
      technicalQuestions: 16,
      hrQuestions: 8,
      totalQuestions: 24,
    },
  };
}

export default {
  BASE_URL: API_BASE_URL,
  request: apiRequest,
  get,
  post,
  put,
  patch,
  delete: del,
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
  getCurrentUser,
  getDashboardData,
  checkBackendHealth,
  testDatabaseConnection,
};
