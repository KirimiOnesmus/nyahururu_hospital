const express = require("express");
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");
const createUploader = require("../middleware/upload");
const uploadEvents = createUploader("events");

router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "communication", "it"),
  uploadEvents.single("image"),
  createEvent
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "communication", "it"),
  uploadEvents.single("image"),
  updateEvent
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "communication", "it"),
  deleteEvent
);

module.exports = router;
