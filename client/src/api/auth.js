import api from './axios';



export const loginUser = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};
 

export const registerResearcher = async (formData) => {
  try {
    const response = await api.post('/researchers/register', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || '',
      institution: formData.institution || '',
      discipline: formData.discipline || '',
      qualification: formData.qualification || '',
      bio: formData.bio || '',
      password: formData.password,
    });

        const data = response.data.data || response.data;

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.researcher?.role || 'researcher');
      localStorage.setItem('collection', 'researchers');
      localStorage.setItem('researcher', JSON.stringify(data.researcher));
    }

    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};


export const verifyResearcherEmail = async (token, email) => {
  try {
    const response = await api.post('/researchers/verify-email', {
      token,
      email,
    });
        const data = response.data.data || response.data;
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Email verification failed' };
  }
};


export const loginResearcher = async (email, password) => {
  try {
    const response = await api.post('/researchers/login', {
      email,
      password,
    });

        const data = response.data.data || response.data;

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.researcher?.role || 'researcher');
      localStorage.setItem('collection', 'researchers');
      localStorage.setItem('researcher', JSON.stringify(data.researcher));
    }

    return data;

    

  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};


export const getResearcherProfile = async () => {
  try {
    const response = await api.get('/researchers/me');
        const data = response.data.data || response.data;
    if (data.researcher) {
      localStorage.setItem('researcher', JSON.stringify(data.researcher));
    }

    return data;

  } catch (error) {

    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};


export const updateResearcherProfile = async (updates) => {
  try {
    const response = await api.put('/researchers/profile', updates);
   
        const data = response.data.data || response.data;
   
    if (data.researcher) {
      localStorage.setItem('researcher', JSON.stringify(data.researcher));
    }
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update profile' };
  }
};




export const changeResearcherPassword = async (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  try {
    const response = await api.post('/researchers/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });

        const data = response.data.data || response.data;

    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Password change failed' };
  }
};

export const forgotResearcherPassword = async (email) => {
  try {
    const response = await api.post('/researchers/forgot-password', {
      email,
    });

        const data = response.data.data || response.data;
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Password reset request failed' };
  }
};


export const resetResearcherPassword = async (
  token,
  email,
  password,
  confirmPassword
) => {
  try {
    const response = await api.post('/researchers/reset-password', {
      token,
      email,
      password,
      confirmPassword,
    });

        const data = response.data.data || response.data;
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Password reset failed' };
  }
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


export const getCachedResearcherProfile = () => {
  const cached = localStorage.getItem('researcher');
  return cached ? JSON.parse(cached) : null;
};


export const isAdmin = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'superadmin';
};

export const isReviewer = () => {
  const role = getUserRole();
  return ['reviewer', 'admin', 'superadmin'].includes(role);
};


export const canManageReviewers = () => {
  return isAdmin();
};

export const getUserDisplayName = () => {
  const profile = getCachedResearcherProfile();
  if (!profile) return 'User';
  return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
};


export default {
  // Generic
  loginUser,

  // Researcher auth
  registerResearcher,
  verifyResearcherEmail,
  loginResearcher,

  // Profile
  getResearcherProfile,
  updateResearcherProfile,

  // Password
  changeResearcherPassword,
  forgotResearcherPassword,
  resetResearcherPassword,

  // Session
  logout,
  isAuthenticated,
  getToken,
  getUserRole,
  isResearcher,
  isAdmin,
  isReviewer,
  canManageReviewers,
  getCachedResearcherProfile,
  getUserDisplayName,
};