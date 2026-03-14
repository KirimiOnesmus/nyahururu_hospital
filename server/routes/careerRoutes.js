const express = require("express");
const router = express.Router();
const {
  getAllCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
} = require("../controllers/careersController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.get("/", getAllCareers);

router.get("/:id", getCareerById);

// Admin: create a new career
router.post("/", verifyToken, authorizeRoles("admin"), createCareer);

// Admin: update a career
router.put("/:id", verifyToken, authorizeRoles("admin"), updateCareer);

// Admin: delete a career
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteCareer);

module.exports = router;
