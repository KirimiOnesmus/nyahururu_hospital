"use strict";

const GENDER_VALUES = ["Male", "Female", "Other"];
// Kept as strings including the empty string, mirroring the Mongoose
// schema which used enum: [..., ""] as a "not-yet-set" sentinel.
const BLOOD_GROUP_VALUES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", ""];
const DONOR_STATUSES = ["registered", "confirmed", "completed", "cancelled", "deferred"];
const REGISTRATION_STATUSES = ["pending", "approved", "rejected"];

const DONOR_ID_MAX_ATTEMPTS = 5;

/**
 * Random 6-digit donor ID in the form DON-NCRH-{6digits}-{year}.
 * Matches the format the Mongoose pre-save hook produced, so donor IDs
 * printed on past cards / emails stay consistent with new ones after
 * cutover. The random format is preserved (rather than switching to a
 * sequential Counter) because IDs are user-facing and a format change
 * would need a policy decision, not a migration decision.
 */
function generateDonorId() {
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `DON-NCRH-${randomNumber}-${year}`;
}

module.exports = (sequelize, DataTypes) => {
  const BloodDonor = sequelize.define(
    "BloodDonor",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      donorId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },

      fullName: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: { msg: "Full name is required" } },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: { msg: "Invalid email" },
        },
        set(value) {
          this.setDataValue("email", value ? value.trim().toLowerCase() : value);
        },
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: { notEmpty: { msg: "Phone number is required" } },
      },
      nationalId: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: { notEmpty: { msg: "National ID is required" } },
      },
      gender: {
        type: DataTypes.ENUM(...GENDER_VALUES),
        allowNull: false,
      },

      age: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
          min: { args: [16], msg: "Age must be at least 16" },
          max: { args: [70], msg: "Age must not exceed 70" },
        },
      },
      weight: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: { min: { args: [50], msg: "Weight must be at least 50 kg" } },
      },
      bloodGroup: {
        type: DataTypes.ENUM(...BLOOD_GROUP_VALUES),
        allowNull: false,
        defaultValue: "",
      },
      healthConditions: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      medications: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },

      donationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      // Free-form time string ("10:00 AM", "14:30"); the original Mongoose
      // field was `String`. Preserved to keep the current API contract.
      donationTime: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      consentDonate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
          mustBeTrue(value) {
            // Mirrors the Mongoose `required: true, default: false`
            // combination: the field is required, but "required" for a
            // consent checkbox really means "must be affirmatively true"
            // — reflected here as an explicit validator so an unchecked
            // form is rejected instead of silently accepted.
            if (value !== true) {
              throw new Error("Donation consent is required");
            }
          },
        },
      },
      consentTest: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
          mustBeTrue(value) {
            if (value !== true) throw new Error("Test consent is required");
          },
        },
      },
      consentTerms: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
          mustBeTrue(value) {
            if (value !== true) throw new Error("Terms consent is required");
          },
        },
      },

      status: {
        type: DataTypes.ENUM(...DONOR_STATUSES),
        allowNull: false,
        defaultValue: "registered",
      },
      registrationStatus: {
        type: DataTypes.ENUM(...REGISTRATION_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "blood_donors",
      indexes: [
        { unique: true, fields: ["donor_id"] },
        { unique: true, fields: ["national_id"] },
        { fields: ["email"] },
        { fields: ["donation_date"] },
        { fields: ["status"] },
      ],
      hooks: {
        beforeValidate: (donor) => {
          if (!donor.donorId) {
            donor.donorId = generateDonorId();
          }
        },
      },
    },
  );

  /**
   * Create a donor with a unique donorId, retrying on the (astronomically
   * unlikely at 900k namespace/year) collision. The original Mongoose
   * model did a pre-check-then-write inside a pre-save hook, which had a
   * classic TOCTOU race under concurrency. Retry-on-conflict is safer:
   * the DB's unique constraint is the source of truth, and we regenerate
   * only if the constraint actually fires.
   */
  BloodDonor.createWithUniqueId = async function createWithUniqueId(data, options = {}) {
    const { Sequelize } = sequelize;
    for (let attempt = 1; attempt <= DONOR_ID_MAX_ATTEMPTS; attempt += 1) {
      try {
        return await BloodDonor.create({ ...data, donorId: generateDonorId() }, options);
      } catch (err) {
        const isDuplicateDonorId =
          err instanceof Sequelize.UniqueConstraintError &&
          (err.fields?.donor_id || err.fields?.donorId);
        if (isDuplicateDonorId && attempt < DONOR_ID_MAX_ATTEMPTS) {
          continue; // regenerate and retry
        }
        throw err;
      }
    }
    // Unreachable — the loop above either returns or throws.
    throw new Error("BloodDonor.createWithUniqueId: exhausted retries");
  };

  BloodDonor.GENDERS = GENDER_VALUES;
  BloodDonor.BLOOD_GROUPS = BLOOD_GROUP_VALUES;
  BloodDonor.STATUSES = DONOR_STATUSES;
  BloodDonor.REGISTRATION_STATUSES = REGISTRATION_STATUSES;

  return BloodDonor;
};
