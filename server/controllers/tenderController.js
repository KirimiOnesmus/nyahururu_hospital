// controllers/tenderController.js
const Tender = require("../models/tenderModel");
const Bid = require("../models/bidModel");

// Get all tenders with filters
exports.getAllTenders = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      sortBy = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tenderNumber: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "alphabetical":
        sort = { title: 1 };
        break;
      case "deadline":
        sort = { submissionDeadline: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const tenders = await Tender.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .lean();

    const total = await Tender.countDocuments(query);

    // Get statistics
    const stats = {
      total: await Tender.countDocuments(),
      active: await Tender.countDocuments({ status: "active" }),
      closed: await Tender.countDocuments({ status: "closed" }),
      underEvaluation: await Tender.countDocuments({
        status: "under_evaluation",
      }),
      awarded: await Tender.countDocuments({ status: "awarded" }),
    };

    res.status(200).json({
      success: true,
      data: tenders,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tenders",
      error: error.message,
    });
  }
};

// Get single tender by ID
exports.getTenderById = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      });
    }

    res.status(200).json({
      success: true,
      data: tender,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tender",
      error: error.message,
    });
  }
};

// Create new tender

exports.createTender = async (req, res) => {
  try {
    const tenderData = {
      ...req.body,
      createdBy: req.user.id,
      createdByName: req.user.name,
      activityLog: [
        {
          action: "created",
          description: "Tender created",
          performedBy: req.user.id,
          performedByName: req.user.name,
        },
      ],
    };

    const tender = await Tender.create(tenderData);
    // console.log('Tender created:', tender);
    res.status(201).json({
      success: true,
      message: "Tender created successfully",
      data: tender,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      console.error("Mongoose Validation Error:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating tender",
      error: error.message,
    });
  }
};

// Update tender
exports.updateTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      });
    }

    // Add to activity log
    const activityEntry = {
      action: "updated",
      description: "Tender information updated",
      performedBy: req.user.id,
      performedByName: req.user.name,
    };

    const updatedTender = await Tender.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id,
        $push: { activityLog: activityEntry },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Tender updated successfully",
      data: updatedTender,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating tender",
      error: error.message,
    });
  }
};

// Delete tender
exports.deleteTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      });
    }

    // Delete associated bids
    await Bid.deleteMany({ tender: req.params.id });

    await Tender.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Tender deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting tender",
      error: error.message,
    });
  }
};

// Bulk delete tenders
exports.bulkDeleteTenders = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid tender IDs",
      });
    }

    // Delete associated bids
    await Bid.deleteMany({ tender: { $in: ids } });

    const result = await Tender.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} tender(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting tenders",
      error: error.message,
    });
  }
};

// Close tender
exports.closeTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      });
    }

    tender.status = "closed";
    tender.activityLog.push({
      action: "closed",
      description: "Tender closed",
      performedBy: req.user.id,
      performedByName: req.user.name,
    });

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
      error: error.message,
    });
  }
};

// Extend deadline
exports.extendDeadline = async (req, res) => {
  try {
    const { newDeadline } = req.body;

    if (!newDeadline) {
      return res.status(400).json({
        success: false,
        message: "Please provide new deadline",
      });
    }

    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      });
    }

    const oldDeadline = tender.submissionDeadline;
    tender.submissionDeadline = newDeadline;
    tender.activityLog.push({
      action: "deadline_extended",
      description: `Deadline extended from ${oldDeadline.toDateString()} to ${new Date(
        newDeadline
      ).toDateString()}`,
      performedBy: req.user.id,
      performedByName: req.user.name,
    });

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
      error: error.message,
    });
  }
};

// Award tender
exports.awardTender = async (req, res) => {
  try {
    const { bidId } = req.body;

    if (!bidId) {
      return res.status(400).json({
        success: false,
        message: "Please provide bid ID",
      });
    }

    const tender = await Tender.findById(req.params.id);
    const bid = await Bid.findById(bidId);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      });
    }

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Update tender
    tender.status = "awarded";
    tender.awardedTo = bid.vendorName;
    tender.awardedBidId = bidId;
    tender.activityLog.push({
      action: "awarded",
      description: `Tender awarded to ${bid.vendorName}`,
      performedBy: req.user.id,
      performedByName: req.user.name,
    });

    // Update winning bid
    bid.status = "awarded";

    // Update other bids to rejected
    await Bid.updateMany(
      { tender: req.params.id, _id: { $ne: bidId } },
      { status: "rejected" }
    );

    await tender.save();
    await bid.save();

    res.status(200).json({
      success: true,
      message: "Tender awarded successfully",
      data: { tender, bid },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error awarding tender",
      error: error.message,
    });
  }
};

// Get tender statistics
exports.getTenderStatistics = async (req, res) => {
  try {
    const stats = {
      total: await Tender.countDocuments(),
      active: await Tender.countDocuments({ status: "active" }),
      closed: await Tender.countDocuments({ status: "closed" }),
      underEvaluation: await Tender.countDocuments({
        status: "under_evaluation",
      }),
      awarded: await Tender.countDocuments({ status: "awarded" }),
      draft: await Tender.countDocuments({ status: "draft" }),
      cancelled: await Tender.countDocuments({ status: "cancelled" }),
    };

    // Category breakdown
    const categoryStats = await Tender.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly trends
    const monthlyTrends = await Tender.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats,
        categories: categoryStats,
        monthlyTrends,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};
