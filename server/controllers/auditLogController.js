"use strict";

const { Op } = require("sequelize");
const { AuditLog } = require("../sequelize/models");
const { asyncHandler, sendSuccess } = require("../utils/appError");


exports.getAuditLogs = asyncHandler(async (req, res) => {
  const {
    action,
    resource,
    severity,
    from,
    to,
    search,
    page = 1,
    limit = 200,
  } = req.query;

  const where = {};

  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (severity) where.severity = severity;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) {

      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = toDate;
    }
  }


  if (search) {
    const q = `%${search}%`;
    where[Op.or] = [
      { userName: { [Op.like]: q } },
      { userEmail: { [Op.like]: q } },
      { action: { [Op.like]: q } },
      { resource: { [Op.like]: q } },
      { description: { [Op.like]: q } },
      { ipAddress: { [Op.like]: q } },
      { resourceId: { [Op.like]: q } },
    ];
  }

  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: Math.min(Number(limit), 500),
    offset,
  });

  const data = rows.map((row) => {
    const plain = row.toJSON();
    return {
      id: plain.id,
      timestamp: plain.createdAt,
      user: {
        name: plain.userName,
        email: plain.userEmail,
        role: plain.userRole,
      },
      action: plain.action,
      resource: plain.resource,
      resourceId: plain.resourceId,
      description: plain.description,
      severity: plain.severity,
      ipAddress: plain.ipAddress,
      userAgent: plain.userAgent,
      sessionId: plain.sessionId,
      changes: plain.changes,
      metadata: plain.metadata,
    };
  });

  return sendSuccess(res, 200, "Audit logs retrieved", data, {
    page: Number(page),
    limit: Number(limit),
    total: count,
    pages: Math.ceil(count / Number(limit)),
  });
});


exports.getAuditStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [total, today, failedLogins, highSeverity] = await Promise.all([
    AuditLog.count(),
    AuditLog.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
    AuditLog.count({ where: { action: "login_failed" } }),
    AuditLog.count({ where: { severity: { [Op.in]: ["high", "critical"] } } }),
  ]);

  return sendSuccess(res, 200, "Audit stats", {
    total,
    today,
    failedLogins,
    critical: highSeverity,
  });
});
