"use strict";

const SERVICE_DIVISIONS = ["Outpatient", "Inpatient", "Specialist Clinics"];

const SERVICE_CATEGORIES = [
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
];

module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    "Service",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      division: {
        type: DataTypes.ENUM(...SERVICE_DIVISIONS),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(...SERVICE_CATEGORIES),
        allowNull: false,
      },
      description: { type: DataTypes.TEXT, allowNull: false },
      headOfDepartment: DataTypes.STRING(150),
      contactInfo: DataTypes.STRING(255),
      serviceHours: DataTypes.STRING(150),
      location: DataTypes.STRING(255),
      tariffInfo: DataTypes.TEXT,
      nhifCovered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      imageUrl: DataTypes.STRING(500),
    },
    {
      tableName: "services",
      indexes: [
        { unique: true, fields: ["name"] },
        { fields: ["division"] },
        { fields: ["category"] },
        { fields: ["nhif_covered"] },
      ],
    },
  );

  Service.DIVISIONS = SERVICE_DIVISIONS;
  Service.CATEGORIES = SERVICE_CATEGORIES;

  return Service;
};
