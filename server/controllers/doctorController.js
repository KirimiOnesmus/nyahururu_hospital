"use strict";

const { Op } = require("sequelize");
const { Doctor, User, Profile } = require("../sequelize/models");

// ── Helpers ─────────────────────────────────────────────────────────

// Include shape used by every "list doctors" endpoint. Pulls the user
// row plus the user's profile row in a single query — replaces the
// Mongoose N+1 pattern that did Doctor.find → for each doctor,
// Profile.findOne({ userId }). Sequelize does this with a nested
// include; the extra join is cheap and one round trip is dramatically
// better than N+1.
const USER_INCLUDE = {
  model: User,
  as: "user",
  attributes: ["id", "firstName", "lastName", "email", "role", "createdAt", "photo"],
  include: [{ model: Profile, as: "profile" }],
};

// Case-insensitive LIKE for the speciality/department search params.
// utf8mb4_unicode_ci already collates without case, so no per-query
// flag is needed. Escape SQL LIKE metacharacters so a search for "M/S"
// doesn't accidentally match across multiple rows.
const iLike = (raw) => {
  const escaped = String(raw).replace(/[\\%_]/g, (m) => `\\${m}`);
  return { [Op.like]: `%${escaped}%` };
};

// The "look up the doctor row for this authenticated caller" pattern
// used by all three self-edit endpoints. Centralised so a change to
// the ownership rules only touches one place.
const requireDoctorForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { error: { status: 404, message: "User not found" } };
  if (user.role !== "doctor") {
    return { error: { status: 403, message: "Only doctors can perform this action" } };
  }
  return { user };
};

// ── Self-edit endpoints ─────────────────────────────────────────────

exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { speciality, education, bio, department } = req.body;

    const { user, error } = await requireDoctorForUser(userId);
    if (error) return res.status(error.status).json({ message: error.message });

    // findOrCreate: single round trip, atomic on MySQL. The `defaults`
    // block is used only when the row is new — the update branch below
    // handles the existing case with the same field-by-field logic the
    // Mongoose flow had.
    const [doctor, created] = await Doctor.findOrCreate({
      where: { userId },
      defaults: { userId, speciality, education, bio, department, availability: [] },
    });

    if (!created) {
      if (speciality !== undefined) doctor.speciality = speciality;
      if (education !== undefined) doctor.education = education;
      if (bio !== undefined) doctor.bio = bio;
      if (department !== undefined) doctor.department = department;
      await doctor.save();
    }

    // Keep the user's canonical department in sync when a doctor updates
    // their doctor row — matches userController.syncDoctorProfile's
    // intent (both surfaces should agree on which department a doctor
    // belongs to). Silently no-ops if department wasn't in the update.
    if (department !== undefined && user.department !== department) {
      user.department = department;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating doctor profile",
      error: error.message,
    });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        message: "Please provide valid availability data",
      });
    }

    const { error } = await requireDoctorForUser(userId);
    if (error) return res.status(error.status).json({ message: error.message });

    const doctor = await Doctor.findOne({ where: { userId } });
    if (!doctor) {
      return res.status(404).json({
        message: "Doctor profile not found. Please create doctor profile first.",
      });
    }

    // The Doctor model validates availability shape (day whitelist +
    // HH:MM regex) in its custom validator — a malformed slot rejects
    // the whole update rather than silently persisting bad data.
    doctor.availability = availability;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({
      success: false,
      message: "Error updating availability",
      error: error.message,
    });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await requireDoctorForUser(userId);
    if (error) return res.status(error.status).json({ message: error.message });

    const doctor = await Doctor.findOne({ where: { userId } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    doctor.isAvailableNow = !doctor.isAvailableNow;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Availability set to ${doctor.isAvailableNow ? "available" : "unavailable"}`,
      data: { isAvailableNow: doctor.isAvailableNow },
    });
  } catch (error) {
    console.error("Error toggling availability:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling availability",
      error: error.message,
    });
  }
};

// ── Public list / detail ────────────────────────────────────────────

exports.getAllDoctors = async (req, res) => {
  try {
    const { speciality, department, available } = req.query;

    const where = {};
    if (speciality) where.speciality = iLike(speciality);
    if (department) where.department = iLike(department);
    if (available === "true") where.isAvailableNow = true;

    const doctors = await Doctor.findAll({
      where,
      include: [USER_INCLUDE],
      order: [["rating", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors",
      error: error.message,
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [USER_INCLUDE],
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor",
      error: error.message,
    });
  }
};

exports.getDoctorsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const doctors = await Doctor.findAll({
      where: { department: iLike(department) },
      include: [USER_INCLUDE],
      order: [["rating", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors by department:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors by department",
      error: error.message,
    });
  }
};
