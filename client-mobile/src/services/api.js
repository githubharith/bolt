import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get API URL from environment or use default
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('guardshare_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('guardshare_token');
      await AsyncStorage.removeItem('guardshare_user');
      // You might want to navigate to login screen here
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const filesAPI = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    }),

  getAll: (params) => api.get('/files', { params }),
  getRecent: () => api.get('/files/recent'),
  download: (fileId) => api.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  toggleFavorite: (fileId) => api.patch(`/files/${fileId}/favorite`),
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

export const linksAPI = {
  create: (linkData) => api.post('/links', linkData),
  getAll: (params) => api.get('/links', { params }),
  getRecent: () => api.get('/links/recent'),
  access: (linkId, params) => api.get(`/links/access/${linkId}`, { params }),
  download: (linkId, params) => 
    api.get(`/links/download/${linkId}`, {
      params,
      responseType: 'blob',
    }),
  toggle: (linkId) => api.patch(`/links/${linkId}/toggle`),
  delete: (linkId) => api.delete(`/links/${linkId}`),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  get: (userId) => api.get(`/users/${userId}`),
  delete: (userId) => api.delete(`/users/${userId}`),
  updateRole: (userId, role) => api.patch(`/users/${userId}/role`, { role }),
  search: (query) => api.get('/users/search/for-links', { params: { q: query } }),
};

export default api;