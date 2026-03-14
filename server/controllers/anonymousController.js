const AnonymousAppointment = require("../models/anonymousModel");
const generateCaseCode = async (caseType) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();
  
  const prefix = caseType === "GBV" ? "GBV" : "MH";
  

  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));
  
  const todayCases = await AnonymousAppointment.countDocuments({
    case_type: caseType,
    created_at: { $gte: startOfDay, $lte: endOfDay }
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
      safe_to_contact
    } = req.body;


    // Validation
    if (!case_type || !["GBV", "Mental Health"].includes(case_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing case type. Must be 'GBV' or 'Mental Health'"
      });
    }

    if (!contact_method || !["phone", "in_person"].includes(contact_method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing contact method. Must be 'phone' or 'in-person'"
      });
    }

    if (contact_method === "phone" && !contact_value) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required when contact method is 'phone'"
      });
    }

    if (!asap && (!preferred_date || !preferred_time)) {
      return res.status(400).json({
        success: false,
        message: "Preferred date and time are required when not marked as ASAP"
      });
    }

    if (safe_to_contact === null || safe_to_contact === undefined) {
      return res.status(400).json({
        success: false,
        message: "Safety contact preference is required"
      });
    }

    // Generate unique case code
    const case_code = await generateCaseCode(case_type);

    // Create appointment
    const appointment = await AnonymousAppointment.create({
      case_code,
      case_type,
      contact_method,
      contact_value: contact_method === "phone" ? contact_value : null,
      preferred_date: asap ? null : preferred_date,
      preferred_time: asap ? null : preferred_time,
      asap,
      reason: reason || null,
      safe_to_contact,
      status: "pending"
    });

    // TODO: Send notifications to staff
    // - Email notification to support team
    // - SMS if safe_to_contact is true and contact_method is phone
    // - Flag ASAP cases for immediate attention

    res.status(201).json({
      success: true,
      message: "Anonymous appointment request submitted successfully",
      data: {
        case_code: appointment.case_code,
        case_type: appointment.case_type,
        contact_method: appointment.contact_method,
        asap: appointment.asap,
        preferred_date: appointment.preferred_date,
        preferred_time: appointment.preferred_time,
        status: appointment.status,
        created_at: appointment.created_at
      }
    });

  } catch (error) {
    console.error("Error creating anonymous appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment. Please try again.",
      error: error.message
    });
  }
};

exports.getAllAnonymousAppointments = async (req, res) => {
  try {
    const { status, case_type, asap, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (case_type) filter.case_type = case_type;
    if (asap) filter.asap = asap === "true";

    // Pagination
    const skip = (page - 1) * limit;

    const appointments = await AnonymousAppointment.find(filter)
      .sort({ created_at: -1, asap: -1 }) // ASAP cases first, then by date
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AnonymousAppointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: appointments
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message
    });
  }
};

exports.getAnonymousAppointmentByCaseCode = async (req, res) => {
  try {
    const { case_code } = req.params;

    const appointment = await AnonymousAppointment.findOne({ case_code });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error.message
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
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const appointment = await AnonymousAppointment.findOneAndUpdate(
      { case_code },
      { status },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // TODO: Send notification based on status change
    // - approved: Send confirmation
    // - in_progress: Notify that session has started
    // - completed: Send follow-up resources
    // - cancelled: Send cancellation notice

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: appointment
    });

  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
      error: error.message
    });
  }
};


exports.deleteAnonymousAppointment = async (req, res) => {
  try {
    const { case_code } = req.params;

    const appointment = await AnonymousAppointment.findOneAndDelete({ case_code });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
      error: error.message
    });
  }
};


exports.getAppointmentStats = async (req, res) => {
  try {
    const total = await AnonymousAppointment.countDocuments();
    const pending = await AnonymousAppointment.countDocuments({ status: "pending" });
    const asapCases = await AnonymousAppointment.countDocuments({ asap: true, status: "pending" });
    const gbvCases = await AnonymousAppointment.countDocuments({ case_type: "GBV" });
    const mentalHealthCases = await AnonymousAppointment.countDocuments({ case_type: "Mental Health" });
    const unsafeToContact = await AnonymousAppointment.countDocuments({ safe_to_contact: false });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        asapCases,
        byType: {
          gbv: gbvCases,
          mentalHealth: mentalHealthCases
        },
        unsafeToContact
      }
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};
