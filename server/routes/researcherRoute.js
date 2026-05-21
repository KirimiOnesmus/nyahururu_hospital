const express = require("express");
const router = express.Router();
const researcherController = require("../controllers/researcherController");
const {
  protectResearcher,
  authorizeResearcherRoles,
  protectEither,    
} = require("../middleware/auth");

router.post("/register", researcherController.register);

router.post("/verify-email", researcherController.verifyEmail);

router.post("/login", researcherController.login);

router.post("/forgot-password", researcherController.forgotPassword);

router.post("/reset-password", researcherController.resetPassword);

//PROTECTED ROUTES - Researcher JWT authentication required

router.get("/me", protectResearcher, researcherController.getMe);

router.put("/profile", protectResearcher, researcherController.updateProfile);

router.post(
  "/change-password",
  protectResearcher,
  researcherController.changePassword,
);

//  Admin routes for managing researchers
router.post(
  "/admin/create",
  protectEither,                                         
  (req, res, next) => {
    const staffOk  = req.user     && ["admin", "superadmin"].includes(req.user.role);
    const researchOk = req.researcher && req.researcher.role === "admin";
    if (staffOk || researchOk) return next();
    return res.status(403).json({ message: "Admin access required" });
  },
  researcherController.adminCreateResearcher,
);

module.exports = router;
