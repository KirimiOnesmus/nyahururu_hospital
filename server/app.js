const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json());



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
const jobRoutes = require('./routes/jobRoutes');
const serviceRoutes = require('./routes/servicesRoutes');
const profileRoutes = require('./routes/profileRoutes');
const inventoryRoutes = require('./routes/invetoryRoutes');
const vehicleRoutes = require("./routes/vehicleRoutes");
const galleryRoutes = require('./routes/galleryRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const tenderRoutes = require('./routes/tenderRoutes');
const bidRoutes = require('./routes/bidRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ambulanceRoutes = require('./routes/ambulanceBookingRoutes');
const anonymousAppointmentRoutes = require('./routes/anonymousRoute');
const bloodDonorRoutes = require('./routes/bloodDonorRoutes');
const UrgentRequest = require('./routes/UrgentRequest');
const researcherRoutes = require('./routes/researcherRoute');
const reviewerRoutes = require("./routes/reviewerRoutes");


app.get('/', (req, res) => res.send("NCRH API running"));
app.use("/uploads", express.static("uploads"));



// Authentication & User Management
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Hospital/Medical Services
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ambulance-bookings', ambulanceRoutes);
app.use('/api/anonymous', anonymousAppointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/blood-donation', bloodDonorRoutes);

// Admin/Operations
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/urgent-request', UrgentRequest);

// Content Management
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use('/api/jobs', jobRoutes);
app.use('/api/applications', careerApplicationRoutes);


app.use('/api/tenders', tenderRoutes);
app.use('/api/bids', bidRoutes);


app.use('/api/reports', reportRoutes);


app.use('/api/research', researchRoutes);

app.use('/api/researchers', researcherRoutes);

app.use('/api/reviewers', reviewerRoutes);


app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      message: `Upload error: ${err.message}`,
      field: err.field
    });
  }


  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error'
  });
});

module.exports = app;