// const UserData = require("../models/userModel");
// const Doctor = require("../models/doctorModel");
// const bcrypt = require("bcryptjs");
// const { generateEmployeeId, generateRFID } = require('../utils/generateIds');

// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await UserData.find().select("-password");
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getUserById = async (req, res) => {
//   try {
//     const user = await UserData.findById(req.params.id).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.createUser = async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       password,
//       role,
//       department,
//       specialization,
//       position,
//       phone,
//       dateOfBirth,
//       joinDate,
//       profileImage,
//       signature,
//       bloodGroup,
//       expiryDate,
//       signatureText,
//       terms,
//       photo,
//     } = req.body;

//     // Validate required fields
//     if (!firstName || !lastName || !email || !role) {
//       return res.status(400).json({ 
//         message: "Missing required fields: firstName, lastName, email, and role are required" 
//       });
//     }

//     // Validate doctor-specific requirements
//     if (role.toLowerCase() === "doctor" && !department) {
//       return res.status(400).json({ 
//         message: "Department is required for doctors" 
//       });
//     }

//     const existingEmail = await UserData.findOne({ email });
//     if (existingEmail) {
//       return res.status(400).json({ message: "Email already in use" });
//     }

//     // Hash password if provided, otherwise use default
//     const hashedPassword = password 
//       ? await bcrypt.hash(password, 10)
//       : await bcrypt.hash("defaultPassword123", 10);

//     // AUTO-GENERATE employee ID and RFID
//     const employeeId = await generateEmployeeId(role || "STAFF", UserData);
//     const rfidTag = generateRFID(employeeId);

//     const user = await UserData.create({
//       firstName,
//       lastName,
//       name: `${firstName} ${lastName}`,
//       email,
//       password: hashedPassword,
//       role: role.toLowerCase(),
//       department:department,
//       specialization, 
//       position,
//       phone,
//       dateOfBirth,
//       joinDate,
//       profileImage: profileImage || photo,
//       signature,
//       employeeId,
//       rfidTag,
//       rfid: rfidTag,
//       bloodGroup,
//       expiryDate,
//       signatureText,
//       terms,
//       photo: photo || profileImage,
//     });

//     await user.save();

//     if (role.toLowerCase() === "doctor" && department) {
//       await exports.syncDoctorProfile(user._id, {
//         role: "doctor",
//         department,
//       });
//     }

//     res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       user: { ...user.toObject(), password: undefined, _id: user._id },
//     });
//   } catch (err) {
//     console.error("Create user error:", err);
//     res.status(500).json({ 
//       message: err.message || "Error creating user",
//       error: process.env.NODE_ENV === 'development' ? err.stack : undefined
//     });
//   }
// };

// exports.updateUser = async (req, res) => {
//   try {
//     const updates = { ...req.body };
//     const userId = req.params.id;


//     delete updates.employeeId;
//     delete updates.rfidTag;
//     delete updates.rfid;


//     const currentUser = await UserData.findById(userId);
//     if (!currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const newRole = updates.role?.toLowerCase() || currentUser.role;
//     const newDepartment = updates.department || currentUser.department;

//     if (newRole === "doctor" && !newDepartment && !updates.department) {
//       return res.status(400).json({ 
//         message: "Specialization is required for doctors" 
//       });
//     }


//     if (updates.firstName || updates.lastName) {
//       const firstName = updates.firstName || currentUser.firstName || '';
//       const lastName = updates.lastName || currentUser.lastName || '';
//       updates.name = `${firstName} ${lastName}`.trim();
//     }


//     if (updates.password) {
//       updates.password = await bcrypt.hash(updates.password, 10);
//     }


//     if (updates.photo && !updates.profileImage) {
//       updates.profileImage = updates.photo;
//     }


//     if (newRole === "doctor" && updates.department) {
//       updates.department = updates.department;
//     }

//     const user = await UserData.findByIdAndUpdate(userId, updates, { 
//       new: true,
//       runValidators: true 
//     }).select("-password");

    
//     if (newRole === "doctor" && (updates.department || currentUser.department)) {
//       await exports.syncDoctorProfile(userId, {
//         role: "doctor",
//         department:newDepartment,
//       });
//     }

//     res.json({ message: "User updated successfully", user });
//   } catch (err) {
//     console.error("Update user error:", err);
//     res.status(500).json({ 
//       message: err.message || "Error updating user",
//       error: process.env.NODE_ENV === 'development' ? err.stack : undefined
//     });
//   }
// };

// exports.deleteUser = async (req, res) => {
//   try {
//     const deleted = await UserData.findByIdAndDelete(req.params.id);

//     if (!deleted) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ message: "User deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


// exports.syncDoctorProfile = async (userId, userData) => {
//   try {
//     if (userData.role && userData.role.toLowerCase() === "doctor") {
//       const { department } = userData;

//       if (!department) {
//         console.warn("No specialization provided for doctor profile sync");
//         return null;
//       }

//       let doctor = await Doctor.findOne({ userId });

//       if (!doctor) {

//         doctor = new Doctor({
//           userId,
//           // speciality: specialization,
//           department: specialization, 
//         });
//         await doctor.save();
//         console.log("Doctor profile created:", { userId, department });
//       } else {
  
//         // doctor.speciality = specialization;
//         doctor.department = department; 
//         doctor.updatedAt = Date.now();
//         await doctor.save();
        
//       }

//       return doctor;
//     }
//   } catch (error) {
//     console.error("Error syncing doctor profile:", error);
//     throw error;
//   }
// };

const UserData = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateEmployeeId, generateRFID } = require('../utils/generateIds');
const { sendVerificationEmail, sendPasswordResetEmail, sendNewPasswordEmail } = require('../utils/emailServices');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserData.find().select("-password -emailVerificationToken -emailVerificationExpire -passwordResetToken -passwordResetExpire");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await UserData.findById(req.params.id)
      .select("-password -emailVerificationToken -emailVerificationExpire -passwordResetToken -passwordResetExpire");

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength if provided
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters long" 
        });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
          message: "Password must contain uppercase, lowercase, number, and special character" 
        });
      }
    }

    // Validate doctor-specific requirements
    if (role.toLowerCase() === "doctor" && !department) {
      return res.status(400).json({ 
        message: "Department is required for doctors" 
      });
    }

    const existingEmail = await UserData.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

    // Hash password if provided, otherwise use default
    const hashedPassword = password 
      ? await bcrypt.hash(password, 12)
      : await bcrypt.hash("defaultPassword123", 12);

    // AUTO-GENERATE employee ID and RFID
    const employeeId = await generateEmployeeId(role || "STAFF", UserData);
    const rfidTag = generateRFID(employeeId);

    const user = await UserData.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role.toLowerCase(),
      department: department,
      specialization, 
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
      emailVerified: false,
      emailVerificationToken: crypto.createHash('sha256').update(emailVerificationToken).digest('hex'),
      emailVerificationExpire,
    });

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, emailVerificationToken, user._id);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
    }

    if (role.toLowerCase() === "doctor" && department) {
      await exports.syncDoctorProfile(user._id, {
        role: "doctor",
        department,
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email to activate your account.",
      user: { 
        ...user.toObject(), 
        password: undefined, 
        emailVerificationToken: undefined,
        emailVerificationExpire: undefined,
        _id: user._id 
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ 
      message: err.message || "Error creating user",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.generateNewPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@$!%*?&';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  for (let i = password.length; i < 12; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({ message: "Token and user ID are required" });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserData.findOne({
      _id: userId,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired verification token" 
      });
    }

    // Generate new password
    const newPassword = exports.generateNewPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.emailVerified = true;
    user.password = hashedPassword;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send new password via email
    try {
      await sendNewPasswordEmail(user.email, newPassword, user._id);
    } catch (emailErr) {
      console.error("Error sending password email:", emailErr);
    }

    res.json({ 
      success: true,
      message: "Email verified successfully. A new password has been sent to your email." 
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    const userId = req.params.id;

    // Prevent updating sensitive fields
    delete updates.employeeId;
    delete updates.rfidTag;
    delete updates.rfid;
    delete updates.emailVerified;
    delete updates.emailVerificationToken;
    delete updates.emailVerificationExpire;
    delete updates.passwordResetToken;
    delete updates.passwordResetExpire;

    const currentUser = await UserData.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle email change with re-verification
    if (updates.email && updates.email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingEmail = await UserData.findOne({ email: updates.email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

      updates.email = updates.email.toLowerCase();
      updates.emailVerified = false;
      updates.emailVerificationToken = crypto.createHash('sha256').update(emailVerificationToken).digest('hex');
      updates.emailVerificationExpire = emailVerificationExpire;

      // Send verification email
      try {
        await sendVerificationEmail(updates.email, emailVerificationToken, userId);
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    const newRole = updates.role?.toLowerCase() || currentUser.role;
    const newDepartment = updates.department || currentUser.department;

    if (newRole === "doctor" && !newDepartment && !updates.department) {
      return res.status(400).json({ 
        message: "Department is required for doctors" 
      });
    }

    if (updates.firstName || updates.lastName) {
      const firstName = updates.firstName || currentUser.firstName || '';
      const lastName = updates.lastName || currentUser.lastName || '';
      updates.name = `${firstName} ${lastName}`.trim();
    }

    // Hash new password if provided
    if (updates.password) {
      if (updates.password.length < 8) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters long" 
        });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(updates.password)) {
        return res.status(400).json({ 
          message: "Password must contain uppercase, lowercase, number, and special character" 
        });
      }
      updates.password = await bcrypt.hash(updates.password, 12);
    }

    if (updates.photo && !updates.profileImage) {
      updates.profileImage = updates.photo;
    }

    const user = await UserData.findByIdAndUpdate(userId, updates, { 
      new: true,
      runValidators: true 
    }).select("-password -emailVerificationToken -emailVerificationExpire -passwordResetToken -passwordResetExpire");

    if (newRole === "doctor" && (updates.department || currentUser.department)) {
      await exports.syncDoctorProfile(userId, {
        role: "doctor",
        department: newDepartment,
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

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserData.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ 
        message: "If email exists, password reset link has been sent" 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpire = Date.now() + 60 * 60 * 1000;

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpire = passwordResetExpire;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken, user._id);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Error sending reset email" });
    }

    res.json({ 
      success: true,
      message: "Password reset link sent to email" 
    });
  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, userId, newPassword } = req.body;

    if (!token || !userId || !newPassword) {
      return res.status(400).json({ message: "Token, user ID, and new password are required" });
    }

    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserData.findOne({
      _id: userId,
      passwordResetToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword) || newPassword.length < 8) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character" 
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    res.json({ 
      success: true,
      message: "Password reset successfully" 
    });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: err.message });
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

exports.syncDoctorProfile = async (userId, userData) => {
  try {
    if (userData.role && userData.role.toLowerCase() === "doctor") {
      const { department } = userData;

      if (!department) {
        console.warn("No department provided for doctor profile sync");
        return null;
      }

      let doctor = await Doctor.findOne({ userId });

      if (!doctor) {
        doctor = new Doctor({
          userId,
          department,
        });
        await doctor.save();
        console.log("Doctor profile created:", { userId, department });
      } else {
        doctor.department = department;
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