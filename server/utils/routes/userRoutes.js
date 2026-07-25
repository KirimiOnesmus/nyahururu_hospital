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

// M3: dedicated, tighter rate limit for password-reset requests — these
// are exactly the kind of endpoint brute-force/enumeration tooling
// targets, and the general API limiter alone isn't tight enough for it.
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// all users
router.get("/", verifyToken, authorizeRoles("admin", "it"), getAllUsers);

// View a single user by ID
router.get("/:id", verifyToken, authorizeRoles("admin", "it", "doctor", "communication"), getUserById);

// add users
router.post("/", verifyToken, authorizeRoles("admin", "it"), createUser);

// update users
router.put("/:id", verifyToken, authorizeRoles("admin", "it"), updateUser);

// verifying email
router.post("/verify-email", verifyEmail);

// H5: staff self-service password reset (previously staff had no way to
// recover a forgotten password at all short of an admin manually issuing
// a new one).
router.post("/forgot-password", resetLimiter, requestPasswordReset);
router.post("/reset-password", resetLimiter, resetPassword);

// delete users
router.delete("/:id", verifyToken, authorizeRoles("admin", "it"), deleteUser);

module.exports = router;
