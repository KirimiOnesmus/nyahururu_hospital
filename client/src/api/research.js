import api from './axios';

export const listReviewers      = ()            => api.get('/research/reviewers').then(r => r.data);
export const listAllResearchers = (params = {}) => api.get('/research/reviewers/all', { params }).then(r => r.data);
export const inviteReviewer     = (body)        => api.post('/research/reviewers/invite', body).then(r => r.data);
export const revokeReviewer     = (id)          => api.patch(`/research/reviewers/${id}/revoke`).then(r => r.data);
export const promoteToAdmin     = (id)          => api.patch(`/research/reviewers/${id}/promote-admin`).then(r => r.data);
export const resendInvite       = (id)          => api.post(`/research/reviewers/${id}/resend-invite`).then(r => r.data);