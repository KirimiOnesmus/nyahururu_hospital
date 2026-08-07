import api from "./axios";

const unwrapList = (res) => ({
  papers: res.data.data || [],
  page: res.data.meta?.page,
  limit: res.data.meta?.limit,
  total: res.data.meta?.total,
  totalPages: res.data.meta?.totalPages,
});

//  Shared 

export const getResearchById = async (id) => {
  const response = await api.get(`/research/${id}`);
  const d = response.data?.data;
  return d?.paper || d || null;
};

export const getResearchDetail = async (id) => {
  const response = await api.get(`/research/${id}`);
  const d = response.data?.data;
  return { paper: d?.paper || d || response.data };
};

export const getRevisionComparison = async (id) => {
  const response = await api.get(`/research/${id}/revisions`);
  return response.data?.data?.comparison || null;
};

export const getResearchDetails = async (id) => {
  const [paper, reviews] = await Promise.all([
    getResearchById(id),
    getReviewHistory(id).catch(() => []),
  ]);
  return { paper, reviews };
};

//  Researcher — My Research 

export const getMyResearch = async (filters = {}) => {
  const { submissionType, page = 1, limit = 10 } = filters;
  const params = new URLSearchParams({ page, limit });
  if (submissionType) params.append("submissionType", submissionType);
  const response = await api.get(`/research/my-research?${params}`);
  return { papers: response.data.data || [], ...response.data.meta };
};

//  Researcher — Initial Proposal 

export const initiateProposalSubmission = async (formData, phone) => {
  const response = await api.post("/research/proposals/initiate", {
    title: formData.title, discipline: formData.discipline,
    phone, amount: 1, type: "proposal_submission",
  });
  return response.data?.data || response.data;
};

export const confirmProposalSubmission = async (formData, paymentId, proposalFile, conditionalDocs = {}) => {
  const fd = new FormData();
  const scalars = [
    "title","discipline","abstract","background","methodology","expectedOutcome","timeline",
    "protocolVersionNumber","protocolVersionDate","researchProgramme","keyPerformanceArea",
    "strategy","sdg","fundingSource","totalFundsNeeded","expectedDurationMonths","hypotheses",
    "justification","literatureReviewSummary","inclusionCriteria","exclusionCriteria",
    "sampleSizeDescription","samplingProcedure","dataManagementPlan","ethicsInformation",
    "ethicsHumanSubjects","ethicsAnimalSubjects","budgetSummary","budgetJustification",
    "expectedApplicationOfResults",
  ];
  scalars.forEach((k) => { if (formData[k]) fd.append(k, formData[k]); });

  if (formData.isInvestigationalProduct) fd.append("isInvestigationalProduct", "true");
  if (Array.isArray(formData.objectives)) formData.objectives.filter(Boolean).forEach((o)=>fd.append("objectives[]",o));
  else if (formData.objectives) fd.append("objectives", formData.objectives);
  if (Array.isArray(formData.coInvestigators) && formData.coInvestigators.length) fd.append("coInvestigators", JSON.stringify(formData.coInvestigators));
  if (Array.isArray(formData.studySites) && formData.studySites.length) fd.append("studySites", JSON.stringify(formData.studySites));
  if (Array.isArray(formData.studyImplementationCounties) && formData.studyImplementationCounties.length) fd.append("studyImplementationCounties", JSON.stringify(formData.studyImplementationCounties));
  if (proposalFile) fd.append("proposalFile", proposalFile);
  if (conditionalDocs.acucApprovalDoc) fd.append("acucApprovalDoc", conditionalDocs.acucApprovalDoc);
  if (conditionalDocs.insuranceCertificateDoc) fd.append("insuranceCertificateDoc", conditionalDocs.insuranceCertificateDoc);
  fd.append("paymentId", paymentId);
  const response = await api.post("/research/proposals/confirm", fd);
  return response.data;
};

//  Researcher — Amendment 

export const submitAmendment = async (formData, file) => {
  const fd = new FormData();
  ["parentResearchId","amendmentDetails","title","protocolVersionNumber","protocolVersionDate",
   "abstract","methodology","objectives","inclusionCriteria","exclusionCriteria","fundingSource"
  ].forEach((k) => { if (formData[k]) fd.append(k, formData[k]); });
  if (Array.isArray(formData.coInvestigators)) fd.append("coInvestigators", JSON.stringify(formData.coInvestigators));
  if (Array.isArray(formData.studySites)) fd.append("studySites", JSON.stringify(formData.studySites));
  if (file) fd.append("proposalFile", file);
  const response = await api.post("/research/amendments", fd);
  return response.data;
};

