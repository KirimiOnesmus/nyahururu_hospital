const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();
const {
  getAllResearch,
  getResearchById,
  createResearch,
  updateResearch,
  deleteResearch,
} = require("../controllers/researchController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");
const uploader = upload("research");
router.get("/", getAllResearch);

router.get("/:id", getResearchById);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "it"),
  uploader.fields([
    { name: "pdf", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createResearch
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "it"),
  uploader.fields([
    { name: "pdf", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateResearch
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "it"),
  deleteResearch
);

module.exports = router;
