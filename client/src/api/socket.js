import { useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/env";
import { getClientSessionId } from "./session";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");


const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  transports: ["polling", "websocket"],
  auth: (callback) => callback({ sessionId: getClientSessionId() }),
});

const handleSessionEnded = () => {
  socket.disconnect();
  if (window.location.pathname !== "/hmis" || !window.location.search.includes("session-elsewhere")) {
    window.location.assign("/hmis?reason=session-elsewhere");
  }
};

socket.on("session:revoked", (payload) => {
  if (payload?.code === "SESSION_ACTIVE_ELSEWHERE") handleSessionEnded();
});
socket.on("connect_error", (error) => {
  if (error.data?.code === "SESSION_ACTIVE_ELSEWHERE") handleSessionEnded();
});

const ensureConnected = () => {
  if (!socket.connected) socket.connect(); 
};

export const joinRole = (role) => {
  ensureConnected();
  socket.emit("join:role", role);
};


export const disconnectSocket = () => {
  socket.disconnect();
};


export const useSocket = (event, handler) => {

  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    ensureConnected();
    socket.on(event, stableHandler);
    return () => {
      socket.off(event, stableHandler);
    };
  }, [event, stableHandler]);
};


export const useSocketStatus = () => {
  const { useState, useEffect } = require("react");
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return connected;
};

export default socket;
