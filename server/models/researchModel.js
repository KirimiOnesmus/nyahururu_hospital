const mongoose = require("mongoose");
const researchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  abstract: String,
  category: String,
  fileUrl: { type: String, required: true },      
  thumbnailUrl: String,                          
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Research", researchSchema);
