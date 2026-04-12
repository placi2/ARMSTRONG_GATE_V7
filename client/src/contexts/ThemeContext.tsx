import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeType = "gold" | "blue" | "green" | "red" | "purple" | "custom";

export const THEME_PRESETS: Record<ThemeType, { primary: string; label: string }> = {
  gold:   { primary: "#b8860b", label: "Or / Noir" },
  blue:   { primary: "#2563eb", label: "Bleu" },
  green:  { primary: "#16a34a", label: "Vert" },
  red:    { primary: "#dc2626", label: "Rouge" },
  purple: { primary: "#7c3aed", label: "Violet" },
  custom: { primary: "#b8860b", label: "Personnalisé" },
};

interface ThemeContextType {
  currentTheme: ThemeType;
  primaryColor: string;
  textOnPrimary: string;
  setTheme: (t: ThemeType) => void;
  setCustomColor: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Calculate readable text color (white or black) based on bg
function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

function applyTheme(color: string) {
  const root = document.documentElement;
  root.style.setProperty("--theme-primary", color);
  root.style.setProperty("--theme-text", getTextColor(color));
  // light version for hover/active states
  root.style.setProperty("--theme-primary-light", color + "22");
  root.style.setProperty("--theme-primary-medium", color + "44");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() =>
    (localStorage.getItem("armstrong-theme") as ThemeType) || "gold"
  );
  const [primaryColor, setPrimaryColor] = useState(() =>
    localStorage.getItem("armstrong-primary") || THEME_PRESETS.gold.primary
  );

  useEffect(() => {
    applyTheme(primaryColor);
    localStorage.setItem("armstrong-theme", currentTheme);
    localStorage.setItem("armstrong-primary", primaryColor);
  }, [primaryColor, currentTheme]);

  useEffect(() => { applyTheme(primaryColor); }, []);

  const handleSetTheme = (t: ThemeType) => {
    setCurrentTheme(t);
    setPrimaryColor(THEME_PRESETS[t].primary);
  };

  const handleSetCustom = (c: string) => {
    setCurrentTheme("custom");
    setPrimaryColor(c);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme, primaryColor,
      textOnPrimary: getTextColor(primaryColor),
      setTheme: handleSetTheme,
      setCustomColor: handleSetCustom,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
