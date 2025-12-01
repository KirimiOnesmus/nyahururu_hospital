import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use((config => {
    const token = localStorage.getItem('token'); // assuming token is stored in localStorage
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
        
    return config;
}));

export default api;