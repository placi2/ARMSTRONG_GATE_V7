import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "CDF";

export interface AppSettings {
  goldPriceUsd: number;
  goldPrice: number;       // alias for goldPriceUsd (backward compat)
  currency: Currency;
  exchangeRateCdf: number;
  exchangeRate: number;    // alias for exchangeRateCdf (backward compat)
  companyName: string;
  customLogo: string | null;
  reportDay: number;
  reportRecipients: string;
  reportFormat: string;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  // New API
  fmt: (usdAmount: number) => string;
  sym: string;
  convert: (usdAmount: number) => number;
  // Old API aliases (backward compat)
  getFormattedPrice: (priceInEur: number) => string;
  convertPrice: (priceInEur: number) => number;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

const DEFAULT: AppSettings = {
  goldPriceUsd: 65,
  goldPrice: 65,
  currency: "USD",
  exchangeRateCdf: 2800,
  exchangeRate: 2800,
  companyName: "ARMSTRONG GATE",
  customLogo: null,
  reportDay: 1,
  reportRecipients: "",
  reportFormat: "PDF",
};

const KEY = "ag_settings";
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      // Try new key
      const s = localStorage.getItem(KEY);
      if (s) {
        const p = JSON.parse(s);
        return { ...DEFAULT, ...p, goldPrice: p.goldPriceUsd || p.goldPrice || 65, exchangeRate: p.exchangeRateCdf || p.exchangeRate || 2800 };
      }
      // Try old key
      const old = localStorage.getItem("amstrong_settings");
      if (old) {
        const p = JSON.parse(old);
        return { ...DEFAULT, goldPriceUsd: p.goldPrice || 65, goldPrice: p.goldPrice || 65, exchangeRateCdf: p.exchangeRate || 2800, exchangeRate: p.exchangeRate || 2800, customLogo: p.customLogo || null };
      }
    } catch {}
    return DEFAULT;
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings(p => {
      const n = { ...p, ...s };
      // Keep aliases in sync
      if (s.goldPriceUsd !== undefined) n.goldPrice = s.goldPriceUsd;
      if (s.goldPrice !== undefined) n.goldPriceUsd = s.goldPrice;
      if (s.exchangeRateCdf !== undefined) n.exchangeRate = s.exchangeRateCdf;
      if (s.exchangeRate !== undefined) n.exchangeRateCdf = s.exchangeRate;
      return n;
    });
  };

  const convert = (usdAmount: number): number => {
    if (settings.currency === "CDF") return usdAmount * (settings.exchangeRateCdf || 2800);
    return usdAmount;
  };

  const sym = settings.currency === "CDF" ? "FC" : "$";
  const currencySymbol = sym;

  const fmt = (usdAmount: number): string => {
    const v = convert(usdAmount);
    const n = Math.round(v).toLocaleString("fr-FR");
    return settings.currency === "CDF" ? `${n} FC` : `$${n}`;
  };

  // Backward compat aliases
  const getFormattedPrice = fmt;
  const convertPrice = convert;
  const formatAmount = fmt;

  return (
    <SettingsContext.Provider value={{
      settings, updateSettings,
      fmt, sym, convert,
      getFormattedPrice, convertPrice, currencySymbol, formatAmount,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
