"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "services",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          name: { type: Sequelize.STRING(150), allowNull: false, unique: true },
          division: {
            type: Sequelize.ENUM("Outpatient", "Inpatient", "Specialist Clinics"),
            allowNull: false,
          },
          category: {
            type: Sequelize.ENUM(
              "General Medicine",
              "Maternal and Child Health",
              "Emergency Services",
              "Obstetrics and Gynecology",
              "Dentistry",
              "Ophthalmology",
              "ENT",
              "Surgery",
              "Orthopedics",
              "Radiology",
              "Laboratory",
              "Pharmacy",
              "Physiotherapy",
              "Mental Health",
              "Dermatology",
              "Emergency",
              "Renal Dialysis",
              "High Risk Ante-natal Care",
              "Medical Outpatient Clinic",
              "Pediatric Outpatient Clinic",
              "Gynecology Outpatient Clinic",
              "Diabetes Outpatient Clinic",
              "Surgical Outpatient Clinic",
              "Orthopedic Surgery Clinic",
              "Others",
            ),
            allowNull: false,
          },
          description: { type: Sequelize.TEXT, allowNull: false },
          head_of_department: { type: Sequelize.STRING(150), allowNull: true },
          contact_info: { type: Sequelize.STRING(255), allowNull: true },
          service_hours: { type: Sequelize.STRING(150), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          tariff_info: { type: Sequelize.TEXT, allowNull: true },
          nhif_covered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          image_url: { type: Sequelize.STRING(500), allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          transaction,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
        },
      );

      await queryInterface.addIndex("services", ["division"], {
        transaction,
        name: "services_division_idx",
      });
      await queryInterface.addIndex("services", ["category"], {
        transaction,
        name: "services_category_idx",
      });
      await queryInterface.addIndex("services", ["nhif_covered"], {
        transaction,
        name: "services_nhif_covered_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("services");
  },
};