//  Researcher — Continuing Review 

export const submitContinuingReview = async (formData, files = []) => {
  const fd = new FormData();
  ["parentResearchId","progressSummary","participantsEnrolled","participantsContinuing",
   "adverseEvents","amendments","constraints","plansForNextYear","isLastYear"
  ].forEach((k) => { if (formData[k] !== undefined && formData[k] !== null) fd.append(k, formData[k]); });
  files.forEach((f) => { if (f.file) fd.append(f.label || "progressFile", f.file); });
  const response = await api.post("/research/continuing-reviews", fd);
  return response.data;
};

//  Researcher — Study Closure 

export const submitStudyClosure = async (formData, file) => {
  const fd = new FormData();
  [
    "parentResearchId", "closureReason", "resultsSummary", "publications",
    "participantIdentifiersDestroyed", "specimenDisposalPlan", "dataFutureUsePlan",
    "investigationalProductDisposal", "publicationLink",
  ].forEach((k) => {
    if (formData[k] !== undefined && formData[k] !== null && formData[k] !== "") {
      fd.append(k, formData[k]);
    }
  });
  // Attestations travel as a JSON string; the server parses it.
  if (formData.closureAttestations) {
    fd.append("closureAttestations", JSON.stringify(formData.closureAttestations));
  }
  if (file) fd.append("closeoutReport", file);
  const response = await api.post("/research/study-closures", fd);
  return response.data;
};

//  Researcher — Resubmit a continuing review (reuses the same record) 

export const resubmitContinuingReview = async (researchId, fields, files = []) => {
  const fd = new FormData();
  ["progressSummary", "participantsEnrolled", "participantsContinuing",
   "adverseEvents", "amendments", "constraints", "plansForNextYear", "isLastYear",
  ].forEach((k) => {
    if (fields[k] !== undefined && fields[k] !== null) fd.append(k, fields[k]);
  });
  files.forEach((f) => { if (f.file) fd.append(f.label || "progressFile", f.file); });
  const response = await api.patch(`/research/${researchId}/resubmit`, fd);
  return response.data;
};

//  Researcher — Resubmit 

export const resubmitResearch = async (researchId, fields, file) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
  if (file) fd.append("proposalFile", file);
  const response = await api.patch(`/research/${researchId}/resubmit`, fd);
  return response.data;
};

//  Co-investigators

export const getCoInvestigatorStudies = async () => {
  const r = await api.get("/research/co-investigator/studies");
  return r.data?.data?.studies ?? r.data?.data ?? [];
};
export const getResearchCoInvestigators = async (researchId) => {
  const r = await api.get(`/research/${researchId}/co-investigators`);
  return r.data?.data?.coInvestigators ?? [];
};
export const setCoInvestigatorEditAccess = async (researchId, coInvestigatorId, canEdit) => {
  const r = await api.patch(`/research/${researchId}/co-investigators/${coInvestigatorId}/edit-access`, { canEdit });
  return r.data?.data;
};
export const coInvestigatorEditResearch = async (researchId, fields) => {
  const r = await api.patch(`/research/${researchId}/co-edit`, fields);
  return r.data?.data;
};

//  CSC endorsement  evidence upload required 

export const recordCscEndorsement = async (researchId, { cscApprovalDate, cscReviewDate, cscComments, cscContactName, cscContactEmail, evidenceFile }) => {
  const fd = new FormData();
  fd.append("cscApprovalDate", cscApprovalDate);
  if (cscReviewDate) fd.append("cscReviewDate", cscReviewDate);
  if (cscComments) fd.append("cscComments", cscComments);
  fd.append("cscContactName", cscContactName);
  fd.append("cscContactEmail", cscContactEmail);
  if (evidenceFile) fd.append("cscEvidenceFile", evidenceFile);
  const r = await api.patch(`/research/${researchId}/csc-endorsement`, fd);
  return r.data?.data;
};

//  Administrative completeness review 

