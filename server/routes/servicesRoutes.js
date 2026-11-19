const express = require("express");
const router = express.Router();
const {
  getAllServices,
  getServiceFilters,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/servicesController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");
const createUploader = require("../middleware/upload");
const uploadServices = createUploader("services");

// Public routes
router.get("/", getAllServices);
router.get("/filters", getServiceFilters);
router.get("/:id", getServiceById);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "it"),
  uploadServices.single("image"),
  createService
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "it"),
  uploadServices.single("image"),
  updateService
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "it"),
  deleteService
);

module.exports = router;
