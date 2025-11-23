const Service = require("../models/servicesModel");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

exports.createService = async (req, res) => {
  try {
    const { name, description, department } = req.body;
    if (!name)
      return res.status(400).json({ message: "Service name is required" });
    
    // Check for existing service
    const existing = await Service.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Service already exists" });

    const imageUrl = req.file ? `/uploads/services/${req.file.filename}` : null;
    const newService = new Service({ name, description, department, imageUrl });
    await newService.save();
    res.status(201).json({ message: "Service Add", newService });
    
  } catch (error) {
    console.error("Create service error:", error);
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({ message: "Service name already exists" });
    }
    res.status(500).json({ message: error.message || "Server Error", error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { name, description, department } = req.body;
    console.log("Update request body:", req.body);
    console.log("Department received:", department);
    
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    
    // Check if name is being changed and if it conflicts with another service
    if (name && name !== service.name) {
      const existing = await Service.findOne({ name });
      if (existing && existing._id.toString() !== service._id.toString()) {
        return res.status(400).json({ message: "Service name already exists" });
      }
      service.name = name;
    }
    
    // Update fields if provided
    if (description !== undefined && description !== null) {
      service.description = description;
    }
    
    // Always update department if it's provided (even if empty string)
    if (department !== undefined) {
      service.department = department || "";
    }

    // Update image if new file is uploaded
    if (req.file) {
      service.imageUrl = `/uploads/services/${req.file.filename}`;
    }
    
    await service.save();
    res.json({ message: "Service updated successfully", service });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ message: error.message || "Error updating service" });
  }
};
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
