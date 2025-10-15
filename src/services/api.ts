import axios from 'axios';

declare global {
  interface Window {
    crypto?: {
      randomUUID: () => string;
    };
  }
}

const generateRequestId = () => {
  return window.crypto?.randomUUID() || 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
});
// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('guardshare_token');
    if (token && !config.headers['skip-auth']) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Add security headers
      config.headers['X-Request-ID'] = generateRequestId();
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
          config.headers['X-CSRF-TOKEN'] = csrfToken;
         }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data, config } = error.response || {};
    const url = config?.url || '';

    // Don't intercept 401s for link access, download, or view to allow custom handling
    if (status === 401 && (url.includes('/links/access/') || url.includes('/links/download/') || url.includes('/links/view/'))) {
      return Promise.reject(error);
    }
    
    if (status === 401) {
      // Enhanced auth handling
      localStorage.removeItem('guardshare_token');
      localStorage.removeItem('guardshare_user');
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    } 
    else if (status === 403) {
      window.location.href = '/forbidden';
    }
    else if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'] || 30;
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    // Standardize error response
    return Promise.reject({
      status: status || 500,
      message: data?.message || 'Network Error',
      code: data?.code,
      timestamp: new Date().toISOString()
    });
  }
);

// API Methods
export const authAPI = {
  login: (credentials: { username: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post('/auth/register', userData),
  
  refreshToken: () => 
    api.post('/auth/refresh', null, { 
      headers: { 'skip-auth': true } 
    }),
  
  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (data: { username?: string; email?: string }) =>
    api.put('/auth/profile', data)
};

export const filesAPI = {
  upload: (formData: FormData, onProgress?: (percentage: number) => void) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      }
    }),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    favorite?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/files', { params }),
  
  getRecent: () => api.get('/files/recent'),

  viewFile: (fileId: string) => 
    api.get(`/files/${fileId}/view`, { responseType: 'blob' }),
  
  download: (fileId: string) =>
    api.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  
  toggleFavorite: (fileId: string) =>
    api.patch(`/files/${fileId}/favorite`),
  
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
  
  // Admin endpoints
  adminGetAll: (params?: any) => api.get('/files/admin/all', { params })
};

export const linksAPI = {
  create: (linkData: any) => api.post('/links', linkData),
  
  getLinks: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    favorite?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/links', { params }),
  
  getRecent: () => api.get('/links/recent'),
  
  access: (linkId: string, credentials?: {
    password?: string;
    username?: string;
  }) => api.get(`/links/access/${linkId}`, { params: credentials }),
  
  download: (linkId: string, credentials?: {
    password?: string;
    username?: string;
  }) => api.get(`/links/download/${linkId}`, {
    params: credentials,
    responseType: 'blob'
  }),

  view: (linkId: string, credentials?: {
    password?: string;
    username?: string;
  }) => api.get(`/links/view/${linkId}`, {
    params: credentials,
    responseType: 'blob'
  }),
  
  toggle: (linkId: string) => api.patch(`/links/${linkId}/toggle`),
  toggleFavorite: (linkId: string) => api.patch(`/links/${linkId}/toggle-favorite`),
  
  deleteLink: (linkId: string) => api.delete(`/links/${linkId}`),
  updateLink: (linkId: string, linkData: any) => api.put(`/links/${linkId}`, linkData),
  
  // Admin endpoints
  adminGetAll: (params?: any) => api.get('/links/admin/all', { params })
};

export const usersAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/users', { params }),
  
  getUser: (userId: string) => api.get(`/users/${userId}`),
  
  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
  
  updateRole: (userId: string, role: 'user' | 'superuser') =>
    api.patch(`/users/${userId}/role`, { role }),

  updateStatus: (userId: string, isActive: boolean) =>
    api.patch(`/users/${userId}/status`, { isActive }),
  
  getActivityLogs: (userId: string, params?: {
    page?: number;
    limit?: number;
    action?: string;
  }) => api.get(`/users/${userId}/activity`, { params }),
  
  searchUsers: (q: string) => 
    api.get('/users/search/for-links', { params: { q } })
};

export default api;