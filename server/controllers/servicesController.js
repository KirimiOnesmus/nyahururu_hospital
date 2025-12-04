const Service = require("../models/servicesModel");
const fs = require("fs");
const path = require("path");

// Delete file helper function
const deleteImageFile = (imagePath) => {
  if (imagePath) {
    const fullPath = path.join(__dirname, "..", imagePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error(`Failed to delete image: ${err.message}`);
      }
    }
  }
};

exports.createService = async (req, res) => {
  try {

    const {
      name,
      division,
      category,
      description,
      headOfDepartment,
      contactInfo,
      serviceHours,
      location,
      tariffInfo,
      nhifCovered,
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Service name is required" });
    }

    if (!division) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Division is required" });
    }

    if (!category) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Category is required" });
    }

    if (!description || !description.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Description is required" });
    }

    // Validate division enum
    const validDivisions = ["Outpatient", "Inpatient", "Specialist Clinics"];
    // console.log('Checking division:', division, 'against:', validDivisions);
    
    if (!validDivisions.includes(division)) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({
        message: "Invalid division. Must be Outpatient, Inpatient, or Specialist Clinics",
      });
    }

    // Validate file
    if (!req.file) {
      return res.status(400).json({ message: "Service image is required" });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    // Check for duplicate name
    const existing = await Service.findOne({ name: name.trim() });
    if (existing) {
      deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Service with this name already exists" });
    }

    const imageUrl = `/uploads/services/${req.file.filename}`;
    const newService = new Service({
      name: name.trim(),
      division,
      category,
      description: description.trim(),
      headOfDepartment: headOfDepartment?.trim() || null,
      contactInfo: contactInfo?.trim() || null,
      serviceHours: serviceHours?.trim() || null,
      location: location?.trim() || null,
      tariffInfo: tariffInfo?.trim() || null,
      nhifCovered: nhifCovered === "true" || nhifCovered === true || false,
      imageUrl,
    });

    await newService.save();
    console.log('✅ Service created successfully:', newService._id);
    res.status(201).json({ message: "Service created successfully", service: newService });
  } catch (error) {
    if (req.file) {
      deleteImageFile(`/uploads/services/${req.file.filename}`);
    }

    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    
    const {
      name,
      division,
      category,
      description,
      headOfDepartment,
      contactInfo,
      serviceHours,
      location,
      tariffInfo,
      nhifCovered,
    } = req.body;

 


    const service = await Service.findById(req.params.id);
    if (!service) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(404).json({ message: "Service not found" });
    }

    // Validate required fields if provided
    if (name && !name.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      
      return res.status(400).json({ message: "Service name cannot be empty" });
    }

    if (description && !description.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    const validDivisions = ["Outpatient", "Inpatient", "Specialist Clinics"];
    console.log('Checking division:', division, 'against:', validDivisions);
    
    if (division && !validDivisions.includes(division)) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      
      return res.status(400).json({
        message: "Invalid division. Must be Outpatient, Inpatient, or Specialist Clinics",
      });
    }

    // Check for duplicate name (excluding current service)
    if (name && name.trim() !== service.name) {
      const existing = await Service.findOne({ name: name.trim() });
      if (existing) {
        if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
       
        return res.status(400).json({ message: "Service with this name already exists" });
      }
    }

    // Update fields
    if (name) service.name = name.trim();
    if (division) service.division = division;
    if (category) service.category = category;
    if (description) service.description = description.trim();
    if (headOfDepartment !== undefined)
      service.headOfDepartment = headOfDepartment?.trim() || null;
    if (contactInfo !== undefined)
      service.contactInfo = contactInfo?.trim() || null;
    if (serviceHours !== undefined)
      service.serviceHours = serviceHours?.trim() || null;
    if (location !== undefined)
      service.location = location?.trim() || null;
    if (tariffInfo !== undefined)
      service.tariffInfo = tariffInfo?.trim() || null;
    if (nhifCovered !== undefined)
      service.nhifCovered = nhifCovered === "true" || nhifCovered === true || false;

    // Handle image update
    if (req.file) {
      deleteImageFile(service.imageUrl);
      service.imageUrl = `/uploads/services/${req.file.filename}`;
    }

    await service.save();

    res.json({ message: "Service updated successfully", service });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
   
;
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Delete associated image file
    if (service.imageUrl) {
      deleteImageFile(service.imageUrl);
    }

    console.log('✅ Service deleted successfully:', service._id);
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error('Error deleting service:', error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};