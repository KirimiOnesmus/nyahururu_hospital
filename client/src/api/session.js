.

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
export const isAuthenticated = () => !!getRole();
export const isResearcherSession = () => localStorage.getItem("collection") === "researchers";
export const getCachedResearcher = () => {
  const cached = localStorage.getItem("researcher");
  return cached ? JSON.parse(cached) : null;
};
