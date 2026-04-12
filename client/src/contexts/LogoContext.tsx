import React, { createContext, useState, useEffect, ReactNode } from "react";

interface LogoContextType {
  logoEmoji: string;
  logoColor: string;
  logoImage: string | null;
  updateLogo: (emoji: string, color: string) => void;
  updateLogoImage: (base64: string | null) => void;
  resetLogo: () => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);
const KEY = "armstrong_logo_v3";
const DEFAULT_EMOJI = "⛏";
const DEFAULT_COLOR = "bg-amber-500";

function loadSaved() {
  try {
    // Try new key first
    const s = localStorage.getItem(KEY);
    if (s) return JSON.parse(s);
    
    // Fallback: try to get logo from settings
    const settings = localStorage.getItem("armstrong_settings");
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.customLogo) {
        return { emoji: DEFAULT_EMOJI, color: DEFAULT_COLOR, image: parsed.customLogo };
      }
    }
    
    // Fallback: old key
    const old = localStorage.getItem("armstrong_logo_v2");
    if (old) return JSON.parse(old);
  } catch {}
  return { emoji: DEFAULT_EMOJI, color: DEFAULT_COLOR, image: null };
}

function save(data: { emoji: string; color: string; image: string | null }) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export function LogoProvider({ children }: { children: ReactNode }) {
  const saved = loadSaved();
  const [logoEmoji, setLogoEmoji] = useState<string>(saved.emoji || DEFAULT_EMOJI);
  const [logoColor, setLogoColor] = useState<string>(saved.color || DEFAULT_COLOR);
  const [logoImage, setLogoImage] = useState<string | null>(saved.image || null);

  const updateLogo = (emoji: string, color: string) => {
    setLogoEmoji(emoji);
    setLogoColor(color);
    save({ emoji, color, image: logoImage });
  };

  const updateLogoImage = (base64: string | null) => {
    setLogoImage(base64);
    save({ emoji: logoEmoji, color: logoColor, image: base64 });
    // Also sync to settings storage for persistence
    try {
      const s = localStorage.getItem("armstrong_settings");
      if (s) {
        const parsed = JSON.parse(s);
        parsed.customLogo = base64;
        localStorage.setItem("armstrong_settings", JSON.stringify(parsed));
      }
    } catch {}
  };

  const resetLogo = () => {
    setLogoEmoji(DEFAULT_EMOJI);
    setLogoColor(DEFAULT_COLOR);
    setLogoImage(null);
    save({ emoji: DEFAULT_EMOJI, color: DEFAULT_COLOR, image: null });
  };

  return (
    <LogoContext.Provider value={{ logoEmoji, logoColor, logoImage, updateLogo, updateLogoImage, resetLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo(): LogoContextType {
  const ctx = React.useContext(LogoContext);
  if (!ctx) throw new Error("useLogo must be used within LogoProvider");
  return ctx;
}
