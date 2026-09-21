"use strict";
const researchService = require("../services/researchService");
const audit = require("../services/auditService");
const {
  Research,
  Researcher,
  Review,
  ResearchReviewer,
} = require("../sequelize/models");
const { asyncHandler, sendSuccess, AppError } = require("../utils/appError");

//  Shared

exports.getResearchById = asyncHandler(async (req, res) => {
  const paper = await researchService.getResearchById(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });
  sendSuccess(res, 200, "Research fetched successfully.", { paper });
});

exports.getRevisionComparison = asyncHandler(async (req, res) => {
  const comparison = await researchService.getRevisionComparison(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });
  sendSuccess(res, 200, "Revision comparison fetched.", { comparison });
});

//  Researcher

exports.getMyResearch = asyncHandler(async (req, res) => {
  const result = await researchService.getMyResearch(
    req.researcher.id,
    req.query,
  );
  sendSuccess(res, 200, "Your research fetched successfully.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.initiateProposalPayment = asyncHandler(async (req, res) => {
  const result = await researchService.initiateProposalPayment({
    phone: req.body.phone,
    researcherId: req.researcher?.id || null,
  });
  sendSuccess(res, 200, result.message, result);
});

exports.confirmProposalSubmission = asyncHandler(async (req, res) => {
  const file =
    req.files?.proposalFile?.[0] ||
    req.files?.find?.((f) =>
      ["proposalFile", "proposal", "pdf"].includes(f.fieldname),
    );


  const acucApprovalDoc = req.files?.find?.((f) =>
    ["acucApprovalDoc", "acucApproval"].includes(f.fieldname),
  );
  const insuranceCertificateDoc = req.files?.find?.((f) =>
    ["insuranceCertificateDoc", "insuranceCertificate"].includes(f.fieldname),
  );

  const research = await researchService.confirmProposalSubmission(
    req.researcher,
    req.body,
    file,
    { acucApprovalDoc, insuranceCertificateDoc },
  );
  sendSuccess(
    res,
    201,
    "Proposal submitted successfully. Awaiting reviewer assignment.",
    {
      research: {
        id: research.id,
        title: research.title,
        submissionType: research.submissionType,
        status: research.status,
        submittedAt: research.createdAt,
      },
    },
  );
});

exports.submitAmendment = asyncHandler(async (req, res) => {
  const file = req.files?.find?.((f) =>
    ["proposalFile", "protocol"].includes(f.fieldname),
  );
  const research = await researchService.submitAmendment(
    req.researcher,
    req.body,
    file,
  );
  sendSuccess(res, 201, "Amendment submitted successfully.", {
    research: {
      id: research.id,
      title: research.title,
      amendmentNumber: research.amendmentNumber,
      status: research.status,
    },
  });
});

exports.submitContinuingReview = asyncHandler(async (req, res) => {
  const research = await researchService.submitContinuingReview(
    req.researcher,
    req.body,
    req.files,
  );
  sendSuccess(res, 201, "Continuing review submitted successfully.", {
    research: {
      id: research.id,
      title: research.title,
      continuingReviewNumber: research.continuingReviewNumber,
      status: research.status,
    },
  });
});

exports.submitStudyClosure = asyncHandler(async (req, res) => {
  const file = req.files?.[0] || req.file || null;
  const research = await researchService.submitStudyClosure(
    req.researcher,
    req.body,
    file,
  );
  sendSuccess(res, 201, "Study closure report submitted successfully.", {
    research: {
      id: research.id,
      title: research.title,
      closureReason: research.closureReason,
      status: research.status,
      publicationLink: research.publicationLink,
    },
  });
});

exports.resubmit = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const file = files.find((f) =>
    ["proposalFile", "paper", "pdf"].includes(f.fieldname),
  );
  const research = await researchService.resubmit(
    req.researcher,
    req.params.id,
    req.body,
    file,
    files,
  );
  sendSuccess(res, 200, "Resubmission received.", {
    research: {
      id: research.id,
      status: research.status,
      resubmissionCount: research.resubmissionCount,
    },
  });
});

