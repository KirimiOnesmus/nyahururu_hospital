
"use strict";

require("dotenv").config();

const REQUIRED_ENV = [
  "PORT",
  "MONGO_URI",
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
const mongoSanitize = require("express-mongo-sanitize");
const compression   = require("compression");
const cookieParser  = require("cookie-parser");
const rateLimit     = require("express-rate-limit");
const path          = require("path");


const connectDB          = require("./config/db");
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

// Careers & Procurement
const jobRoutes              = require("./routes/jobRoutes");
const careerApplicationRoutes = require("./routes/careerApplicationRoutes");
const tenderRoutes           = require("./routes/tenderRoutes");
const bidRoutes              = require("./routes/bidRoutes");

// Research & Payments
const researchRoutes         = require("./routes/researchRoutes");
const paymentRoutes          = require("./routes/paymentRoute");
const certificateRoutes      = require("./routes/certificates");


connectDB();


const app = express();


if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}


// M4: previously `contentSecurityPolicy: production ? undefined : false`
// meant production silently fell back to Helmet's generic default policy
// — never verified against this app's actual origins/CDNs. Now explicit,
// built from the same CORS_ORIGINS allowlist already configured below,
// plus the CDNs this app is known to load from client-side.
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

const sanitizeRequest = (req, res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.query) {
    const cleaned = mongoSanitize.sanitize(req.query);
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, cleaned);
  }
  next();
};



app.use(express.json({ limit: "10kb" }));        
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(compression());                            
app.use(sanitizeRequest);


app.use(hpp({ whitelist: ["fields", "sort", "page", "limit", "filter"] }));


// H6: uploaded files were previously served from one fully public
// `/uploads` static mount — including research papers, bid documents,
// reports and progress files, with randomized filenames as the *only*
// protection (security-by-obscurity, not access control: any leaked/
// logged/referrer-forwarded URL exposed the file to the internet
// permanently). Split into:
//   - genuinely public CMS assets (gallery/news/events/services/notices/
//     tenders — the hospital's own public-facing images and procurement
//     documents), served as before, and
//   - everything else, which now requires a valid staff or researcher
//     session before the file is streamed at all.
// This is a floor, not the full fix — per-file ownership checks (e.g. "is
// this researcher allowed to see *this* paper") still belong in a proper
// GET /api/research/:id/file-style controller route; this closes the
// "public to the entire internet" gap in the meantime.
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
  // Accept either a staff session or a researcher session — both
  // extractToken() paths already exist in middleware/auth.js.
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

// Careers & Procurement 
app.use("/api/applications",  careerApplicationRoutes);
app.use("/api/tenders",       tenderRoutes);
app.use("/api/bids",          bidRoutes);

//Research & Payments 
app.use("/api/research",      researchRoutes);
app.use("/api/payments",   paymentRoutes);
app.use("/api/certificates", certificateRoutes);


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

  // Mongoose: duplicate key 
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Mongoose: validation errors 
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  // Mongoose: invalid ObjectId 
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field '${err.path}': ${err.value}`,
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