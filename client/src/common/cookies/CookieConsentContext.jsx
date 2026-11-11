import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  DEFAULT_COOKIE_CATEGORIES,
  readCookieConsent,
} from "./cookieConsent";

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(readCookieConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const syncConsent = (event) => {
      if (event.key === COOKIE_CONSENT_KEY) setConsent(readCookieConsent());
    };
    window.addEventListener("storage", syncConsent);
    return () => window.removeEventListener("storage", syncConsent);
  }, []);

  const saveConsent = useCallback((categories) => {
    const next = {
      version: COOKIE_CONSENT_VERSION,
      savedAt: new Date().toISOString(),
      categories: {
        ...DEFAULT_COOKIE_CATEGORIES,
        ...categories,
        essential: true,
        analytics: false,
      },
    };
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
    } catch {
      // Consent still applies for this page view when persistent storage is unavailable.
    }
    setConsent(next);
    setSettingsOpen(false);
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const value = useMemo(() => ({ consent, saveConsent, settingsOpen, openSettings, closeSettings }), [
    consent,
    saveConsent,
    settingsOpen,
    openSettings,
    closeSettings,
  ]);

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error("useCookieConsent must be used inside CookieConsentProvider");
  return context;
}
