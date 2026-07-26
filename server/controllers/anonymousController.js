"use strict";

const { Op, UniqueConstraintError } = require("sequelize");
const { AnonymousAppointment } = require("../sequelize/models");




const CASE_CODE_MAX_ATTEMPTS = 5;

const generateCaseCode = async (caseType) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();
  const prefix = caseType === "GBV" ? "GBV" : "MH";

  
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const todayCases = await AnonymousAppointment.count({
    where: {
      case_type: caseType,
      createdAt: { [Op.gte]: startOfDay, [Op.lte]: endOfDay },
    },
  });

  const caseNumber = String(todayCases + 1).padStart(3, "0");
  return `${prefix}-${caseNumber}-${day}-${year}`;
};



exports.createAnonymousAppointment = async (req, res) => {
  try {
    const {
      case_type,
      contact_method,
      contact_value,
      preferred_date,
      preferred_time,
      asap,
      reason,
      safe_to_contact,
    } = req.body;

    if (!case_type || !["GBV", "Mental Health"].includes(case_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing case type. Must be 'GBV' or 'Mental Health'",
      });
    }

    if (!contact_method || !["phone", "in_person"].includes(contact_method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing contact method. Must be 'phone' or 'in_person'",
      });
    }

    if (contact_method === "phone" && !contact_value) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required when contact method is 'phone'",
      });
    }

    if (!asap && (!preferred_date || !preferred_time)) {
      return res.status(400).json({
        success: false,
        message: "Preferred date and time are required when not marked as ASAP",
      });
    }

    if (safe_to_contact === null || safe_to_contact === undefined) {
      return res.status(400).json({
        success: false,
        message: "Safety contact preference is required",
      });
    }

 
    let appointment;
    for (let attempt = 0; attempt < CASE_CODE_MAX_ATTEMPTS; attempt += 1) {
      const case_code = await generateCaseCode(case_type);
      try {
        appointment = await AnonymousAppointment.create({
          case_code,
          case_type,
          contact_method,
          contact_value: contact_method === "phone" ? contact_value : null,
          preferred_date: asap ? null : preferred_date,
          preferred_time: asap ? null : preferred_time,
          asap,
          reason: reason || null,
          safe_to_contact,
          status: "pending",
        });
        break;
      } catch (err) {

        const isCollision =
          err instanceof UniqueConstraintError &&
          (err.fields?.case_code || err.errors?.some?.((e) => e.path === "case_code"));
        if (!isCollision || attempt === CASE_CODE_MAX_ATTEMPTS - 1) throw err;
      }
    }

    res.status(201).json({
      success: true,
      message: "Anonymous appointment request submitted successfully",
      data: {
        case_code:      appointment.case_code,
        case_type:      appointment.case_type,
        contact_method: appointment.contact_method,
        asap:           appointment.asap,
        preferred_date: appointment.preferred_date,
        preferred_time: appointment.preferred_time,
        status:         appointment.status,
        created_at:     appointment.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating anonymous appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment. Please try again.",
    });
  }
};

exports.getAllAnonymousAppointments = async (req, res) => {
  try {
    const { status, case_type, asap, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status)    where.status = status;
    if (case_type) where.case_type = case_type;
    if (asap !== undefined) where.asap = asap === "true";

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const { rows: appointments, count: total } = await AnonymousAppointment.findAndCountAll({
      where,

      order: [
        ["asap", "DESC"],
        ["createdAt", "DESC"],
      ],
      offset,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
};

exports.getAnonymousAppointmentByCaseCode = async (req, res) => {
  try {
    const { case_code } = req.params;

    const appointment = await AnonymousAppointment.findOne({ where: { case_code } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
    });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { case_code } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "in_progress", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const appointment = await AnonymousAppointment.findOne({ where: { case_code } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: appointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
    });
  }
};

exports.deleteAnonymousAppointment = async (req, res) => {
  try {
    const { case_code } = req.params;

    const appointment = await AnonymousAppointment.findOne({ where: { case_code } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    await appointment.destroy();

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
    });
  }
};

exports.getAppointmentStats = async (req, res) => {
  try {

    const [
      total,
      pending,
      asapCases,
      gbvCases,
      mentalHealthCases,
      unsafeToContact,
    ] = await Promise.all([
      AnonymousAppointment.count(),
      AnonymousAppointment.count({ where: { status: "pending" } }),
      AnonymousAppointment.count({ where: { asap: true, status: "pending" } }),
      AnonymousAppointment.count({ where: { case_type: "GBV" } }),
      AnonymousAppointment.count({ where: { case_type: "Mental Health" } }),
      AnonymousAppointment.count({ where: { safe_to_contact: false } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        asapCases,
        byType: { gbv: gbvCases, mentalHealth: mentalHealthCases },
        unsafeToContact,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};