export const returnForCorrection = async (researchId, issues) => {
  const r = await api.patch(`/research/${researchId}/return-for-correction`, { issues });
  return r.data?.data;
};
export const markCompletenessVerified = async (researchId) => {
  const r = await api.patch(`/research/${researchId}/verify-completeness`);
  return r.data?.data;
};

//  Protocol deviations

export const submitProtocolDeviation = async (formData, files = []) => {
  const fd = new FormData();
  ["parentResearchId", "deviationType", "severity", "description", "dateOfDeviation",
   "correctiveAction", "participantsAffected", "atRiskParticipantList", "isUrgentSafety",
  ].forEach((k) => { if (formData[k] !== undefined && formData[k] !== null && formData[k] !== "") fd.append(k, formData[k]); });
  files.forEach((f) => fd.append("supportingDocuments", f));
  const r = await api.post("/research/protocol-deviations", fd);
  return r.data?.data?.deviation;
};
export const getProtocolDeviations = async (researchId) => {
  const r = await api.get(`/research/${researchId}/protocol-deviations`);
  return r.data?.data?.deviations ?? [];
};

//  Decision letter 

export const getDecisionLetter = async (researchId) => {
  const r = await api.get(`/research/${researchId}/decision-letter`);
  return r.data?.data;
};
export const getDecisionLetterHistory = async (researchId) => {
  const r = await api.get(`/research/${researchId}/decision-letters`);
  return r.data?.data?.letters ?? [];
};

export const getResearcherRevenue = async (researchId) => {
  const response = await api.get(`/research/${researchId}/revenue`);
  return response.data;
};

//  Payments 

export const initiateSTKPush = async ({ phone, amount, type, researchId }) => {
  const response = await api.post("/payments/initiate", { phone, amount, type, researchId });
  return response.data;
};
export const verifyPaymentStatus = async (checkoutRequestId) => {
  if (!checkoutRequestId) throw new Error("No checkout request ID available");
  const response = await api.get(`/payments/status/${checkoutRequestId}`);
  return response.data?.data ?? response.data;
};
export const pollPaymentStatus = (checkoutRequestId, maxAttempts = 12) =>
  new Promise((resolve, reject) => {
    let attempts = 0;
    const iv = setInterval(async () => {
      attempts++;
      try {
        const r = await verifyPaymentStatus(checkoutRequestId);
        if (r.status !== "pending") { clearInterval(iv); resolve(r); }
      } catch (e) { clearInterval(iv); reject(e.response?.data || { message: "Payment check failed" }); }
      if (attempts >= maxAttempts) { clearInterval(iv); reject(new Error("Payment timeout")); }
    }, 5000);
  });

//  Reviewer 

export const getPendingReviews = async () => unwrapList(await api.get("/research/reviewer/assigned"));
export const getAssignedResearch = async (filters = {}) => {
  const { submissionType, includeCompleted, page = 1, limit = 20 } = filters;
  const p = new URLSearchParams({ page, limit });
  if (submissionType) p.append("submissionType", submissionType);
  if (includeCompleted) p.append("includeCompleted", includeCompleted);
  return unwrapList(await api.get(`/research/reviewer/assigned?${p}`));
};
export const submitReview = async (researchId, { decision, comment, criteria, attachments = [] }) => {
  // Chair's change #6: reviewers can attach supporting documents to their
  // feedback. Only switch to multipart when there are files — keeps the
  // request as plain JSON (current behavior) otherwise.
  if (Array.isArray(attachments) && attachments.length > 0) {
    const fd = new FormData();
    fd.append("researchId", researchId);
    fd.append("decision", decision);
    fd.append("comment", comment);
    // Backend's multipartCriteriaSchema expects criteria as a JSON string
    // when submitted alongside files.
    fd.append("criteria", JSON.stringify(criteria));
    attachments.forEach((file) => fd.append("attachments", file));
    const response = await api.post("/research/reviews", fd);
    return response.data;
  }

  const response = await api.post("/research/reviews", { researchId, decision, comment, criteria });
  return response.data;
};
export const getReviewHistory = async (researchId) => {
  const response = await api.get(`/research/reviews/${researchId}`);
  return response.data?.data?.reviews || [];
};
export const getResearchComments = async (researchId) => {
  const response = await api.get(`/research/${researchId}/comments`);
  return response.data?.data?.comments || [];
};