exports.getMyRevenue = asyncHandler(async (req, res) => {
  const result = await researchService.getResearcherRevenue(
    req.researcher,
    req.params.id,
    { researcher: req.researcher || null, user: req.user || null },
  );
  sendSuccess(res, 200, "Revenue data fetched successfully.", result);
});

//  Reviewer

exports.getAssignedResearch = asyncHandler(async (req, res) => {
  const result = await researchService.getAssignedResearch(
    req.researcher?.id || req.user?.id,
    req.query,
  );
  sendSuccess(
    res,
    200,
    "Assigned research fetched successfully.",
    result.papers,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  );
});

exports.submitReview = asyncHandler(async (req, res) => {
  let reviewer = req.researcher;
  if (!reviewer && req.user) {
    reviewer = await Researcher.findOne({
      where: { email: req.user.email },
      attributes: ["id", "name", "email", "role", "institution"],
    });
    if (!reviewer)
      throw new AppError(
        "No reviewer profile found for this staff account.",
        403,
      );
  }
  if (!reviewer) throw new AppError("Reviewer authentication required.", 401);

  const { review, research, reviewProgress } =
    await researchService.submitReview(reviewer, req.body, req.files || []);
  audit.log({
    req, action: "submit_review", resource: "research", resourceId: research.id,
    description: `Review submitted: ${review.decision} (round ${review.round})`,
    metadata: { decision: review.decision, round: review.round },
  });
  sendSuccess(res, 201, "Review submitted successfully.", {
    review: {
      id: review.id,
      decision: review.decision,
      round: review.round,
      submittedAt: review.submittedAt,
    },
    research: { id: research.id, status: research.status },
    reviewProgress,
  });
});

exports.getReviewHistory = asyncHandler(async (req, res) => {
  const comments = await researchService.getResearchComments(
    req.params.researchId,
    {
      researcher: req.researcher,
      user: req.user,
    },
  );
  sendSuccess(res, 200, "Review history fetched successfully.", {
    reviews: comments,
  });
});

exports.getReviewerStats = asyncHandler(async (req, res) => {
  const reviewerId = req.researcher?.id || req.user?.id;
  const stats = await Review.getReviewerStats(reviewerId);
  sendSuccess(res, 200, "Reviewer stats fetched successfully.", { stats });
});

//  Research comments

exports.getResearchComments = asyncHandler(async (req, res) => {
  const comments = await researchService.getResearchComments(req.params.id, {
    researcher: req.researcher,
    user: req.user,
  });
  sendSuccess(res, 200, "Comments fetched successfully.", { comments });
});

//  Committee

exports.getCommitteeQueue = asyncHandler(async (req, res) => {
  const result = await researchService.getCommitteeQueue(req.query);
  sendSuccess(res, 200, "Committee queue fetched.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.getAllResearchCommittee = asyncHandler(async (req, res) => {
  const result = await researchService.getAllResearchCommittee(req.query);
  sendSuccess(res, 200, "All research fetched.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.submitCommitteeReview = asyncHandler(async (req, res) => {
  const { review, research, finalized, votesReceived, votesRequired, votesMax, decisionCounts } =
    await researchService.submitCommitteeReview(req.researcher, req.body);
  audit.log({
    req, action: "submit_committee_review", resource: "research", resourceId: research.id,
    description: `Committee vote: ${review.decision} (round ${review.round})${finalized ? " — FINALIZED" : ""}`,
    severity: finalized ? "medium" : "info",
    metadata: { decision: review.decision, finalized, votesReceived, decisionCounts },
  });
  sendSuccess(res, 201, "Committee decision recorded.", {
    review: { id: review.id, decision: review.decision, round: review.round },
    research: { id: research.id, status: research.status },
    finalized,
    votesReceived,
    votesRequired,
    votesMax,
    decisionCounts,
  });
});

// Chair's change #6.1: optional narrative note a committee member can
// attach to the draft Compiled Decision Report.
exports.addCommitteeReportNote = asyncHandler(async (req, res) => {
  const report = await researchService.addCommitteeReportNote(
    req.researcher || req.user,
    req.body,
  );
  audit.log({
    req, action: "add_committee_report_note", resource: "research", resourceId: req.body.researchId,
    description: "Committee narrative note added to decision report.",
  });
  sendSuccess(res, 200, "Note added to decision report.", { report });
});


exports.getDecisionReport = asyncHandler(async (req, res) => {
  const report = await researchService.getDecisionReport(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });
  if (!report) {
    return sendSuccess(res, 200, "No decision report available yet.", { report: null });
  }
  sendSuccess(res, 200, "Decision report fetched.", { report });
});


exports.updateDecisionReport = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) {
    updates.officerAttachment = `/uploads/officer-reports/${req.file.filename}`;
  }
  const report = await researchService.updateDecisionReport(
    req.params.id,
    req.params.reportId,
    updates,
  );
  audit.log({
    req, action: "update_decision_report", resource: "research", resourceId: req.params.id,
    description: "Decision report edited by Research Officer.",
    metadata: { finalDecision: report.finalDecision, hasAttachment: !!req.file },
  });
  sendSuccess(res, 200, "Decision report updated.", { report });
});

