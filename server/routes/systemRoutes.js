"use strict";

const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { getSystemHealth, getSystemSettings, setMaintenanceMode } = require("../controllers/systemController");

// Health monitoring must still work when the database itself is unavailable,
// so validate the signed access token here without looking up the account row.
const verifySuperadminHealthToken = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.jwt;
  if (!token) return res.status(401).json({ success: false, message: "Authentication required." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role !== "superadmin" || decoded.collection === "researchers") {
      return res.status(403).json({ success: false, message: "Superadmin access required." });
    }
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });
  }
};

router.get("/health", verifySuperadminHealthToken, getSystemHealth);
router.get("/settings", verifyToken, authorizeRoles("superadmin"), getSystemSettings);
router.put("/settings/maintenance", verifyToken, authorizeRoles("superadmin"), setMaintenanceMode);

module.exports = router;
