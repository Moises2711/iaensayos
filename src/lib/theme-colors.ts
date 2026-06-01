import { useEffect, useState } from "react";

const STORAGE_KEY = "ia-ensayos:theme-colors";

export type ThemeColors = {
  foreground: string; // CSS color
  background: string; // CSS color
};

export const DEFAULT_THEME_COLORS: ThemeColors = {
  foreground: "#f4ece0",
  background: "#1a1410",
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadThemeColors(): ThemeColors {
  if (!isBrowser()) return DEFAULT_THEME_COLORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_COLORS;
    const parsed = JSON.parse(raw) as Partial<ThemeColors>;
    return {
      foreground: parsed.foreground ?? DEFAULT_THEME_COLORS.foreground,
      background: parsed.background ?? DEFAULT_THEME_COLORS.background,
    };
  } catch {
    return DEFAULT_THEME_COLORS;
  }
}

export function applyThemeColors(colors: ThemeColors) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--card-foreground", colors.foreground);
  root.style.setProperty("--popover-foreground", colors.foreground);
  root.style.setProperty("--background", colors.background);
}

export function saveThemeColors(colors: ThemeColors) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  applyThemeColors(colors);
}

/** Mount once at the app root to hydrate persisted colors. */
export function useApplyStoredThemeColors() {
  useEffect(() => {
    applyThemeColors(loadThemeColors());
  }, []);
}

/** Stateful hook for color pickers. */
export function useThemeColors() {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_THEME_COLORS);

  useEffect(() => {
    const loaded = loadThemeColors();
    setColors(loaded);
    applyThemeColors(loaded);
  }, []);

  const update = (patch: Partial<ThemeColors>) => {
    setColors((prev) => {
      const next = { ...prev, ...patch };
      saveThemeColors(next);
      return next;
    });
  };

  const reset = () => {
    setColors(DEFAULT_THEME_COLORS);
    saveThemeColors(DEFAULT_THEME_COLORS);
  };

  return { colors, update, reset };
}
