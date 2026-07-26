

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Origin only (no /api suffix) — used to build asset/image URLs such as `${ASSET_BASE_URL}${imageUrl}`.

export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
