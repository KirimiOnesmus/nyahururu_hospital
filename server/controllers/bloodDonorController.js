"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { BloodDonor, BloodDonationAppointment, BloodDonationEvent, sequelize } = require("../sequelize/models");
const emailService = require("../utils/emailServices");
const audit = require("../services/auditService");

const DONOR_PRIVACY_NOTICE_VERSION = "1.0";
const MIN_BLOOD_GROUP_AGGREGATE_SIZE = 5;
// Override per deployment; keep a conservative default until the office sets its daily limit.
const configuredDailyCapacity = Number.parseInt(process.env.BLOOD_DONATION_DAILY_CAPACITY, 10);
const BLOOD_DONATION_DAILY_CAPACITY = Number.isInteger(configuredDailyCapacity) && configuredDailyCapacity > 0
  ? configuredDailyCapacity
  : 10;
const CAPACITY_STATUSES = ["registered", "confirmed"];
const DONOR_LIST_ATTRIBUTES = [
  "donorId", "fullName", "email", "phone",
  "consentDonate", "consentTest",
  "consentTerms", "consentPrivacy", "consentPrivacyVersion",
  "consentPrivacyAt", "consentDonateAt", "consentTestAt", "consentTermsAt",
  "createdAt", "updatedAt", "registrationSource", "bloodGroupSource",
];
const DONOR_SCREENING_ATTRIBUTES = [
  "age", "gender", "weight", "bloodGroup", "bloodGroupVerifiedAt", "healthConditions", "medications",
];

const donorSummary = (donor) => {
  const record = donor.get ? donor.get({ plain: true }) : donor;
  return Object.fromEntries(DONOR_LIST_ATTRIBUTES
    .filter((field) => Object.prototype.hasOwnProperty.call(record, field))
    .map((field) => [field, record[field]]));
};

const validateDonationDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date || "") &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

const lockDonationCapacityDate = async (date, transaction) => {
  // A transaction-scoped row lock serializes bookings across app instances
  // without requiring a second database connection per request.
  await sequelize.query(
    "INSERT IGNORE INTO blood_donation_capacity_days (donation_date) VALUES (?)",
    { replacements: [date], transaction },
  );
  await sequelize.query(
    "SELECT donation_date FROM blood_donation_capacity_days WHERE donation_date = ? FOR UPDATE",
    { replacements: [date], transaction },
  );
};

const countScheduledDonations = (date, transaction) => {
  const where = {
    donationDate: date,
    status: { [Op.in]: CAPACITY_STATUSES },
    registrationStatus: { [Op.ne]: "rejected" },
  };
  return BloodDonationAppointment.count({ where, transaction });
};

const createAppointment = (donor, values, options) => BloodDonationAppointment.create({
  donorId: donor.donorId,
  donationDate: values.donationDate,
  donationTime: values.donationTime,
  status: values.status || "registered",
  registrationStatus: values.registrationStatus || "pending",
}, options);

const capacityResponse = (res, booked) => res.status(409).json({
  success: false,
  code: "DONATION_CAPACITY_REACHED",
  message: "The blood donation office is fully booked for this date. Please choose another date.",
  data: { capacity: BLOOD_DONATION_DAILY_CAPACITY, booked, available: 0 },
});

exports.getDonationAvailability = async (req, res) => {
  const { date } = req.query;
  if (!validateDonationDate(date)) {
    return res.status(400).json({ success: false, message: "Please provide a valid date (YYYY-MM-DD)." });
  }
  try {
    const booked = await countScheduledDonations(date);
    return res.status(200).json({
      success: true,
      data: {
        date,
        capacity: BLOOD_DONATION_DAILY_CAPACITY,
        booked,
        available: Math.max(0, BLOOD_DONATION_DAILY_CAPACITY - booked),
      },
    });
  } catch (error) {
    logger.error({ errorName: error?.name }, "Blood donation availability lookup failed");
    return res.status(500).json({ success: false, message: "Availability could not be loaded. Please try again." });
  }
};


