"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { BloodDonor, sequelize } = require("../sequelize/models");
const emailService = require("../utils/emailServices");
const audit = require("../services/auditService");

const DONOR_PRIVACY_NOTICE_VERSION = "1.0";
const MIN_BLOOD_GROUP_AGGREGATE_SIZE = 5;
const DONOR_LIST_ATTRIBUTES = [
  "donorId", "fullName", "email", "phone",
  "donationDate", "donationTime", "consentDonate", "consentTest",
  "consentTerms", "consentPrivacy", "consentPrivacyVersion",
  "consentPrivacyAt", "consentDonateAt", "consentTestAt", "consentTermsAt",
  "status", "registrationStatus", "createdAt", "updatedAt",
];

const donorSummary = (donor) => {
  const record = donor.get ? donor.get({ plain: true }) : donor;
  return Object.fromEntries(DONOR_LIST_ATTRIBUTES
    .filter((field) => Object.prototype.hasOwnProperty.call(record, field))
    .map((field) => [field, record[field]]));
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(donationDate) || Number.isNaN(Date.parse(`${donationDate}T00:00:00Z`))) {
      return res.status(400).json({ success: false, message: "Please provide a valid preferred donation date." });
    }
    if (!/^\d{2}:\d{2}$/.test(donationTime)) {
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
    transaction = await sequelize.transaction();

    const existingDonor = await BloodDonor.findOne({
      where: { email: normalizedEmail },
      transaction,
    });

    if (existingDonor) {
      await transaction.rollback();
      transaction = null;
      return res.status(400).json({ success: false, message: "Email already registered" });
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
    if (transaction && !transaction.finished) await transaction.rollback();
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

exports.getAllDonors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const where = {};
    if (status)     where.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
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
      description: "Viewed blood donor directory",
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

    transaction = await sequelize.transaction();
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
    if (transaction && !transaction.finished) await transaction.rollback();
    logger.error({ errorName: error?.name }, "Blood donor update failed");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateDonorStatus = async (req, res) => {
  let transaction;
  try {
    const { donorId } = req.params;
    const { status, registrationStatus } = req.body;

    transaction = await sequelize.transaction();
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
    if (transaction && !transaction.finished) await transaction.rollback();
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
