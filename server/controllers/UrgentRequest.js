

const UrgentRequest = require("../models/UrgentBloodRequest"); 


const createUrgentRequest = async (req, res) => {
  try {
    const { bloodGroups, message, contactNumber, isActive } = req.body;

    if (!bloodGroups || bloodGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one blood group",
      });
    }

    if (!message || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide message and contact number",
      });
    }


    const urgentRequest = await UrgentRequest.create({
      bloodGroups,
      message,
      contactNumber,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id, 
    });

    res.status(201).json({
      success: true,
      message: "Urgent blood request created successfully",
      data: urgentRequest,
    });
  } catch (error) {
    console.error("Create urgent request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create urgent request",
      error: error.message,
    });
  }
};


const getAllUrgentRequests = async (req, res) => {
  try {
    const { isActive, bloodGroup } = req.query;


    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    if (bloodGroup) {
      filter.bloodGroups = bloodGroup;
    }

    const urgentRequests = await UrgentRequest.find(filter)
      .sort({ isActive: -1, createdAt: -1 })
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      count: urgentRequests.length,
      data: urgentRequests,
    });
  } catch (error) {
    console.error("Get all urgent requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch urgent requests",
      error: error.message,
    });
  }
};


const getActiveUrgentRequests = async (req, res) => {
  try {
    const { bloodGroup } = req.query;

    const filter = { isActive: true };
    if (bloodGroup) {
      filter.bloodGroups = bloodGroup;
    }

    const urgentRequests = await UrgentRequest.find(filter)
      .sort({ createdAt: -1 })
      .select("-createdBy -updatedBy");

    res.status(200).json({
      success: true,
      count: urgentRequests.length,
      data: urgentRequests,
    });
  } catch (error) {
    console.error("Get active urgent requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active urgent requests",
      error: error.message,
    });
  }
};


const updateUrgentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodGroups, message, contactNumber, isActive } = req.body;

    
    const urgentRequest = await UrgentRequest.findById(id);

    if (!urgentRequest) {
      return res.status(404).json({
        success: false,
        message: "Urgent request not found",
      });
    }

  
    if (bloodGroups && bloodGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one blood group must be selected",
      });
    }

    if (bloodGroups) urgentRequest.bloodGroups = bloodGroups;
    if (message) urgentRequest.message = message;
    if (contactNumber) urgentRequest.contactNumber = contactNumber;
    if (isActive !== undefined) urgentRequest.isActive = isActive;

    urgentRequest.updatedBy = req.user.id;

    await urgentRequest.save();

    res.status(200).json({
      success: true,
      message: "Urgent request updated successfully",
      data: urgentRequest,
    });
  } catch (error) {
    console.error("Update urgent request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update urgent request",
      error: error.message,
    });
  }
};

const toggleUrgentRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const urgentRequest = await UrgentRequest.findById(id);

    if (!urgentRequest) {
      return res.status(404).json({
        success: false,
        message: "Urgent request not found",
      });
    }

    // Toggle status
    urgentRequest.isActive = !urgentRequest.isActive;
    urgentRequest.updatedBy = req.user.id;

    await urgentRequest.save();

    res.status(200).json({
      success: true,
      message: `Urgent request ${urgentRequest.isActive ? "activated" : "deactivated"} successfully`,
      data: urgentRequest,
    });
  } catch (error) {
    console.error("Toggle urgent request status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle urgent request status",
      error: error.message,
    });
  }
};


const deleteUrgentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const urgentRequest = await UrgentRequest.findById(id);

    if (!urgentRequest) {
      return res.status(404).json({
        success: false,
        message: "Urgent request not found",
      });
    }

    await urgentRequest.deleteOne();

    res.status(200).json({
      success: true,
      message: "Urgent request deleted successfully",
    });
  } catch (error) {
    console.error("Delete urgent request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete urgent request",
      error: error.message,
    });
  }
};

module.exports = {
  createUrgentRequest,
  getAllUrgentRequests,
  getActiveUrgentRequests,
  updateUrgentRequest,
  toggleUrgentRequestStatus,
  deleteUrgentRequest,
};