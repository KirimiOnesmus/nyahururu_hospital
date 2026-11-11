const STAFF_KEYS = ["role", "collection"];
const RESEARCHER_KEYS = ["role", "collection", "researcher"];
const CLIENT_SESSION_KEY = "ncrh.clientSessionId";
const TAB_INSTANCE_ID = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const createClientSessionId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

let clientSessionId = sessionStorage.getItem(CLIENT_SESSION_KEY) || createClientSessionId();
sessionStorage.setItem(CLIENT_SESSION_KEY, clientSessionId);

let sessionChannel = null;
if (typeof BroadcastChannel !== "undefined") {
  sessionChannel = new BroadcastChannel("ncrh-client-session-tabs");
  sessionChannel.addEventListener("message", (event) => {
    if (event.data?.type === "claim" && event.data.sessionId === clientSessionId && event.data.tabId !== TAB_INSTANCE_ID) {
      clientSessionId = createClientSessionId();
      sessionStorage.setItem(CLIENT_SESSION_KEY, clientSessionId);
      sessionChannel.postMessage({ type: "claim", tabId: TAB_INSTANCE_ID, sessionId: clientSessionId });
    }
  });
  sessionChannel.postMessage({ type: "claim", tabId: TAB_INSTANCE_ID, sessionId: clientSessionId });
}

export const getClientSessionId = () => clientSessionId;

export const rotateClientSessionId = () => {
  clientSessionId = createClientSessionId();
  sessionStorage.setItem(CLIENT_SESSION_KEY, clientSessionId);
  sessionChannel?.postMessage({ type: "claim", tabId: TAB_INSTANCE_ID, sessionId: clientSessionId });
  return clientSessionId;
};

export const setClientSessionId = (sessionId) => {
  if (typeof sessionId !== "string" || !sessionId) return;
  clientSessionId = sessionId;
  sessionStorage.setItem(CLIENT_SESSION_KEY, sessionId);
};

export const setStaffSession = ({ role }) => {
  if (role) localStorage.setItem("role", role);
  localStorage.setItem("collection", "users");
};

export const setResearcherSession = ({ role, researcher }) => {
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

export const getToken = () => null;
export const getRole = () => localStorage.getItem("role");
export const isAuthenticated = () => !!getRole();
export const isResearcherSession = () => localStorage.getItem("collection") === "researchers";
export const getCachedResearcher = () => {
  const cached = localStorage.getItem("researcher");
  return cached ? JSON.parse(cached) : null;
};
