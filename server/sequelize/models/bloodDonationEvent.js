"use strict";

module.exports = (sequelize, DataTypes) => {
  const BloodDonationEvent = sequelize.define("BloodDonationEvent", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    donorId: { type: DataTypes.STRING(50), allowNull: false, field: "donor_id" },
    appointmentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, unique: true, field: "appointment_id" },
    donationDate: { type: DataTypes.DATEONLY, allowNull: false, field: "donation_date" },
    status: { type: DataTypes.ENUM("completed", "deferred"), allowNull: false, defaultValue: "completed" },
    verificationStatus: { type: DataTypes.ENUM("verified", "legacy_unverified"), allowNull: false, defaultValue: "verified", field: "verification_status" },
    verifiedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: "verified_by" },
    verifiedAt: { type: DataTypes.DATE, allowNull: true, field: "verified_at" },
  }, { tableName: "blood_donation_events", indexes: [{ fields: ["donor_id", "donation_date"] }] });
  BloodDonationEvent.associate = (models) => {
    BloodDonationEvent.belongsTo(models.BloodDonor, { foreignKey: "donorId", targetKey: "donorId", as: "donor", constraints: false });
    BloodDonationEvent.belongsTo(models.BloodDonationAppointment, { foreignKey: "appointmentId", as: "appointment", constraints: false });
  };
  return BloodDonationEvent;
};
