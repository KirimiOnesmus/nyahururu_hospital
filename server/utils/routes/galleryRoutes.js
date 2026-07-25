const express = require("express");
const router = express.Router();
const {
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  bulkDeleteGallery,
  toggleVisibility,
  likeGallery,
  getGalleryStats,
} = require("../controllers/galleryController");

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/galleryCategoryController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");
const createUploader = require("../middleware/upload");
const uploadGallery = createUploader("gallery");

// Public routes
router.get("/", getAllGallery);
router.get("/stats", getGalleryStats);
router.get("/categories", getAllCategories);
router.get("/:id", getGalleryById);
router.post("/:id/like", likeGallery);

// Protected routes - Gallery
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "communication", "it"),
  uploadGallery.single("file"),
  createGallery
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "communication", "it"),
  updateGallery
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "communication", "it"),
  deleteGallery
);
router.post(
  "/bulk/delete",
  verifyToken,
  authorizeRoles("admin", "communication"),
  bulkDeleteGallery
);
router.patch(
  "/:id/toggle-visibility",
  verifyToken,
  authorizeRoles("admin", "communication", "it"),
  toggleVisibility
);

// Protected routes - Categories
router.get("/categories/:id", getCategoryById);
router.post(
  "/categories",
  verifyToken,
  authorizeRoles("admin"),
  createCategory
);
router.put(
  "/categories/:id",
  verifyToken,
  authorizeRoles("admin"),
  updateCategory
);
router.delete(
  "/categories/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteCategory
);

module.exports = router;
