"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const {
  AmbulanceBooking, Vehicle, User, sequelize,
} = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");


const VALID_STATUSES = [
  "Pending", "Assigned", "In Transit", "Arrived",
  "Completed", "Cancelled", "Waiting",
];

const DETAIL_INCLUDE = [
  {
    model: Vehicle, as: "vehicle",
    attributes: ["id", "plate", "type", "driver", "mileage", "make", "model"],
  },
  { model: User, as: "user", attributes: ["id", "name", "email"] },
];


const LIST_INCLUDE = [
  {
    model: Vehicle, as: "vehicle",
    attributes: ["id", "plate", "type", "driver", "mileage"],
  },
  { model: User, as: "user", attributes: ["id", "name", "email"] },
];

exports.createAmbulanceBooking = async (req, res) => {
  try {
    const {
      patientName, phone, email, currentLocation, destinationHospital,
      emergencyLevel, medicalCondition, additionalNotes,
    } = req.body;

    if (!patientName || !phone || !currentLocation || !medicalCondition || !emergencyLevel) {
      return res.status(400).json({
        message: "Missing required fields: patientName, phone, currentLocation, medicalCondition, emergencyLevel",
      });
    }

    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }


    const { booking, ambulance } = await sequelize.transaction(async (t) => {
      const b = await AmbulanceBooking.create(
        {
          patientName,
          phone,
          email: email || null,
          currentLocation,
          destinationHospital: destinationHospital || "Not specified",
          emergencyLevel,
          medicalCondition,
          additionalNotes: additionalNotes || null,
          status: "Pending",
          bookingDate: new Date(),
          userId: req.user?.id || null,
        },
        { transaction: t },
      );

   
      const availableAmbulance = await Vehicle.findOne({
        where: {
          status: "Available",
          type: { [Op.in]: ["Ambulance", "ambulance"] },
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (availableAmbulance) {
        availableAmbulance.status = "In Use";
        availableAmbulance.updatedBy = req.user?.id || null;
        await availableAmbulance.save({ transaction: t });

        b.vehicleId = availableAmbulance.id;
        b.status = "Assigned";
        b.assignedAt = new Date();
        await b.save({ transaction: t });
      } else {
        b.status = "Waiting";
        await b.save({ transaction: t });
      }

      return { booking: b, ambulance: availableAmbulance || null };
    });

    res.status(201).json({
      message: ambulance
        ? "Ambulance booked successfully. Dispatch team will contact you shortly."
        : "Your request has been registered. Awaiting available ambulance.",
      booking,
      ambulance,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getAllAmbulanceBookings = async (req, res) => {
  try {
    const { search, emergencyLevel, status } = req.query;
    const where = {};
    if (emergencyLevel && emergencyLevel !== "all") where.emergencyLevel = emergencyLevel;
    if (status && status !== "all") where.status = status;
    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (m) => `\\${m}`);
      const like = `%${escaped}%`;
      where[Op.or] = [
        { patientName: { [Op.like]: like } }, { phone: { [Op.like]: like } },
        { status: { [Op.like]: like } }, { emergencyLevel: { [Op.like]: like } },
        { currentLocation: { [Op.like]: like } }, { destinationHospital: { [Op.like]: like } },
        { medicalCondition: { [Op.like]: like } },
      ];
    }
    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const [{ rows: bookings, count: total }, statusRows, emergencyRows] = await Promise.all([
      AmbulanceBooking.findAndCountAll({ where, include: LIST_INCLUDE, order: [["bookingDate", "DESC"]], distinct: true, limit, offset }),
      AmbulanceBooking.count({ group: ["status"] }),
      AmbulanceBooking.count({ group: ["emergencyLevel"] }),
    ]);
    const statusCounts = Object.fromEntries(statusRows.map(({ status: key, count: value }) => [key, Number(value)]));
    const emergencyCounts = Object.fromEntries(emergencyRows.map(({ emergencyLevel: key, count: value }) => [key, Number(value)]));
    const stats = {
      total,
      pendingBookings: (statusCounts.Pending || 0) + (statusCounts.Waiting || 0),
      assignedBookings: statusCounts.Assigned || 0,
      criticalBookings: emergencyCounts.critical || 0,
    };
    if (requestedPaging) return res.json({ data: bookings, meta: { ...buildMeta(page, limit, total, bookings.length, offset), stats } });
    res.json(bookings);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getAmbulanceBookingById = async (req, res) => {
  try {
    const booking = await AmbulanceBooking.findByPk(req.params.id, {
      include: DETAIL_INCLUDE,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });


    const isOwner = booking.userId === req.user.id;
    const isStaff = ["admin", "superadmin", "staff"].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "You do not have access to this booking." });
    }

    res.json(booking);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await AmbulanceBooking.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Vehicle, as: "vehicle",
          attributes: ["id", "plate", "type", "driver"],
        },
      ],
      order: [["bookingDate", "DESC"]],
    });
    res.json(bookings);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const booking = await sequelize.transaction(async (t) => {
      const b = await AmbulanceBooking.findByPk(req.params.id, {
        transaction: t,
      });
      if (!b) return null;

      b.status = status;
      await b.save({ transaction: t });

      if (status === "Completed" && b.vehicleId) {
        const vehicle = await Vehicle.findByPk(b.vehicleId, { transaction: t });
        if (vehicle) {
          vehicle.status = "Available";
          vehicle.updatedBy = req.user?.id || null;
          await vehicle.save({ transaction: t });
        }
      }
      return b;
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });


    const populated = await AmbulanceBooking.findByPk(booking.id, {
      include: [
        {
          model: Vehicle, as: "vehicle",
          attributes: ["id", "plate", "type", "driver"],
        },
      ],
    });

    res.json({ message: "Booking status updated successfully", booking: populated });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.cancelBooking = async (req, res) => {
  try {

    const booking = await sequelize.transaction(async (t) => {
      const b = await AmbulanceBooking.findByPk(req.params.id, { transaction: t });
      if (!b) return { notFound: true };

      const isOwner = b.userId && req.user?.id && String(b.userId) === String(req.user.id);
      const isStaff = ["admin", "superadmin", "it"].includes(req.user?.role);
      if (!isOwner && !isStaff) {
        return { forbidden: true };
      }

      if (["Completed", "Cancelled"].includes(b.status)) {
        return {
          alreadyClosed: `Cannot cancel a ${b.status.toLowerCase()} booking`,
        };
      }

      if (b.vehicleId) {
        const vehicle = await Vehicle.findByPk(b.vehicleId, { transaction: t });
        if (vehicle) {
          vehicle.status = "Available";
          vehicle.updatedBy = req.user?.id || null;
          await vehicle.save({ transaction: t });
        }
      }

      b.status = "Cancelled";
      b.cancelledAt = new Date();
      b.cancelReason = req.body.reason || "User cancelled";
      await b.save({ transaction: t });
      return { booking: b };
    });

    if (booking.notFound) return res.status(404).json({ message: "Booking not found" });
    if (booking.forbidden) {
      return res.status(403).json({ message: "You do not have access to cancel this booking." });
    }
    if (booking.alreadyClosed) return res.status(400).json({ message: booking.alreadyClosed });

    res.json({ message: "Booking cancelled successfully", booking: booking.booking });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const bookings = await AmbulanceBooking.findAll({
      where: { status },
      include: [
        {
          model: Vehicle, as: "vehicle",
          attributes: ["id", "plate", "type", "driver"],
        },
      ],
      order: [["bookingDate", "DESC"]],
    });
    res.json(bookings);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

module.exports = exports;
