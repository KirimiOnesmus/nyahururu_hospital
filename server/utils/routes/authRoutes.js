const express = require("express");
const router = express.Router();
const { login, logout, refresh, me } = require("../controllers/authController");
const { createUser } = require("../controllers/userController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// C2: authController.register removed. Account creation now goes through
// the single hardened path in userController.createUser (role-ceiling
// enforcement, email verification, generated temp password, employeeId/RFID
// generation) — this route is kept only so existing frontend calls to
// POST /api/auth/register keep working, but it now does exactly what
// POST /api/users does.
router.post("/register", verifyToken, authorizeRoles("admin", "it"), createUser);

router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/refresh", refresh);
router.get("/me", verifyToken, me);

module.exports = router;
