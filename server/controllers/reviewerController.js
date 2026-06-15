const reviewerService = require("../services/reviewerService");
const { asyncHandler, sendSuccess } = require("../utils/appError");

const { getCallerIdentity } = require("../middleware/auth");

exports.inviteReviewer = asyncHandler(async (req, res) => { 
  const caller = getCallerIdentity(req);
  const result = await reviewerService.inviteReviewer(req.body, caller);

  const message =
    result.action === "promoted"
      ? `${result.reviewer.name} has been promoted to reviewer.`
      : `Invitation sent to ${result.reviewer.email}. They have 72 hours to set their password.`;

  sendSuccess(res, result.action === "promoted" ? 200 : 201, message, {
    action:   result.action,
    reviewer: result.reviewer,
    ...(result._devInviteLink && { _devInviteLink: result._devInviteLink }),
  });
});

exports.setPassword = asyncHandler(async (req, res) => {
  const { token, reviewer } = await reviewerService.setPassword(req.body);
  sendSuccess(res, 200, "Password set successfully. You can now log in.", { token, reviewer });
});


exports.resendInvite = asyncHandler(async (req, res) => {
  const caller = getCallerIdentity(req);
  const result = await reviewerService.resendInvite(req.params.id, caller);

  sendSuccess(res, 200, "Invitation resent successfully.", {
    ...(result._devInviteLink && { _devInviteLink: result._devInviteLink }),
  });
});

exports.revokeReviewer = asyncHandler(async (req, res) => {
  const researcher = await reviewerService.revokeReviewer(req.params.id);
  sendSuccess(res, 200, `${researcher.name}'s reviewer access has been revoked.`, { researcher });
});

exports.promoteToAdmin = asyncHandler(async (req, res) => {
  const researcher = await reviewerService.promoteToAdmin(req.params.id);
  sendSuccess(res, 200, `${researcher.name} has been promoted to research admin.`, { researcher });
});

exports.listReviewers = asyncHandler(async (req, res) => {
  const result = await reviewerService.listReviewers();
  sendSuccess(res, 200, "Reviewers fetched successfully.", result);
});

exports.listAllResearchers = asyncHandler(async (req, res) => {
  const result = await reviewerService.listAllResearchers(req.query);
  sendSuccess(res, 200, "Researchers fetched successfully.", result, {
    page:       result.page,
    limit:      result.limit,
    total:      result.total,
    totalPages: result.totalPages,
  });
});

exports.updateReviewer = asyncHandler(async (req, res) => {
  const reviewer = await reviewerService.updateReviewer(req.params.id, req.body);
  sendSuccess(res, 200, "Reviewer updated successfully.", { reviewer });
});
