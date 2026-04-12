import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "CDF";

export interface AppSettings {
  goldPriceUsd: number; goldPrice: number;        // goldPrice = alias
  currency: Currency;
  exchangeRateCdf: number; exchangeRate: number;  // exchangeRate = alias
  companyName: string; customLogo: string | null;
  reportDay: number; reportRecipients: string; reportFormat: string;
}

interface SettingsCtx {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  fmt: (usdAmount: number) => string;
  sym: string;
  convert: (usdAmount: number) => number;
  // backward-compat aliases
  getFormattedPrice: (v: number) => string;
  formatAmount: (v: number) => string;
  convertPrice: (v: number) => number;
  currencySymbol: string;
}

const DEFAULTS: AppSettings = {
  goldPriceUsd:65, goldPrice:65, currency:"USD",
  exchangeRateCdf:2800, exchangeRate:2800,
  companyName:"ARMSTRONG GATE", customLogo:null,
  reportDay:1, reportRecipients:"", reportFormat:"PDF",
};

const KEY = "ag_settings";
const SettingsContext = createContext<SettingsCtx|undefined>(undefined);

export function SettingsProvider({children}:{children:ReactNode}) {
  const [settings, setSettings] = useState<AppSettings>(()=>{
    try {
      const s = localStorage.getItem(KEY);
      if(s){ const p=JSON.parse(s); return {...DEFAULTS,...p,goldPrice:p.goldPriceUsd||p.goldPrice||65,exchangeRate:p.exchangeRateCdf||p.exchangeRate||2800}; }
      const old = localStorage.getItem("amstrong_settings");
      if(old){ const p=JSON.parse(old); return {...DEFAULTS,goldPriceUsd:p.goldPrice||65,goldPrice:p.goldPrice||65,exchangeRateCdf:p.exchangeRate||2800,exchangeRate:p.exchangeRate||2800,customLogo:p.customLogo||null}; }
    } catch {}
    return DEFAULTS;
  });

  useEffect(()=>{ try { localStorage.setItem(KEY,JSON.stringify(settings)); } catch {} },[settings]);

  const updateSettings = (s:Partial<AppSettings>) => setSettings(p=>{
    const n={...p,...s};
    if(s.goldPriceUsd!==undefined) n.goldPrice=s.goldPriceUsd;
    if(s.goldPrice!==undefined)    n.goldPriceUsd=s.goldPrice;
    if(s.exchangeRateCdf!==undefined) n.exchangeRate=s.exchangeRateCdf;
    if(s.exchangeRate!==undefined)    n.exchangeRateCdf=s.exchangeRate;
    return n;
  });

  const convert = (v:number) => settings.currency==="CDF" ? v*(settings.exchangeRateCdf||2800) : v;
  const sym = settings.currency==="CDF" ? "FC" : "$";

  const fmt = (usdAmount:number):string => {
    const v = convert(usdAmount);
    const formatted = v%1===0 ? v.toLocaleString("fr-FR") : v.toLocaleString("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:2});
    return settings.currency==="CDF" ? `${formatted} FC` : `$${formatted}`;
  };

  return (
    <SettingsContext.Provider value={{
      settings, updateSettings, fmt, sym, convert,
      getFormattedPrice:fmt, formatAmount:fmt, convertPrice:convert, currencySymbol:sym,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings():SettingsCtx {
  const ctx=useContext(SettingsContext);
  if(!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
