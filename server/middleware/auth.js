const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Researcher = require("../models/ResearcherModel");
const { AppError, asyncHandler } = require("../utils/appError");
const { RESEARCHER_ROLES, RESEARCHER_STATUSES } = require("../constants/researchIndex");

//  INTERNAL HELPERS-  Extract Bearer token from Authorization header or jwt cookie.

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  if (req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }
  return null;
};

//Build a consistent caller identity object used by both - getCallerName and getCallerIdentity.


const buildCallerIdentity = (req) => {
  if (req.researcher) {
    return {
      id:    req.researcher._id,
      name:  req.researcher.name || req.researcher.firstName || "Researcher",
      role:  req.researcher.role,
      model: "Researcher",
    };
  }
  if (req.user) {
    const name =
      req.user.name ||
      `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
      "Staff Admin";
    return {
      id:    req.user._id,
      name,
      role:  req.user.role,
      model: "User",
    };
  }
  return null;
};
 

//  HMIS STAFF ROUTES

exports.verifyToken = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError("No token provided.", 401);
 
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
  if (decoded.collection === "researchers") {
    throw new AppError("Access denied — researcher token not allowed on staff routes.", 403);
  }
 
  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new AppError("User not found.", 401);
 
  if (user.isActive === false) throw new AppError("Your account has been deactivated.", 403);
 
  req.user = user;
  next();
});

// STAFF ROLE GATE

exports.authorizeRoles = (...roles) => (req, res, next) => {
  // Superadmin always passes
  if (req.user?.role === "superadmin") return next();
 
  if (!roles.includes(req.user?.role)) {
    return next(
      new AppError(
        `Access denied — role '${req.user?.role}' is not authorized for this action.`,
        403
      )
    );
  }
  next();
};



// RESEARCHER AUTHENTICATION

exports.protectResearcher = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError("No token provided.", 401);
 
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
  // Staff tokens must never reach researcher routes
  if (decoded.collection !== "researchers") {
    throw new AppError("Access denied — researcher token required.", 403);
  }
 
  const researcher = await Researcher.findById(decoded.id);
  if (!researcher) throw new AppError("Account not found.", 401);
 
  if (researcher.isActive === false) {
    throw new AppError("Your account has been deactivated.", 403);
  }
  if (researcher.status === RESEARCHER_STATUSES.SUSPENDED) {
    throw new AppError("Your account has been suspended. Please contact support.", 403);
  }
 
  req.researcher = researcher;
  next();
});


//  RESEARCHER ROLE GATE

exports.authorizeResearcherRoles = (...roles) => (req, res, next) => {
  // Both admin and superadmin always pass 
  if (
    req.researcher?.role === RESEARCHER_ROLES.ADMIN ||
    req.researcher?.role === RESEARCHER_ROLES.SUPERADMIN
  ) {
    return next();
  }
 
  if (!roles.includes(req.researcher?.role)) {
    return next(
      new AppError(
        `Access denied — role '${req.researcher?.role}' is not authorized for this action.`,
        403
      )
    );
  }
  next();
};

//DUAL-AUTHORITY AUTHENTICATION

exports.protectEither = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError("No token provided.", 401);
 
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
  if (decoded.collection === "researchers") {
    const researcher = await Researcher.findById(decoded.id);
    if (!researcher) throw new AppError("Researcher not found.", 401);
 
    if (researcher.isActive === false) {
      throw new AppError("Your account has been deactivated.", 403);
    }
    if (researcher.status === RESEARCHER_STATUSES.SUSPENDED) {
      throw new AppError("Your account has been suspended.", 403);
    }
 
    req.researcher = researcher;
  } else {
    // Hospital staff token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) throw new AppError("User not found.", 401);
    if (user.isActive === false) throw new AppError("Your account has been deactivated.", 403);
 
    req.user = user;
  }
 
  next();
});


//REVIEW/MODERATION AUTHENTICATION

exports.protectReviewers = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError("No token provided.", 401);
 
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
  if (decoded.collection === "researchers") {
    const researcher = await Researcher.findById(decoded.id);
    if (!researcher) throw new AppError("Researcher not found.", 401);
 
    if (researcher.isActive === false) {
      throw new AppError("Your account has been deactivated.", 403);
    }
 
    const allowedRoles = [
      RESEARCHER_ROLES.REVIEWER,
      RESEARCHER_ROLES.ADMIN,
      RESEARCHER_ROLES.SUPERADMIN,
    ];
 
    if (!allowedRoles.includes(researcher.role)) {
      throw new AppError(
        `Role '${researcher.role}' does not have review permissions.`,
        403
      );
    }
 
    req.researcher = researcher;
  } else {
    // Hospital staff token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) throw new AppError("User not found.", 401);
 
    if (!["admin", "superadmin"].includes(user.role)) {
      throw new AppError(
        `Role '${user.role}' does not have review permissions.`,
        403
      );
    }
 
    req.user = user;
  }
 
  next();
});

// Optional researcher authentication

exports.optionalResearcher = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.collection === "researchers") {
      const researcher = await Researcher.findById(decoded.id);
      if (researcher && researcher.isActive !== false) {
        req.researcher = researcher;
      }
    }
  } catch {
    // Silent fail — token invalid or expired; request proceeds unauthenticated
  }
 
  next();
};

//RESEARCH ADMIN GUARD- Accepts BOTH hospital staff admins (req.user) AND research admins (req.researcher).

exports.protectResearchAdmin = (req, res, next) => {
  const staffIsAdmin =
    req.user && ["admin", "superadmin"].includes(req.user.role);
 
  const researcherIsAdmin =
    req.researcher &&
    [RESEARCHER_ROLES.ADMIN, RESEARCHER_ROLES.SUPERADMIN].includes(req.researcher.role);
 
  if (staffIsAdmin || researcherIsAdmin) return next();
 
  return next(new AppError("Admin access required.", 403));
};


exports.restrictTo = (...roles) => (req, res, next) => {
  // HMIS staff superadmin/admin always passes
  if (req.user && ["admin", "superadmin"].includes(req.user.role)) {
    return next();
  }
 
  if (!req.researcher) {
    return next(new AppError("Authentication required.", 401));
  }
 
  if (!roles.includes(req.researcher.role)) {
    return next(
      new AppError(`Access denied — required role: ${roles.join(" or ")}.`, 403)
    );
  }
 
  next();
};
 

//  UTILITIES

exports.getCallerName = (req) => {
  const identity = buildCallerIdentity(req);
  return identity?.name || "Unknown";
};

exports.getCallerIdentity = (req) => buildCallerIdentity(req);

exports.isResearchAdmin = (req) => {
  const staffIsAdmin =
    req.user && ["admin", "superadmin"].includes(req.user.role);
 
  const researcherIsAdmin =
    req.researcher &&
    [RESEARCHER_ROLES.ADMIN, RESEARCHER_ROLES.SUPERADMIN].includes(req.researcher.role);
 
  return !!(staffIsAdmin || researcherIsAdmin);
};