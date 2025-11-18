const express = require("express");
const router = express.Router();
const createUploader  = require('../middleware/upload'); 
const uploadPhoto= createUploader("profile");
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePhoto,
} = require("../controllers/profileController");
const { verifyToken } = require("../middleware/auth");

// Profile routes
router.get("/", verifyToken, getProfile);
router.put("/update", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);
router.post(
  "/upload-photo",
  verifyToken,
  uploadPhoto.single("image"),

  uploadProfilePhoto
);

module.exports = router;
