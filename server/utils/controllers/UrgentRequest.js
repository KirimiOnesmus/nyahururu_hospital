"use strict";

const { UrgentBloodRequest, User, sequelize } = require("../sequelize/models");

// ── Helpers ─────────────────────────────────────────────────────────

// Mongo could match a single value against an array field (`{ bloodGroups: bloodGroup }`)
// because it does the "any element equals" test transparently. MySQL
// stores bloodGroups as a JSON array column, so we express the same
// "contains this element" via JSON_CONTAINS. The blood group is a
// tightly-controlled enum ("O+" etc), but we still funnel through
// sequelize.escape as a safety net rather than string-concatenating.
const jsonContainsBloodGroup = (bloodGroup) =>
  sequelize.literal(
    `JSON_CONTAINS(blood_groups, ${sequelize.escape(JSON.stringify(bloodGroup))})`,
  );

const CREATOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
];

// ── Endpoints ───────────────────────────────────────────────────────

const createUrgentRequest = async (req, res) => {
  try {
    const { bloodGroups, message, contactNumber, isActive } = req.body;

    if (!bloodGroups || bloodGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one blood group",
      });
    }

    if (!message || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide message and contact number",
      });
    }

    const urgentRequest = await UrgentBloodRequest.create({
      bloodGroups,
      message,
      contactNumber,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Urgent blood request created successfully",
      data: urgentRequest,
    });
  } catch (error) {
    console.error("Create urgent request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create urgent request",
    });
  }
};

const getAllUrgentRequests = async (req, res) => {
  try {
    const { isActive, bloodGroup } = req.query;
    const { Op } = require("sequelize");

    // JSON_CONTAINS is a raw literal that can't participate in the
    // ordinary field-lookup shape, so we AND-combine everything under
    // Op.and — one predicate per query param that was actually passed.
    const clauses = [];
    if (isActive !== undefined) clauses.push({ isActive: isActive === "true" });
    if (bloodGroup) clauses.push(jsonContainsBloodGroup(bloodGroup));
    const where = clauses.length ? { [Op.and]: clauses } : {};

    const urgentRequests = await UrgentBloodRequest.findAll({
      where,
      order: [
        ["isActive", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: CREATOR_INCLUDE,
    });

    res.status(200).json({
      success: true,
      count: urgentRequests.length,
      data: urgentRequests,
    });
  } catch (error) {
    console.error("Get all urgent requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch urgent requests",
    });
  }
};

const getActiveUrgentRequests = async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    const { Op } = require("sequelize");

    const clauses = [{ isActive: true }];
    if (bloodGroup) clauses.push(jsonContainsBloodGroup(bloodGroup));

    const urgentRequests = await UrgentBloodRequest.findAll({
      where: { [Op.and]: clauses },
      order: [["createdAt", "DESC"]],
      // Public endpoint — hide creator/updater FKs like Mongoose's
      // .select("-createdBy -updatedBy") did.
      attributes: { exclude: ["createdBy", "updatedBy"] },
    });

    res.status(200).json({
      success: true,
      count: urgentRequests.length,
      data: urgentRequests,
    });
  } catch (error) {
    console.error("Get active urgent requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active urgent requests",
    });
  }
};

const updateUrgentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodGroups, message, contactNumber, isActive } = req.body;

    const urgentRequest = await UrgentBloodRequest.findByPk(id);
    if (!urgentRequest) {
      return res.status(404).json({
        success: false,
        message: "Urgent request not found",
      });
    }

    if (bloodGroups && bloodGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one blood group must be selected",
      });
    }

    // JSON column reassignment (never in-place mutation) so Sequelize's
    // change tracker sees the update. Same pattern applied throughout
    // the Content-domain cutover.
    if (bloodGroups) urgentRequest.bloodGroups = bloodGroups;
    if (message) urgentRequest.message = message;
    if (contactNumber) urgentRequest.contactNumber = contactNumber;
    if (isActive !== undefined) urgentRequest.isActive = isActive;

    urgentRequest.updatedBy = req.user.id;

    await urgentRequest.save();

    res.status(200).json({
      success: true,
      message: "Urgent request updated successfully",
      data: urgentRequest,
    });
  } catch (error) {
    console.error("Update urgent request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update urgent request",
    });
  }
};

const toggleUrgentRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const urgentRequest = await UrgentBloodRequest.findByPk(id);
    if (!urgentRequest) {
      return res.status(404).json({
        success: false,
        message: "Urgent request not found",
      });
    }

    urgentRequest.isActive = !urgentRequest.isActive;
    urgentRequest.updatedBy = req.user.id;
    await urgentRequest.save();

    res.status(200).json({
      success: true,
      message: `Urgent request ${urgentRequest.isActive ? "activated" : "deactivated"} successfully`,
      data: urgentRequest,
    });
  } catch (error) {
    console.error("Toggle urgent request status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle urgent request status",
    });
  }
};

const deleteUrgentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const urgentRequest = await UrgentBloodRequest.findByPk(id);
    if (!urgentRequest) {
      return res.status(404).json({
        success: false,
        message: "Urgent request not found",
      });
    }

    await urgentRequest.destroy();

    res.status(200).json({
      success: true,
      message: "Urgent request deleted successfully",
    });
  } catch (error) {
    console.error("Delete urgent request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete urgent request",
    });
  }
};

module.exports = {
  createUrgentRequest,
  getAllUrgentRequests,
  getActiveUrgentRequests,
  updateUrgentRequest,
  toggleUrgentRequestStatus,
  deleteUrgentRequest,
};
