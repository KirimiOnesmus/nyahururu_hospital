export const COOKIE_CONSENT_KEY = "ncrh-cookie-consent";
export const COOKIE_CONSENT_VERSION = 1;

export const DEFAULT_COOKIE_CATEGORIES = {
  essential: true,
  preferences: false,
  maps: false,
  analytics: false,
};

export function readCookieConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY) || "null");
    if (saved?.version !== COOKIE_CONSENT_VERSION || !saved.categories) return null;
    return {
      version: COOKIE_CONSENT_VERSION,
      savedAt: saved.savedAt || null,
      categories: {
        ...DEFAULT_COOKIE_CATEGORIES,
        ...saved.categories,
        essential: true,
        analytics: false,
      },
    };
  } catch {
    return null;
  }
}

export const hasPreferenceConsent = () =>
  readCookieConsent()?.categories?.preferences === true;
