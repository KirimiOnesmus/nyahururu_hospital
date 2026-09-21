"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { Doctor, User, Profile } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");


const USER_INCLUDE = {
  model: User,
  as: "user",
  attributes: ["id", "firstName", "lastName", "email", "role", "createdAt", "photo"],
  include: [{ model: Profile, as: "profile" }],
};

const iLike = (raw) => {
  const escaped = String(raw).replace(/[\\%_]/g, (m) => `\\${m}`);
  return { [Op.like]: `%${escaped}%` };
};


const requireDoctorForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return { error: { status: 404, message: "User not found" } };
  if (user.role !== "doctor") {
    return { error: { status: 403, message: "Only doctors can perform this action" } };
  }
  return { user };
};



exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { speciality, education, bio, department } = req.body;

    const { user, error } = await requireDoctorForUser(userId);
    if (error) return res.status(error.status).json({ message: error.message });

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
    });
  }
};



exports.getAllDoctors = async (req, res) => {
  try {
    const { speciality, department, available } = req.query;

    const where = {};
    if (speciality) where.speciality = iLike(speciality);
    if (department) where.department = iLike(department);
    if (available === "true") where.isAvailableNow = true;

    const { page, limit, offset } = getPagination(req.query);
    const { rows: doctors, count: total } = await Doctor.findAndCountAll({
      where,
      include: [USER_INCLUDE],
      order: [["rating", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
      meta: buildMeta(page, limit, total, doctors.length, offset),
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors",
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
    });
  }
};
