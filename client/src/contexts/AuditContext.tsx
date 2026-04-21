import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";

export type AuditModule =
  | "Site" | "Équipe" | "Employé" | "Production" | "Dépense"
  | "Caisse" | "Équipement" | "Avance" | "Utilisateur" | "Paramètres";

export interface AuditLog {
  id: string;
  timestamp: string;        // ISO datetime
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: AuditModule;
  itemId?: string;
  itemName?: string;        // e.g. "Site Principal", "Moussa Diallo"
  details?: string;         // human-readable summary of what changed
  siteId?: string;
  siteName?: string;
  ipHint?: string;          // browser fingerprint hint
}

interface AuditContextType {
  logs: AuditLog[];
  log: (entry: Omit<AuditLog, "id" | "timestamp">) => void;
  clearLogs: () => void;
}

const KEY = "ag_audit_logs";
const MAX_LOGS = 500;

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(logs.slice(0, MAX_LOGS))); } catch {}
  }, [logs]);

  const log = useCallback((entry: Omit<AuditLog, "id" | "timestamp">) => {
    const newLog: AuditLog = {
      ...entry,
      id: `AL${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, MAX_LOGS));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  return (
    <AuditContext.Provider value={{ logs, log, clearLogs }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit(): AuditContextType {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be inside AuditProvider");
  return ctx;
}
