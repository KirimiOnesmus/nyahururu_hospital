const express = require("express");
const router = express.Router();
const { login, logout, refresh, me } = require("../controllers/authController");
const { createUser } = require("../controllers/userController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");


router.post("/register", verifyToken, authorizeRoles("admin", "it"), createUser);

router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/refresh", refresh);
router.get("/me", verifyToken, me);

module.exports = router;
