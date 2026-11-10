const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  verifyEmail,
  deleteUser,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/userController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");


const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

router.get("/", verifyToken, authorizeRoles("admin", "it"), getAllUsers);

// View a single user by ID
router.get("/:id", verifyToken, authorizeRoles("admin", "it"), getUserById);


router.post("/", verifyToken, authorizeRoles("admin", "it"), createUser);


router.put("/:id", verifyToken, authorizeRoles("admin", "it"), updateUser);

router.post("/verify-email", verifyEmail);

router.post("/forgot-password", resetLimiter, requestPasswordReset);
router.post("/reset-password", resetLimiter, resetPassword);

router.delete("/:id", verifyToken, authorizeRoles("admin", "it"), deleteUser);

module.exports = router;
