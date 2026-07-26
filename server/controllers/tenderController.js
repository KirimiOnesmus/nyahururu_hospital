const emitChange = require("../utils/emitChange");
"use strict";

const { Op } = require("sequelize");
const { Tender, Bid, User, sequelize } = require("../sequelize/models");


const SORT_MAP = {
  newest:       [["createdAt", "DESC"]],
  oldest:       [["createdAt", "ASC"]],
  alphabetical: [["title", "ASC"]],
  deadline:     [["submissionDeadline", "ASC"]],
};

const CREATOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
];
const DETAIL_INCLUDE = [
  ...CREATOR_INCLUDE,
  { model: User, as: "updater", attributes: ["id", "name", "email"] },
];

const buildActivityEntry = (req, action, description) => ({
  action,
  description,
  performedBy: req.user.id,
  performedByName: req.user.name,

  timestamp: new Date().toISOString(),
});


const appendActivity = (tender, entry) => {
  tender.activityLog = [...(tender.activityLog || []), entry];
};


exports.getAllTenders = async (req, res) => {
  try {
    const {
      search, category, status,
      sortBy = "newest", page = 1, limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
   
      const escaped = String(search).replace(/[\\%_]/g, (m) => `\\${m}`);
      const like = `%${escaped}%`;
      where[Op.or] = [
        { title: { [Op.like]: like } },
        { tenderNumber: { [Op.like]: like } },
        { description: { [Op.like]: like } },
      ];
    }

    if (category && category !== "all") where.category = category;
    if (status && status !== "all") where.status = status;

 
    const [{ rows: tenders, count: total }, allTotal, active, closed, underEvaluation, awarded] =
      await Promise.all([
        Tender.findAndCountAll({
          where,
          order: SORT_MAP[sortBy] || SORT_MAP.newest,
          offset,
          limit: limitNum,
          include: CREATOR_INCLUDE,
        }),
        Tender.count(),
        Tender.count({ where: { status: "active" } }),
        Tender.count({ where: { status: "closed" } }),
        Tender.count({ where: { status: "under_evaluation" } }),
        Tender.count({ where: { status: "awarded" } }),
      ]);

    res.status(200).json({
      success: true,
      data: tenders,
      stats: { total: allTotal, active, closed, underEvaluation, awarded },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tenders",
    });
  }
};

exports.getTenderById = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id, {
      include: DETAIL_INCLUDE,
    });
    if (!tender) {
      return res.status(404).json({ success: false, message: "Tender not found" });
    }
    res.status(200).json({ success: true, data: tender });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tender",
    });
  }
};

exports.createTender = async (req, res) => {
  try {

    const tender = await Tender.create({
      ...req.body,
      createdBy: req.user.id,
      createdByName: req.user.name,
      activityLog: [buildActivityEntry(req, "created", "Tender created")],
    });

    res.status(201).json({
      success: true,
      message: "Tender created successfully",
    emitChange("tenders", "created", { id: tender.id });
      data: tender,
    });
  } catch (error) {
 
    if (error.name === "SequelizeValidationError" || error.name === "ValidationError") {
      const errors = error.errors?.map((e) => e.message) || [error.message];
      console.error("Sequelize Validation Error:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating tender",
    });
  }
};

exports.updateTender = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: "Tender not found" });
    }

    const { activityLog: _ignored, ...updatable } = req.body;
    tender.set(updatable);
    tender.updatedBy = req.user.id;
    appendActivity(
      tender,
      buildActivityEntry(req, "updated", "Tender information updated"),
    );

    await tender.save();

    res.status(200).json({
      success: true,
      message: "Tender updated successfully",
    emitChange("tenders", "updated", { id: tender.id });
      data: tender,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating tender",
    });
  }
};

exports.deleteTender = async (req, res) => {
  try {

    const deleted = await sequelize.transaction(async (t) => {
      const tender = await Tender.findByPk(req.params.id, { transaction: t });
      if (!tender) return { notFound: true };

      await Bid.destroy({ where: { tenderId: tender.id }, transaction: t });
      await tender.destroy({ transaction: t });
      return { deleted: true };
    });

    if (deleted.notFound) {
      return res.status(404).json({ success: false, message: "Tender not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tender deleted successfully",
    emitChange("tenders", "deleted", { id: req.params.id });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting tender",
    });
  }
};

exports.bulkDeleteTenders = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid tender IDs",
      });
    }

    const result = await sequelize.transaction(async (t) => {
      await Bid.destroy({
        where: { tenderId: { [Op.in]: ids } },
        transaction: t,
      });
      const n = await Tender.destroy({
        where: { id: { [Op.in]: ids } },
        transaction: t,
      });
      return n;
    });

    res.status(200).json({
      success: true,
      message: `${result} tender(s) deleted successfully`,
      deletedCount: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting tenders",
    });
  }
};

