// read-then-write without atomicity;
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: String, // e.g. "NCRH-CLR-2026"
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);