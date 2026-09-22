"use strict";

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";


const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: maxAgeMs,
  path: "/",
});

const ACCESS_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; 
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; 


const signAccessToken = (user) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { id: user.id, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
  return { token, jti };
};

const signRefreshToken = (user) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { id: user.id, jti, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
  return { token, jti };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("jwt", accessToken, cookieOptions(ACCESS_COOKIE_MAX_AGE));
  res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_COOKIE_MAX_AGE));
};

const clearAuthCookies = (res) => {
  res.clearCookie("jwt", cookieOptions(0));
  res.clearCookie("refreshToken", cookieOptions(0));
};

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
