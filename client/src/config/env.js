

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${ASSET_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
