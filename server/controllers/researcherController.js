const authService   = require("../services/researcherService")
const { asyncHandler, sendSuccess } = require("../utils/appError");

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  sendSuccess(res, 201, "Account created. Please check your email to verify.", {
    token:      result.token,
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
  sendSuccess(res, 200, "Login successful.", { token, researcher });
});

exports.getMe = asyncHandler(async (req, res) => {
  const researcher = await authService.getMe(req.researcher._id);
  sendSuccess(res, 200, "Profile fetched successfully.", { researcher });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const researcher = await authService.updateProfile(req.researcher._id, req.body);
  sendSuccess(res, 200, "Profile updated successfully.", { researcher });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.researcher._id, req.body);
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