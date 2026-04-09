
import api from './axios';

export const loginUser = async (email, password) => { 
  const res = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', res.data.token); 
  return res.data;
};

//RESEARCHER REGISTRATION & AUTH


export const registerResearcher = async (formData) => {
  const response = await api.post('/researchers/register', {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    institution: formData.institution,
    discipline: formData.discipline,
    qualification: formData.qualification,
    bio: formData.bio,
    password: formData.password,
  });
  

  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('role', response.data.researcher?.role || 'researcher');
    localStorage.setItem('collection', 'researchers');
  }
  
  return response.data;
};
 

export const verifyResearcherEmail = async (token, email) => {
  const response = await api.post('/researchers/verify-email', {
    token,
    email,
  });
  return response.data;
};
 

export const loginResearcher = async (email, password) => {
  const response = await api.post('/researchers/login', {
    email,
    password,
  });
 

  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('role', response.data.researcher?.role || 'researcher');
    localStorage.setItem('collection', 'researchers');
  }
 
  return response.data;
};
 

export const getResearcherProfile = async () => {
  const response = await api.get('/researchers/me');
  return response.data;
};
 

export const updateResearcherProfile = async (updates) => {
  const response = await api.put('/researchers/profile', updates);
  return response.data;
};
 

export const changeResearcherPassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/researchers/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return response.data;
};
 

export const forgotResearcherPassword = async (email) => {
  const response = await api.post('/researchers/forgot-password', {
    email,
  });
  return response.data;
};
 

export const resetResearcherPassword = async (token, email, password, confirmPassword) => {
  const response = await api.post('/researchers/reset-password', {
    token,
    email,
    password,
    confirmPassword,
  });
  return response.data;
};
 

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('collection');
  localStorage.removeItem('researcher');
};
 

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
 

export const getToken = () => {
  return localStorage.getItem('token');
};
 

export const getUserRole = () => {
  return localStorage.getItem('role');
};

export const isResearcher = () => {
  return localStorage.getItem('collection') === 'researchers';
};