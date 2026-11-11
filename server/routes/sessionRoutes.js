"use strict";

const router = require("express").Router();
const { protectEither } = require("../middleware/auth");
const { recordRequestActivity } = require("../services/activeSessionService");

router.post("/activity", protectEither, async (req, res, next) => {
  try {
    const account = req.user
      ? { id: req.user.id, collection: "users" }
      : { id: req.researcher.id, collection: "researchers" };
    const result = await recordRequestActivity(req, res, account);
    if (!result.valid) {
      return res.status(401).json({
        success: false,
        code: "SESSION_ACTIVE_ELSEWHERE",
        message: "This session ended because your account became active in another device, browser, or tab.",
      });
    }
    return res.status(200).json({ success: true, lastActiveAt: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
