const express = require("express");
const router = express.Router();
const researcherController = require("../controllers/researcherController");
const { protectResearcher } = require("../middleware/auth");


router.post(
  "/register",
  researcherController.register
);

router.post(
  "/verify-email",
  researcherController.verifyEmail
);

router.post(
  "/login",
  researcherController.login
);

router.post(
  "/forgot-password",
  researcherController.forgotPassword
);


router.post(
  "/reset-password",
  researcherController.resetPassword
);

//PROTECTED ROUTES - Researcher JWT authentication required
  
router.get(
  "/me",
  protectResearcher,
  researcherController.getMe
);


router.put(
  "/profile",
  protectResearcher,
  researcherController.updateProfile
);

router.post(
  "/change-password",
  protectResearcher,
  researcherController.changePassword
);

module.exports = router;