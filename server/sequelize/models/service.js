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
      cashMin: { type: DataTypes.DECIMAL(12, 2), validate: { min: 0 } },
      cashMax: { type: DataTypes.DECIMAL(12, 2), validate: { min: 0 } },
      shaMin: { type: DataTypes.DECIMAL(12, 2), validate: { min: 0 } },
      shaMax: { type: DataTypes.DECIMAL(12, 2), validate: { min: 0 } },
      itemsTotal: { type: DataTypes.INTEGER.UNSIGNED, validate: { min: 0 } },
      itemsShaCovered: { type: DataTypes.INTEGER.UNSIGNED, validate: { min: 0 } },
      shaCoverage: {
        type: DataTypes.ENUM("none", "partial", "full"),
        allowNull: true,
        defaultValue: null,
      },
      isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 100 },
      lastImportBatchId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: "services",
      hooks: {
        beforeValidate(service) {
          const total = service.itemsTotal;
          const covered = service.itemsShaCovered;
          if (total != null && covered != null) {
            service.shaCoverage = covered === 0 ? "none" : covered === total ? "full" : "partial";
            service.nhifCovered = covered > 0;
          } else if (service.changed("itemsTotal") || service.changed("itemsShaCovered")) {
            service.shaCoverage = null;
          }
        },
      },
      validate: {
        validPriceRanges() {
          for (const [minKey, maxKey] of [["cashMin", "cashMax"], ["shaMin", "shaMax"]]) {
            const min = this[minKey];
            const max = this[maxKey];
            if (min != null && max != null && Number(min) > Number(max)) {
              throw new Error(`${minKey} cannot be greater than ${maxKey}`);
            }
          }
          if (this.itemsTotal != null && this.itemsShaCovered != null && this.itemsShaCovered > this.itemsTotal) {
            throw new Error("SHA-covered items cannot exceed the total item count");
          }
        },
      },
      indexes: [
        { unique: true, fields: ["name"] },
        { fields: ["division"] },
        { fields: ["category"] },
        { fields: ["nhif_covered"] },
        { fields: ["is_published", "division", "category"] },
        { fields: ["sort_order"] },
      ],
    },
  );

  Service.DIVISIONS = SERVICE_DIVISIONS;
  Service.CATEGORIES = SERVICE_CATEGORIES;

  return Service;
};
