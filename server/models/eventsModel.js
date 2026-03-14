const mongoose = require('mongoose');
const eventSchema =new mongoose.Schema({
    title:{type:String, required:true},
    description: String,
    date: Date,
    location: String,
    imageUrl: String,
    createdAt:{type:Date,default:Date.now}
})
module.exports = mongoose.model("Event" ,eventSchema);