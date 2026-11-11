import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { clearAllSessions, getClientSessionId, setClientSessionId } from './session';
import { disconnectSocket } from './socket';

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
    config.headers['X-Client-Session-Id'] = getClientSessionId();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const sessionId = response.headers?.['x-client-session-id'];
    if (sessionId) setClientSessionId(sessionId);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url    = error.config?.url || "";

    if (status === 401 && error.response?.data?.code === 'SESSION_ACTIVE_ELSEWHERE') {
      disconnectSocket();
      window.location.assign('/hmis?reason=session-elsewhere');
      return new Promise(() => {});
    }

    if (status === 503 && error.response?.data?.code === 'MAINTENANCE_MODE' && localStorage.getItem('role') !== 'superadmin') {
      window.location.assign('/maintenance');
      return new Promise(() => {});
    }

    if (status === 429 && error.response?.headers?.['x-session-logged-out'] === 'true') {
      clearAllSessions();
      localStorage.removeItem('token');
      disconnectSocket();
      window.location.assign('/hmis?reason=rate-limit');
      return new Promise(() => {});
    }

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
