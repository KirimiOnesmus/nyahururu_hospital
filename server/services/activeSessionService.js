"use strict";

const { randomUUID } = require("crypto");
const { ActiveSession, User, Researcher, sequelize } = require("../sequelize/models");
const logger = require("../utils/logger");

const SESSION_ENDED_MESSAGE = "This session ended because your account became active in another device, browser, or tab.";

const getAccountModel = (collection) => collection === "researchers" ? Researcher : User;

function sessionIdForRequest(req, res) {
  const supplied = req.get("X-Client-Session-Id");
  const sessionId = typeof supplied === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supplied)
    ? supplied
    : randomUUID();
  res.setHeader("X-Client-Session-Id", sessionId);
  return sessionId;
}

function notifyRevokedSessions(sessionIds) {
  if (!sessionIds.length) return;
  try {
    const { getIO } = require("../utils/socket");
    const io = getIO();
    for (const sessionId of sessionIds) {
      io.to(`active-session:${sessionId}`).emit("session:revoked", {
        code: "SESSION_ACTIVE_ELSEWHERE",
        message: SESSION_ENDED_MESSAGE,
      });
    }
  } catch (error) {
    // Session activity polling is the fallback across instances or before the
    // socket server is initialized.
    logger.debug({ err: error }, "Could not send immediate session-revocation event");
  }
}

async function registerActivity({ accountId, collection, sessionId }) {
  const accountModel = getAccountModel(collection);
  let result;
  const now = new Date();

  await sequelize.transaction(async (transaction) => {
    const account = await accountModel.findByPk(accountId, {
      attributes: ["id"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!account) {
      result = { valid: false, revokedIds: [] };
      return;
    }

    const rows = await ActiveSession.findAll({
      where: { accountId, collection, revokedAt: null },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const current = await ActiveSession.findByPk(sessionId, { transaction, lock: transaction.LOCK.UPDATE });

    if (current && (String(current.accountId) !== String(accountId) || current.collection !== collection)) {
      result = { valid: false, revokedIds: [] };
      return;
    }
    if (current?.revokedAt) {
      result = { valid: false, revokedIds: [] };
      return;
    }

    if (current) {
      const priorTime = new Date(current.lastActiveAt).getTime();
      current.lastActiveAt = new Date(Math.max(now.getTime(), priorTime + 1));
      await current.save({ transaction });
    } else {
      await ActiveSession.create({
        sessionId,
        accountId,
        collection,
        lastActiveAt: now,
      }, { transaction });
    }

    const revokedIds = [];
    for (const session of rows) {
      if (session.sessionId === sessionId) continue;
      session.revokedAt = now;
      session.revocationReason = "active_elsewhere";
      await session.save({ transaction });
      revokedIds.push(session.sessionId);
    }
    result = { valid: true, revokedIds };
  });

  if (result?.valid) notifyRevokedSessions(result.revokedIds);
  return result || { valid: false, revokedIds: [] };
}

async function assertSessionActive(req, res, decoded) {
  const collection = decoded.collection === "researchers" ? "researchers" : "users";
  const sessionId = sessionIdForRequest(req, res);
  let session = await ActiveSession.findByPk(sessionId);

  if (!session) {
    const result = await registerActivity({ accountId: decoded.id, collection, sessionId });
    if (!result.valid) return false;
    session = await ActiveSession.findByPk(sessionId);
  }

  if (
    !session || session.revokedAt ||
    String(session.accountId) !== String(decoded.id) ||
    session.collection !== collection
  ) return false;

  return true;
}

async function recordRequestActivity(req, res, account) {
  const sessionId = sessionIdForRequest(req, res);
  return registerActivity({
    accountId: account.id,
    collection: account.collection,
    sessionId,
  });
}

async function startSession({ req, res, accountId, collection }) {
  const sessionId = sessionIdForRequest(req, res);
  const result = await registerActivity({ accountId, collection, sessionId });
  if (!result.valid) throw new Error("Could not establish the authenticated session.");
  return sessionId;
}

async function revokeRequestSession(req, reason = "logout") {
  const sessionId = req.get?.("X-Client-Session-Id") || req.headers?.["x-client-session-id"];
  if (!sessionId) return;
  await ActiveSession.update({ revokedAt: new Date(), revocationReason: reason }, {
    where: { sessionId, revokedAt: null },
  });
}

module.exports = {
  SESSION_ENDED_MESSAGE,
  assertSessionActive,
  recordRequestActivity,
  startSession,
  revokeRequestSession,
};
