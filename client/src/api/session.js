// Centralized session storage.
//
// Security note (M-1, resolved): the backend now issues an httpOnly,
// Secure (in prod), SameSite=lax `jwt` cookie on login (see
// utils/tokenService.js's setAuthCookies / authController.login), and
// client/src/api/axios.js sends `withCredentials: true`. The staff auth
// token itself is therefore no longer stored here — only the non-sensitive
// `role`/`collection` UI cache is. Researcher auth still returns a plain
// bearer token (no cookie equivalent issued yet), so `token` is kept for
// that flow only.
//
// What this module fixes:
//   - every read/write of these keys goes through one place instead of
//     being duplicated ad-hoc across auth.js, axios.js, Sidebar.jsx, etc.

const STAFF_KEYS = ["role", "collection"];
const RESEARCHER_KEYS = ["token", "role", "collection", "researcher"];

export const setStaffSession = ({ role }) => {
  if (role) localStorage.setItem("role", role);
  localStorage.setItem("collection", "users");
};

export const setResearcherSession = ({ token, role, researcher }) => {
  if (token) localStorage.setItem("token", token);
  localStorage.setItem("role", role || researcher?.role || "researcher");
  localStorage.setItem("collection", "researchers");
  if (researcher) localStorage.setItem("researcher", JSON.stringify(researcher));
};

export const updateCachedResearcher = (researcher) => {
  if (researcher) localStorage.setItem("researcher", JSON.stringify(researcher));
};

export const clearStaffSession = () => {
  STAFF_KEYS.forEach((k) => localStorage.removeItem(k));
};

export const clearResearcherSession = () => {
  RESEARCHER_KEYS.forEach((k) => localStorage.removeItem(k));
};

export const clearAllSessions = () => {
  clearStaffSession();
  clearResearcherSession();
};

export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");
// Staff sessions live in an httpOnly cookie now, so "role present" is the
// best client-readable signal of "a session was established" — same
// reasoning as api/auth.js's isAuthenticated().
export const isAuthenticated = () => !!getRole();
export const isResearcherSession = () => localStorage.getItem("collection") === "researchers";
export const getCachedResearcher = () => {
  const cached = localStorage.getItem("researcher");
  return cached ? JSON.parse(cached) : null;
};
