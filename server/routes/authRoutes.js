const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// Register new user (only admin or IT can do this)
router.post("/register", verifyToken, authorizeRoles("admin", "it"), register);

// Login (everyone)
router.post("/login", login);

module.exports = router;