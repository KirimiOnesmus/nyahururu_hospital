// Centralized session storage.
//
// Security note (FC1 in the security review): the token, role, collection
// and cached profile are still readable by any script on the page because
// they live in localStorage, and a real fix requires the backend to start
// issuing an httpOnly, Secure, SameSite cookie on login (the middleware
// already reads req.cookies.jwt, but no controller sets it yet — that's a
// backend change, out of scope for this frontend-only pass).
//
// What this module *does* fix today:
//   - every read/write of these keys goes through one place instead of
//     being duplicated ad-hoc across auth.js, axios.js, Sidebar.jsx, etc.
//   - axios.js is already sending withCredentials so cookie auth will work
//     the moment the backend starts setting the cookie, with no further
//     frontend changes needed.
//   - once cookies land, only this file needs to change.

const STAFF_KEYS = ["token", "role", "collection"];
const RESEARCHER_KEYS = ["token", "role", "collection", "researcher"];

export const setStaffSession = ({ token, role }) => {
  if (token) localStorage.setItem("token", token);
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
export const isAuthenticated = () => !!getToken();
export const isResearcherSession = () => localStorage.getItem("collection") === "researchers";
export const getCachedResearcher = () => {
  const cached = localStorage.getItem("researcher");
  return cached ? JSON.parse(cached) : null;
};
