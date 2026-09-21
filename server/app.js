"use strict";

require("dotenv").config();

const REQUIRED_ENV = [
  "PORT",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "NODE_ENV",
];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `[FATAL] Missing required environment variables: ${missingEnv.join(", ")}`
  );
  process.exit(1);
}


const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const hpp        = require("hpp");
const compression   = require("compression");
const cookieParser  = require("cookie-parser");
const rateLimit     = require("express-rate-limit");
const path          = require("path");


const { AppError, globalErrorHandler } = require("./utils/appError");
const logger             = require("./utils/logger"); 


// Auth & Identity
const authRoutes             = require("./routes/authRoutes");
const userRoutes             = require("./routes/userRoutes");
const profileRoutes          = require("./routes/profileRoutes");
const researcherAuthRoutes   = require("./routes/researcherRoutes");
const reviewerRoutes         = require("./routes/reviewerRoutes");

// Medical Services
const appointmentRoutes      = require("./routes/appointmentRoutes");
const ambulanceRoutes        = require("./routes/ambulanceBookingRoutes");
const anonymousAppointmentRoutes = require("./routes/anonymousRoute");
const doctorRoutes           = require("./routes/doctorsRoutes");
const serviceRoutes          = require("./routes/servicesRoutes");
const bloodDonorRoutes       = require("./routes/bloodDonorRoutes");

// Operations & Admin
const inventoryRoutes        = require("./routes/invetoryRoutes");
const vehicleRoutes          = require("./routes/vehicleRoutes");
const fraudRoutes            = require("./routes/fraudRoutes");
const UrgentRequest          = require("./routes/UrgentRequest");
const reportRoutes           = require("./routes/reportRoutes");

// Content Management
const eventRoutes            = require("./routes/eventRoutes");
const newsRoutes             = require("./routes/newsRoutes");
const galleryRoutes          = require("./routes/galleryRoutes");
const noticeRoutes           = require("./routes/noticeRoutes");
const feedbackRoutes         = require("./routes/feedbackRoutes");

// Procurement
const tenderRoutes           = require("./routes/tenderRoutes");
const bidRoutes              = require("./routes/bidRoutes");

// System
const auditLogRoutes         = require("./routes/auditLogRoutes");

// Research & Payments
const researchRoutes         = require("./routes/researchRoutes");
const paymentRoutes          = require("./routes/paymentRoute");
const certificateRoutes      = require("./routes/certificates");


const app = express();



app.set("trust proxy", 1);//ngrok testing

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}


const buildProductionCSP = () => {
  const selfOrigins = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  return {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", ...selfOrigins],
      connectSrc: ["'self'", ...selfOrigins],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  };
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? buildProductionCSP() : false,
  })
);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
   
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
    },
    credentials: true,                     
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(
  rateLimit({
    windowMs:       15 * 60 * 1000,
    max:            200,
    standardHeaders: true,
    legacyHeaders:  false,
    handler: (req, res) => {
      logger.warn({ ip: req.ip, path: req.path }, "Rate limit exceeded");
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    },
  })
);


const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      15,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, "Auth rate limit exceeded");
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again in an hour.",
    });
  },
});

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(compression());


app.use(hpp({ whitelist: ["fields", "sort", "page", "limit", "filter"] }));


const PUBLIC_UPLOAD_FOLDERS = ["public", "gallery", "news", "events", "services", "notices", "tenders"];

PUBLIC_UPLOAD_FOLDERS.forEach((folder) => {
  app.use(
    `/uploads/${folder}`,
    express.static(path.resolve(__dirname, "uploads", folder), {
      maxAge: "7d",
      etag: true,
      dotfiles: "deny",
    })
  );
});

const { verifyToken: requireStaffToken, protectResearcher: requireResearcherToken } = require("./middleware/auth");
const requireUploadAuth = (req, res, next) => {

  requireStaffToken(req, res, (staffErr) => {
    if (!staffErr) return next();
    requireResearcherToken(req, res, next);
  });
};

app.use(
  "/uploads",
  requireUploadAuth,
  express.static(path.resolve(__dirname, "uploads"), {
    maxAge: "7d",
    etag: true,
    dotfiles: "deny",
  })
);

app.use(
  "/public",
  express.static(path.resolve(__dirname, "public"), {
    maxAge:   "7d",
    etag:     true,
    dotfiles: "deny",
  })
)



app.get("/health", (req, res) =>
  res.status(200).json({
    success: true,
    message: "NCRH API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
);



// Auth & Identity 
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/profile",     profileRoutes);
app.use("/api/researchers", authLimiter, researcherAuthRoutes);
app.use("/api/reviewers",   reviewerRoutes);

// Medical Services
app.use("/api/appointments",  appointmentRoutes);
app.use("/api/ambulance-bookings", ambulanceRoutes);
app.use("/api/anonymous",     anonymousAppointmentRoutes);
app.use("/api/doctors",       doctorRoutes);
app.use("/api/services",      serviceRoutes);
app.use("/api/blood-donation", bloodDonorRoutes);

// Operations & Admin 
app.use("/api/inventory",     inventoryRoutes);
app.use("/api/vehicles",      vehicleRoutes);
app.use("/api/fraud",         fraudRoutes);
app.use("/api/urgent-request", UrgentRequest);
app.use("/api/reports",       reportRoutes);

// Content Management 
app.use("/api/events",        eventRoutes);
app.use("/api/news",          newsRoutes);
app.use("/api/gallery",       galleryRoutes);
app.use("/api/notices",       noticeRoutes);
app.use("/api/feedback",      feedbackRoutes);

// Procurement
// (Careers/job listings and applications are now hosted on the county
// website; this API no longer exposes /api/jobs or /api/applications.)
app.use("/api/tenders",       tenderRoutes);
app.use("/api/bids",          bidRoutes);

// System
app.use("/api/audit-logs",    auditLogRoutes);

//Research & Payments 
app.use("/api/research",      researchRoutes);
app.use("/api/payments",   paymentRoutes);
app.use("/api/certificates", certificateRoutes);

//ngrok
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "NCRH API", timestamp: new Date().toISOString() });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());



app.all("*splat", (req, res, next) => {
  next(
    new AppError(
      `Route '${req.method} ${req.originalUrl}' does not exist on this server.`,
      404
    )
  );
});


app.use((err, req, res, next) => {
  // Multer upload errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      field:   err.field || null,
    });
  }

  // CORS policy errors 
  if (err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }



  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }


  const statusCode =
    typeof err.statusCode === "number" ? err.statusCode : 500;

  if (statusCode >= 500) {
    logger.error(
      { err, method: req.method, path: req.originalUrl, ip: req.ip },
      "Internal server error"
    );
  } else {
    logger.warn(
      { message: err.message, method: req.method, path: req.originalUrl },
      "Client error"
    );
  }


  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      success:    false,
      status:     err.status || "error",
      message:    err.message,
      stack:      err.stack,
    });
  }

  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
});

module.exports = app;