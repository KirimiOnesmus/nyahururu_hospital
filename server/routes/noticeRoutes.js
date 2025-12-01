const express = require("express");
const router = express.Router();
const {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  bulkDeleteNotices,
  toggleVisibility,
  uploadAttachment,
  deleteAttachment,
  duplicateNotice,
  getNoticeStats,
} = require("../controllers/noticeController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");
const createUploader = require("../middleware/upload"); 
const uploadNotice = createUploader("notices");

// Public routes
router.get("/", getAllNotices);
router.get("/stats", getNoticeStats);
router.get("/:id", getNoticeById);

// Protected routes
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "communication"),
  createNotice
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "communication"),
  updateNotice
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "communication"),
  deleteNotice
);
router.post(
  "/bulk/delete",
  verifyToken,
  authorizeRoles("admin", "communication"),
  bulkDeleteNotices
);
router.patch(
  "/:id/toggle-visibility",
  verifyToken,
  authorizeRoles("admin", "communication"),
  toggleVisibility
);
router.post(
  "/:id/duplicate",
  verifyToken,
  authorizeRoles("admin", "communication"),
  duplicateNotice
);
router.post(
  "/:id/attachments",
  verifyToken,
  authorizeRoles("admin", "communication"),
  uploadNotice.single("file"),
  uploadAttachment
);
router.delete(
  "/:id/attachments",
  verifyToken,
  authorizeRoles("admin", "communication"),
  deleteAttachment
);

module.exports = router;
