"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { Event } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");

exports.getAllEvents = async (req, res) => {
  try {
    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const { rows: events, count: total } = await Event.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    if (!requestedPaging) return res.json(events);
    return res.json({ data: events, meta: buildMeta(page, limit, total, events.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    // $gte → Op.gte; ascending order preserved so callers can render a
    // "next event" ribbon by taking the first result.
    const events = await Event.findAll({
      where: { date: { [Op.gte]: new Date() } },
      order: [["date", "ASC"]],
    });
    res.json(events);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, venue } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const imageUrl = req.file ? `/uploads/events/${req.file.filename}` : null;
    // Frontend sends `venue`, model stores `location` — same field, kept
    // the rename here rather than in the model to preserve the API
    // contract for the client.
    const newEvent = await Event.create({
      title,
      description,
      date,
      location: venue,
      imageUrl,
    });
    res.status(201).json({ message: "Event created successfully", newEvent });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, venue } = req.body;
    const imageUrl = req.file ? `/uploads/events/${req.file.filename}` : undefined;

    const updateData = { title, description, date, location: venue };
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Sequelize has no `findByIdAndUpdate` — the equivalent is find → set
    // → save, which lets model-level validators + hooks fire the same
    // way they did under Mongoose's { runValidators: true }.
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.set(updateData);
    await event.save();

    res.json({ message: "Event updated successfully", updatedEvent: event });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.destroy();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
