"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { BloodDonor, sequelize } = require("../sequelize/models");
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
  "donationDate", "donationTime", "consentDonate", "consentTest",
  "consentTerms", "consentPrivacy", "consentPrivacyVersion",
  "consentPrivacyAt", "consentDonateAt", "consentTestAt", "consentTermsAt",
  "status", "registrationStatus", "createdAt", "updatedAt",
  "registrationSource",
];
const DONOR_SCREENING_ATTRIBUTES = [
  "age", "gender", "weight", "bloodGroup", "healthConditions", "medications",
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

const countScheduledDonations = (date, transaction, excludeDonorId) => {
  const where = {
    donationDate: date,
    status: { [Op.in]: CAPACITY_STATUSES },
    registrationStatus: { [Op.ne]: "rejected" },
  };
  if (excludeDonorId) where.donorId = { [Op.ne]: excludeDonorId };
  return BloodDonor.count({ where, transaction });
};

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
      donationDate,
      donationTime,
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
        donationDate:  donor.donationDate,
        donationTime:  donor.donationTime,
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
    if (normalizedEmail) {
      const existingDonor = await BloodDonor.findOne({ where: { email: normalizedEmail }, transaction });
      if (existingDonor) {
        await transaction.rollback();
        transaction = null;
        return res.status(409).json({ success: false, message: "This email is already registered. Find the existing donor record instead." });
      }
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
      donationDate,
      donationTime,
      age: parsedAge,
      gender,
      weight: parsedWeight,
      bloodGroup,
      healthConditions: typeof healthConditions === "string" ? healthConditions.trim() || null : null,
      medications: typeof medications === "string" ? medications.trim() || null : null,
      registrationSource: "office",
      consentDonate,
      consentTest,
      consentTerms,
      consentPrivacy,
      consentPrivacyVersion: DONOR_PRIVACY_NOTICE_VERSION,
      consentPrivacyAt: consentRecordedAt,
      consentDonateAt: consentRecordedAt,
      consentTestAt: consentRecordedAt,
      consentTermsAt: consentRecordedAt,
    }, { transaction });

    await audit.log({
      req,
      action: "create",
      resource: "BloodDonor",
      resourceId: donor.donorId,
      description: "Blood donation office recorded an in-person walk-in donor",
      changes: { fields: ["fullName", "phone", "age", "gender", "weight", "bloodGroup", "healthConditions", "medications"] },
      metadata: { registrationSource: "office", consentPrivacyVersion: DONOR_PRIVACY_NOTICE_VERSION },
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
      attributes: ["donorId", ...DONOR_SCREENING_ATTRIBUTES],
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
    if (status)     where.status = status;
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

    res.status(200).json({
      success: true,
      data: donors.map(donorSummary),
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
    const editableFields = ["fullName", "phone", "donationDate", "donationTime", "status", "registrationStatus"];
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

    const resultingStatus = updates.status || donor.status;
    const resultingRegistrationStatus = updates.registrationStatus || donor.registrationStatus;
    const resultingDate = updates.donationDate || donor.donationDate;
    if (updates.donationDate && !validateDonationDate(updates.donationDate)) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({ success: false, message: "Please provide a valid preferred donation date." });
    }
    const wasScheduled = CAPACITY_STATUSES.includes(donor.status) && donor.registrationStatus !== "rejected";
    const willBeScheduled = CAPACITY_STATUSES.includes(resultingStatus) && resultingRegistrationStatus !== "rejected";
    const becomesScheduled = willBeScheduled && (!wasScheduled || Boolean(updates.donationDate));
    if (becomesScheduled) {
      await lockDonationCapacityDate(resultingDate, transaction);
      const booked = await countScheduledDonations(resultingDate, transaction, donor.donorId);
      if (booked >= BLOOD_DONATION_DAILY_CAPACITY) {
        await transaction.rollback();
        transaction = null;
        return capacityResponse(res, booked);
      }
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
    const { donorId } = req.params;
    const { status, registrationStatus } = req.body;

    transaction = await sequelize.transaction({ isolationLevel: "READ COMMITTED" });
    const donor = await BloodDonor.findOne({ where: { donorId }, transaction });
    if (!donor) {
      await transaction.rollback();
      transaction = null;
      return res.status(404).json({ success: false, message: "Donor not found" });
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

    const resultingStatus = status || donor.status;
    const resultingRegistrationStatus = registrationStatus || donor.registrationStatus;
    const wasScheduled = CAPACITY_STATUSES.includes(donor.status) && donor.registrationStatus !== "rejected";
    const willBeScheduled = CAPACITY_STATUSES.includes(resultingStatus) && resultingRegistrationStatus !== "rejected";
    const becomesScheduled = willBeScheduled && !wasScheduled;
    if (becomesScheduled) {
      await lockDonationCapacityDate(donor.donationDate, transaction);
      const booked = await countScheduledDonations(donor.donationDate, transaction, donor.donorId);
      if (booked >= BLOOD_DONATION_DAILY_CAPACITY) {
        await transaction.rollback();
        transaction = null;
        return capacityResponse(res, booked);
      }
    }

    if (status) donor.status = status;
    if (registrationStatus) donor.registrationStatus = registrationStatus;

    await donor.save({ transaction });

    await audit.log({
      req,
      action: "update",
      resource: "BloodDonor",
      resourceId: donor.donorId,
      description: "Updated blood donor workflow status",
      changes: { fields: [status && "status", registrationStatus && "registrationStatus"].filter(Boolean) },
      transaction,
      required: true,
    });
    await transaction.commit();
    transaction = null;

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: donorSummary(donor),
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const donations = await BloodDonor.findAll({
      attributes: DONOR_LIST_ATTRIBUTES,
      where: {
        donationDate: { [Op.gte]: today },
        status: { [Op.in]: ["registered", "confirmed"] },
      },
      order: [
        ["donationDate", "ASC"],
        ["donationTime", "ASC"],
      ],
    });

    await audit.log({
      req,
      action: "view",
      resource: "BloodDonor",
      description: "Viewed upcoming donor appointments",
      required: true,
    });

    res.status(200).json({
      success: true,
      data: donations.map(donorSummary),
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
      BloodDonor.findAll({
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
