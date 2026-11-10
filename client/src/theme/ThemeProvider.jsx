import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ncrh-theme";
const ACCESSIBILITY_STORAGE_KEY = "ncrh-accessibility";
const ThemeContext = createContext(null);

const DEFAULT_ACCESSIBILITY = {
  textSize: "medium",
  pageWidth: "standard",
  textAlignment: "left",
};

const ACCESSIBILITY_OPTIONS = {
  textSize: ["small", "medium", "large"],
  pageWidth: ["standard", "wide"],
  textAlignment: ["left", "center", "right", "justify"],
};

const getSystemDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export function applyTheme(theme) {
  const dark = theme === "dark" || (theme === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function readAccessibilityPreferences() {
  if (typeof window === "undefined") return DEFAULT_ACCESSIBILITY;
  try {
    const saved = JSON.parse(localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) || "{}");
    return Object.fromEntries(
      Object.entries(DEFAULT_ACCESSIBILITY).map(([key, fallback]) => [
        key,
        ACCESSIBILITY_OPTIONS[key].includes(saved[key]) ? saved[key] : fallback,
      ])
    );
  } catch {
    return DEFAULT_ACCESSIBILITY;
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem(STORAGE_KEY) || "system";
  });
  const [accessibility, setAccessibility] = useState(readAccessibilityPreferences);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = accessibility.textSize;
    root.dataset.pageWidth = accessibility.pageWidth;
    root.dataset.textAlignment = accessibility.textAlignment;
    root.style.fontSize = { small: "14px", medium: "16px", large: "18px" }[accessibility.textSize];
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibility));
  }, [accessibility]);

  const resolved = theme === "system" ? (getSystemDark() ? "dark" : "light") : theme;

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      resolved,
      accessibility,
      setAccessibility,
    }),
    [theme, resolved, accessibility]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