exports.closeTender = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: "Tender not found" });
    }

    tender.status = "closed";
    appendActivity(tender, buildActivityEntry(req, "closed", "Tender closed"));

    await tender.save();

    res.status(200).json({
      success: true,
      message: "Tender closed successfully",
      data: tender,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error closing tender",
    });
  }
};

exports.extendDeadline = async (req, res) => {
  try {
    const { newDeadline } = req.body;
    if (!newDeadline) {
      return res.status(400).json({
        success: false,
        message: "Please provide new deadline",
      });
    }

    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: "Tender not found" });
    }

    const oldDeadline = tender.submissionDeadline;
    tender.submissionDeadline = new Date(newDeadline);

    appendActivity(
      tender,
      buildActivityEntry(
        req,
        "deadline_extended",
        `Deadline extended from ${oldDeadline ? new Date(oldDeadline).toDateString() : "(none)"} to ${new Date(newDeadline).toDateString()}`,
      ),
    );

    await tender.save();

    res.status(200).json({
      success: true,
      message: "Deadline extended successfully",
      data: tender,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error extending deadline",
    });
  }
};

exports.awardTender = async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) {
      return res.status(400).json({
        success: false,
        message: "Please provide bid ID",
      });
    }


    const result = await sequelize.transaction(async (t) => {
      const tender = await Tender.findByPk(req.params.id, { transaction: t });
      if (!tender) return { notFound: "tender" };

      const bid = await Bid.findByPk(bidId, { transaction: t });
      if (!bid) return { notFound: "bid" };

      tender.status = "awarded";
      tender.awardedTo = bid.vendorName;
      tender.awardedBidId = bid.id;
      appendActivity(
        tender,
        buildActivityEntry(req, "awarded", `Tender awarded to ${bid.vendorName}`),
      );

      bid.status = "awarded";

      await Bid.update(
        { status: "rejected" },
        {
          where: { tenderId: tender.id, id: { [Op.ne]: bid.id } },
          transaction: t,
        },
      );

      await tender.save({ transaction: t });
      await bid.save({ transaction: t });

      return { tender, bid };
    });

    if (result.notFound === "tender") {
      return res.status(404).json({ success: false, message: "Tender not found" });
    }
    if (result.notFound === "bid") {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tender awarded successfully",
      data: { tender: result.tender, bid: result.bid },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error awarding tender",
    });
  }
};

exports.getTenderStatistics = async (req, res) => {
  try {

    const [
      total, active, closed, underEvaluation, awarded, draft, cancelled,
      categoryRaw, monthlyRaw,
    ] = await Promise.all([
      Tender.count(),
      Tender.count({ where: { status: "active" } }),
      Tender.count({ where: { status: "closed" } }),
      Tender.count({ where: { status: "under_evaluation" } }),
      Tender.count({ where: { status: "awarded" } }),
      Tender.count({ where: { status: "draft" } }),
      Tender.count({ where: { status: "cancelled" } }),

      Tender.findAll({
        attributes: [
          "category",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["category"],
        raw: true,
      }),

      Tender.findAll({
        attributes: [
          [sequelize.fn("YEAR", sequelize.col("created_at")), "year"],
          [sequelize.fn("MONTH", sequelize.col("created_at")), "month"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: [
          sequelize.fn("YEAR", sequelize.col("created_at")),
          sequelize.fn("MONTH", sequelize.col("created_at")),
        ],
        order: [
          [sequelize.fn("YEAR", sequelize.col("created_at")), "DESC"],
          [sequelize.fn("MONTH", sequelize.col("created_at")), "DESC"],
        ],
        limit: 12,
        raw: true,
      }),
    ]);

   
    const categories = categoryRaw.map((r) => ({
      _id: r.category,
      count: Number(r.count),
    }));
    const monthlyTrends = monthlyRaw.map((r) => ({
      _id: { year: Number(r.year), month: Number(r.month) },
      count: Number(r.count),
    }));

    res.status(200).json({
      success: true,
      data: {
        overview: { total, active, closed, underEvaluation, awarded, draft, cancelled },
        categories,
        monthlyTrends,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
    });
  }
};
