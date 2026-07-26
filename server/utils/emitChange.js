"use strict";

let _io = null;

const emitChange = (resource, action, payload = {}) => {
  try {
    if (!_io) {
      const { getIO } = require("./socket");
      _io = getIO();
    }
    _io.emit(`${resource}:${action}`, {
      ...payload,
      _ts: Date.now(),
    });
  } catch {
    // Socket not ready — skip silently.
  }
};

module.exports = emitChange;