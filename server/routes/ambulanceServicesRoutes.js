"use strict";

const express = require("express");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const controller = require("../controllers/ambulanceServicesController");

const router = express.Router();
router.get("/", controller.list);
router.get("/manage", verifyToken, authorizeRoles("admin", "it"), controller.manageList);
router.post("/", verifyToken, authorizeRoles("admin", "it"), controller.create);
router.put("/:id", verifyToken, authorizeRoles("admin", "it"), controller.update);
router.delete("/:id", verifyToken, authorizeRoles("admin", "it"), controller.remove);

module.exports = router;
