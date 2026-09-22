const jwt = require("jsonwebtoken");


const JWT_VERIFY_OPTIONS = { algorithms: ["HS256"] };

const { User, TokenBlacklist, Researcher } = require("../sequelize/models");
const { AppError, asyncHandler } = require("../utils/appError");
const { RESEARCHER_ROLES, RESEARCHER_STATUSES } = require("../constants/researchIndex");


const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  if (req.cookies?.jwt) {
    return req.cookies.jwt;
  }

  return null;
};

const buildCallerIdentity = (req) => {
  if (req.researcher) {
    return {
      id:    req.researcher.id,
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
      id:    req.user.id,
      name,
      role:  req.user.role,
      model: "User",
    };
  }
  return null;
};

const staffIsAdmin = (req) =>
  !!(req.user && ["admin", "superadmin"].includes(req.user.role));

const staffIsResearchOfficer = (req) =>
  !!(req.user && ["admin", "superadmin", "research"].includes(req.user.role));

const researcherHasCommitteeAccess = (researcher) =>
  !!researcher &&
  (researcher.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE ||
    researcher.isCommittee === true);


//  HMIS STAFF ROUTES

exports.verifyToken = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError("No token provided.", 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);

  if (decoded.collection === "researchers") {
    throw new AppError("Access denied — researcher token not allowed on staff routes.", 403);
  }

  if (decoded.jti) {
    const blacklisted = await TokenBlacklist.findOne({ where: { jti: decoded.jti } });
    if (blacklisted) throw new AppError("Session expired. Please log in again.", 401);
  }

  const user = await User.findByPk(decoded.id, { attributes: { exclude: ["password"] } });
  if (!user) throw new AppError("User not found.", 401);

  if (user.isActive === false) throw new AppError("Your account has been deactivated.", 403);


  const MUST_CHANGE_PASSWORD_ALLOWLIST = [
    { method: "POST", path: "/api/profile/change-password" },
    { method: "POST", path: "/api/auth/logout" },
  ];
  if (user.mustChangePassword) {
    const currentPath = req.originalUrl.split("?")[0];
    const allowed = MUST_CHANGE_PASSWORD_ALLOWLIST.some(
      (r) => r.method === req.method && currentPath === r.path,
    );
    if (!allowed) {
      throw new AppError("You must change your password before continuing.", 403);
    }
  }

  req.user = user;
  req.decodedToken = decoded;
  next();
});

// STAFF ROLE GATE

exports.authorizeRoles = (...roles) => (req, res, next) => {
 
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

  const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);

 
  if (decoded.collection !== "researchers") {
    throw new AppError("Access denied — researcher token required.", 403);
  }

  const researcher = await Researcher.findByPk(decoded.id);
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
  if (!roles.includes(req.researcher?.role)) {
    return next(
      new AppError(
        `Access denied — role '${req.researcher?.role}' is not authorized for this action.`,
        403,
      ),
    );
  }
  next();
};

// RESEARCH COMMITTEE GATE


exports.protectCommittee = (req, res, next) => {
  if (staffIsResearchOfficer(req)) return next();

  if (!req.researcher) {
    return next(new AppError("Authentication required.", 401));
  }

  if (!researcherHasCommitteeAccess(req.researcher)) {
    return next(new AppError("Research Committee access required.", 403));
  }

  next();
};

//DUAL-AUTHORITY AUTHENTICATION

exports.protectEither = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError("No token provided.", 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);

  if (decoded.collection === "researchers") {
    const researcher = await Researcher.findByPk(decoded.id);
    if (!researcher) throw new AppError("Researcher not found.", 401);

    if (researcher.isActive === false) {
      throw new AppError("Your account has been deactivated.", 403);
    }
    if (researcher.status === RESEARCHER_STATUSES.SUSPENDED) {
      throw new AppError("Your account has been suspended.", 403);
    }

    req.researcher = researcher;
  } else {

    const user = await User.findByPk(decoded.id, { attributes: { exclude: ["password"] } });
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

  const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);

  if (decoded.collection === "researchers") {
    const researcher = await Researcher.findByPk(decoded.id);
    if (!researcher) throw new AppError("Researcher not found.", 401);

    if (researcher.isActive === false) {
      throw new AppError("Your account has been deactivated.", 403);
    }

    const allowedRoles = [
      RESEARCHER_ROLES.REVIEWER,
      RESEARCHER_ROLES.RESEARCH_COMMITTEE,
    ];

    if (!allowedRoles.includes(researcher.role)) {
      throw new AppError(
        `Role '${researcher.role}' does not have review permissions.`,
        403
      );
    }

    req.researcher = researcher;
  } else {
   
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ["password"] } });
    if (!user) throw new AppError("User not found.", 401);

    if (!["admin", "superadmin", "research"].includes(user.role)) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
    if (decoded.collection === "researchers") {
      const researcher = await Researcher.findByPk(decoded.id);
      if (researcher && researcher.isActive !== false) {
        req.researcher = researcher;
      }
    }
  } catch {
    // Silent fail — token invalid or expired; request proceeds unauthenticated
  }

  next();
};

//RESEARCH ADMIN GUARD

exports.protectResearchAdmin = (req, res, next) => {
  if (staffIsResearchOfficer(req)) return next();
  return next(new AppError("Research admin access required.", 403));
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (staffIsResearchOfficer(req)) return next();

  if (!req.researcher) {
    return next(new AppError("Authentication required.", 401));
  }

  if (!roles.includes(req.researcher.role)) {
    return next(
      new AppError(`Access denied — required role: ${roles.join(" or ")}.`, 403),
    );
  }

  next();
};






exports.getCallerName = (req) => {
  const identity = buildCallerIdentity(req);
  return identity?.name || "Unknown";
};

exports.getCallerIdentity = (req) => buildCallerIdentity(req);


exports.isResearchAdmin = (req) => staffIsResearchOfficer(req);

exports.hasCommitteeAccess = (req) =>
  staffIsResearchOfficer(req) || researcherHasCommitteeAccess(req.researcher);