exports.registerDonor = async (req, res) => {
  let transaction;
  try {
    const {
      fullName, email, phone, donationDate, donationTime,
      consentDonate, consentTest, consentTerms, consentPrivacy,
    } = req.body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !donationDate || !donationTime) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone number, preferred date, and preferred time are required.",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!validateDonationDate(donationDate)) {
      return res.status(400).json({ success: false, message: "Please provide a valid preferred donation date." });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(donationTime)) {
      return res.status(400).json({ success: false, message: "Please provide a valid preferred donation time." });
    }

    if (consentDonate !== true || consentTest !== true || consentTerms !== true || consentPrivacy !== true) {
      return res.status(400).json({
        success: false,
        message: "Please review and accept each required consent before registering.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const consentRecordedAt = new Date();
    transaction = await sequelize.transaction({ isolationLevel: "READ COMMITTED" });

    const existingDonor = await BloodDonor.findOne({
      where: { email: normalizedEmail },
      transaction,
    });

    if (existingDonor) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    await lockDonationCapacityDate(donationDate, transaction);
    const booked = await countScheduledDonations(donationDate, transaction);
    if (booked >= BLOOD_DONATION_DAILY_CAPACITY) {
      await transaction.rollback();
      transaction = null;
      return capacityResponse(res, booked);
    }

    const donor = await BloodDonor.createWithUniqueId({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      // Eligibility and clinical screening are completed by donation staff;
      // public registration collects only what is needed to arrange contact.
      consentDonate,
      consentTest,
      consentTerms,
      consentPrivacy,
      registrationSource: "public",
      consentPrivacyVersion: DONOR_PRIVACY_NOTICE_VERSION,
      consentPrivacyAt: consentRecordedAt,
      consentDonateAt: consentRecordedAt,
      consentTestAt: consentRecordedAt,
      consentTermsAt: consentRecordedAt,
    }, { transaction });
    const appointment = await createAppointment(donor, { donationDate, donationTime }, { transaction });

    await audit.log({
      req,
      action: "create",
      resource: "BloodDonor",
      resourceId: donor.donorId,
      description: "Public blood donor registration received",
      metadata: { consentPrivacyVersion: DONOR_PRIVACY_NOTICE_VERSION },
      transaction,
      required: true,
    });
    await transaction.commit();
    transaction = null;

    try {
      await emailService.sendDonorRegistrationEmail({
        fullName:      donor.fullName,
        email:         donor.email,
        donorId:       donor.donorId,
        donationDate:  appointment.donationDate,
        donationTime:  appointment.donationTime,
      });
    } catch (emailError) {
      logger.error({ errorName: emailError?.name }, "Failed to send blood donor registration email");
    }

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        donorId: donor.donorId,
        registrationDate: donor.createdAt,
      },
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try { await transaction.rollback(); } catch (rollbackError) {
        logger.error({ errorName: rollbackError?.name }, "Blood donor registration rollback failed");
      }
    }
    logger.error({ errorName: error?.name }, "Blood donor registration failed");
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
    });
  }
};

