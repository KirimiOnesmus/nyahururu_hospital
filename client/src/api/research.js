import api from "./axios";

const normalizeStatus = (status) => {
  const s = String(status || "")
    .toLowerCase()
    .trim();
  if (["approved", "accepted"].includes(s)) return "approved";
  if (["rejected", "needs_revision", "revision_needed", "declined"].includes(s))
    return "rejected";
  return "pending";
};

const unwrapList = (res) => ({
  papers: res.data.data || [],
  page: res.data.meta?.page,
  limit: res.data.meta?.limit,
  total: res.data.meta?.total,
  totalPages: res.data.meta?.totalPages,
});

export const getAllPublishedResearch = async (filters = {}) => {
  try {
    const { search, discipline, category, page = 1, limit = 12 } = filters;
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (discipline) params.append("discipline", discipline);
    if (category) params.append("category", category);
    params.append("page", page);
    params.append("limit", limit);
    const response = await api.get(`/research/public?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to fetch research papers" }
    );
  }
};

export const getResearchById = async (id) => {
  try {
    const response = await api.get(`/research/${id}`);
    const d = response.data?.data;
    if (d?.paper?._id) return d.paper;
    if (d?._id) return d;
    return null;
  } catch (error) {
    const msg =
      error.response?.data?.message || error.message || "Research not found";
    throw { message: msg, status: error.response?.status };
  }
};

// ─── Used by CommitteeResearchDetails to fetch a single enriched record ───────

export const getResearchDetail = async (id) => {
  try {
    const response = await api.get(`/research/${id}`);
    const d = response.data?.data;
    if (d?.paper?._id) return { paper: d.paper };
    if (d?._id) return { paper: d };
  

    return { paper: response.data };
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch research detail" };
  }
};

// ─── Used by CommitteeResearchDetails Approve / Request Revisions buttons ─────
export const submitCommitteeDecision = async (researchId, { decision }) => {
  try {
    const response = await api.patch(
      `/research/${researchId}/committee-decision`,
      { decision },
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to submit committee decision" }
    );
  }
};

//  RESEARCHER ENDPOINTS

export const initiateProposalSubmission = async (formData, phone) => {
  try {
    const response = await api.post("/research/proposals/initiate", {
      title: formData.title,
      discipline: formData.discipline,
      duration: formData.duration,
      fundingSource: formData.fundingSource,
      abstract: formData.abstract,
      background: formData.background,
      objectives: formData.objectives,
      methodology: formData.methodology,
      expectedOutcome: formData.expectedOutcome,
      coInvestigators: formData.coInvestigators,
      timeline: formData.timeline,
      phone,
      amount: 1,
      type: "proposal_submission",
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to initiate proposal submission",
      }
    );
  }
};

export const confirmProposalSubmission = async (
  formData,
  paymentId,
  proposalFile,
) => {
  try {
    const fd = new FormData();
    const scalarFields = [
      "title",
      "discipline",
      "duration",
      "fundingSource",
      "abstract",
      "background",
      "methodology",
      "expectedOutcome",
      "timeline",
    ];
    scalarFields.forEach((key) => {
      if (
        formData[key] !== undefined &&
        formData[key] !== null &&
        formData[key] !== ""
      ) {
        fd.append(key, formData[key]);
      }
    });
    if (Array.isArray(formData.objectives)) {
      formData.objectives
        .filter(Boolean)
        .forEach((obj) => fd.append("objectives[]", obj));
    }
    if (
      Array.isArray(formData.coInvestigators) &&
      formData.coInvestigators.length > 0
    ) {
      fd.append("coInvestigators", JSON.stringify(formData.coInvestigators));
    }
    if (proposalFile) fd.append("proposalFile", proposalFile);
    fd.append("paymentId", paymentId);
    const response = await api.post("/research/proposals/confirm", fd);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to confirm proposal submission",
      }
    );
  }
};

export const submitProposal = async (formData) => {
  console.warn(
    "submitProposal is deprecated. Use initiateProposalSubmission + confirmProposalSubmission",
  );
  return confirmProposalSubmission(
    formData,
    formData.transactionCode,
    formData.proposalFile,
  );
};

export const submitFinalPaper = async (researchId, formData) => {
  try {
    const fd = new FormData();
    if (formData.finalAbstract)
      fd.append("finalAbstract", formData.finalAbstract);
    if (Array.isArray(formData.keywords)) {
      formData.keywords
        .filter(Boolean)
        .forEach((k) => fd.append("keywords[]", k));
    } else if (formData.keywords) {
      fd.append("keywords", formData.keywords);
    }
    if (formData.finalPaperFile)
      fd.append("finalPaperFile", formData.finalPaperFile);
    if (formData.finalDataset) fd.append("finalDataset", formData.finalDataset);
    if (formData.dataDictionary)
      fd.append("dataDictionary", formData.dataDictionary);
    if (formData.statisticalScripts)
      fd.append("statisticalScripts", formData.statisticalScripts);
    if (formData.ethicsApproval)
      fd.append("ethicsApproval", formData.ethicsApproval);
    if (formData.fundingDisclosure)
      fd.append("fundingDisclosure", formData.fundingDisclosure);
    fd.append(
      "conflictOfInterestDeclared",
      !!formData.conflictOfInterestDeclared,
    );
    fd.append("aiUsageDeclared", !!formData.aiUsageDeclared);
    if (formData.aiUsageDetails)
      fd.append("aiUsageDetails", formData.aiUsageDetails);
    if (formData.plagiarismReportLink)
      fd.append("plagiarismReportLink", formData.plagiarismReportLink);
    if (formData.fundingSource)
      fd.append("fundingSource", formData.fundingSource);
    if (formData.noteToCommittee)
      fd.append("noteToCommittee", formData.noteToCommittee);
    const response = await api.post(`/research/${researchId}/final-paper`, fd);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to submit final paper" };
  }
};

export const getMyResearch = async () => {
  try {
    const response = await api.get("/research/my-research");
    const { data, meta } = response.data;
    return { papers: data || [], ...meta };
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch your research" };
  }
};

export const resubmitResearch = async (researchId, fields, file) => {
  try {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    if (file) {
      fd.append("proposalFile", file);
      fd.append("finalPaperFile", file);
    }
    const response = await api.patch(`/research/${researchId}/resubmit`, fd);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Resubmission failed" };
  }
};

export const getResearchDetails = async (id) => {
  try {
    const [paper, reviews] = await Promise.all([
      getResearchById(id),
      getReviewHistory(id).catch(() => []),
    ]);
    return { paper, reviews };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getResearcherRevenue = async (researchId) => {
  try {
    const response = await api.get(`/research/${researchId}/revenue`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch revenue data" };
  }
};

export const initiateSTKPush = async (config) => {
  try {
    const response = await api.post("/mpesa/initiate", config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to initiate payment" };
  }
};

export const verifyPaymentStatus = async (checkoutRequestId) => {
  try {
    const response = await api.get(`/mpesa/verify/${checkoutRequestId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to verify payment" };
  }
};

export const getDownloadToken = async (paymentId, researchId) => {
  try {
    const response = await api.get(`/mpesa/token/${paymentId}/${researchId}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to generate download token" }
    );
  }
};

//  PROGRESS ENDPOINTS

export const saveProgressReport = async (
  researchId,
  fields,
  fileMap = {},
  isDraft = false,
) => {
  try {
    const fd = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "")
        fd.append(key, value);
    });
    fd.append("isDraft", isDraft);
    Object.entries(fileMap).forEach(([fieldName, file]) => {
      if (file) fd.append(fieldName, file);
    });
    const response = await api.patch(`/research/${researchId}/progress`, fd);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: isDraft
          ? "Failed to save draft"
          : "Failed to submit progress report",
      }
    );
  }
};

export const submitProgressReport = (researchId, fields, fileMap) =>
  saveProgressReport(researchId, fields, fileMap, false);

export const saveProgressDraft = (researchId, fields, fileMap) =>
  saveProgressReport(researchId, fields, fileMap, true);


//Certificates

export const getMyCertificates = async () => {
  const res = await api.get("/certificates/my");
  return res.data.data.certificates;
};

const fetchCertificateBlob = async (id) => {
  const res = await api.get(`/certificates/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};

export const viewCertificate = async (id) => {
  const blob = await fetchCertificateBlob(id);
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
};

export const downloadCertificate = async (id, certificateNumber) => {
  const blob = await fetchCertificateBlob(id);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${certificateNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

//  REVIEWER ENDPOINTS

export const getPendingReviews = async (filters = {}) => {
  try {
    const { stage, search, page = 1, limit = 20 } = filters;
    const params = new URLSearchParams();
    if (stage) params.append("stage", stage);
    if (search) params.append("search", search);
    params.append("page", page);
    params.append("limit", limit);
    const response = await api.get(
      `/research/reviews/pending?${params.toString()}`,
    );
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to fetch pending reviews" }
    );
  }
};

export const getAssignedResearch = async (filters = {}) => {
  try {
    const { stage, search, page = 1, limit = 20, includeCompleted } = filters;
    const params = new URLSearchParams();
    if (stage) params.append("stage", stage);
    if (search) params.append("search", search);
    if (includeCompleted) params.append("includeCompleted", "true");
    params.append("page", page);
    params.append("limit", limit);
    const response = await api.get(
      `/research/reviewer/assigned?${params.toString()}`,
    );
    const { data, meta } = response.data;
    return { papers: data || [], ...meta };
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch your assigned research",
      }
    );
  }
};

export const submitReview = async (researchId, reviewData) => {
  try {
    const response = await api.post("/research/reviews", {
      researchId,
      ...reviewData,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to submit review" };
  }
};

export const getReviewHistory = async (researchId) => {
  try {
    const response = await api.get(`/research/reviews/${researchId}`);
    return response.data?.data?.reviews ?? [];
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch review history" };
  }
};

//  REVIEWER MANAGEMENT (Admin only)

export const inviteReviewer = async (inviteData) => {
  try {
    const response = await api.post("/reviewers/invite", inviteData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to send invitation" };
  }
};

export const setReviewerPassword = async (token, email, password) => {
  try {
    const response = await api.post("/reviewers/set-password", {
      token,
      email,
      password,
      confirmPassword: password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to set password" };
  }
};

export const resendInvite = async (reviewerId) => {
  try {
    const response = await api.post(`/reviewers/${reviewerId}/resend-invite`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to resend invite" };
  }
};

export const listReviewers = async () => {
  try {
    const response = await api.get("/reviewers");
    return response.data?.data ?? response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch reviewers" };
  }
};

export const listAllResearchers = async (filters = {}) => {
  try {
    const { role, page = 1, limit = 100 } = filters;
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    params.append("page", page);
    params.append("limit", limit);
    const response = await api.get(`/reviewers/all?${params.toString()}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch researchers" };
  }
};

export const revokeReviewer = async (reviewerId) => {
  try {
    const response = await api.patch(`/reviewers/${reviewerId}/revoke`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to revoke reviewer" };
  }
};


//Committee
export const inviteCommitteeMember = async (inviteData) => {
  try {
    const response = await api.post("/reviewers/committee/invite", inviteData);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to invite committee member" }
    );
  }
};

export const promoteToAdmin = async (reviewerId, email) => {
  try {
    const response = await api.post(`/reviewers/committee/invite`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to promote to committee" };
  }
};

export const updateReviewerDetails = async (reviewerId, updates) => {
  try {
    const response = await api.put(`/reviewers/${reviewerId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update reviewer" };
  }
};

export const getPendingCommitteeApproval = async () => {
  const res = await api.get("/research/committee/queue");
  return unwrapList(res);
};

export const getAllResearch = async ({ stage, search, page = 1, limit = 50 } = {}) => {
  const res = await api.get("/research/committee/all", {
    params: { stage, search, page, limit },
  });
  return unwrapList(res);
};

export const getFinalApprovalQueue = async (filters = {}) => {
  try {
    const { page = 1, limit = 20 } = filters;
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);
    const response = await api.get(
      `/research/committee/final-approvals?${params.toString()}`,
    );
    return {
      records: response.data.data || [],
      page: response.data.meta?.page,
      limit: response.data.meta?.limit,
      total: response.data.meta?.total,
      totalPages: response.data.meta?.totalPages,
    };
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to fetch final approval queue" }
    );
  }
};

export const getFinalApprovalStats = async () => {
  try {
    const response = await api.get("/research/committee/final-approvals/stats");
    return response.data?.data ?? response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to fetch final approval stats" }
    );
  }
};

export const getApprovalFeed = async (filters = {}) => {
  try {
    const { limit = 50 } = filters;
    const params = new URLSearchParams();
    params.append("limit", limit);
    const response = await api.get(
      `/research/committee/final-approvals/feed?${params.toString()}`,
    );
    return { comments: response.data?.data?.comments ?? [] };
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch approval feed" };
  }
};

export const postApprovalComment = async ({ researchId, message }) => {
  try {
    const response = await api.post("/research/committee/final-approvals/comments", {
      researchId,
      message,
    });
    return response.data?.data?.comment ?? response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to post comment" };
  }
};

export const getRecordTimeline = async (researchId) => {
  try {
    const response = await api.get(
      `/research/committee/final-approvals/${researchId}/timeline`,
    );
    return { timeline: response.data?.data?.timeline ?? [] };
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch record timeline" };
  }
};
export const submitCommitteeReview = async (researchId, { decision, comment }) => {
  try {
    const response = await api.post("/research/committee/reviews", {
      researchId,
      decision, 
      comment,
    });
   
    return response.data?.data ?? response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to submit committee vote" };
  }
};

//  ADMIN ENDPOINTS — Publish & Assign Reviewer

export const publishResearch = async (researchId) => {
  try {
    const response = await api.patch(`/research/${researchId}/publish`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to publish research" };
  }
};

export const assignReviewer = async (researchId, email) => {
  try {
    const response = await api.patch(
      `/research/${researchId}/assign-reviewer`,
      { email },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to assign reviewer" };
  }
};

//  ADMIN ENDPOINTS — Revenue & Analytics

export const getResearchRevenue = async (params) => {
  try {
    const response = await api.get(
      `/payments/admin/revenue?${params.toString()}`
    );
    return response.data?.data ?? response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to fetch research revenue" }
    );
  }
};

export const getAllResearchRevenue = async (filters = {}) => {
  try {
    const { researcherId, startDate, endDate, status = "completed" } = filters;
    const params = new URLSearchParams();
    if (researcherId) params.append("researcher", researcherId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("status", status);
    const response = await api.get(`/payments/admin/revenue?${params.toString()}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch revenue data" };
  }
};

export const refundPayment = async (paymentId, reason) => {
  try {
    const response = await api.post("/payments/admin/refund", {
      paymentId,
      reason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to process refund" };
  }
};

export const updateDownloadPrice = async (researchId, downloadPrice) => {
  try {
    const response = await api.patch(`/research/${researchId}/download-price`, {
      downloadPrice,
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to update download price" }
    );
  }
};

//  HELPER FUNCTIONS

export const pollPaymentStatus = async (
  checkoutRequestId,
  maxAttempts = 12,
) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await verifyPaymentStatus(checkoutRequestId);
        if (result.status !== "pending") {
          clearInterval(interval);
          resolve(result);
        }
      } catch (error) {
        clearInterval(interval);
        reject(error.response?.data || { message: "Failed to verify payment" });
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error("Payment verification timeout"));
      }
    }, 5000);
  });
};

export const formatPhoneNumber = (phone) => {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "254" + digits.slice(1);
  if (!digits.startsWith("254") || digits.length !== 12)
    throw new Error("Invalid phone number");
  return digits;
};

export const validatePaymentAmount = (amount, type) => {
  const MIN_AMOUNT = 1;
  const MAX_AMOUNT = 150000;
  if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    throw new Error(
      `Amount must be between KES ${MIN_AMOUNT} and KES ${MAX_AMOUNT}`,
    );
  }
  return true;
};

export default {
  getAllPublishedResearch,
  getResearchById,
  // ↓ new — required by CommitteeResearchDetails
  getResearchDetail,
  submitCommitteeDecision,
  initiateProposalSubmission,
  confirmProposalSubmission,
  submitProposal,
  submitFinalPaper,
  getMyResearch,
  getResearcherRevenue,
  saveProgressReport,
  submitProgressReport,
  saveProgressDraft,
  resubmitResearch,
  getResearchDetails,
  initiateSTKPush,
  verifyPaymentStatus,
  getDownloadToken,
  pollPaymentStatus,
  getPendingReviews,
  getAssignedResearch,
  submitReview,
  getReviewHistory,
  inviteReviewer,
  setReviewerPassword,
  resendInvite,
  listReviewers,
  listAllResearchers,
  revokeReviewer,
  inviteCommitteeMember,
  promoteToAdmin,
  updateReviewerDetails,
  publishResearch,
  assignReviewer,
  getResearchRevenue,
  getAllResearchRevenue,
  refundPayment,
  updateDownloadPrice,
  formatPhoneNumber,
  validatePaymentAmount,
  getFinalApprovalQueue,
  getFinalApprovalStats,
  getApprovalFeed,
  postApprovalComment,
  getRecordTimeline,
};