import api from './axios';

//PUBLIC ENDPOINTS (No auth required)

export const getAllPublishedResearch = async (filters = {}) => {
  try {
    const { search, discipline, category, page = 1, limit = 12 } = filters;
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (discipline) params.append('discipline', discipline);
    if (category) params.append('category', category);
    params.append('page', page);
    params.append('limit', limit);

    const response = await api.get(`/research?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch research papers' };
  }
};

export const getResearchById = async (id) => {
  try {
    const response = await api.get(`/research/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Research not found' };
  }
};

// RESEARCHER ENDPOINTS (Auth required: researcher role)


 
export const initiateProposalSubmission = async (formData, phone) => {
  try {
    const response = await api.post('/research/proposals/initiate', {
      title: formData.title,
      discipline: formData.discipline,
      abstract: formData.abstract,
      background: formData.background,
      objectives: formData.objectives,
      methodology: formData.methodology,
      expectedOutcome: formData.expectedOutcome,
      timeline: formData.timeline,
      phone,
      // amount: 150,
      amount: 1, // Set to 1 KES for testing. Change to 150 for production.
      type: 'proposal_submission'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initiate proposal submission' };
  }
};

// Step 2: Confirm proposal submission after payment
 
export const confirmProposalSubmission = async (formData, paymentId, proposalFile) => {
  try {
    const fd = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value && key !== 'proposalFile') {
        fd.append(key, value);
      }
    });
    
    // Add payment reference
    fd.append('paymentId', paymentId);
    
    // Add file
    if (proposalFile) {
      fd.append('proposalFile', proposalFile);
    }

    const response = await api.post('/research/proposals/confirm', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to confirm proposal submission' };
  }
};

//DEPRECATED: Use initiateProposalSubmission + confirmProposalSubmission instead
 
export const submitProposal = async (formData) => {
  console.warn('submitProposal is deprecated. Use initiateProposalSubmission + confirmProposalSubmission');
  return confirmProposalSubmission(formData, formData.transactionCode, formData.proposalFile);
};

export const submitFinalPaper = async (formData) => {
  try {
    const fd = new FormData();
    
    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value && key !== 'finalPaperFile') {
        if (Array.isArray(value)) {
          value.forEach((item) => fd.append(`${key}[]`, item));
        } else {
          fd.append(key, value);
        }
      }
    });
    
    // Add file
    if (formData.finalPaperFile) {
      fd.append('finalPaperFile', formData.finalPaperFile);
    }

    const response = await api.post('/research/submit-final-paper', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit final paper' };
  }
};

export const getMyResearch = async () => {
  try {
    const response = await api.get('/research/my-research');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch your research' };
  }
};

