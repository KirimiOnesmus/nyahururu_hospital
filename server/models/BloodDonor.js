const mongoose = require("mongoose");

const bloodDonorSchema = new mongoose.Schema(
  {
    // Auto-generated Donor ID
    donorId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Personal Information
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    nationalId: {
      type: String,
      required: [true, "National ID is required"],
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },

    // Health Information
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [16, "Age must be at least 16"],
      max: [70, "Age must not exceed 70"],
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [50, "Weight must be at least 50 kg"],
    },
    bloodGroup: {
      type: String,
      enum: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", ""],
      default: "",
    },
    healthConditions: {
      type: String,
      default: "",
      trim: true,
    },
    medications: {
      type: String,
      default: "",
      trim: true,
    },

    // Donation Schedule
    donationDate: {
      type: Date,
      required: [true, "Donation date is required"],
    },
    donationTime: {
      type: String,
      required: [true, "Donation time is required"],
    },

    // Consents
    consentDonate: {
      type: Boolean,
      required: [true, "Donation consent is required"],
      default: false,
    },
    consentTest: {
      type: Boolean,
      required: [true, "Test consent is required"],
      default: false,
    },
    consentTerms: {
      type: Boolean,
      required: [true, "Terms consent is required"],
      default: false,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["registered", "confirmed", "completed", "cancelled", "deferred"],
      default: "registered",
    },
    registrationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to generate donorId before saving
bloodDonorSchema.pre("save", async function (next) {
  // Only generate ID if it doesn't exist
  if (!this.donorId) {
    try {
      const year = new Date().getFullYear();
      const randomNumber = Math.floor(100000 + Math.random() * 900000); 
      let donorId = `DON-NCRH-${randomNumber}-${year}`;

      // Check if this ID already exists
      let existingDonor = await mongoose.model("BloodDonor").findOne({
        donorId,
      });

      // Regenerate if duplicate
      while (existingDonor) {
        const newRandomNumber = Math.floor(
          100000 + Math.random() * 900000
        );
        donorId = `DON-NCRH-${newRandomNumber}-${year}`;
        existingDonor = await mongoose.model("BloodDonor").findOne({
          donorId,
        });
      }

      this.donorId = donorId;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

bloodDonorSchema.index({ email: 1, nationalId: 1 });
bloodDonorSchema.index({ donationDate: 1 });
bloodDonorSchema.index({ status: 1 });

module.exports = mongoose.model("BloodDonor", bloodDonorSchema);