"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { BloodDonor, sequelize } = require("../sequelize/models");
const emailService = require("../utils/emailServices");


exports.registerDonor = async (req, res) => {
  try {
    const {
      fullName, email, phone, gender, age, weight, nationalId,
      bloodGroup, healthConditions, medications, donationDate,
      donationTime, consentDonate, consentTest, consentTerms,
    } = req.body;

    if (!consentDonate || !consentTest || !consentTerms) {
      return res.status(400).json({
        success: false,
        message: "All consents must be accepted",
      });
    }

    const existingDonor = await BloodDonor.findOne({
      where: {
        [Op.or]: [{ email }, { nationalId }],
      },
    });

    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message:
          existingDonor.email === email
            ? "Email already registered"
            : "National ID already registered",
      });
    }


    const donor = await BloodDonor.createWithUniqueId({
      fullName,
      email,
      phone,
      gender,
      age: parseInt(age, 10),
      weight: parseInt(weight, 10),
      nationalId,
      bloodGroup: bloodGroup || "",
      healthConditions,
      medications,
      donationDate: new Date(donationDate),
      donationTime,
      consentDonate,
      consentTest,
      consentTerms,
    });

    try {
      await emailService.sendDonorRegistrationEmail({
        fullName:      donor.fullName,
        email:         donor.email,
        donorId:       donor.donorId,
        bloodGroup:    donor.bloodGroup,
        donationDate:  donor.donationDate,
        donationTime:  donor.donationTime,
        phone:         donor.phone,
      });
      console.log("Registration confirmation email sent successfully");
    } catch (emailError) {
      console.error("Failed to send registration email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        donorId: donor.donorId,
        email: donor.email,
        registrationDate: donor.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
    });
  }
};

exports.getDonor = async (req, res) => {
  try {
    const { donorId } = req.params;
    const donor = await BloodDonor.findOne({ where: { donorId } });
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }
    res.status(200).json({ success: true, data: donor });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getAllDonors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, bloodGroup, gender } = req.query;

    const where = {};
    if (status)     where.status = status;
    if (bloodGroup) where.bloodGroup = bloodGroup;
    if (gender)     where.gender = gender;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const { rows: donors, count: total } = await BloodDonor.findAndCountAll({
      where,
      offset,
      limit: limitNum,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: donors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateDonor = async (req, res) => {
  try {
    const { donorId } = req.params;
    const updates = { ...req.body };


    delete updates.donorId;
    delete updates.createdAt;
    delete updates.nationalId;
    delete updates.email;
    delete updates.id; 

    const donor = await BloodDonor.findOne({ where: { donorId } });
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }


    donor.set(updates);
    await donor.save();

    res.status(200).json({
      success: true,
      message: "Donor updated successfully",
      data: donor,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateDonorStatus = async (req, res) => {
  try {
    const { donorId } = req.params;
    const { status, registrationStatus } = req.body;

    const donor = await BloodDonor.findOne({ where: { donorId } });
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    if (status)             donor.status = status;
    if (registrationStatus) donor.registrationStatus = registrationStatus;

    await donor.save();

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: donor,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteDonor = async (req, res) => {
  try {
    const { donorId } = req.params;
    const donor = await BloodDonor.findOne({ where: { donorId } });
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }
    await donor.destroy();
    res.status(200).json({ success: true, message: "Donor deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getDonorsByBloodGroup = async (req, res) => {
  try {
    const { bloodGroup } = req.params;

    const donors = await BloodDonor.findAll({
      where: { bloodGroup, status: "completed" },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: donors,
      count: donors.length,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getUpcomingDonations = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const donations = await BloodDonor.findAll({
      where: {
        donationDate: { [Op.gte]: today },
        status: { [Op.in]: ["registered", "confirmed"] },
      },
      order: [
        ["donationDate", "ASC"],
        ["donationTime", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: donations,
      count: donations.length,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getDonationStats = async (req, res) => {
  try {

    const [byBloodGroup, byStatus, byGender, totalDonors] = await Promise.all([
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
      BloodDonor.findAll({
        attributes: [
          "gender",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["gender"],
        raw: true,
      }),
      BloodDonor.count(),
    ]);


    const mapRows = (rows, groupField) =>
      rows.map((r) => ({ _id: r[groupField], count: Number(r.count) }));

    res.status(200).json({
      success: true,
      data: {
        bloodGroupStats: mapRows(byBloodGroup, "bloodGroup"),
        statusStats:     mapRows(byStatus, "status"),
        genderStats:     mapRows(byGender, "gender"),
        totalDonors,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
  }
};
