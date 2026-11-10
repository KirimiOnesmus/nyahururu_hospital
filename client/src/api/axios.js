import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});


api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url    = error.config?.url || "";

    const isResearchEndpoint = /\/researchers?(\/|$)/.test(url);
    const isAuthEndpoint = url.includes("/change-password") || url.includes("/login");

    if (status === 401 && !isResearchEndpoint) {
      localStorage.removeItem('role');
      localStorage.removeItem('collection');
      localStorage.removeItem('researcher');
      localStorage.removeItem('token');
      window.location.href = '/hmis';
      return new Promise(() => {});
    }

    if (status === 403 && !isAuthEndpoint) {
      const msg = error.response?.data?.message || '';
      if (msg.includes('researcher token') || msg.includes('researcher token required')) {
        localStorage.removeItem('role');
        localStorage.removeItem('collection');
        localStorage.removeItem('researcher');
        localStorage.removeItem('token');
        window.location.href = '/hmis';
        return new Promise(() => {});
      }
    }

    if (status === 401 && isResearchEndpoint) {
      console.warn('[Auth] Access forbidden:', error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default api;