export const getResearcherRevenue = async (researchId) => {
  try {
    const response = await api.get(`/research/${researchId}/revenue-share`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch revenue data' };
  }
};

//PAYMENT ENDPOINTS (M-Pesa STK Push & Verification)

export const initiateSTKPush = async (config) => {
  try {
    const response = await api.post('/research/mpesa/stk-push', config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initiate payment' };
  }
};

export const verifyPaymentStatus = async (checkoutRequestId) => {
 try {
    const response = await api.get(`/mpesa/verify/${checkoutRequestId}`); // ← was /research/mpesa/verify/
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify payment' };
  }
};

//REVIEWER ENDPOINTS (Auth required: reviewer/admin role)

export const getPendingReviews = async (filters = {}) => {
  try {
    const { stage, search, page = 1, limit = 20 } = filters;
    const params = new URLSearchParams();
    
    if (stage) params.append('stage', stage);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);

    const response = await api.get(
      `/research/reviews/pending?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pending reviews' };
  }
};

export const submitReview = async (researchId, reviewData) => {
  try {
    const response = await api.post(
      `/research/${researchId}/review`,
      reviewData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit review' };
  }
};

export const getReviewHistory = async (researchId) => {
  try {
    const response = await api.get(`/research/${researchId}/review-history`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch review history' };
  }
};

//REVIEWER MANAGEMENT (Admin only)

export const inviteReviewer = async (inviteData) => {
  try {
    const response = await api.post('/research/reviewers/invite', inviteData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send invitation' };
  }
};

export const setReviewerPassword = async (token, email, password) => {
  try {
    const response = await api.post('/research/reviewers/set-password', {
      token,
      email,
      password,
      confirmPassword: password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to set password' };
  }
};

export const resendInvite = async (reviewerId) => {
  try {
    const response = await api.post(
      `/research/reviewers/${reviewerId}/resend-invite`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to resend invite' };
  }
};

export const listReviewers = async () => {
  try {
    const response = await api.get('/research/reviewers');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch reviewers' };
  }
};

export const listAllResearchers = async (filters = {}) => {
  try {
    const { role, page = 1, limit = 100 } = filters;
    const params = new URLSearchParams();
    
    if (role) params.append('role', role);
    params.append('page', page);
    params.append('limit', limit);

    const response = await api.get(
      `/research/reviewers/all?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch researchers' };
  }
};

export const revokeReviewer = async (reviewerId) => {
  try {
    const response = await api.patch(
      `/research/reviewers/${reviewerId}/revoke`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to revoke reviewer' };
  }
};

export const promoteToAdmin = async (reviewerId) => {
  try {
    const response = await api.patch(
      `/research/reviewers/${reviewerId}/promote-admin`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to promote reviewer' };
  }
};

export const updateReviewerDetails = async (reviewerId, updates) => {
  try {
    const response = await api.put(
      `/research/reviewers/${reviewerId}`,
      updates
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update reviewer' };
  }
};

// ADMIN ENDPOINTS — Revenue & Analytics

export const getResearchRevenue = async (researchId) => {
  try {
    const response = await api.get(
      `/research/admin/research/${researchId}/revenue`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch research revenue' };
  }
};

export const getAllResearchRevenue = async (filters = {}) => {
  try {
    const { researcherId, startDate, endDate, status = 'completed' } = filters;
    const params = new URLSearchParams();
    
    if (researcherId) params.append('researcher', researcherId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('status', status);

    const response = await api.get(
      `/research/admin/revenue?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch revenue data' };
  }
};

export const refundPayment = async (paymentId, reason) => {
  try {
    const response = await api.post('/research/admin/payments/refund', {
      paymentId,
      reason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to process refund' };
  }
};

export const updateDownloadPrice = async (researchId, downloadPrice) => {
  try {
    const response = await api.patch(`/research/${researchId}/download-price`, {
      downloadPrice,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update download price' };
  }
};

// HELPER FUNCTIONS

export const pollPaymentStatus = async (checkoutRequestId, maxAttempts = 12) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await verifyPaymentStatus(checkoutRequestId);
        if (result.status !== 'pending') {
          clearInterval(interval);
          resolve(result);
        }
      } catch (error) {
        clearInterval(interval);
        reject(error.response?.data || { message: 'Failed to verify payment' });
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Payment verification timeout'));
      }
    }, 5000); // Check every 5 seconds
  });
};

export const formatPhoneNumber = (phone) => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '254' + digits.slice(1);
  }
  if (!digits.startsWith('254') || digits.length !== 12) {
    throw new Error('Invalid phone number');
  }
  return digits;
};

export const validatePaymentAmount = (amount, type) => {
  const MIN_AMOUNT = 1;
  const MAX_AMOUNT = 150000;

  if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    throw new Error(`Amount must be between KES ${MIN_AMOUNT} and KES ${MAX_AMOUNT}`);
  }

  return true;
};

export default {
  getAllPublishedResearch,
  getResearchById,

  initiateProposalSubmission,
  confirmProposalSubmission,
  submitProposal,
  submitFinalPaper,
  getMyResearch,
  getResearcherRevenue,
  
  initiateSTKPush,
  verifyPaymentStatus,
  pollPaymentStatus,

  getPendingReviews,
  submitReview,
  getReviewHistory,
  
  inviteReviewer,
  setReviewerPassword,
  resendInvite,
  listReviewers,
  listAllResearchers,
  revokeReviewer,
  promoteToAdmin,
  updateReviewerDetails,

  getResearchRevenue,
  getAllResearchRevenue,
  refundPayment,
  updateDownloadPrice,
  
  formatPhoneNumber,
  validatePaymentAmount,
};

