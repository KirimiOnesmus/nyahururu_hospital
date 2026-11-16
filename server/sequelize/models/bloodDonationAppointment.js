"use strict";

module.exports = (sequelize, DataTypes) => {
  const BloodDonationAppointment = sequelize.define("BloodDonationAppointment", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    donorId: { type: DataTypes.STRING(50), allowNull: false, field: "donor_id" },
    donationDate: { type: DataTypes.DATEONLY, allowNull: false, field: "donation_date" },
    donationTime: { type: DataTypes.STRING(20), allowNull: false, field: "donation_time" },
    status: { type: DataTypes.ENUM("registered", "confirmed", "completed", "cancelled", "deferred"), allowNull: false, defaultValue: "registered" },
    registrationStatus: { type: DataTypes.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending", field: "registration_status" },
  }, {
    tableName: "blood_donation_appointments",
    indexes: [{ fields: ["donor_id"] }, { fields: ["donation_date", "status", "registration_status"] }],
  });
  BloodDonationAppointment.associate = (models) => {
    BloodDonationAppointment.belongsTo(models.BloodDonor, { foreignKey: "donorId", targetKey: "donorId", as: "donor", constraints: false });
  };
  return BloodDonationAppointment;
};
