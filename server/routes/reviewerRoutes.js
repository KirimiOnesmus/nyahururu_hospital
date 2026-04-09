const express = require("express");
const router = express.Router();
const reviewerController = require("../controllers/reviewerController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.post(
  "/set-password",
  reviewerController.setPassword
);

//ADMIN ONLY ROUTES - Staff admin or research admin JWT required

router.post(
  "/invite",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.inviteReviewer
);

router.post(
  "/:id/resend-invite",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.resendInvite
);

router.patch(
  "/:id/revoke",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.revokeReviewer
);


router.patch(
  "/:id/promote-admin",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.promoteToAdmin
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.updateReviewer
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.listReviewers
);

router.get(
  "/all",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.listAllResearchers
);

module.exports = router;