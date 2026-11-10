import { useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/env";

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const SOCKET_PATH = API_BASE_URL.startsWith(window.location.origin)
  ? `${new URL(API_BASE_URL).pathname.replace(/\/$/, "")}/socket.io`
  : "/socket.io";


const socket = io(SOCKET_URL, {
  path: SOCKET_PATH,
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  transports: ["polling", "websocket"],
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

export const useResourceRefresh = (resources, refresh) => {
  const resourceKey = Array.isArray(resources) ? resources.join(",") : resources;
  const stableRefresh = useCallback(refresh, [refresh]);

  useEffect(() => {
    ensureConnected();
    const eventNames = resourceKey.split(",").filter(Boolean).flatMap((resource) => [
      `${resource}:created`,
      `${resource}:updated`,
      `${resource}:deleted`,
    ]);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        Promise.resolve(stableRefresh()).catch(() => {});
      }
    };

    eventNames.forEach((event) => socket.on(event, refreshWhenVisible));
    socket.on("connect", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      eventNames.forEach((event) => socket.off(event, refreshWhenVisible));
      socket.off("connect", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [resourceKey, stableRefresh]);
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
