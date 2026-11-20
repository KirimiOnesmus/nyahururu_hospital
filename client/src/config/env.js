

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const normalizedUrl = `${url.startsWith("/") ? "" : "/"}${url}`;
  if (/^\/uploads\/(public|gallery|news|events|services|notices|tenders)\//i.test(normalizedUrl)) {
    return `${API_BASE_URL}${normalizedUrl}`;
  }
  return `${ASSET_BASE_URL}${normalizedUrl}`;
};
