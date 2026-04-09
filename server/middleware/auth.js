const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Researcher = require("../models/ResearcherModel");


exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject researcher tokens on staff routes
    if (decoded.collection === "researchers") {
      return res.status(403).json({ 
        message: "Access denied — researcher token not allowed here" 
      });
    }

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Superadmin can do anything
    if (req.user?.role === "superadmin") return next();

    // Check if user role is in allowed roles
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ 
        message: `Access denied — role '${req.user?.role}' not authorized` 
      });
    }

    next();
  };
};

// RESEARCHER AUTHENTICATION

exports.protectResearcher = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject hospital staff tokens on researcher routes
    if (decoded.collection !== "researchers") {
      return res.status(403).json({ 
        message: "Access denied — researcher token required" 
      });
    }

    const researcher = await Researcher.findById(decoded.id);
    if (!researcher) {
      return res.status(401).json({ message: "Account not found" });
    }

    req.researcher = researcher;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};


exports.authorizeResearcherRoles = (...roles) => {
  return (req, res, next) => {
    // Research admin can do anything
    if (req.researcher?.role === "admin") return next();

    // Check if researcher role is in allowed roles
    if (!roles.includes(req.researcher?.role)) {
      return res.status(403).json({ 
        message: `Access denied — role '${req.researcher?.role}' not authorized` 
      });
    }

    next();
  };
};

//DUAL-AUTHORITY AUTHENTICATION

exports.protectEither = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.collection === "researchers") {
      const researcher = await Researcher.findById(decoded.id);
      if (!researcher) {
        return res.status(401).json({ message: "Researcher not found" });
      }
      req.researcher = researcher;
    } else {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

//REVIEW/MODERATION AUTHENTICATION

exports.protectReviewers = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.collection === "researchers") {
      const researcher = await Researcher.findById(decoded.id);
      if (!researcher) {
        return res.status(401).json({ message: "Researcher not found" });
      }

      // Only reviewer or admin can review research
      if (!["reviewer", "admin"].includes(researcher.role)) {
        return res.status(403).json({ 
          message: `Role '${researcher.role}' cannot review research` 
        });
      }

      req.researcher = researcher;
    } else {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only admin or superadmin can review research
      if (!["admin", "superadmin"].includes(user.role)) {
        return res.status(403).json({ 
          message: `Role '${user.role}' cannot review research` 
        });
      }

      req.user = user;
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Optional researcher authentication

exports.optionalResearcherAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.collection === "researchers") {
      const researcher = await Researcher.findById(decoded.id);
      if (researcher) {
        req.researcher = researcher;
      }
    }
  } catch (err) {
    // Silent fail — continue unauthenticated
    console.warn("[Optional Auth] Token invalid:", err.message);
  }

  next();
};

// UTILITY: Get caller identity for logging/emails

exports.getCallerName = (req) => {
  if (req.user) {
    return req.user.name || 
           `${req.user.firstName} ${req.user.lastName}`.trim() ||
           "Staff Admin";
  }
  if (req.researcher) {
    return req.researcher.name || "Researcher";
  }
  return "Unknown";
};
