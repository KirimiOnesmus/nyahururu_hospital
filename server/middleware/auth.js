const jwt = require("jsonwebtoken");
const  User = require("../models/userModel");

//middleware to protect routes
exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password") ;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
}
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
           if (req.user.role === 'superadmin') return next();
           
        if (!roles.includes(req.user.role)) 
            return res.status(403).json({ message: "Access denied" });
        next();
    };
}