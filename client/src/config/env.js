// Single source of truth for backend URL configuration.
// Previously this same expression was copy-pasted into 13+ files
// (EventsPage.jsx, NewsPage.jsx, Services.jsx x2, DoctorCard.jsx,
// EventOverlay.jsx, News.jsx, NewsDetails.jsx, DoctorDetails.jsx,
// ServiceDetails.jsx, Home.jsx, axios.js, publicApi.js) with two
// different env var names (VITE_BACKEND_URL and VITE_API_URL).
//
// Standardized on a single var: VITE_API_URL (should point at the
// API root, e.g. "http://localhost:5000/api" in dev).

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Origin only (no /api suffix) — used to build asset/image URLs
// such as `${ASSET_BASE_URL}${imageUrl}`.
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
