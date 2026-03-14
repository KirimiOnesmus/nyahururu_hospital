const BloodDonor = require("../models/BloodDonor");
const emailService = require("../utils/emailServices");

exports.registerDonor = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      gender,
      age,
      weight,
      nationalId,
      bloodGroup,
      healthConditions,
      medications,
      donationDate,
      donationTime,
      consentDonate,
      consentTest,
      consentTerms,
    } = req.body;

    // Validate all consents
    if (!consentDonate || !consentTest || !consentTerms) {
      return res.status(400).json({
        success: false,
        message: "All consents must be accepted",
      });
    }

    const existingDonor = await BloodDonor.findOne({
      $or: [{ email }, { nationalId }],
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


    const donor = new BloodDonor({
      fullName,
      email,
      phone,
      gender,
      age: parseInt(age),
      weight: parseInt(weight),
      nationalId,
      bloodGroup: bloodGroup || "",
      healthConditions,
      medications,
      donationDate: new Date(donationDate),
      donationTime,
      consentDonate,
      consentTest,
      consentTerms
    });

    await donor.save();

    try {
      await emailService.sendDonorRegistrationEmail({
        fullName: donor.fullName,
        email: donor.email,
        donorId: donor.donorId,
        bloodGroup: donor.bloodGroup,
        donationDate: donor.donationDate,
        donationTime: donor.donationTime,
        phone: donor.phone
      });
      console.log('Registration confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
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
      message: error.message || "Registration failed",
    });
  }
};

// Get Donor by ID
exports.getDonor = async (req, res) => {
  try {
    const { donorId } = req.params;

    const donor = await BloodDonor.findOne({ donorId });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: donor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all donors (with pagination and filters)
exports.getAllDonors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, bloodGroup, gender } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (gender) filter.gender = gender;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donors = await BloodDonor.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await BloodDonor.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: donors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Donor
exports.updateDonor = async (req, res) => {
  try {
    const { donorId } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.donorId;
    delete updates.createdAt;
    delete updates.nationalId;
    delete updates.email;

    const donor = await BloodDonor.findOneAndUpdate(
      { donorId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Donor updated successfully",
      data: donor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Donor Status
exports.updateDonorStatus = async (req, res) => {
  try {
    const { donorId } = req.params;
    const { status, registrationStatus } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (registrationStatus) updateData.registrationStatus = registrationStatus;

    const donor = await BloodDonor.findOneAndUpdate(
      { donorId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: donor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Donor
exports.deleteDonor = async (req, res) => {
  try {
    const { donorId } = req.params;

    const donor = await BloodDonor.findOneAndDelete({ donorId });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get donors by blood group (for inventory management)
exports.getDonorsByBloodGroup = async (req, res) => {
  try {
    const { bloodGroup } = req.params;

    const donors = await BloodDonor.find({
      bloodGroup,
      status: "completed",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: donors,
      count: donors.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get upcoming donations
exports.getUpcomingDonations = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const donations = await BloodDonor.find({
      donationDate: { $gte: today },
      status: { $in: ["registered", "confirmed"] },
    })
      .sort({ donationDate: 1, donationTime: 1 });

    res.status(200).json({
      success: true,
      data: donations,
      count: donations.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get donation statistics
exports.getDonationStats = async (req, res) => {
  try {
    const stats = await BloodDonor.aggregate([
      {
        $group: {
          _id: "$bloodGroup",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const statusStats = await BloodDonor.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const genderStats = await BloodDonor.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        bloodGroupStats: stats,
        statusStats,
        genderStats,
        totalDonors: await BloodDonor.countDocuments(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to send confirmation email
// async function sendConfirmationEmail(donor) {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_FROM,
//       to: donor.email,
//       subject: "Blood Donation Registration Confirmation",
//       html: `
//         <h2>Welcome, ${donor.fullName}!</h2>
//         <p>Your blood donation registration has been received successfully.</p>
        
//         <h3>Registration Details:</h3>
//         <ul>
//           <li><strong>Donor ID:</strong> ${donor.donorId}</li>
//           <li><strong>Blood Group:</strong> ${donor.bloodGroup || "Not specified"}</li>
//           <li><strong>Scheduled Date:</strong> ${new Date(donor.donationDate).toLocaleDateString()}</li>
//           <li><strong>Scheduled Time:</strong> ${donor.donationTime}</li>
//         </ul>
        
//         <p>Our team will contact you soon to confirm your appointment.</p>
//         <p>Thank you for saving lives!</p>
        
//         <hr>
//         <p style="font-size: 12px; color: #666;">
//           For any inquiries, please contact us at support@blooddonation.org
//         </p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// }