//  Reviewer management 

export const inviteReviewer = async (data) => (await api.post("/reviewers/invite", data)).data;
export const setReviewerPassword = async (data) => (await api.post("/reviewers/set-password", data)).data;
export const resendInvite = async (id) => (await api.post(`/reviewers/${id}/resend-invite`)).data;
export const listReviewers = async () => (await api.get("/reviewers")).data?.data || [];
export const listAllResearchers = async (filters = {}) => {
  const p = new URLSearchParams();
  if (filters.role) p.append("role", filters.role);
  if (filters.limit) p.append("limit", filters.limit);
  if (filters.page) p.append("page", filters.page);
  const qs = p.toString();
  return (await api.get(`/reviewers/all${qs ? `?${qs}` : ""}`)).data?.data || [];
};
export const revokeReviewer = async (id) => (await api.patch(`/reviewers/${id}/revoke`)).data;
export const inviteCommitteeMember = async (data) => (await api.post("/reviewers/committee/invite", data)).data;
export const promoteToAdmin = async (id, email) => (await api.post("/reviewers/committee/invite", { email })).data;
export const updateReviewerDetails = async (id, data) => (await api.patch(`/reviewers/${id}`, data)).data;

//  Multi-reviewer assignment  

export const assignReviewers = async (researchId, emails) => {
  const response = await api.post(`/research/${researchId}/reviewers`, { emails });
  return response.data;
};
export const getResearchReviewers = async (researchId) => {
  const response = await api.get(`/research/${researchId}/reviewers`);
  return response.data?.data?.reviewers || [];
};
export const removeResearchReviewer = async (researchId, reviewerId) =>
  (await api.delete(`/research/${researchId}/reviewers/${reviewerId}`)).data;
export const assignReviewer = async (researchId, email) =>
  (await api.patch(`/research/${researchId}/assign-reviewer`, { email })).data;

//  Committee 

export const getCommitteeQueue = async (f = {}) => {
  const p = new URLSearchParams({ page: f.page || 1, limit: f.limit || 20 });
  return unwrapList(await api.get(`/research/committee/queue?${p}`));
};
export const getAllResearchCommittee = async (f = {}) => {
  const p = new URLSearchParams({ page: f.page || 1, limit: f.limit || 20 });
  if (f.submissionType) p.append("submissionType", f.submissionType);
  if (f.status) p.append("status", f.status);
  if (f.stage) p.append("stage", f.stage);
  if (f.search) p.append("search", f.search);
  return unwrapList(await api.get(`/research/committee/all?${p}`));
}; 

export const submitCommitteeReview = async (researchId, { decision, comment, criteria }) => {
  const r = await api.post("/research/committee/reviews", { researchId, decision, comment, criteria });
  return r.data?.data ?? r.data;
};
export const getFinalApprovalQueue = async (f = {}) => {
  const p = new URLSearchParams({ page: f.page || 1, limit: f.limit || 20 });
  const r = await api.get(`/research/committee/final-approvals?${p}`);
  return { records: r.data.data || [], ...r.data.meta };
};
export const getFinalApprovalStats = async () => {
  const r = await api.get("/research/committee/final-approvals/stats");
  return r.data?.data ?? r.data;
};
export const getApprovalFeed = async (f = {}) => {
  const p = new URLSearchParams({ limit: f.limit || 50 });
  const r = await api.get(`/research/committee/final-approvals/feed?${p}`);
  return { comments: r.data?.data?.comments ?? [] };
};
export const postApprovalComment = async ({ researchId, message }) => {
  const r = await api.post("/research/committee/final-approvals/comments", { researchId, message });
  return r.data?.data?.comment ?? r.data;
};
export const getRecordTimeline = async (researchId) => {
  const r = await api.get(`/research/committee/final-approvals/${researchId}/timeline`);
  return { timeline: r.data?.data?.timeline ?? [] };
};

//  Research Officer — Compiled Decision Report workflow (Chair's §6.1/§6.8) 

// The Research Officer's release queue: research sitting at
// PENDING_OFFICER_REVIEW, each paired with its draft Compiled Decision Report.
export const getOfficerQueue = async (filters = {}) => {
  const { page = 1, limit = 20 } = filters;
  const p = new URLSearchParams({ page, limit });
  const r = await api.get(`/research/officer/queue?${p}`);
  return { records: r.data?.data ?? [], ...r.data?.meta };
};

