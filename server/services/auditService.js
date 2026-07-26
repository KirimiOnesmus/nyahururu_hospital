"use strict";

const { AuditLog } = require("../sequelize/models");
let _io = null;
const emitSocket = (event, data) => {
  try {
    if (!_io) {
      const { getIO } = require("../utils/socket");
      _io = getIO();
    }
    _io.emit(event, data);
  } catch {
    // Socket not initialised yet (e.g. during seeding) — skip silently.
  }
};


const inferSeverity = (action) => {
  const SEVERITY_MAP = {
    login: "info",
    logout: "info",
    view: "info",
    create: "low",
    update: "low",
    export: "low",
    download: "low",
    publish: "low",
    approve: "medium",
    reject: "medium",
    login_failed: "high",
    delete: "high",
    role_change: "high",
    permission_change: "high",
    password_reset: "medium",
  };
  return SEVERITY_MAP[action] || "info";
};

const extractCaller = (req) => {
  const user = req.user || null;
  return {
    userId: user?.id || null,
    userName: user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || null,
    userEmail: user?.email || null,
    userRole: user?.role || null,
  };
};

const extractClient = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress || null,
  userAgent: req.headers?.["user-agent"] || null,
  sessionId: req.decodedToken?.jti || null,
});


const log = async ({
  req,
  action,
  resource,
  resourceId,
  description,
  severity,
  changes,
  metadata,
  actor,
}) => {
  try {
    const caller = actor || extractCaller(req);
    const client = extractClient(req);
    const sev = severity || inferSeverity(action);

    const entry = await AuditLog.create({
      ...caller,
      ...client,
      action,
      resource: resource || null,
      resourceId: resourceId ? String(resourceId) : null,
      description: description || null,
      severity: sev,
      changes: changes || null,
      metadata: metadata || null,
    });


    emitSocket("audit:new", {
      id: entry.id,
      timestamp: entry.createdAt,
      user: {
        name: caller.userName,
        email: caller.userEmail,
        role: caller.userRole,
      },
      action,
      resource: resource || null,
      resourceId: resourceId ? String(resourceId) : null,
      description: description || null,
      severity: sev,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      sessionId: client.sessionId,
    });
  } catch (err) {
  
    console.error("[AuditService] Failed to write audit log:", err.message);
  }
};

module.exports = { log };