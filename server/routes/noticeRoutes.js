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

const adminComms = [verifyToken, authorizeRoles("admin", "communication")];


router.get("/", getAllNotices);
router.get("/stats", getNoticeStats);                        

router.post("/bulk/delete", ...adminComms, bulkDeleteNotices); 


router.get("/:id", getNoticeById);

router.post("/", ...adminComms, createNotice);
router.put("/:id", ...adminComms, updateNotice);
router.delete("/:id", ...adminComms, deleteNotice);
router.patch("/:id/toggle-visibility", ...adminComms, toggleVisibility);
router.post("/:id/duplicate", ...adminComms, duplicateNotice);
router.post("/:id/attachments", ...adminComms, uploadNotice.single("file"), uploadAttachment);
router.delete("/:id/attachments", ...adminComms, deleteAttachment);

module.exports = router;