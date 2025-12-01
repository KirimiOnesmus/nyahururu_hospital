const UserData = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const { generateEmployeeId, generateRFID } = require('../utils/generateIds');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserData.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await UserData.findById(req.params.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      specialization,
      position,
      phone,
      dateOfBirth,
      joinDate,
      profileImage,
      signature,
      bloodGroup,
      expiryDate,
      signatureText,
      terms,
      photo,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ 
        message: "Missing required fields: firstName, lastName, email, and role are required" 
      });
    }

    // Validate doctor-specific requirements
    if (role.toLowerCase() === "doctor" && !department) {
      return res.status(400).json({ 
        message: "Department is required for doctors" 
      });
    }

    const existingEmail = await UserData.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password if provided, otherwise use default
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash("defaultPassword123", 10);

    // AUTO-GENERATE employee ID and RFID
    const employeeId = await generateEmployeeId(role || "STAFF", UserData);
    const rfidTag = generateRFID(employeeId);

    const user = await UserData.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      department:department, // Use department
      specialization, // Store specialization field
      position,
      phone,
      dateOfBirth,
      joinDate,
      profileImage: profileImage || photo,
      signature,
      employeeId,
      rfidTag,
      rfid: rfidTag,
      bloodGroup,
      expiryDate,
      signatureText,
      terms,
      photo: photo || profileImage,
    });

    await user.save();

    // Sync doctor profile if role is doctor
    if (role.toLowerCase() === "doctor" && department) {
      await exports.syncDoctorProfile(user._id, {
        role: "doctor",
        department,
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { ...user.toObject(), password: undefined, _id: user._id },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ 
      message: err.message || "Error creating user",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    const userId = req.params.id;

    // PREVENT updating employeeId and rfidTag
    delete updates.employeeId;
    delete updates.rfidTag;
    delete updates.rfid;

    // Get current user to check role
    const currentUser = await UserData.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If updating to doctor role or specialization, validate
    const newRole = updates.role?.toLowerCase() || currentUser.role;
    const newDepartment = updates.department || currentUser.department;

    if (newRole === "doctor" && !newDepartment && !updates.department) {
      return res.status(400).json({ 
        message: "Specialization is required for doctors" 
      });
    }

    // Update name if firstName or lastName changed
    if (updates.firstName || updates.lastName) {
      const firstName = updates.firstName || currentUser.firstName || '';
      const lastName = updates.lastName || currentUser.lastName || '';
      updates.name = `${firstName} ${lastName}`.trim();
    }

    // Hash password if being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Handle photo field alias
    if (updates.photo && !updates.profileImage) {
      updates.profileImage = updates.photo;
    }

    // Sync department from specialization for doctors
    if (newRole === "doctor" && updates.department) {
      updates.department = updates.department;
    }

    const user = await UserData.findByIdAndUpdate(userId, updates, { 
      new: true,
      runValidators: true 
    }).select("-password");

    // Sync doctor profile if role is doctor
    if (newRole === "doctor" && (updates.department || currentUser.department)) {
      await exports.syncDoctorProfile(userId, {
        role: "doctor",
        department:newDepartment,
      });
    }

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ 
      message: err.message || "Error updating user",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await UserData.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sync doctor profile when a user with role 'doctor' is created or updated
exports.syncDoctorProfile = async (userId, userData) => {
  try {
    if (userData.role && userData.role.toLowerCase() === "doctor") {
      const { department } = userData;

      if (!department) {
        console.warn("No specialization provided for doctor profile sync");
        return null;
      }

      // Check if doctor profile exists
      let doctor = await Doctor.findOne({ userId });

      if (!doctor) {
        // Create new doctor profile
        doctor = new Doctor({
          userId,
          // speciality: specialization,
          department: specialization, // Set department from specialization
        });
        await doctor.save();
        console.log("Doctor profile created:", { userId, department });
      } else {
        // Update existing doctor profile
        // doctor.speciality = specialization;
        doctor.department = department; // Update department
        doctor.updatedAt = Date.now();
        await doctor.save();
        
      }

      return doctor;
    }
  } catch (error) {
    console.error("Error syncing doctor profile:", error);
    throw error;
  }
};