const User = require("../models/userModel");
const Profile = require("../models/ProfileModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");


exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    let doctorDetails = null;
    if (user.role === "doctor") doctorDetails = await Doctor.findOne({ userId });

    const profile = await Profile.findOne({ userId });

    res.status(200).json({
      success: true,
      data: {
        user,
        doctorDetails,
        profile, 
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, address, bio, speciality, education, profileImage } = req.body;

  

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    await user.save();

 
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId, phone, address, imageUrl: profileImage || null });
    } else {
      if (phone !== undefined) profile.phone = phone;
      if (address !== undefined) profile.address = address;
      if (profileImage !== undefined) profile.imageUrl = profileImage;
      profile.updatedAt = Date.now();
    }
    await profile.save();

    let doctorDetails = null;
    if (user.role === "doctor") {
      let doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        doctor = new Doctor({ userId, speciality: speciality || "", bio: bio || "", education: education || "" });
      } else {
        if (speciality !== undefined) doctor.speciality = speciality;
        if (bio !== undefined) doctor.bio = bio;
        if (education !== undefined) doctor.education = education;
        doctor.updatedAt = Date.now();
      }
      await doctor.save();
      doctorDetails = doctor;
    }

    const updatedUser = await User.findById(userId).select("-password");
    profile = await Profile.findOne({ userId }); 

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: {
        user: updatedUser,
        doctorDetails,
        profile, 
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Error updating profile", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, currentPassword } = req.body;


    const currentPass = oldPassword || currentPassword;

    if (!currentPass || !newPassword) {
      return res.status(400).json({
        message: "Please provide both current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};

exports.uploadProfilePhoto =async (req, res) =>{

    try { 
      const userId = req.user.id;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}`: null;

      let profile = await Profile.findOne({ userId });
      if (!profile) {
        profile = new Profile({ userId, imageUrl });
      } else {
        profile.imageUrl = imageUrl;
        profile.updatedAt = Date.now();
      }
      await profile.save();

      res.status(200).json({ success: true, imageUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to upload image", error: err.message });
    }
  };