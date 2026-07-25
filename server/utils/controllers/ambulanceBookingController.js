"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const {
  AmbulanceBooking, Vehicle, User, sequelize,
} = require("../sequelize/models");

// ── Helpers ─────────────────────────────────────────────────────────

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

// Slimmer include for list endpoints (drops make/model).
const LIST_INCLUDE = [
  {
    model: Vehicle, as: "vehicle",
    attributes: ["id", "plate", "type", "driver", "mileage"],
  },
  { model: User, as: "user", attributes: ["id", "name", "email"] },
];

// ── CRUD ────────────────────────────────────────────────────────────

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

    // The whole "book + maybe-assign-ambulance" flow runs inside a
    // single MySQL transaction. Under Mongoose the two-step "find
    // available ambulance then update it" was race-prone — two
    // concurrent bookings could both find the same vehicle and both
    // try to grab it, leaving one silently overwriting the other's
    // assignment. Here we take a row lock on the vehicle so a second
    // booking arriving mid-transaction waits until the first commits
    // (or rolls back), then sees the updated `status = 'In Use'` and
    // moves on to the next available ambulance.
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

      // FOR UPDATE lock — needs InnoDB, which is the model default.
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
    const bookings = await AmbulanceBooking.findAll({
      include: LIST_INCLUDE,
      order: [["bookingDate", "DESC"]],
    });
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

    // H-2: bookings contain patient-identifying data (name, phone, pickup
    // location). Only the owning user or staff may view a given booking —
    // previously this endpoint had no auth at all, allowing IDOR by
    // enumerating sequential booking IDs.
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

    // Status change + optional vehicle-release inside a transaction so
    // an app crash after the booking save but before the vehicle
    // release can't leave a phantom "in use" ambulance no one owns.
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

    // Refetch with vehicle include for response parity with Mongoose.
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
    // Same transactional pattern — booking cancel + vehicle release
    // must succeed together or not at all.
    const booking = await sequelize.transaction(async (t) => {
      const b = await AmbulanceBooking.findByPk(req.params.id, { transaction: t });
      if (!b) return { notFound: true };

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