exports.releaseDecisionReport = asyncHandler(async (req, res) => {
  const { research, report } = await researchService.releaseDecisionReport(
    req.user || req.researcher,
    req.params.id,
    req.params.reportId,
  );
  audit.log({
    req, action: "release_decision_report", resource: "research", resourceId: research.id,
    description: `Decision report released: ${report.finalDecision}`,
    severity: "medium",
    metadata: { finalDecision: report.finalDecision },
  });
  sendSuccess(res, 200, "Decision report released to researcher.", {
    research: { id: research.id, status: research.status },
    report,
  });
});

exports.getOfficerReviewQueue = asyncHandler(async (req, res) => {
  const result = await researchService.getOfficerReviewQueue(req.query);
  sendSuccess(res, 200, "Officer review queue fetched.", result.records, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.getFinalApprovalQueue = asyncHandler(async (req, res) => {
  const result = await researchService.getFinalApprovalQueue(req.query);
  sendSuccess(res, 200, "Final approval queue fetched.", result.records, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.getFinalApprovalStats = asyncHandler(async (req, res) => {
  const stats = await researchService.getFinalApprovalStats();
  sendSuccess(res, 200, "Stats fetched.", stats);
});

exports.getApprovalFeed = asyncHandler(async (req, res) => {
  const comments = await researchService.getApprovalFeed(req.query);
  sendSuccess(res, 200, "Feed fetched.", { comments });
});

exports.postApprovalComment = asyncHandler(async (req, res) => {
  if (!req.researcher)
    throw new AppError("Committee authentication required.", 401);
  const comment = await researchService.postApprovalComment(req.researcher, {
    researchId: req.body.researchId,
    message: req.body.message,
  });
  sendSuccess(res, 201, "Comment posted.", { comment });
});

exports.getRecordTimeline = asyncHandler(async (req, res) => {
  const timeline = await researchService.getRecordTimeline(req.params.id);
  sendSuccess(res, 200, "Timeline fetched.", { timeline });
});

//  Admin

exports.getAllResearchAdmin = asyncHandler(async (req, res) => {
  const result = await researchService.getAllResearchAdmin(req.query);
  sendSuccess(res, 200, "All research fetched.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.assignReviewers = asyncHandler(async (req, res) => {
  const { research, assignments } = await researchService.assignReviewers(
    req.params.id,
    req.body.emails,
    req.researcher?.id || req.user?.id,
  );
  audit.log({
    req, action: "assign_reviewer", resource: "research", resourceId: research.id,
    description: `Assigned ${assignments.length} reviewer(s) to "${research.title}"`,
    metadata: { reviewerEmails: assignments.map((a) => a.reviewer.email) },
  });
  sendSuccess(res, 200, `${assignments.length} reviewer(s) assigned.`, {
    research: { id: research.id, title: research.title },
    reviewers: assignments.map((a) => ({
      id: a.reviewer.id,
      name: a.reviewer.name,
      email: a.reviewer.email,
      isNew: a.isNew,
    })),
  });
});


exports.assignReviewer = asyncHandler(async (req, res) => {
  const { research, reviewer, isReassignment } =
    await researchService.assignReviewer(req.params.id, req.body.email);
  sendSuccess(
    res,
    200,
    isReassignment
      ? `Reviewer re-assigned to ${reviewer.name}.`
      : `${reviewer.name} assigned as reviewer.`,
    {
      research: {
        id: research.id,
        title: research.title,
        assignedReviewer: {
          id: reviewer.id,
          name: reviewer.name,
          email: reviewer.email,
        },
      },
    },
  );
});

exports.getResearchReviewers = asyncHandler(async (req, res) => {
  const assignments = await ResearchReviewer.getForResearch(req.params.id);
  sendSuccess(res, 200, "Reviewers fetched.", { reviewers: assignments });
});

exports.removeReviewer = asyncHandler(async (req, res) => {
  const deleted = await ResearchReviewer.destroy({
    where: { researchId: req.params.id, reviewerId: req.params.reviewerId },
  });
  if (!deleted) throw new AppError("Reviewer assignment not found.", 404);
  audit.log({
    req, action: "remove_reviewer", resource: "research", resourceId: req.params.id,
    description: `Removed reviewer ${req.params.reviewerId} from research ${req.params.id}`,
  });
  sendSuccess(res, 200, "Reviewer removed.");
});

exports.reactivateResearch = asyncHandler(async (req, res) => {
  const adminId = req.researcher?.id || req.user?.id;
  const research = await researchService.reactivateResearch(
    req.params.id,
    adminId,
    req.body.reason,
  );
  audit.log({
    req, action: "reactivate", resource: "research", resourceId: research.id,
    description: `Reactivated research "${research.title}" — reason: ${req.body.reason}`,
    severity: "medium",
  });
  sendSuccess(res, 200, "Research reactivated.", {
    research: {
      id: research.id,
      status: research.status,
      reactivatedAt: research.reactivatedAt,
    },
  });
});

exports.deleteResearch = asyncHandler(async (req, res) => {
  await researchService.deleteResearch(
    req.params.id,
    req.researcher?.id || req.user?.id,
  );
  audit.log({
    req, action: "delete", resource: "research", resourceId: req.params.id,
    description: `Soft-deleted research ID ${req.params.id}`,
    severity: "high",
  });
  sendSuccess(res, 200, "Research deleted.");
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await researchService.getDashboardStats();
  sendSuccess(res, 200, "Dashboard stats fetched.", { stats });
});


exports.getPublicStats = asyncHandler(async (req, res) => {
  const stats = await researchService.getPublicResearchStats();
  res.set("Cache-Control", "public, max-age=120");
  sendSuccess(res, 200, "Public research stats fetched.", { stats });
});


exports.getReviewerWorkload = asyncHandler(async (req, res) => {
  const workload = await researchService.getReviewerWorkload();
  sendSuccess(res, 200, "Reviewer workload fetched.", workload);
});

exports.getCoInvestigatorStudies = asyncHandler(async (req, res) => {
  const studies = await researchService.getCoInvestigatorStudies(req.researcher.id);
  sendSuccess(res, 200, "Co-investigator studies fetched.", { studies });
});

exports.getResearchCoInvestigators = asyncHandler(async (req, res) => {
  const coInvestigators = await researchService.getResearchCoInvestigators(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });
  sendSuccess(res, 200, "Co-investigators fetched.", { coInvestigators });
});

exports.setCoInvestigatorEditAccess = asyncHandler(async (req, res) => {
  const assignment = await researchService.setCoInvestigatorEditAccess(
    req.params.id,
    req.params.coInvestigatorId,
    req.body.canEdit,
    req.researcher.id,
  );
  audit.log({
    req, action: "update", resource: "research_co_investigator", resourceId: assignment.id,
    description: `${assignment.canEdit ? "Granted" : "Revoked"} delegated edit access for co-investigator ${assignment.researcherId} on research ${req.params.id}`,
  });
  sendSuccess(res, 200, "Co-investigator edit access updated.", {
    coInvestigatorId: assignment.researcherId,
    canEdit: assignment.canEdit,
  });
});


exports.coInvestigatorEditResearch = asyncHandler(async (req, res) => {
  const research = await researchService.coInvestigatorEditResearch(
    req.researcher,
    req.params.id,
    req.body,
  );
  audit.log({
    req, action: "update", resource: "research_co_edit", resourceId: research.id,
    description: `Co-investigator edited delegated sections of "${research.title}"`,
  });
  sendSuccess(res, 200, "Changes saved.", {
    research: { id: research.id, status: research.status, updatedAt: research.updatedAt },
  });
});


exports.recordCscEndorsement = asyncHandler(async (req, res) => {
  const adminId = req.researcher?.id || req.user?.id;
  const evidenceFile = req.files?.find?.((f) =>
    ["cscEvidenceFile", "csc-evidence", "evidence"].includes(f.fieldname),
  ) || req.files?.[0] || null;
  const research = await researchService.recordCscEndorsement(
    req.params.id,
    req.body,
    adminId,
    evidenceFile,
  );
  audit.log({
    req, action: "approve", resource: "research_csc", resourceId: research.id,
    description: `Recorded CSC endorsement for "${research.title}" (attested by ${research.cscContactName} <${research.cscContactEmail}>)`,
  });
  sendSuccess(res, 200, "CSC endorsement recorded.", {
    research: { id: research.id, cscApprovalDate: research.cscApprovalDate, cscEvidenceFile: research.cscEvidenceFile },
  });
});


exports.returnForCorrection = asyncHandler(async (req, res) => {
  const adminId = req.researcher?.id || req.user?.id;
  const research = await researchService.returnForCorrection(req.params.id, req.body, adminId);
  audit.log({
    req, action: "reject", resource: "research_completeness", resourceId: research.id,
    description: `Returned "${research.title}" for correction: ${(research.completenessIssues || []).join(", ")}`,
  });
  sendSuccess(res, 200, "Proposal returned for correction.", {
    research: { id: research.id, status: research.status, issues: research.completenessIssues },
  });
});

exports.markCompletenessVerified = asyncHandler(async (req, res) => {
  const adminId = req.researcher?.id || req.user?.id;
  const research = await researchService.markCompletenessVerified(req.params.id, adminId);
  audit.log({
    req, action: "approve", resource: "research_completeness", resourceId: research.id,
    description: `Verified completeness for "${research.title}"`,
  });
  sendSuccess(res, 200, "Completeness verified.", {
    research: { id: research.id, status: research.status, completenessCheckedAt: research.completenessCheckedAt },
  });
});


exports.submitProtocolDeviation = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const deviation = await researchService.submitProtocolDeviation(req.researcher, req.body, files);
  sendSuccess(res, 201, "Protocol deviation report submitted.", { deviation });
});

exports.getProtocolDeviations = asyncHandler(async (req, res) => {
  const deviations = await researchService.getProtocolDeviations(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });
  sendSuccess(res, 200, "Protocol deviations fetched.", { deviations });
});


exports.getDecisionLetter = asyncHandler(async (req, res) => {
  const research = await researchService.getDecisionLetter(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });
  sendSuccess(res, 200, "Decision letter fetched.", {
    decisionLetterNumber: research.decisionLetterNumber,
    decisionLetterFile: research.decisionLetterFile,
    decisionLetterIssuedAt: research.decisionLetterIssuedAt,
  });
});

exports.getDecisionLetterHistory = asyncHandler(async (req, res) => {
  const letters = await researchService.getDecisionLetterHistory(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });
  sendSuccess(res, 200, "Decision letter history fetched.", { letters });
});