// Researcher-facing read; also used by staff/committee to preview the
// draft pre-release. Returns null if nothing exists yet.
export const getDecisionReport = async (researchId) => {
  const r = await api.get(`/research/${researchId}/decision-report`);
  return r.data?.data?.report ?? null;
};

// RO edits the committee commentary and/or overrides the final decision
// before releasing it to the researcher.
export const updateDecisionReport = async (researchId, reportId, updates) => {
  const hasFile = updates.officerAttachmentFile instanceof File;
  let r;
  if (hasFile) {
    const formData = new FormData();
    if (updates.committeeComment != null) formData.append("committeeComment", updates.committeeComment);
    if (updates.finalDecision) formData.append("finalDecision", updates.finalDecision);
    formData.append("officerAttachment", updates.officerAttachmentFile);
    r = await api.patch(`/research/${researchId}/decision-reports/${reportId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    const { officerAttachmentFile, ...rest } = updates;
    r = await api.patch(`/research/${researchId}/decision-reports/${reportId}`, rest);
  }
  return r.data?.data?.report;
};

// The one action that turns the compiled draft into the researcher's
// official outcome — issues the decision letter and the single
// researcher-facing email.
export const releaseDecisionReport = async (researchId, reportId) => {
  const r = await api.post(`/research/${researchId}/decision-reports/${reportId}/release`);
  return r.data?.data;
};

//  Admin / Research Officer — dashboard 

export const getResearchDashboardStats = async () => {
  const r = await api.get("/research/admin/stats");
  return r.data?.data?.stats ?? r.data?.data;
};

export const getReviewerWorkload = async () => {
  const r = await api.get("/research/admin/reviewer-workload");
  return r.data?.data ?? { reviewers: [], committee: [] };
};

export const getResearchRevenue = async (params) => (await api.get(`/payments/admin/revenue?${params}`)).data?.data;
export const getAllResearchRevenue = async (f = {}) => {
  const p = new URLSearchParams({ status: f.status || "completed" });
  if (f.researcherId) p.append("researcher", f.researcherId);
  if (f.startDate) p.append("startDate", f.startDate);
  if (f.endDate) p.append("endDate", f.endDate);
  return (await api.get(`/payments/admin/revenue?${p}`)).data?.data;
};
export const refundPayment = async (paymentId, reason) =>
  (await api.post("/payments/admin/refund", { paymentId, reason })).data;



export const formatPhoneNumber = (phone) => {
  let d = String(phone).replace(/\D/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  if (!d.startsWith("254") || d.length !== 12) throw new Error("Invalid phone number");
  return d;
};



export const SUBMISSION_TYPES = {
  INITIAL_PROPOSAL: "initial_proposal", AMENDMENT: "amendment",
  CONTINUING_REVIEW: "continuing_review", STUDY_CLOSURE: "study_closure",
};
export const SUBMISSION_TYPE_LABELS = {
  initial_proposal: "Initial Proposal", amendment: "Amendment",
  continuing_review: "Continuing Review", study_closure: "Study Closure",
};
export const DEVIATION_TYPES = [
  { value: "protocol_deviation", label: "Protocol Deviation" },
  { value: "protocol_violation", label: "Protocol Violation" },
  { value: "safety_event", label: "Safety Event" },
];
export const DEVIATION_SEVERITIES = [
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];
export const KEMRI_PROGRAMMES = [
  "Biotechnology","Traditional Medicine & Drug Development",
  "Infectious and Parasitic Diseases","Public Health and Health Systems",
  "Non-Communicable Diseases","Sexual, Reproductive, Adolescent and Child Health",
];
export const KENYAN_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi",
  "Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos",
  "Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a",
  "Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri",
  "Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi",
  "Trans-Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];
//  Researcher — Certificates 

export const getMyCertificates = async () => {
  const res = await api.get("/certificates/my");
  return res.data?.data?.certificates || res.data?.certificates || [];
};

export const downloadCertificate = async (id, mode = "download") => {
  const res = await api.get(`/certificates/${id}/download`, {
    params: mode === "view" ? { mode: "view" } : {},
    responseType: "blob",
  });
  return res.data;
};
