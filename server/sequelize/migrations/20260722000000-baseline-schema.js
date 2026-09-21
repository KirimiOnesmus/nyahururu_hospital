"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    await queryInterface.createTable("counters", {
      key: { type: Sequelize.STRING(100), primaryKey: true },
      seq: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("token_blacklist", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      jti: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("users", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      email_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      email_verification_token: { type: Sequelize.STRING(255), allowNull: true },
      email_verification_expire: { type: Sequelize.DATE, allowNull: true },
      password_reset_token: { type: Sequelize.STRING(255), allowNull: true },
      password_reset_expire: { type: Sequelize.DATE, allowNull: true },
      role: { type: Sequelize.ENUM("superadmin", "admin", "doctor", "staff", "it", "nurse", "pharmacist", "communication", "research"), allowNull: false, defaultValue: "staff" },
      department: { type: Sequelize.STRING(100) },
      position: { type: Sequelize.STRING(100) },
      phone: { type: Sequelize.STRING(30) },
      blood_group: { type: Sequelize.STRING(10) },
      expiry_date: { type: Sequelize.DATE },
      signature_text: { type: Sequelize.STRING(255) },
      date_of_birth: { type: Sequelize.DATEONLY },
      join_date: { type: Sequelize.DATEONLY },
      photo: { type: Sequelize.STRING(500) },
      terms: { type: Sequelize.STRING(255) },
      signature: { type: Sequelize.STRING(500) },
      employee_id: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      rfid_tag: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      failed_login_attempts: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      lock_until: { type: Sequelize.DATE, allowNull: true },
      must_change_password: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("profiles", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(30) },
      address: { type: Sequelize.STRING(255) },
      image_url: { type: Sequelize.STRING(500), allowNull: true, defaultValue: null },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("researchers", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(30), allowNull: true, defaultValue: "" },
      password: { type: Sequelize.STRING(255), allowNull: true },
      role: { type: Sequelize.ENUM("researcher", "reviewer", "research_committee", "co_investigator"), allowNull: false, defaultValue: "researcher" },
      status: { type: Sequelize.ENUM("active", "invited", "inactive", "suspended"), allowNull: false, defaultValue: "active" },
      email_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      email_verification_token: { type: Sequelize.STRING(255) },
      email_verification_expire: { type: Sequelize.DATE },
      password_reset_token: { type: Sequelize.STRING(255) },
      password_reset_expire: { type: Sequelize.DATE },
      invitation_token: { type: Sequelize.STRING(255) },
      invitation_expire: { type: Sequelize.DATE },
      invited_by_admin_id: { type: Sequelize.STRING(50) },
      invited_by_admin_name: { type: Sequelize.STRING(150) },
      invited_at: { type: Sequelize.DATE },
      invitation_accepted_at: { type: Sequelize.DATE },
      title: { type: Sequelize.STRING(50), defaultValue: "" },
      institution: { type: Sequelize.STRING(255), defaultValue: "" },
      department: { type: Sequelize.STRING(150), defaultValue: "" },
      discipline: { type: Sequelize.STRING(150), defaultValue: "" },
      qualification: { type: Sequelize.STRING(150), defaultValue: "" },
      bio: { type: Sequelize.STRING(1000), defaultValue: "" },
      location: { type: Sequelize.STRING(150), defaultValue: "" },
      social_links: { type: Sequelize.JSON, allowNull: false },
      profile_image: { type: Sequelize.STRING(500) },
      profile_image_key: { type: Sequelize.STRING(255) },
      specialisations: { type: Sequelize.JSON, allowNull: false },
      review_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      acceptance_rate: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      notifications: { type: Sequelize.JSON, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      deactivated_at: { type: Sequelize.DATE },
      last_login: { type: Sequelize.DATE },
      is_committee: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      committee_since: { type: Sequelize.DATE },
      promoted_from_reviewer: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("doctors", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, unique: true },
      speciality: { type: Sequelize.STRING(150) },
      department: { type: Sequelize.STRING(150) },
      bio: { type: Sequelize.STRING(1000) },
      education: { type: Sequelize.STRING(500) },
      availability: { type: Sequelize.JSON, allowNull: false },
      is_available_now: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      rating: { type: Sequelize.DECIMAL(2,1), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("services", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      division: { type: Sequelize.ENUM("Outpatient", "Inpatient", "Specialist Clinics"), allowNull: false },
      category: { type: Sequelize.ENUM("General Medicine", "Maternal and Child Health", "Emergency Services", "Obstetrics and Gynecology", "Dentistry", "Ophthalmology", "ENT", "Surgery", "Orthopedics", "Radiology", "Laboratory", "Pharmacy", "Physiotherapy", "Mental Health", "Dermatology", "Emergency", "Renal Dialysis", "High Risk Ante-natal Care", "Medical Outpatient Clinic", "Pediatric Outpatient Clinic", "Gynecology Outpatient Clinic", "Diabetes Outpatient Clinic", "Surgical Outpatient Clinic", "Orthopedic Surgery Clinic", "Others"), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      head_of_department: { type: Sequelize.STRING(150) },
      contact_info: { type: Sequelize.STRING(255) },
      service_hours: { type: Sequelize.STRING(150) },
      location: { type: Sequelize.STRING(255) },
      tariff_info: { type: Sequelize.TEXT },
      nhif_covered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      image_url: { type: Sequelize.STRING(500) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("vehicles", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      plate: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      type: { type: Sequelize.ENUM("Ambulance", "Service Van", "Delivery Truck", "Staff Transport"), allowNull: false },
      status: { type: Sequelize.ENUM("Available", "In Use", "Maintenance"), allowNull: false, defaultValue: "Available" },
      driver: { type: Sequelize.STRING(150) },
      last_service: { type: Sequelize.DATE },
      next_service: { type: Sequelize.DATE },
      mileage: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      color: { type: Sequelize.STRING(50) },
      make: { type: Sequelize.STRING(80) },
      model: { type: Sequelize.STRING(80) },
      year: { type: Sequelize.INTEGER },
      registration_expiry: { type: Sequelize.DATE },
      insurance_expiry: { type: Sequelize.DATE },
      notes: { type: Sequelize.TEXT },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("news", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      author: { type: Sequelize.STRING(150) },
      image_url: { type: Sequelize.STRING(500) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("notices", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      category: { type: Sequelize.ENUM("General", "Emergency", "Event", "System Update", "Policy", "Maintenance", "Health Advisory"), allowNull: false },
      audience: { type: Sequelize.ENUM("All", "Staff", "Patients", "Doctors", "Nurses", "Public", "Specific Department"), allowNull: false },
      start_date: { type: Sequelize.DATE, allowNull: false },
      start_time: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "00:00" },
      end_date: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      end_time: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "23:59" },
      status: { type: Sequelize.ENUM("active", "scheduled", "expired", "hidden"), allowNull: false, defaultValue: "active" },
      visible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      send_notification: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      attachments: { type: Sequelize.JSON, allowNull: false },
      views: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("gallery_categories", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(500) },
      icon: { type: Sequelize.STRING(100) },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("gallery", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT },
      type: { type: Sequelize.ENUM("image", "video"), allowNull: false },
      category: { type: Sequelize.STRING(100), allowNull: false },
      file_url: { type: Sequelize.STRING(500), allowNull: false },
      thumbnail_url: { type: Sequelize.STRING(500) },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_size: { type: Sequelize.BIGINT.UNSIGNED },
      mime_type: { type: Sequelize.STRING(100) },
      tags: { type: Sequelize.JSON, allowNull: false },
      visible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      views: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      likes: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      uploaded_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      upload_date: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("events", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT },
      date: { type: Sequelize.DATE },
      location: { type: Sequelize.STRING(255) },
      image_url: { type: Sequelize.STRING(500) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("appointments", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      patient_name: { type: Sequelize.STRING(150), allowNull: false },
      patient_email: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: false },
      department: { type: Sequelize.STRING(100), allowNull: false },
      service: { type: Sequelize.STRING(150), allowNull: false },
      appointment_date: { type: Sequelize.STRING(30), allowNull: false },
      time: { type: Sequelize.STRING(20), allowNull: false },
      status: { type: Sequelize.ENUM("Pending", "Confirmed", "Cancelled", "Completed"), allowNull: false, defaultValue: "Pending" },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("anonymous_appointments", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      case_code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      case_type: { type: Sequelize.ENUM("GBV", "Mental Health"), allowNull: false },
      contact_method: { type: Sequelize.ENUM("phone", "in_person"), allowNull: false },
      contact_value: { type: Sequelize.STRING(50), allowNull: true, defaultValue: null },
      safe_to_contact: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      preferred_date: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      preferred_time: { type: Sequelize.STRING(20), allowNull: true, defaultValue: null },
      asap: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      reason: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM("pending", "approved", "in_progress", "completed", "cancelled"), allowNull: false, defaultValue: "pending" },
      created_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("blood_donors", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      donor_id: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: false },
      national_id: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      gender: { type: Sequelize.ENUM("Male", "Female", "Other"), allowNull: false },
      age: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      weight: { type: Sequelize.FLOAT, allowNull: false },
      blood_group: { type: Sequelize.ENUM("O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", ""), allowNull: false, defaultValue: "" },
      health_conditions: { type: Sequelize.TEXT, allowNull: false },
      medications: { type: Sequelize.TEXT, allowNull: false },
      donation_date: { type: Sequelize.DATEONLY, allowNull: false },
      donation_time: { type: Sequelize.STRING(20), allowNull: false },
      consent_donate: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      consent_test: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      consent_terms: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: Sequelize.ENUM("registered", "confirmed", "completed", "cancelled", "deferred"), allowNull: false, defaultValue: "registered" },
      registration_status: { type: Sequelize.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending" },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("urgent_blood_requests", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      blood_groups: { type: Sequelize.JSON, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      contact_number: { type: Sequelize.STRING(30), allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("ambulance_bookings", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      patient_name: { type: Sequelize.STRING(150), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      current_location: { type: Sequelize.STRING(500), allowNull: false },
      destination_hospital: { type: Sequelize.STRING(255), allowNull: false, defaultValue: "Not specified" },
      emergency_level: { type: Sequelize.ENUM("standard", "urgent", "critical"), allowNull: false, defaultValue: "standard" },
      medical_condition: { type: Sequelize.TEXT, allowNull: false },
      additional_notes: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM("Pending", "Assigned", "In Transit", "Arrived", "Completed", "Cancelled", "Waiting"), allowNull: false, defaultValue: "Pending" },
      vehicle_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      booking_date: { type: Sequelize.DATE, allowNull: false },
      assigned_at: { type: Sequelize.DATE },
      completed_at: { type: Sequelize.DATE },
      cancelled_at: { type: Sequelize.DATE },
      cancel_reason: { type: Sequelize.STRING(500) },
      estimated_arrival: { type: Sequelize.DATE },
      actual_arrival: { type: Sequelize.DATE },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("inventories", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      category: { type: Sequelize.ENUM("Medicine", "Equipment", "Consumable", "Other"), allowNull: false, defaultValue: "Other" },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      unit: { type: Sequelize.STRING(30), allowNull: false },
      price: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      supplier: { type: Sequelize.STRING(200) },
      batch: { type: Sequelize.STRING(100) },
      expiry: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      min_threshold: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
      description: { type: Sequelize.TEXT },
      sku: { type: Sequelize.STRING(80), allowNull: true, unique: true },
      last_restocked: { type: Sequelize.DATE, allowNull: false },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("fraud_reports", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      issue: { type: Sequelize.STRING(500), allowNull: false },
      date_of_incident: { type: Sequelize.STRING(100) },
      location: { type: Sequelize.STRING(255) },
      details: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM("pending", "reviewed", "dismissed"), allowNull: false, defaultValue: "pending" },
      investigation_notes: { type: Sequelize.TEXT },
      reviewed_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      reviewed_by_name: { type: Sequelize.STRING(150) },
      reviewed_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("feedback", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      subject: { type: Sequelize.STRING(255), allowNull: true },
      type: { type: Sequelize.STRING(50), allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "pending" },
      response: { type: Sequelize.TEXT },
      responded_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      responded_by_name: { type: Sequelize.STRING(150) },
      responded_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("reports", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(300), allowNull: false },
      category: { type: Sequelize.ENUM("operations", "financial", "inventory", "logistics", "hr", "procurement"), allowNull: false },
      type: { type: Sequelize.ENUM("pdf", "excel", "word", "zip", "image"), allowNull: false },
      period: { type: Sequelize.ENUM("Monthly", "Quarterly", "Yearly", "Custom"), allowNull: false },
      custom_start_date: { type: Sequelize.DATE },
      custom_end_date: { type: Sequelize.DATE },
      description: { type: Sequelize.TEXT },
      file_url: { type: Sequelize.STRING(500), allowNull: false },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_size: { type: Sequelize.BIGINT.UNSIGNED },
      status: { type: Sequelize.ENUM("draft", "published", "archived"), allowNull: false, defaultValue: "draft" },
      uploaded_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      views: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      downloads: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      tags: { type: Sequelize.JSON, allowNull: false },
      comments: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("audit_logs", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      user_name: { type: Sequelize.STRING(120), allowNull: true },
      user_email: { type: Sequelize.STRING(255), allowNull: true },
      user_role: { type: Sequelize.STRING(50), allowNull: true },
      action: { type: Sequelize.STRING(50), allowNull: false },
      resource: { type: Sequelize.STRING(100), allowNull: true },
      resource_id: { type: Sequelize.STRING(100), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      severity: { type: Sequelize.ENUM("info", "low", "medium", "high", "critical"), allowNull: false, defaultValue: "info" },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      session_id: { type: Sequelize.STRING(255), allowNull: true },
      changes: { type: Sequelize.JSON, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("tenders", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      tender_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(300), allowNull: false },
      category: { type: Sequelize.ENUM("Medical Equipment", "Drugs & Pharmaceuticals", "ICT Services", "Construction", "Maintenance", "Consultancy", "Laboratory Supplies", "Food Services", "Other"), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      scope_of_work: { type: Sequelize.TEXT, allowNull: false },
      eligibility_criteria: { type: Sequelize.TEXT },
      required_documents: { type: Sequelize.TEXT },
      deliverables: { type: Sequelize.TEXT },
      budget_min: { type: Sequelize.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
      budget_max: { type: Sequelize.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
      budget_range: { type: Sequelize.STRING(100), defaultValue: "" },
      publication_date: { type: Sequelize.DATE, allowNull: false },
      submission_deadline: { type: Sequelize.DATE, allowNull: false },
      evaluation_date: { type: Sequelize.DATE },
      visibility: { type: Sequelize.ENUM("public", "internal", "restricted"), allowNull: false, defaultValue: "public" },
      status: { type: Sequelize.ENUM("draft", "active", "closed", "under_evaluation", "awarded", "cancelled"), allowNull: false, defaultValue: "draft" },
      attachments: { type: Sequelize.JSON, allowNull: false },
      activity_log: { type: Sequelize.JSON, allowNull: false },
      bids_received: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      awarded_to: { type: Sequelize.STRING(255) },
      awarded_bid_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, defaultValue: null },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      created_by_name: { type: Sequelize.STRING(150), allowNull: false },
      updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("bids", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      tender_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      tender_number: { type: Sequelize.STRING(50), allowNull: false },
      vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      vendor_name: { type: Sequelize.STRING(200), allowNull: false },
      vendor_email: { type: Sequelize.STRING(255), allowNull: false },
      vendor_phone: { type: Sequelize.STRING(30) },
      vendor_company: { type: Sequelize.STRING(200) },
      vendor_address: { type: Sequelize.JSON, allowNull: false },
      bid_amount: { type: Sequelize.DECIMAL(16,2), allowNull: false },
      formatted_bid_amount: { type: Sequelize.STRING(50) },
      currency: { type: Sequelize.ENUM("USD", "EUR", "GBP", "KES", "UGX"), allowNull: false, defaultValue: "USD" },
      payment_terms: { type: Sequelize.STRING(500) },
      tax_rate: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      technical_proposal: { type: Sequelize.TEXT, allowNull: false },
      financial_proposal: { type: Sequelize.TEXT },
      executive_summary: { type: Sequelize.TEXT },
      methodology: { type: Sequelize.TEXT },
      key_personnel: { type: Sequelize.JSON, allowNull: false },
      milestones: { type: Sequelize.JSON, allowNull: false },
      compliance: { type: Sequelize.JSON, allowNull: false },
      documents: { type: Sequelize.JSON, allowNull: false },
      delivery_timeline: { type: Sequelize.STRING(500) },
      start_date: { type: Sequelize.DATE },
      completion_date: { type: Sequelize.DATE },
      warranty_terms: { type: Sequelize.TEXT },
      warranty_period: { type: Sequelize.INTEGER.UNSIGNED },
      maintenance_support: { type: Sequelize.TEXT },
      status: { type: Sequelize.ENUM("draft", "submitted", "under_review", "shortlisted", "rejected", "awarded", "withdrawn"), allowNull: false, defaultValue: "submitted" },
      rejection_reason: { type: Sequelize.TEXT },
      score_technical: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      score_financial: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      score_compliance: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      score_experience: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      score_overall: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      evaluation_criteria: { type: Sequelize.JSON, allowNull: false },
      evaluation_notes: { type: Sequelize.TEXT },
      strengths: { type: Sequelize.JSON, allowNull: false },
      weaknesses: { type: Sequelize.JSON, allowNull: false },
      recommendations: { type: Sequelize.TEXT },
      evaluated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      evaluated_by_name: { type: Sequelize.STRING(150) },
      evaluated_at: { type: Sequelize.DATE },
      evaluators: { type: Sequelize.JSON, allowNull: false },
      submission_date: { type: Sequelize.DATE, allowNull: false },
      last_modified_date: { type: Sequelize.DATE },
      withdrawn_date: { type: Sequelize.DATE },
      comments: { type: Sequelize.JSON, allowNull: false },
      clarifications: { type: Sequelize.JSON, allowNull: false },
      cost_breakdown: { type: Sequelize.JSON, allowNull: false },
      ranking: { type: Sequelize.INTEGER.UNSIGNED },
      is_lowest_bid: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      price_competitiveness: { type: Sequelize.ENUM("highly_competitive", "competitive", "average", "above_average", "expensive"), allowNull: true },
      vendor_past_performance: { type: Sequelize.JSON, allowNull: false },
      risk_level: { type: Sequelize.ENUM("low", "medium", "high", "critical"), allowNull: false, defaultValue: "medium" },
      identified_risks: { type: Sequelize.JSON, allowNull: false },
      is_confidential: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      tags: { type: Sequelize.JSON, allowNull: false },
      flags: { type: Sequelize.JSON, allowNull: false },
      activity_log: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("researches", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      researcher_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      research_id: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      submission_type: { type: Sequelize.ENUM("initial_proposal", "amendment", "continuing_review", "study_closure"), allowNull: false, defaultValue: "initial_proposal" },
      parent_research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      title: { type: Sequelize.STRING(500), allowNull: false },
      discipline: { type: Sequelize.STRING(150), allowNull: false },
      abstract: { type: Sequelize.TEXT },
      background: { type: Sequelize.TEXT },
      objectives: { type: Sequelize.TEXT },
      methodology: { type: Sequelize.TEXT },
      expected_outcome: { type: Sequelize.TEXT },
      timeline: { type: Sequelize.TEXT },
      team_members: { type: Sequelize.TEXT },
      references: { type: Sequelize.TEXT },
      protocol_version_number: { type: Sequelize.STRING(50), allowNull: true },
      protocol_version_date: { type: Sequelize.DATEONLY, allowNull: true },
      seru_number: { type: Sequelize.STRING(50), allowNull: true },
      centre: { type: Sequelize.STRING(150), allowNull: false, defaultValue: "NCRH" },
      research_programme: { type: Sequelize.STRING(200), allowNull: true },
      key_performance_area: { type: Sequelize.STRING(200), allowNull: true },
      strategy: { type: Sequelize.STRING(200), allowNull: true },
      sdg: { type: Sequelize.STRING(200), allowNull: true },
      study_implementation_counties: { type: Sequelize.JSON, allowNull: false },
      study_sites: { type: Sequelize.JSON, allowNull: false },
      co_investigators: { type: Sequelize.JSON, allowNull: false },
      funding_source: { type: Sequelize.STRING(300), allowNull: true },
      total_funds_needed: { type: Sequelize.DECIMAL(14,2), allowNull: true },
      expected_duration_months: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      hypotheses: { type: Sequelize.TEXT },
      justification: { type: Sequelize.TEXT },
      literature_review_summary: { type: Sequelize.TEXT },
      inclusion_criteria: { type: Sequelize.TEXT },
      exclusion_criteria: { type: Sequelize.TEXT },
      sample_size_description: { type: Sequelize.TEXT },
      sampling_procedure: { type: Sequelize.TEXT },
      data_management_plan: { type: Sequelize.TEXT },
      ethics_information: { type: Sequelize.TEXT },
      ethics_human_subjects: { type: Sequelize.TEXT },
      ethics_animal_subjects: { type: Sequelize.TEXT },
      budget_summary: { type: Sequelize.TEXT },
      budget_justification: { type: Sequelize.TEXT },
      expected_application_of_results: { type: Sequelize.TEXT },
      informed_consent_docs: { type: Sequelize.JSON, allowNull: false },
      study_tools_docs: { type: Sequelize.JSON, allowNull: false },
      investigator_certificates: { type: Sequelize.JSON, allowNull: false },
      supporting_documents: { type: Sequelize.JSON, allowNull: false },
      proposal_file: { type: Sequelize.STRING(500) },
      proposal_file_key: { type: Sequelize.STRING(255) },
      csc_review_date: { type: Sequelize.DATEONLY, allowNull: true },
      csc_approval_date: { type: Sequelize.DATEONLY, allowNull: true },
      csc_comments: { type: Sequelize.TEXT },
      csc_evidence_file: { type: Sequelize.STRING(500), allowNull: true },
      csc_evidence_file_key: { type: Sequelize.STRING(500), allowNull: true },
      csc_contact_name: { type: Sequelize.STRING(200), allowNull: true },
      csc_contact_email: { type: Sequelize.STRING(200), allowNull: true },
      decision_letter_number: { type: Sequelize.STRING(50), allowNull: true },
      decision_letter_file: { type: Sequelize.STRING(500), allowNull: true },
      decision_letter_file_key: { type: Sequelize.STRING(500), allowNull: true },
      decision_letter_issued_at: { type: Sequelize.DATE, allowNull: true },
      completeness_checked_at: { type: Sequelize.DATE, allowNull: true },
      completeness_checked_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      completeness_issues: { type: Sequelize.JSON, allowNull: true },
      review_type: { type: Sequelize.ENUM("full_committee", "expedited", "secretariat"), allowNull: false, defaultValue: "full_committee" },
      status: { type: Sequelize.ENUM("draft", "awaiting_payment", "submitted", "returned_for_correction", "under_review", "revision_requested", "pending_committee_review", "pending_officer_review", "approved", "rejected", "expired", "closed", "suspended"), allowNull: false, defaultValue: "draft" },
      assigned_reviewer_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      assigned_at: { type: Sequelize.DATE },
      approved_at: { type: Sequelize.DATE },
      approval_valid_until: { type: Sequelize.DATEONLY, allowNull: true },
      proposal_review: { type: Sequelize.JSON, allowNull: false },
      review_comment: { type: Sequelize.TEXT },
      reviewed_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      reviewed_at: { type: Sequelize.DATE },
      resubmission_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      revision_history: { type: Sequelize.JSON, allowNull: false },
      priority: { type: Sequelize.ENUM("high", "medium", "normal"), allowNull: false, defaultValue: "normal" },
      review_deadline: { type: Sequelize.DATE },
      committee_round: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      committee_reviewed_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      committee_reviewed_at: { type: Sequelize.DATE },
      committee_comment: { type: Sequelize.TEXT },
      aggregate_score: { type: Sequelize.DECIMAL(4,2), allowNull: true },
      review_decision: { type: Sequelize.STRING(50) },
      amendment_number: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      amendment_details: { type: Sequelize.TEXT },
      is_substantial_amendment: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: null },
      is_investigational_product: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      study_design: { type: Sequelize.ENUM("observational", "interventional", "mixed_methods", "other"), allowNull: true, defaultValue: null },
      closure_reason: { type: Sequelize.ENUM("completed", "premature_discontinuation", "not_started", "transferred"), allowNull: true },
      closure_report: { type: Sequelize.JSON, allowNull: true },
      closeout_report_file: { type: Sequelize.STRING(500), allowNull: true },
      closeout_report_file_key: { type: Sequelize.STRING(255), allowNull: true },
      publication_link: { type: Sequelize.STRING(500), allowNull: true },
      continuing_review_data: { type: Sequelize.JSON, allowNull: true },
      continuing_review_number: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      progress_data: { type: Sequelize.JSON, allowNull: false },
      progress_files: { type: Sequelize.JSON, allowNull: false },
      nacosti_permit: { type: Sequelize.STRING(100) },
      nacosti_submitted_at: { type: Sequelize.DATE },
      submission_payment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      clearance_certificate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      completion_certificate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      reactivated_at: { type: Sequelize.DATE },
      reactivated_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      reactivation_reason: { type: Sequelize.STRING(500) },
      is_deleted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      deleted_at: { type: Sequelize.DATE },
      deleted_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("payments", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      researcher_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      type: { type: Sequelize.ENUM("proposal_submission"), allowNull: false },
      research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      amount: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "KES" },
      phone: { type: Sequelize.STRING(30), allowNull: false },
      buyer_email: { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
      merchant_request_id: { type: Sequelize.STRING(100) },
      checkout_request_id: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      mpesa_receipt_number: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      transaction_date: { type: Sequelize.STRING(30) },
      status: { type: Sequelize.ENUM("pending", "completed", "failed", "cancelled", "refunded"), allowNull: false, defaultValue: "pending" },
      seru_number: { type: Sequelize.STRING(50), allowNull: true },
      result_code: { type: Sequelize.STRING(20) },
      result_desc: { type: Sequelize.STRING(500) },
      refunded_at: { type: Sequelize.DATE },
      refund_reason: { type: Sequelize.STRING(500) },
      refund_code: { type: Sequelize.STRING(50) },
      refund_amount: { type: Sequelize.DECIMAL(12,2) },
      download_token: { type: Sequelize.STRING(255) },
      download_token_expire: { type: Sequelize.DATE },
      downloaded_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("reviews", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      reviewer_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      round: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      decision: { type: Sequelize.ENUM("approved", "revision", "rejected", "suspended", "noted"), allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: false },
      criteria: { type: Sequelize.JSON, allowNull: false },
      reviewer_role: { type: Sequelize.ENUM("reviewer", "committee"), allowNull: false },
      is_latest: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      submitted_at: { type: Sequelize.DATE, allowNull: false },
      committee_vote_key: { type: Sequelize.STRING(120), allowNull: true },
      stage: { type: Sequelize.STRING(50), allowNull: false },
      attachments: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("certificates", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      type: { type: Sequelize.ENUM("proposal_approval", "ethics_clearance"), allowNull: false },
      certificate_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      researcher_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      research_title: { type: Sequelize.STRING(500), allowNull: false },
      researcher_name: { type: Sequelize.STRING(150), allowNull: false },
      institution: { type: Sequelize.STRING(255) },
      study_sites: { type: Sequelize.JSON, allowNull: false },
      research_code: { type: Sequelize.STRING(100) },
      committee_approval_statement: { type: Sequelize.TEXT },
      valid_from: { type: Sequelize.DATE },
      valid_until: { type: Sequelize.DATE },
      publication_date: { type: Sequelize.DATE },
      journal_name: { type: Sequelize.STRING(255) },
      completion_statement: { type: Sequelize.TEXT },
      verification_token: { type: Sequelize.STRING(64), allowNull: false },
      qr_code_data_url: { type: Sequelize.TEXT },
      pdf_file: { type: Sequelize.STRING(500) },
      pdf_file_key: { type: Sequelize.STRING(255) },
      signature_area_label: { type: Sequelize.STRING(255), allowNull: false, defaultValue: "Director, Research & Ethics Committee" },
      seal_image_url: { type: Sequelize.STRING(500), allowNull: true, defaultValue: null },
      status: { type: Sequelize.ENUM("active", "revoked"), allowNull: false, defaultValue: "active" },
      revoked_at: { type: Sequelize.DATE },
      revoked_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      revoked_reason: { type: Sequelize.STRING(500) },
      supersedes_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      issued_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("research_reviewers", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      reviewer_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      assigned_at: { type: Sequelize.DATE, allowNull: false },
      assigned_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      review_status: { type: Sequelize.ENUM("pending", "submitted"), allowNull: false, defaultValue: "pending" },
      review_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      first_reminder_sent_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("co_investigator_assignments", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      researcher_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      invited_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      role_on_study: { type: Sequelize.STRING(150), allowNull: true },
      can_edit: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      accepted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("protocol_deviations", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      researcher_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      deviation_type: { type: Sequelize.ENUM("protocol_deviation", "protocol_violation", "safety_event"), allowNull: false, defaultValue: "protocol_deviation" },
      severity: { type: Sequelize.ENUM("minor", "major", "critical"), allowNull: false, defaultValue: "minor" },
      description: { type: Sequelize.TEXT, allowNull: false },
      date_of_deviation: { type: Sequelize.DATEONLY, allowNull: false },
      corrective_action: { type: Sequelize.TEXT, allowNull: true },
      participants_affected: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 },
      at_risk_participant_list: { type: Sequelize.TEXT, allowNull: true },
      is_urgent_safety: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      linked_amendment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      status: { type: Sequelize.ENUM("draft", "submitted", "acknowledged", "resolved"), allowNull: false, defaultValue: "draft" },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      deadline: { type: Sequelize.DATE, allowNull: true },
      supporting_documents: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.createTable("research_decision_reports", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      research_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      round: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      reviewer_comments: { type: Sequelize.JSON, allowNull: false },
      committee_comment: { type: Sequelize.TEXT, allowNull: true },
      officer_attachment: { type: Sequelize.STRING(500), allowNull: true },
      final_decision: { type: Sequelize.ENUM("approved", "revision", "rejected", "suspended"), allowNull: true },
      compiled_by_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      decision_letter_id: { type: Sequelize.STRING(100), allowNull: true },
      released_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });

    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    // Foreign keys (added after all tables exist to avoid ordering/circular issues)
    await queryInterface.addConstraint("ambulance_bookings", {
      fields: ["vehicle_id"], type: "foreign key", name: "fk_ambulance_bookings_vehicle_id",
      references: { table: "vehicles", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("ambulance_bookings", {
      fields: ["user_id"], type: "foreign key", name: "fk_ambulance_bookings_user_id",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("audit_logs", {
      fields: ["user_id"], type: "foreign key", name: "fk_audit_logs_user_id",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("bids", {
      fields: ["tender_id"], type: "foreign key", name: "fk_bids_tender_id",
      references: { table: "tenders", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("bids", {
      fields: ["vendor_id"], type: "foreign key", name: "fk_bids_vendor_id",
      references: { table: "users", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("bids", {
      fields: ["evaluated_by"], type: "foreign key", name: "fk_bids_evaluated_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("certificates", {
      fields: ["research_id"], type: "foreign key", name: "fk_certificates_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("certificates", {
      fields: ["researcher_id"], type: "foreign key", name: "fk_certificates_researcher_id",
      references: { table: "researchers", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("certificates", {
      fields: ["revoked_by_id"], type: "foreign key", name: "fk_certificates_revoked_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("certificates", {
      fields: ["supersedes_id"], type: "foreign key", name: "fk_certificates_supersedes_id",
      references: { table: "certificates", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("certificates", {
      fields: ["issued_by_id"], type: "foreign key", name: "fk_certificates_issued_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("co_investigator_assignments", {
      fields: ["research_id"], type: "foreign key", name: "fk_co_investigator_assignments_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "NO ACTION", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("co_investigator_assignments", {
      fields: ["researcher_id"], type: "foreign key", name: "fk_co_investigator_assignments_researcher_id",
      references: { table: "researchers", field: "id" },
      onDelete: "NO ACTION", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("co_investigator_assignments", {
      fields: ["invited_by_id"], type: "foreign key", name: "fk_co_investigator_assignments_invited_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("doctors", {
      fields: ["user_id"], type: "foreign key", name: "fk_doctors_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("feedback", {
      fields: ["responded_by"], type: "foreign key", name: "fk_feedback_responded_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("fraud_reports", {
      fields: ["reviewed_by"], type: "foreign key", name: "fk_fraud_reports_reviewed_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("gallery", {
      fields: ["uploaded_by"], type: "foreign key", name: "fk_gallery_uploaded_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("gallery_categories", {
      fields: ["created_by"], type: "foreign key", name: "fk_gallery_categories_created_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("inventories", {
      fields: ["created_by"], type: "foreign key", name: "fk_inventories_created_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("inventories", {
      fields: ["updated_by"], type: "foreign key", name: "fk_inventories_updated_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("notices", {
      fields: ["created_by"], type: "foreign key", name: "fk_notices_created_by",
      references: { table: "users", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("notices", {
      fields: ["updated_by"], type: "foreign key", name: "fk_notices_updated_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("payments", {
      fields: ["researcher_id"], type: "foreign key", name: "fk_payments_researcher_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("payments", {
      fields: ["research_id"], type: "foreign key", name: "fk_payments_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("profiles", {
      fields: ["user_id"], type: "foreign key", name: "fk_profiles_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("protocol_deviations", {
      fields: ["research_id"], type: "foreign key", name: "fk_protocol_deviations_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "NO ACTION", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("protocol_deviations", {
      fields: ["researcher_id"], type: "foreign key", name: "fk_protocol_deviations_researcher_id",
      references: { table: "researchers", field: "id" },
      onDelete: "NO ACTION", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("protocol_deviations", {
      fields: ["linked_amendment_id"], type: "foreign key", name: "fk_protocol_deviations_linked_amendment_id",
      references: { table: "researches", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("reports", {
      fields: ["uploaded_by"], type: "foreign key", name: "fk_reports_uploaded_by",
      references: { table: "users", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["researcher_id"], type: "foreign key", name: "fk_researches_researcher_id",
      references: { table: "researchers", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["parent_research_id"], type: "foreign key", name: "fk_researches_parent_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["assigned_reviewer_id"], type: "foreign key", name: "fk_researches_assigned_reviewer_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["reviewed_by_id"], type: "foreign key", name: "fk_researches_reviewed_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["committee_reviewed_by_id"], type: "foreign key", name: "fk_researches_committee_reviewed_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["reactivated_by_id"], type: "foreign key", name: "fk_researches_reactivated_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["deleted_by_id"], type: "foreign key", name: "fk_researches_deleted_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("research_decision_reports", {
      fields: ["research_id"], type: "foreign key", name: "fk_research_decision_reports_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "CASCADE", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("research_decision_reports", {
      fields: ["compiled_by_id"], type: "foreign key", name: "fk_research_decision_reports_compiled_by_id",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("research_reviewers", {
      fields: ["research_id"], type: "foreign key", name: "fk_research_reviewers_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "CASCADE", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("research_reviewers", {
      fields: ["reviewer_id"], type: "foreign key", name: "fk_research_reviewers_reviewer_id",
      references: { table: "researchers", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("research_reviewers", {
      fields: ["assigned_by_id"], type: "foreign key", name: "fk_research_reviewers_assigned_by_id",
      references: { table: "researchers", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("research_reviewers", {
      fields: ["review_id"], type: "foreign key", name: "fk_research_reviewers_review_id",
      references: { table: "reviews", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("reviews", {
      fields: ["research_id"], type: "foreign key", name: "fk_reviews_research_id",
      references: { table: "researches", field: "id" },
      onDelete: "CASCADE", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("reviews", {
      fields: ["reviewer_id"], type: "foreign key", name: "fk_reviews_reviewer_id",
      references: { table: "researchers", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("tenders", {
      fields: ["created_by"], type: "foreign key", name: "fk_tenders_created_by",
      references: { table: "users", field: "id" },
      onDelete: "RESTRICT", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("tenders", {
      fields: ["updated_by"], type: "foreign key", name: "fk_tenders_updated_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("urgent_blood_requests", {
      fields: ["created_by"], type: "foreign key", name: "fk_urgent_blood_requests_created_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("vehicles", {
      fields: ["created_by"], type: "foreign key", name: "fk_vehicles_created_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("vehicles", {
      fields: ["updated_by"], type: "foreign key", name: "fk_vehicles_updated_by",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("tenders", {
      fields: ["awarded_bid_id"], type: "foreign key", name: "tenders_awarded_bid_id_fk",
      references: { table: "bids", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["submission_payment_id"], type: "foreign key", name: "researches_submission_payment_fk",
      references: { table: "payments", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["clearance_certificate_id"], type: "foreign key", name: "researches_clearance_certificate_fk",
      references: { table: "certificates", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("researches", {
      fields: ["completion_certificate_id"], type: "foreign key", name: "researches_completion_certificate_fk",
      references: { table: "certificates", field: "id" },
      onDelete: "SET NULL", onUpdate: "CASCADE",
    });

    // Secondary indexes
    await queryInterface.addIndex("users", ["role"], { name: "users_role_idx" });
    await queryInterface.addIndex("users", ["is_active"], { name: "users_is_active_idx" });
    await queryInterface.addIndex("token_blacklist", ["expires_at"], { name: "token_blacklist_expires_at_idx" });
    await queryInterface.addIndex("researchers", ["role", "status"], { name: "researchers_role_status_idx" });
    await queryInterface.addIndex("researchers", ["role", "institution"], { name: "researchers_role_institution_idx" });
    await queryInterface.addIndex("researchers", ["role", "is_committee"], { name: "researchers_role_committee_idx" });
    await queryInterface.addIndex("news", ["created_at"], { name: "news_created_at_idx" });
    await queryInterface.addIndex("notices", ["category"], { name: "notices_category_idx" });
    await queryInterface.addIndex("notices", ["audience"], { name: "notices_audience_idx" });
    await queryInterface.addIndex("notices", ["status"], { name: "notices_status_idx" });
    await queryInterface.addIndex("notices", ["start_date"], { name: "notices_start_date_idx" });
    await queryInterface.addIndex("gallery_categories", ["active"], { name: "gallery_categories_active_idx" });
    await queryInterface.addIndex("gallery_categories", ["order"], { name: "gallery_categories_order_idx" });
    await queryInterface.addIndex("gallery", ["category"], { name: "gallery_category_idx" });
    await queryInterface.addIndex("gallery", ["type"], { name: "gallery_type_idx" });
    await queryInterface.addIndex("gallery", ["visible"], { name: "gallery_visible_idx" });
    await queryInterface.addIndex("gallery", ["upload_date"], { name: "gallery_upload_date_idx" });
    await queryInterface.addIndex("events", ["date"], { name: "events_date_idx" });
    await queryInterface.addIndex("services", ["division"], { name: "services_division_idx" });
    await queryInterface.addIndex("services", ["category"], { name: "services_category_idx" });
    await queryInterface.addIndex("services", ["nhif_covered"], { name: "services_nhif_covered_idx" });
    await queryInterface.addIndex("doctors", ["speciality"], { name: "doctors_speciality_idx" });
    await queryInterface.addIndex("doctors", ["department"], { name: "doctors_department_idx" });
    await queryInterface.addIndex("doctors", ["is_available_now", "rating"], { name: "doctors_available_rating_idx" });
    await queryInterface.addIndex("vehicles", ["status"], { name: "vehicles_status_idx" });
    await queryInterface.addIndex("vehicles", ["type"], { name: "vehicles_type_idx" });
    await queryInterface.addIndex("appointments", ["patient_email"], { name: "appointments_patient_email_idx" });
    await queryInterface.addIndex("appointments", ["status"], { name: "appointments_status_idx" });
    await queryInterface.addIndex("appointments", ["appointment_date"], { name: "appointments_appointment_date_idx" });
    await queryInterface.addIndex("anonymous_appointments", ["case_type"], { name: "anonymous_appointments_case_type_idx" });
    await queryInterface.addIndex("anonymous_appointments", ["status"], { name: "anonymous_appointments_status_idx" });
    await queryInterface.addIndex("anonymous_appointments", ["created_at"], { name: "anonymous_appointments_created_at_idx" });
    await queryInterface.addIndex("blood_donors", ["email"], { name: "blood_donors_email_idx" });
    await queryInterface.addIndex("blood_donors", ["donation_date"], { name: "blood_donors_donation_date_idx" });
    await queryInterface.addIndex("blood_donors", ["status"], { name: "blood_donors_status_idx" });
    await queryInterface.addIndex("urgent_blood_requests", ["is_active"], { name: "urgent_blood_requests_is_active_idx" });
    await queryInterface.addIndex("urgent_blood_requests", ["created_at"], { name: "urgent_blood_requests_created_at_idx" });
    await queryInterface.addIndex("ambulance_bookings", ["status"], { name: "ambulance_bookings_status_idx" });
    await queryInterface.addIndex("ambulance_bookings", ["booking_date"], { name: "ambulance_bookings_booking_date_idx" });
    await queryInterface.addIndex("ambulance_bookings", ["emergency_level"], { name: "ambulance_bookings_emergency_level_idx" });
    await queryInterface.addIndex("inventories", ["expiry"], { name: "inventories_expiry_idx" });
    await queryInterface.addIndex("inventories", ["quantity"], { name: "inventories_quantity_idx" });
    await queryInterface.addIndex("inventories", ["category"], { name: "inventories_category_idx" });
    await queryInterface.addIndex("fraud_reports", ["status"], { name: "fraud_reports_status_idx" });
    await queryInterface.addIndex("fraud_reports", ["created_at"], { name: "fraud_reports_created_at_idx" });
    await queryInterface.addIndex("tenders", ["status", "category"], { name: "tenders_status_category_idx" });
    await queryInterface.addIndex("tenders", ["submission_deadline"], { name: "tenders_submission_deadline_idx" });
    await queryInterface.addIndex("tenders", ["created_by"], { name: "tenders_created_by_idx" });
    await queryInterface.addIndex("bids", ["tender_id", "status"], { name: "bids_tender_status_idx" });
    await queryInterface.addIndex("bids", ["vendor_id", "submission_date"], { name: "bids_vendor_submission_idx" });
    await queryInterface.addIndex("bids", ["status", "submission_date"], { name: "bids_status_submission_idx" });
    await queryInterface.addIndex("bids", ["score_overall"], { name: "bids_score_overall_idx" });
    await queryInterface.addIndex("bids", ["bid_amount"], { name: "bids_bid_amount_idx" });
    await queryInterface.addIndex("bids", ["ranking"], { name: "bids_ranking_idx" });
    await queryInterface.addIndex("bids", ["tender_number"], { name: "bids_tender_number_idx" });
    await queryInterface.addIndex("bids", ["tender_id", "score_overall", "bid_amount"], { name: "bids_tender_score_amount_idx" });
    await queryInterface.addIndex("bids", ["status", "evaluated_at"], { name: "bids_status_evaluated_at_idx" });
    await queryInterface.addIndex("feedback", ["status"], { name: "feedback_status_idx" });
    await queryInterface.addIndex("feedback", ["created_at"], { name: "feedback_created_at_idx" });
    await queryInterface.addIndex("feedback", ["email"], { name: "feedback_email_idx" });
    await queryInterface.addIndex("feedback", ["type"], { name: "feedback_type_idx" });
    await queryInterface.addIndex("reports", ["category", "status"], { name: "reports_category_status_idx" });
    await queryInterface.addIndex("reports", ["uploaded_by"], { name: "reports_uploaded_by_idx" });
    await queryInterface.addIndex("reports", ["type"], { name: "reports_type_idx" });
    await queryInterface.addIndex("reports", ["period"], { name: "reports_period_idx" });
    await queryInterface.addIndex("researches", ["researcher_id", "created_at"], { name: "researches_researcher_created_idx" });
    await queryInterface.addIndex("researches", ["assigned_reviewer_id", "status"], { name: "researches_reviewer_status_idx" });
    await queryInterface.addIndex("researches", ["title"], { name: "researches_title_idx" });
    await queryInterface.addIndex("researches", ["discipline"], { name: "researches_discipline_idx" });
    await queryInterface.addIndex("researches", ["submission_type", "status"], { name: "researches_submission_status" });
    await queryInterface.addIndex("researches", ["parent_research_id"], { name: "researches_parent" });
    await queryInterface.addIndex("researches", ["approval_valid_until"], { name: "researches_approval_expiry" });
    await queryInterface.addIndex("researches", ["seru_number"], { name: "researches_seru_number_idx" });
    await queryInterface.addIndex("payments", ["status", "type"], { name: "payments_status_type_idx" });
    await queryInterface.addIndex("payments", ["researcher_id", "type"], { name: "payments_researcher_type_idx" });
    await queryInterface.addIndex("payments", ["research_id", "status"], { name: "payments_research_status_idx" });
    await queryInterface.addIndex("payments", ["created_at"], { name: "payments_created_at_idx" });
    await queryInterface.addIndex("payments", ["phone"], { name: "payments_phone_idx" });
    await queryInterface.addIndex("payments", ["seru_number"], { name: "payments_seru_number_idx" });
    await queryInterface.addIndex("reviews", ["research_id", "stage", "is_latest"], { name: "reviews_research_stage_latest_idx" });
    await queryInterface.addIndex("reviews", ["reviewer_id", "submitted_at"], { name: "reviews_reviewer_submitted_idx" });
    await queryInterface.addIndex("reviews", ["research_id", "round"], { name: "reviews_research_round_idx" });
    await queryInterface.addIndex("reviews", ["research_id", "stage", "reviewer_role", "round"], { name: "reviews_research_stage_role_round_idx" });
    await queryInterface.addIndex("reviews", ["committee_vote_key"], { name: "reviews_committee_vote_unique", unique: true });
    await queryInterface.addIndex("certificates", ["type"], { name: "certificates_type_idx" });
    await queryInterface.addIndex("certificates", ["status"], { name: "certificates_status_idx" });
    await queryInterface.addIndex("certificates", ["research_id"], { name: "certificates_research_idx" });
    await queryInterface.addIndex("certificates", ["research_id", "type"], { name: "certificates_research_type_idx" });
    await queryInterface.addIndex("audit_logs", ["user_id"]);
    await queryInterface.addIndex("audit_logs", ["action"]);
    await queryInterface.addIndex("audit_logs", ["resource"]);
    await queryInterface.addIndex("audit_logs", ["severity"]);
    await queryInterface.addIndex("audit_logs", ["created_at"]);
    await queryInterface.addIndex("research_reviewers", ["research_id", "reviewer_id"], { name: "research_reviewers_unique", unique: true });
    await queryInterface.addIndex("research_reviewers", ["reviewer_id", "review_status"], { name: "research_reviewers_reviewer_status" });
    await queryInterface.addIndex("co_investigator_assignments", ["research_id", "researcher_id"], { name: "uq_coinv_research_researcher", unique: true });
    await queryInterface.addIndex("co_investigator_assignments", ["researcher_id"], { name: "idx_coinv_researcher" });
    await queryInterface.addIndex("protocol_deviations", ["research_id"], { name: "idx_deviation_research" });
    await queryInterface.addIndex("protocol_deviations", ["researcher_id"], { name: "idx_deviation_researcher" });
    await queryInterface.addIndex("protocol_deviations", ["status", "deadline"], { name: "idx_deviation_status_deadline" });
    await queryInterface.addIndex("research_decision_reports", ["research_id", "round"], { name: "research_decision_reports_research_round_unique", unique: true });
    await queryInterface.addIndex("research_decision_reports", ["released_at"], { name: "research_decision_reports_released_idx" });

    // FULLTEXT search indexes (raw SQL — MySQL InnoDB)
    await queryInterface.sequelize.query("ALTER TABLE researchers ADD FULLTEXT INDEX researchers_text_search (name, email, institution, discipline)");
    await queryInterface.sequelize.query("ALTER TABLE notices ADD FULLTEXT INDEX notices_text_search (title, content)");
    await queryInterface.sequelize.query("ALTER TABLE gallery ADD FULLTEXT INDEX gallery_text_search (title, description)");
    await queryInterface.sequelize.query("ALTER TABLE inventories ADD FULLTEXT INDEX inventories_text_search (name, supplier)");
    await queryInterface.sequelize.query("ALTER TABLE tenders ADD FULLTEXT INDEX tenders_text_search (title, description, tender_number)");
    await queryInterface.sequelize.query("ALTER TABLE reports ADD FULLTEXT INDEX reports_text_search (title, description)");
    await queryInterface.sequelize.query("ALTER TABLE researches ADD FULLTEXT INDEX research_text_search (title, abstract, discipline)");
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.dropTable("research_decision_reports");
    await queryInterface.dropTable("protocol_deviations");
    await queryInterface.dropTable("co_investigator_assignments");
    await queryInterface.dropTable("research_reviewers");
    await queryInterface.dropTable("certificates");
    await queryInterface.dropTable("reviews");
    await queryInterface.dropTable("payments");
    await queryInterface.dropTable("researches");
    await queryInterface.dropTable("bids");
    await queryInterface.dropTable("tenders");
    await queryInterface.dropTable("audit_logs");
    await queryInterface.dropTable("reports");
    await queryInterface.dropTable("feedback");
    await queryInterface.dropTable("fraud_reports");
    await queryInterface.dropTable("inventories");
    await queryInterface.dropTable("ambulance_bookings");
    await queryInterface.dropTable("urgent_blood_requests");
    await queryInterface.dropTable("blood_donors");
    await queryInterface.dropTable("anonymous_appointments");
    await queryInterface.dropTable("appointments");
    await queryInterface.dropTable("events");
    await queryInterface.dropTable("gallery");
    await queryInterface.dropTable("gallery_categories");
    await queryInterface.dropTable("notices");
    await queryInterface.dropTable("news");
    await queryInterface.dropTable("vehicles");
    await queryInterface.dropTable("services");
    await queryInterface.dropTable("doctors");
    await queryInterface.dropTable("researchers");
    await queryInterface.dropTable("profiles");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("token_blacklist");
    await queryInterface.dropTable("counters");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  },
};