exports.getDonor = async (req, res) => {
  try {
    const { donorId } = req.params;
    const donor = await BloodDonor.findOne({
      where: { donorId },
      attributes: DONOR_LIST_ATTRIBUTES,
    });
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }
    await audit.log({
      req,
      action: "view",
      resource: "BloodDonor",
      resourceId: donor.donorId,
      description: "Viewed blood donor registration record",
      required: true,
    });
    res.status(200).json({ success: true, data: donorSummary(donor) });
  } catch (error) {
    logger.error({ errorName: error?.name }, "Blood donor record lookup failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.registerOfficeWalkIn = async (req, res) => {
  let transaction;
  try {
    const {
      fullName, email, phone, donationDate, donationTime,
      age, gender, weight, bloodGroup, healthConditions, medications,
      consentDonate, consentTest, consentTerms, consentPrivacy,
    } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() || null : null;
    const parsedAge = Number(age);
    const parsedWeight = Number(weight);

    if (typeof fullName !== "string" || !fullName.trim() || typeof phone !== "string" || !phone.trim() || !donationDate || !donationTime) {
      return res.status(400).json({ success: false, message: "Name, phone number, visit date, and visit time are required." });
    }
    if (email != null && typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!validateDonationDate(donationDate)) {
      return res.status(400).json({ success: false, message: "Please provide a valid visit date." });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(donationTime)) {
      return res.status(400).json({ success: false, message: "Please provide a valid visit time." });
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 16 || parsedAge > 70) {
      return res.status(400).json({ success: false, message: "Donor age must be between 16 and 70 years." });
    }
    if (!Number.isFinite(parsedWeight) || parsedWeight < 50) {
      return res.status(400).json({ success: false, message: "Donor weight must be at least 50 kg." });
    }
    if (!BloodDonor.GENDERS.includes(gender) || !BloodDonor.BLOOD_GROUPS.includes(bloodGroup) || !bloodGroup) {
      return res.status(400).json({ success: false, message: "Select a valid gender and blood group." });
    }
    if (consentDonate !== true || consentTest !== true || consentTerms !== true || consentPrivacy !== true) {
      return res.status(400).json({ success: false, message: "Record each required consent before registering the walk-in donor." });
    }

    const consentRecordedAt = new Date();
    transaction = await sequelize.transaction({ isolationLevel: "READ COMMITTED" });
    const existingDonor = normalizedEmail
      ? await BloodDonor.findOne({ where: { email: normalizedEmail }, transaction, lock: transaction.LOCK.UPDATE })
      : null;

    await lockDonationCapacityDate(donationDate, transaction);
    const booked = await countScheduledDonations(donationDate, transaction);
    if (booked >= BLOOD_DONATION_DAILY_CAPACITY) {
      await transaction.rollback();
      transaction = null;
      return capacityResponse(res, booked);
    }

    const profileUpdates = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      age: parsedAge,
      gender,
      weight: parsedWeight,
      healthConditions: typeof healthConditions === "string" ? healthConditions.trim() || null : null,
      medications: typeof medications === "string" ? medications.trim() || null : null,
      consentDonate,
      consentTest,
      consentTerms,
      consentPrivacy,
      consentPrivacyVersion: DONOR_PRIVACY_NOTICE_VERSION,
      consentPrivacyAt: consentRecordedAt,
      consentDonateAt: consentRecordedAt,
      consentTestAt: consentRecordedAt,
      consentTermsAt: consentRecordedAt,
    };
    const donor = existingDonor
      ? existingDonor
      : await BloodDonor.createWithUniqueId({
        ...profileUpdates,
        bloodGroup,
        bloodGroupSource: "self_reported",
        registrationSource: "office",
      }, { transaction });
    if (existingDonor) {
      donor.set(profileUpdates);
      // Preserve an existing office verification. A new self-reported value
      // updates provenance only when the profile was not already verified.
      if (existingDonor.bloodGroupSource !== "office_verified") {
        donor.bloodGroup = bloodGroup;
        donor.bloodGroupSource = "self_reported";
      }
      await donor.save({ transaction });
    }
    const appointment = await createAppointment(donor, { donationDate, donationTime }, { transaction });

    await audit.log({
      req,
      action: existingDonor ? "update" : "create",
      resource: "BloodDonor",
      resourceId: donor.donorId,
      description: existingDonor ? "Blood donation office updated an existing donor profile for a new visit" : "Blood donation office recorded an in-person walk-in donor",
      changes: existingDonor ? { fields: Object.keys(profileUpdates) } : { fields: ["fullName", "phone", "age", "gender", "weight", "bloodGroup", "healthConditions", "medications"] },
      metadata: { registrationSource: "office", consentPrivacyVersion: DONOR_PRIVACY_NOTICE_VERSION },
      transaction,
      required: true,
    });
    await audit.log({
      req,
      action: "create",
      resource: "BloodDonationAppointment",
      resourceId: appointment.id,
      description: "Blood donation office scheduled an in-person donor visit",
      transaction,
      required: true,
    });
    await transaction.commit();
    transaction = null;

    return res.status(201).json({
      success: true,
      message: "Walk-in donor recorded successfully.",
      data: { donorId: donor.donorId, registrationDate: donor.createdAt },
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try { await transaction.rollback(); } catch (rollbackError) {
        logger.error({ errorName: rollbackError?.name }, "Blood donor walk-in rollback failed");
      }
    }
    logger.error({ errorName: error?.name }, "Blood donation office walk-in registration failed");
    return res.status(500).json({ success: false, message: "Walk-in donor could not be recorded. Please try again." });
  }
};

exports.getDonorScreening = async (req, res) => {
  try {
    const donor = await BloodDonor.findOne({
      where: { donorId: req.params.donorId },
      attributes: ["donorId", ...DONOR_SCREENING_ATTRIBUTES, "bloodGroupSource"],
    });
    if (!donor) return res.status(404).json({ success: false, message: "Donor not found" });

    await audit.log({
      req,
      action: "view",
      resource: "BloodDonorScreening",
      resourceId: donor.donorId,
      description: "Viewed restricted donor screening details",
      required: true,
    });
    return res.status(200).json({ success: true, data: donor });
  } catch (error) {
    logger.error({ errorName: error?.name }, "Donor screening lookup failed");
    return res.status(500).json({ success: false, message: "Screening details could not be loaded." });
  }
};

exports.verifyDonorBloodGroup = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const donor = await BloodDonor.findOne({ where: { donorId: req.params.donorId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!donor) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({ success: false, message: "Donor not found" });
    }
    if (!donor.bloodGroup) {
      await transaction.rollback();
      transaction = null;
      return res.status(409).json({ success: false, message: "A blood group must be recorded before it can be verified." });
    }
    donor.bloodGroupSource = "office_verified";
    donor.bloodGroupVerifiedBy = req.user.id;
    donor.bloodGroupVerifiedAt = new Date();
    await donor.save({ transaction });
    await audit.log({ req, action: "update", resource: "BloodDonorScreening", resourceId: donor.donorId, description: "Verified donor blood group", changes: { fields: ["bloodGroupSource", "bloodGroupVerifiedBy", "bloodGroupVerifiedAt"] }, transaction, required: true });
    await transaction.commit();
    transaction = null;
    return res.status(200).json({ success: true, message: "Blood group marked as office verified." });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    logger.error({ errorName: error?.name }, "Donor blood group verification failed");
    return res.status(500).json({ success: false, message: "Blood group could not be verified." });
  }
};

