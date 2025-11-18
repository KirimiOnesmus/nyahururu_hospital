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
    const { name, description } = req.body;
    if (!name)
      return res.status(400).json({ message: "Service name is required" });
    const existing = await Service.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Service already exists" });

    const imageUrl = req.file ? `/uploads/services/${req.file.filename}` : null;
    const newService = new Service({ name, description, imageUrl });
    await newService.save();
    res.status(201).json({ message: "Service Add", newService });
    
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { name, description } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (name) service.name = name;
    if (description) service.description = description;

    if (req.file) {
      service.imageUrl = `/uploads/services/${req.file.filename}`;
    }
    await service.save();
    res.json({ message: "Service updated", service });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
