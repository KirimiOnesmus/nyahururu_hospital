const express = require("express");
const router = express.Router();
const { getAuditLogs, getAuditStats } = require("../controllers/auditLogController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.get("/", verifyToken, authorizeRoles("superadmin", "it"), getAuditLogs);
router.get("/stats", verifyToken, authorizeRoles("superadmin", "it"), getAuditStats);

module.exports = router;
