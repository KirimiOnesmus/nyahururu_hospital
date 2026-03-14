const mongoose = require("mongoose");
const  connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongo DB Connected");
    } catch (error) {
        // console.error(err.message);
        console.log("Failed to connect mongo DB");
        process.exit(1);
        
    }
};
module.exports= connectDB;