"use strict";
const { Server } = require("socket.io");
let io = null;

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

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on("join:role", (role) => {
      if (role) socket.join(`role:${role}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("[Socket] Socket.IO initialised");
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