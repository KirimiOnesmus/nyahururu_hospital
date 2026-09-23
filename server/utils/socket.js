"use strict";
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

let io = null;

const JWT_VERIFY_OPTIONS = { algorithms: ["HS256"] };

const parseCookies = (header = "") => {
  const out = {};
  header.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  });
  return out;
};

const init = (httpServer, allowedOrigins = []) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ["polling", "websocket"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(async (socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie || "");
    const token = cookies.jwt;
    if (!token) {
      socket.data.role = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);
      if (decoded.jti) {
        const { TokenBlacklist, User, Researcher } = require("../sequelize/models");
        const blacklisted = await TokenBlacklist.findOne({ where: { jti: decoded.jti } });
        if (blacklisted) {
          socket.data.role = null;
          return next();
        }

        if (decoded.collection === "researchers") {
          const researcher = await Researcher.findByPk(decoded.id);
          if (!researcher || researcher.isActive === false) {
            socket.data.role = null;
            return next();
          }
        } else {
          const user = await User.findByPk(decoded.id);
          if (!user || user.isActive === false) {
            socket.data.role = null;
            return next();
          }
        }
      }
      socket.data.user = decoded;
      socket.data.role = decoded.role || null;
      return next();
    } catch {
      socket.data.role = null;
      return next();
    }
  });

  io.on("connection", (socket) => {
    socket.on("join:role", (role) => {
      if (typeof role !== "string" || !role) return;
      if (socket.data.role && socket.data.role === role) {
        socket.join(`role:${role}`);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error(
      "[Socket] getIO() called before init(). " +
        "Make sure server.js calls socket.init() after app.listen()."
    );
  }
  return io;
};

module.exports = { init, getIO };
