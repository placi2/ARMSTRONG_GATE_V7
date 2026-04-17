import { createContext, useState, ReactNode, useEffect } from "react";

export type UserRole =
  | "pdg"           // #01 PDG/Propriétaire
  | "directeur"     // #02 Directeur de Site
  | "rh"            // #03 Responsable RH
  | "finance"       // #04 Chargé de Finance
  | "chef_equipe"   // #05 Chef d'Équipe
  | "equipements"   // #06 Responsable Équipements
  | "logistique"    // #07 Responsable Logistique
  | "auditeur";     // #08 Auditeur/Comptable

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteId?: string;   // obligatoire pour directeur, chef_equipe
  teamId?: string;   // obligatoire pour chef_equipe
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (p: string) => boolean;
  hasRole: (r: UserRole | UserRole[]) => boolean;
  canWrite: boolean;   // false for auditeur
  isAdmin: boolean;    // true for pdg only
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Role labels & colors ──────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  pdg:          "👑 PDG / Propriétaire",
  directeur:    "🏭 Directeur de Site",
  rh:           "👥 Responsable RH",
  finance:      "💰 Chargé de Finance",
  chef_equipe:  "⛏ Chef d'Équipe",
  equipements:  "🔧 Resp. Équipements",
  logistique:   "🚛 Resp. Logistique",
  auditeur:     "📋 Auditeur / Comptable",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  pdg:          "bg-amber-100 text-amber-800",
  directeur:    "bg-blue-100 text-blue-800",
  rh:           "bg-purple-100 text-purple-800",
  finance:      "bg-green-100 text-green-800",
  chef_equipe:  "bg-orange-100 text-orange-800",
  equipements:  "bg-gray-100 text-gray-800",
  logistique:   "bg-cyan-100 text-cyan-800",
  auditeur:     "bg-slate-100 text-slate-700",
};

// ── Permissions per role ──────────────────────────────────────────────────────
// Each permission = "module:action" or just "module" for full access
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  pdg: [
    "dashboard", "sites", "teams", "employees", "production",
    "expenses", "cash", "site-cash", "equipment", "financial",
    "transaction-history", "comparison", "performance-comparison",
    "weekly-reports", "custom-reports", "settings",
    "write", "delete", "manage_users",
  ],
  directeur: [
    "dashboard", "teams", "employees", "production",
    "expenses", "cash", "equipment", "financial",
    "transaction-history", "weekly-reports", "custom-reports",
    "write",
    // NO: sites, site-cash, comparison, performance-comparison, settings
  ],
  rh: [
    "dashboard", "employees", "teams:read",
    "write:employees", "write:attendance",
    // NO: production, expenses, cash, equipment, financial
  ],
  finance: [
    "dashboard", "financial", "cash", "site-cash", "expenses",
    "transaction-history", "weekly-reports", "custom-reports",
    "employees:read",
    "write:cash", "write:expenses",
    // NO: production, equipment, RH
  ],
  chef_equipe: [
    "dashboard", "production", "equipment:read",
    "write:production", "write:attendance",
    // NO: expenses, cash, financial, other teams
  ],
  equipements: [
    "dashboard", "equipment", "expenses:read",
    "write:equipment",
    // NO: RH, finance, cash
  ],
  logistique: [
    "dashboard", "sites:read", "production:read",
    "equipment:read", "expenses",
    "write:expenses:transport",
    // NO: salaires, caisse, finances
  ],
  auditeur: [
    "dashboard", "sites:read", "teams:read", "employees:read",
    "production:read", "expenses:read", "cash:read",
    "financial:read", "equipment:read",
    "weekly-reports", "custom-reports",
    // NO write permissions at all
  ],
};

// ── Nav items visible per role ────────────────────────────────────────────────
export const ROLE_NAV: Record<UserRole, string[]> = {
  pdg: [
    "/", "/sites", "/teams", "/employees", "/production", "/expenses",
    "/cash", "/site-cash", "/equipment", "/financial",
    "/transaction-history", "/comparison", "/performance-comparison",
    "/weekly-reports", "/custom-reports", "/settings",
  ],
  directeur: [
    "/", "/teams", "/employees", "/production", "/expenses",
    "/cash", "/equipment", "/financial",
    "/transaction-history", "/weekly-reports", "/custom-reports",
  ],
  rh: ["/", "/employees", "/teams"],
  finance: [
    "/", "/financial", "/cash", "/site-cash", "/expenses",
    "/transaction-history", "/weekly-reports", "/custom-reports",
  ],
  chef_equipe: ["/", "/production", "/equipment"],
  equipements: ["/", "/equipment", "/expenses"],
  logistique: ["/", "/sites", "/production", "/equipment", "/expenses"],
  auditeur: [
    "/", "/sites", "/teams", "/employees", "/production", "/expenses",
    "/cash", "/financial", "/equipment",
    "/weekly-reports", "/custom-reports",
  ],
};

// ── Built-in users ────────────────────────────────────────────────────────────
const BUILTIN: Record<string, { password: string; user: User }> = {
  "admin@goldmine.com": {
    password: "admin123",
    user: { id:"AU001", name:"Admin PDG", email:"admin@goldmine.com", role:"pdg" },
  },
  "manager@goldmine.com": {
    password: "manager123",
    user: { id:"AU002", name:"Manager Site 1", email:"manager@goldmine.com", role:"directeur", siteId:"S001" },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem("ag_currentUser");
      if (s) setUser(JSON.parse(s));
    } catch { localStorage.removeItem("ag_currentUser"); }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 250));
      const key = email.toLowerCase().trim();
      const pw  = password.trim();

      // 1. Built-in users
      const builtin = BUILTIN[key];
      if (builtin && builtin.password === pw) {
        setUser(builtin.user);
        localStorage.setItem("ag_currentUser", JSON.stringify(builtin.user));
        return;
      }

      // 2. Dynamic users from appUsers
      try {
        const raw = localStorage.getItem("ag_appUsers");
        if (raw) {
          const list = JSON.parse(raw) as any[];
          const found = list.find(u => u.email?.toLowerCase() === key && u.password === pw);
          if (found) {
            const u: User = {
              id: found.id, name: found.name, email: found.email,
              role: found.role as UserRole,
              siteId: found.siteId, teamId: found.teamId,
            };
            setUser(u);
            localStorage.setItem("ag_currentUser", JSON.stringify(u));
            return;
          }
        }
      } catch {}

      throw new Error("Email ou mot de passe incorrect");
    } finally { setIsLoading(false); }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ag_currentUser");
  };

  const hasPermission = (p: string): boolean => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(p) || perms.includes("write");
  };

  const hasRole = (r: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    return Array.isArray(r) ? r.includes(user.role) : user.role === r;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login, logout,
      hasPermission, hasRole,
      canWrite: user ? ROLE_PERMISSIONS[user.role]?.some(p => p === "write" || p.startsWith("write:")) : false,
      isAdmin: user?.role === "pdg",
    }}>
      {children}
    </AuthContext.Provider>
  );
}
