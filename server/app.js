const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json());


//routes

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fraudRoutes = require('./routes/fraudRoutes');
const researchRoutes = require('./routes/researchRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const eventRoutes = require('./routes/eventRoutes');
const newsRoutes = require('./routes/newsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const doctorRoutes = require('./routes/doctorsRoutes');
const careerApplicationRoutes = require('./routes/careerApplicationRoutes');
const careersRoutes = require('./routes/careerRoutes');
const serviceRoutes =require('./routes/servicesRoutes');
const profielRoutes = require('./routes/profileRoutes');


// Base route
app.get('/', (req,res)=>res.send("NCRH API running"));
app.use("/uploads", express.static("uploads"));
//Other routes

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/applications', careerApplicationRoutes);
app.use('/api/services',serviceRoutes);
app.use('/api/profile',profielRoutes);



module.exports= app;