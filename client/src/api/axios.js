
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';



const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('collection');
    
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