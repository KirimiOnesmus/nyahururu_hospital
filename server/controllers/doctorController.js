const Doctor = require("../models/doctorModel");
const User = require("../models/userModel");
const Profile = require("../models/ProfileModel");

exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { speciality, education, bio } = req.body;

    let user = await User.findOne({ userId });

    if (user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can update their profile !",
      });
    }
    let doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      doctor = new Doctor({
        userId,
        speciality,
        education,
        bio,
      });
    } else {
      if (speciality) doctor.speciality = speciality;
      if (education) doctor.education = education;
      if (bio) doctor.bio = bio;
      doctor.updatedAt = Date.now();
    }
    await doctor.save();
    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating doctor profile",
      error: error.message,
    });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { availability } = req.body;
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        message: "Please provide valid availability data",
      });
    }
    const user = await User.findById(userId);
    if (user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can update availability",
      });
    }
    let doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({
        message:
          "Doctor profile not found. Please create doctor profile first.",
      });
    }

    doctor.availability = availability;
    doctor.updatedAt = Date.now();
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({
      success: false,
      message: "Error updating availability",
      error: error.message,
    });
  }
};
exports.toggleAvailability = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can toggle availability",
      });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    doctor.isAvailableNow = !doctor.isAvailableNow;
    doctor.updatedAt = Date.now();
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Availability set to ${
        doctor.isAvailableNow ? "available" : "unavailable"
      }`,
      data: { isAvailableNow: doctor.isAvailableNow },
    });
  } catch (error) {
    console.error("Error toggling availability:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling availability",
      error: error.message,
    });
  }
};


exports.getAllDoctors = async (req, res) => {
  try {
    const { speciality, available } = req.query;
    
    let query = {};
    if (speciality) {
      query.speciality = { $regex: speciality, $options: 'i' };
    }
    if (available === 'true') {
      query.isAvailableNow = true;
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email role createdAt')
      .sort({ rating: -1 });

    // Also get profile info for each doctor
    const doctorsWithProfiles = await Promise.all(
      doctors.map(async (doctor) => {
        const profile = await Profile.findOne({ userId: doctor.userId._id });
        return {
          ...doctor.toObject(),
          profile
        };
      })
    );

    res.status(200).json({
      success: true,
      count: doctorsWithProfiles.length,
      data: doctorsWithProfiles
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching doctors',
      error: error.message 
    });
  }
};


exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id)
      .populate('userId', 'name email role createdAt');

    if (!doctor) {
      return res.status(404).json({ 
        message: 'Doctor not found' 
      });
    }

    // Get profile info
    const profile = await Profile.findOne({ userId: doctor.userId._id });

    res.status(200).json({
      success: true,
      data: {
        ...doctor.toObject(),
        profile
      }
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching doctor',
      error: error.message 
    });
  }
};