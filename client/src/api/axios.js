
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  // M-1: send the httpOnly `jwt`/`refreshToken` cookies the backend already
  // sets on login, instead of reading the token from localStorage and
  // attaching it as a Bearer header. httpOnly cookies can't be read by
  // JavaScript, so a stored/reflected XSS on this app can no longer
  // exfiltrate a live session token the way it could with localStorage.
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

     const isResearchEndpoint = url.includes("/research/");

    const isAuthEndpoint = url.includes("/change-password") || url.includes("/login");


    if (status === 401 && !isResearchEndpoint)  {
      localStorage.removeItem('role');
      localStorage.removeItem('collection');
      localStorage.removeItem('researcher');

     window.location.href = '/hmis';

        return new Promise(() => {});
    }
    if (status === 401 && isResearchEndpoint) {
      console.warn('[Auth] Access forbidden:', error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;