const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { generateEmployeeId, generateRFID } = require('../utils/generateIds');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

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
      photo
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ 
        message: "Missing required fields: firstName, lastName, email, and role are required" 
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password if provided, otherwise use default
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash("defaultPassword123", 10);

    // AUTO-GENERATE employee ID and RFID
    const employeeId = await generateEmployeeId(role || "STAFF", User);
    const rfidTag = generateRFID(employeeId);

    const user = await User.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role,
      department,
      position,
      phone,
      dateOfBirth,
      joinDate,
      profileImage: profileImage || photo, // Support both field names
      signature,
      employeeId,      // Auto-generated
      rfidTag,         // Auto-generated
      rfid: rfidTag,   // Alias for compatibility
      bloodGroup,
      expiryDate,
      signatureText,
      terms,
      photo: photo || profileImage
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { ...user.toObject(), password: undefined },
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

    // PREVENT updating employeeId and rfidTag
    delete updates.employeeId;
    delete updates.rfidTag;
    delete updates.rfid; // Also prevent updating rfid alias

    if (updates.firstName || updates.lastName) {
      const user = await User.findById(req.params.id);
      const firstName = updates.firstName || user?.firstName || '';
      const lastName = updates.lastName || user?.lastName || '';
      updates.name = `${firstName} ${lastName}`.trim();
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Handle photo field alias
    if (updates.photo && !updates.profileImage) {
      updates.profileImage = updates.photo;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { 
      new: true,
      runValidators: true 
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};