exports.getAllDonors = async (req, res) => {
  try {
    const { page = "1", limit = "10", status } = req.query;
    const rawSearch = req.query.search;

    if (typeof rawSearch !== "undefined" && typeof rawSearch !== "string") {
      return res.status(400).json({ success: false, message: "Search must be a text value." });
    }
    const search = rawSearch?.trim() || "";
    if (search.length > 100) {
      return res.status(400).json({ success: false, message: "Search must be 100 characters or fewer." });
    }

    const pageNum = Number(page);
    const requestedLimit = Number(limit);
    if (!Number.isInteger(pageNum) || pageNum < 1 || !Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return res.status(400).json({ success: false, message: "Page and limit must be positive whole numbers." });
    }
    if (status && !BloodDonor.STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid donor status filter." });
    }

    const where = {};
    if (status) {
      const matchingAppointments = await BloodDonationAppointment.findAll({
        attributes: ["donorId"], where: { status }, raw: true,
      });
      const ids = [...new Set(matchingAppointments.map((item) => item.donorId))];
      where.donorId = { [Op.in]: ids.length ? ids : ["__no_matching_donor__"] };
    }
    if (search) {
      // Search only the routine contact/reference fields already returned to
      // authorized directory readers. Screening fields remain excluded.
      const literalSearch = search.replace(/[\\%_]/g, "\\$&");
      where[Op.or] = ["fullName", "email", "phone", "donorId"].map((field) => ({
        [field]: { [Op.like]: `%${literalSearch}%` },
      }));
    }

    const limitNum = Math.min(100, requestedLimit);
    const offset = (pageNum - 1) * limitNum;

    const { rows: donors, count: total } = await BloodDonor.findAndCountAll({
      attributes: DONOR_LIST_ATTRIBUTES,
      where,
      offset,
      limit: limitNum,
      order: [["createdAt", "DESC"]],
    });

    await audit.log({
      req,
      action: "view",
      resource: "BloodDonor",
      description: search ? "Searched blood donor directory" : "Viewed blood donor directory",
      required: true,
    });

    const appointments = await BloodDonationAppointment.findAll({
      where: { donorId: { [Op.in]: donors.map((donor) => donor.donorId) } },
      order: [["donationDate", "DESC"], ["createdAt", "DESC"]],
    });
    const latestAppointment = new Map();
    appointments.forEach((appointment) => {
      if (!latestAppointment.has(appointment.donorId)) latestAppointment.set(appointment.donorId, appointment);
    });
    const donorRows = donors.map((donor) => {
      const row = donor.get({ plain: true });
      const appointment = latestAppointment.get(donor.donorId);
      return { ...row, ...(appointment ? {
        donationDate: appointment.donationDate,
        donationTime: appointment.donationTime,
        status: appointment.status,
        registrationStatus: appointment.registrationStatus,
        appointmentId: appointment.id,
      } : { donationDate: null, donationTime: null, status: null, registrationStatus: null, appointmentId: null }) };
    });

    res.status(200).json({
      success: true,
      data: donorRows.map((row) => {
        const appointment = latestAppointment.get(row.donorId);
        return {
          ...donorSummary(row),
          donationDate: appointment?.donationDate || null,
          donationTime: appointment?.donationTime || null,
          status: appointment?.status || null,
          registrationStatus: appointment?.registrationStatus || null,
          appointmentId: appointment?.id || null,
        };
      }),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error({ errorName: error?.name }, "Blood donor directory lookup failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateDonor = async (req, res) => {
  let transaction;
  try {
    const { donorId } = req.params;
    const editableFields = ["fullName", "phone"];
    const updates = Object.fromEntries(editableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
      .map((field) => [field, req.body[field]]));
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No editable donor fields were provided." });
    }

    transaction = await sequelize.transaction({ isolationLevel: "READ COMMITTED" });
    const donor = await BloodDonor.findOne({ where: { donorId }, transaction });
    if (!donor) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    donor.set(updates);
    await donor.save({ transaction });

    await audit.log({
      req,
      action: "update",
      resource: "BloodDonor",
      resourceId: donor.donorId,
      description: "Updated blood donor registration details",
      changes: { fields: Object.keys(updates) },
      transaction,
      required: true,
    });
    await transaction.commit();
    transaction = null;

    res.status(200).json({
      success: true,
      message: "Donor updated successfully",
      data: donorSummary(donor),
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try { await transaction.rollback(); } catch (rollbackError) {
        logger.error({ errorName: rollbackError?.name }, "Blood donor update rollback failed");
      }
    }
    logger.error({ errorName: error?.name }, "Blood donor update failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateDonorStatus = async (req, res) => {
  let transaction;
  try {
    const { appointmentId } = req.params;
    const { status, registrationStatus } = req.body;

    transaction = await sequelize.transaction({ isolationLevel: "READ COMMITTED" });
    const appointment = await BloodDonationAppointment.findByPk(appointmentId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!appointment) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({ success: false, message: "Donation appointment not found" });
    }
    const donor = await BloodDonor.findOne({ where: { donorId: appointment.donorId }, transaction });
    if (!donor) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({ success: false, message: "Appointment donor profile not found" });
    }

    if (status && !BloodDonor.STATUSES.includes(status)) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({ success: false, message: "Invalid donation status." });
    }
    if (registrationStatus && !BloodDonor.REGISTRATION_STATUSES.includes(registrationStatus)) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({ success: false, message: "Invalid registration status." });
    }
    if (!status && !registrationStatus) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({ success: false, message: "Provide a donation or registration status." });
    }

    const resultingStatus = status || appointment.status;
    const resultingRegistrationStatus = registrationStatus || appointment.registrationStatus;
    const wasScheduled = CAPACITY_STATUSES.includes(appointment.status) && appointment.registrationStatus !== "rejected";
    const willBeScheduled = CAPACITY_STATUSES.includes(resultingStatus) && resultingRegistrationStatus !== "rejected";
    const becomesScheduled = willBeScheduled && !wasScheduled;
    if (becomesScheduled) {
      await lockDonationCapacityDate(appointment.donationDate, transaction);
      const booked = await countScheduledDonations(appointment.donationDate, transaction);
      if (booked >= BLOOD_DONATION_DAILY_CAPACITY) {
        await transaction.rollback();
        transaction = null;
        return capacityResponse(res, booked);
      }
    }

    if (status) appointment.status = status;
    if (registrationStatus) appointment.registrationStatus = registrationStatus;
    await appointment.save({ transaction });
    // Completing an appointment creates one distinct, staff-verified event.
    // The unique appointment key makes repeated status updates idempotent.
    if (resultingStatus === "completed") {
      const actorId = req.user?.id || req.user?.userId || null;
      const [event, created] = await BloodDonationEvent.findOrCreate({
        where: { appointmentId: appointment.id },
        defaults: {
          donorId: appointment.donorId,
          appointmentId: appointment.id,
          donationDate: appointment.donationDate,
          status: "completed",
          verificationStatus: "verified",
          verifiedBy: actorId,
          verifiedAt: new Date(),
        },
        transaction,
      });
      if (!created && event.verificationStatus !== "verified") {
        event.verificationStatus = "verified";
        event.verifiedBy = req.user?.id || null;
        event.verifiedAt = new Date();
        await event.save({ transaction });
      }
    }

    await audit.log({
      req,
      action: "update",
      resource: "BloodDonationAppointment",
      resourceId: appointment.id,
      description: resultingStatus === "completed" ? "Recorded staff-verified donation event" : "Updated donation appointment workflow status",
      changes: { fields: [status && "status", registrationStatus && "registrationStatus"].filter(Boolean) },
      transaction,
      required: true,
    });
    await transaction.commit();
    transaction = null;

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: { ...donorSummary(donor), donationDate: appointment.donationDate, donationTime: appointment.donationTime, status: appointment.status, registrationStatus: appointment.registrationStatus, appointmentId: appointment.id },
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try { await transaction.rollback(); } catch (rollbackError) {
        logger.error({ errorName: rollbackError?.name }, "Blood donor status rollback failed");
      }
    }
    logger.error({ errorName: error?.name }, "Blood donor status update failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteDonor = async (req, res) => {
  let transaction;
  try {
    const { donorId } = req.params;
    transaction = await sequelize.transaction();
    const donor = await BloodDonor.findOne({ where: { donorId }, transaction });
    if (!donor) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({ success: false, message: "Donor not found" });
    }
    const deletedDonorId = donor.donorId;
    await BloodDonationEvent.destroy({ where: { donorId: deletedDonorId }, transaction });
    await BloodDonationAppointment.destroy({ where: { donorId: deletedDonorId }, transaction });
    await donor.destroy({ transaction });
    await audit.log({
      req,
      action: "delete",
      resource: "BloodDonor",
      resourceId: deletedDonorId,
      description: "Deleted blood donor record",
      transaction,
      required: true,
    });
    await transaction.commit();
    transaction = null;
    res.status(200).json({ success: true, message: "Donor deleted successfully" });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    logger.error({ errorName: error?.name }, "Blood donor deletion failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getUpcomingDonations = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const donations = await BloodDonationAppointment.findAll({
      where: { donationDate: { [Op.gte]: today }, status: { [Op.in]: ["registered", "confirmed"] }, registrationStatus: { [Op.ne]: "rejected" } },
      include: [{ model: BloodDonor, as: "donor", attributes: ["donorId", "fullName", "phone", "email", "registrationSource"] }],
      order: [["donationDate", "ASC"], ["donationTime", "ASC"]],
    });

    await audit.log({
      req,
      action: "view",
      resource: "BloodDonationAppointment",
      description: "Viewed upcoming donor appointments",
      required: true,
    });

    res.status(200).json({
      success: true,
      data: donations.map((appointment) => ({
        ...(appointment.donor?.get({ plain: true }) || {}),
        appointmentId: appointment.id,
        donorId: appointment.donorId,
        donationDate: appointment.donationDate,
        donationTime: appointment.donationTime,
        status: appointment.status,
        registrationStatus: appointment.registrationStatus,
      })),
      count: donations.length,
    });
  } catch (error) {
    logger.error({ errorName: error?.name }, "Upcoming donor lookup failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getDonationStats = async (req, res) => {
  try {

    const [byBloodGroup, byStatus, totalDonors] = await Promise.all([
      BloodDonor.findAll({
        attributes: [
          "bloodGroup",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["bloodGroup"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        raw: true,
      }),
      BloodDonationAppointment.findAll({
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }),
      BloodDonor.count(),
    ]);

    await audit.log({
      req,
      action: "view",
      resource: "BloodDonor",
      description: "Viewed blood donation statistics",
      required: true,
    });


    const mapRows = (rows, groupField) => rows.map((r) => ({
      _id: r[groupField],
      id: r[groupField],
      count: Number(r.count),
    }));

    res.status(200).json({
      success: true,
      data: {
        bloodGroupStats: mapRows(byBloodGroup, "bloodGroup")
          .filter((row) => row.count >= MIN_BLOOD_GROUP_AGGREGATE_SIZE),
        statusStats:     mapRows(byStatus, "status"),
        totalDonors,
      },
    });
  } catch (error) {
    logger.error({ errorName: error?.name }, "Blood donation statistics lookup failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getDonationEvents = async (req, res) => {
  try {
    const events = await BloodDonationEvent.findAll({
      include: [{ model: BloodDonor, as: "donor", attributes: ["donorId", "fullName"] }],
      order: [["donationDate", "DESC"], ["createdAt", "DESC"]],
      limit: 200,
    });
    await audit.log({ req, action: "view", resource: "BloodDonationEvent", description: "Viewed donation event history", required: true });
    return res.status(200).json({
      success: true,
      data: events.map((event) => ({
        id: event.id,
        donorId: event.donorId,
        fullName: event.donor?.fullName || "Unknown donor",
        donationDate: event.donationDate,
        status: event.status,
        verificationStatus: event.verificationStatus,
        verifiedAt: event.verifiedAt,
      })),
    });
  } catch (error) {
    logger.error({ errorName: error?.name }, "Donation event history lookup failed");
    return res.status(500).json({ success: false, message: "Donation history could not be loaded." });
  }
};
