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
const { createRateLimitHandler, isSuperadminRequest, getCurrentRole } = require("./middleware/rateLimitHandler");


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
const systemRoutes           = require("./routes/systemRoutes");
const sessionRoutes          = require("./routes/sessionRoutes");

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
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.googleapis.com",
        "https://*.gstatic.com",
        ...selfOrigins,
      ],
      connectSrc: ["'self'", ...selfOrigins],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      frameSrc: ["https://www.google.com", "https://maps.google.com"],
      childSrc: ["https://www.google.com", "https://maps.google.com"],
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
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Session-Id"],
    exposedHeaders: ["X-Session-Logged-Out", "X-Client-Session-Id"],
  })
);

// Read auth cookies before throttling so a 429 can revoke the active session.
app.use(cookieParser());
// Body sizes are capped before rate-limit checks so the login limiter can
// identify the protected superadmin account even before a session exists.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(
  rateLimit({
    windowMs:       15 * 60 * 1000,
    max:            200,
    skip: async (req) => req.path === "/api/sessions/activity" || isSuperadminRequest(req),
    standardHeaders: true,
    legacyHeaders:  false,
    handler: createRateLimitHandler("Too many requests. Please try again later."),
  })
);


const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      15,
  skip: async (req) => /\/auth\/logout$|\/researchers\/logout$/.test(req.originalUrl.split("?", 1)[0]) || req.path === "/api/sessions/activity" || isSuperadminRequest(req),
  handler: createRateLimitHandler("Too many authentication attempts. Please try again in an hour."),
});

app.use(compression());


app.use(hpp({ whitelist: ["fields", "sort", "page", "limit", "filter"] }));


const { LOCAL_ROOT } = require("./config/storage");
const PUBLIC_UPLOAD_FOLDERS = ["public", "gallery", "news", "events", "services", "notices", "tenders"];

PUBLIC_UPLOAD_FOLDERS.forEach((folder) => {
  app.use(
    `/uploads/${folder}`,
    express.static(path.resolve(LOCAL_ROOT, folder), {
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
  express.static(LOCAL_ROOT, {
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
    timestamp: new Date().toISOString(),
  })
);

// Superadmins can inspect the system, create users, change maintenance mode,
// and manage their own session. All other state-changing operations are denied.
app.use("/api", async (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  try {
    const role = await getCurrentRole(req);
    if (role !== "superadmin") return next();
    const route = req.originalUrl.split("?", 1)[0].replace(/\/+$/, "");
    const allowed =
      (req.method === "POST" && ["/api/users", "/api/auth/logout", "/api/profile/change-password", "/api/sessions/activity"].includes(route)) ||
      (req.method === "PUT" && route === "/api/system/settings/maintenance") ||
      (req.method === "POST" && route === "/api/auth/refresh");
    if (allowed) return next();
    return res.status(403).json({ success: false, code: "SUPERADMIN_READ_ONLY", message: "Superadmin access is read-only for this action." });
  } catch (error) { return next(error); }
});

// Persistent maintenance mode blocks ordinary API use while preserving login,
// health checks, and the superadmin's ability to restore service.
app.use("/api", async (req, res, next) => {
  const pathName = req.originalUrl.split("?", 1)[0];
  if (/^\/api\/(auth|researchers)\/(login|logout|refresh)$/.test(pathName) ||
      pathName === "/api/system/health" || pathName === "/api/system/settings/maintenance") return next();
  try {
    const { getMaintenanceMode } = require("./controllers/systemController");
    if (!(await getMaintenanceMode())) return next();
    if (await getCurrentRole(req) === "superadmin") return next();
    return res.status(503).json({ success: false, code: "MAINTENANCE_MODE", message: "The system is temporarily unavailable for maintenance." });
  } catch (error) {
    return next(error);
  }
});



// Auth & Identity 
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/profile",     profileRoutes);
app.use("/api/sessions",    sessionRoutes);
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
app.use("/api/system",       systemRoutes);

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


app.use(globalErrorHandler);

module.exports = app;
