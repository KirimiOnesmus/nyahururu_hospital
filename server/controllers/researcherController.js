const authService   = require("../services/researcherService")
const { asyncHandler, sendSuccess } = require("../utils/appError");
const { setAuthCookies, revokeAuthSession, signRefreshToken } = require("../utils/tokenService");

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  sendSuccess(res, 201, "Account created. Please check your email to verify.", {
    researcher: result.researcher,
    ...(result._devVerifyLink && { _devVerifyLink: result._devVerifyLink }),
  });
});
 
exports.verifyEmail = asyncHandler(async (req, res) => {
  const researcher = await authService.verifyEmail(req.body);
  sendSuccess(res, 200, "Email verified successfully.", { researcher });
});

exports.login = asyncHandler(async (req, res) => {
  const { token, researcher } = await authService.login(req.body);
  const { token: refreshToken } = signRefreshToken({ id: researcher.id });
  setAuthCookies(res, token, refreshToken);
  sendSuccess(res, 200, "Login successful.", { researcher });
});

exports.logout = asyncHandler(async (req, res) => {
  await revokeAuthSession(req, res);
  sendSuccess(res, 200, "Logged out successfully.");
});

exports.getMe = asyncHandler(async (req, res) => {
  const researcher = await authService.getMe(req.researcher.id);
  sendSuccess(res, 200, "Profile fetched successfully.", { researcher });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const researcher = await authService.updateProfile(req.researcher.id, req.body);
  sendSuccess(res, 200, "Profile updated successfully.", { researcher });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.researcher.id, req.body);
  sendSuccess(res, 200, "Password changed successfully.");
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const message = await authService.forgotPassword(req.body.email);
  sendSuccess(res, 200, message);
});

exports.resetPassword = asyncHandler(async (req, res) => { 
  await authService.resetPassword(req.body);
  sendSuccess(res, 200, "Password reset successfully. You can now log in.");
}); 

exports.adminCreateResearcher = asyncHandler(async (req, res) => {
  const researcher = await authService.adminCreateResearcher(req.body);
  sendSuccess(res, 201, "Researcher account created. Credentials sent via email.", { researcher });
});
exports.listAll = asyncHandler(async (req, res) => {
  const { Researcher } = require("../sequelize/models");
  const { Op } = require("sequelize");

  const { role, search, limit = 200 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (search) {
    const like = `%${search}%`;
    where[Op.or] = [
      { name: { [Op.like]: like } },
      { email: { [Op.like]: like } },
      { institution: { [Op.like]: like } },
    ];
  }

  const researchers = await Researcher.findAll({
    where,
    attributes: [
      "id", "name", "firstName", "lastName", "email", "role",
      "isCommittee", "institution", "department", "discipline",
      "emailVerified", "isActive", "createdAt",
    ],
    order: [["createdAt", "DESC"]],
    limit: Math.min(Number(limit) || 200, 500),
  });

  sendSuccess(res, 200, "Researchers fetched.", { researchers });
});