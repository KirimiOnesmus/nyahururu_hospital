"use strict";

const jwt = require("jsonwebtoken");
const { User, Researcher } = require("../sequelize/models");
const { revokeAuthSession } = require("../utils/tokenService");
const logger = require("../utils/logger");

const EXEMPT_ROLES = new Set(["it", "admin", "superadmin"]);

function getRequestToken(req) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  return req.cookies?.jwt || null;
}

async function getCurrentRole(req) {
  const attachedRole = req.user?.role || req.researcher?.role;
  if (attachedRole) return String(attachedRole).trim().toLowerCase();

  const accessToken = getRequestToken(req);
  let decoded;

  if (accessToken) {
    try {
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      decoded = null;
    }
  }

  if (!decoded && req.cookies?.refreshToken) {
    try {
      decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      decoded = null;
    }
  }

  if (!decoded?.id) return null;

  const Account = decoded.collection === "researchers" ? Researcher : User;
  const account = await Account.findByPk(decoded.id, { attributes: ["id", "role"] });
  return account?.role ? String(account.role).trim().toLowerCase() : null;
}

async function isSuperadminRequest(req) {
  try {
    if (req.user?.role) return String(req.user.role).toLowerCase() === "superadmin";
    const accessToken = getRequestToken(req);
    if (accessToken) {
      try {
        const access = jwt.verify(accessToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (access.role === "superadmin" && access.collection !== "researchers") return true;
        if (access.role) return false;
      } catch { /* fall back to refresh token */ }
    }
    if (req.cookies?.refreshToken) {
      try {
        const refresh = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
        if (refresh.role) return refresh.role === "superadmin";
      } catch { /* invalid refresh token is not exempt */ }
    }
    if (req.originalUrl?.split("?", 1)[0] === "/api/auth/login" && req.body?.email) {
      const loginAccount = await User.findOne({
        where: { email: String(req.body.email).trim().toLowerCase(), role: "superadmin" },
        attributes: ["id"],
      });
      if (loginAccount) return true;
    }
    return false;
  } catch (error) {
    logger.error({ err: error, path: req.originalUrl }, "Unable to check superadmin rate-limit exemption");
    return false;
  }
}

function createRateLimitHandler(message) {
  return async (req, res) => {
    let role = null;
    try {
      role = await getCurrentRole(req);
    } catch (error) {
      logger.error({ err: error, path: req.originalUrl }, "Unable to identify account after rate limit");
    }

    const shouldLogOut = role && !EXEMPT_ROLES.has(role);
    let loggedOut = false;
    if (shouldLogOut) {
      try {
        await revokeAuthSession(req, res);
        res.setHeader("X-Session-Logged-Out", "true");
        loggedOut = true;
      } catch (error) {
        logger.error({ err: error, path: req.originalUrl }, "Unable to revoke rate-limited session");
      }
    }

    const responseMessage = loggedOut
      ? `${message} Your session has been ended. Please sign in again.`
      : message;

    logger.warn(
      { ip: req.ip, path: req.path, role, sessionEnded: loggedOut },
      "Rate limit exceeded"
    );

    return res.status(429).json({
      success: false,
      code: loggedOut ? "RATE_LIMITED_SESSION_ENDED" : "RATE_LIMITED",
      message: responseMessage,
    });
  };
}

module.exports = { createRateLimitHandler, getCurrentRole, isSuperadminRequest };
