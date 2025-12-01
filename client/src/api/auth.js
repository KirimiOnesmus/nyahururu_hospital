import api from './axios';

export const loginUser = async (email, password) => { 
  const res = await api.post('/auth/login', { email:email, password:password });
  localStorage.setItem('token', res.data.token); 
  return res.data;
};