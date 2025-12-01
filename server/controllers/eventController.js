const Event = require("../models/eventsModel");

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) { 
    res.status(500).json({ message: error.message });
  }
};
exports.getUpcomingEvents = async (req, res) => {
  try {
    const currentDate = new Date();
    const events = await Event.find({ 
      date: { $gte: currentDate } // Get events with date >= today
    }).sort({ date: 1 }); // Sort by date ascending (earliest first)
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, venue } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });
const imageUrl = req.file ? `/uploads/events/${req.file.filename}` : null;
    const newEvent = await Event.create({
      title,
      description,
      date,
      location:venue,
      imageUrl,
    });
    res.status(201).json({ message: "Event created successfully", newEvent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, venue } = req.body;
    const imageUrl = req.file ? `/uploads/events/${req.file.filename}` : undefined;

    const updateData = {
      title,
      description,
      date,
      location: venue, 
    };
    if (imageUrl) updateData.imageUrl = imageUrl;

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updatedEvent)
      return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event updated successfully", updatedEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent)
      return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
