import { createContext, useState, ReactNode, useEffect } from "react";

export type UserRole = "admin" | "manager";

export interface User {
  id: string; name: string; email: string;
  role: UserRole; siteId?: string; avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Built-in users (managers are also stored in DataContext.appUsers for dynamic creation)
const BUILTIN_USERS: Record<string, { password: string; user: User }> = {
  "admin@goldmine.com": {
    password: "admin123",
    user: { id: "1", name: "Admin User", email: "admin@goldmine.com", role: "admin" },
  },
  "manager@goldmine.com": {
    password: "manager123",
    user: { id: "2", name: "Manager Site 1", email: "manager@goldmine.com", role: "manager", siteId: "S001" },
  },
};

const PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["view_all", "edit_all", "delete_all", "view_sites", "edit_sites", "delete_sites",
    "view_teams", "edit_teams", "delete_teams", "view_employees", "edit_employees",
    "delete_employees", "view_financial", "edit_financial", "view_cash", "edit_cash",
    "view_reports", "export_reports", "manage_users", "add_production", "add_expense"],
  manager: ["view_sites", "view_teams", "edit_teams", "view_employees", "edit_employees",
    "view_financial", "view_cash", "edit_cash", "view_reports", "export_reports",
    "add_production", "add_expense"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ag_currentUser");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem("ag_currentUser"); }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      
      // Check builtin users
      const match = BUILTIN_USERS[email];
      if (match && match.password === password) {
        setUser(match.user);
        localStorage.setItem("ag_currentUser", JSON.stringify(match.user));
        return;
      }

      // Check dynamic users from DataContext (stored in localStorage)
      const stored = localStorage.getItem("ag_appUsers");
      if (stored) {
        const appUsers = JSON.parse(stored);
        const dynUser = appUsers.find((u: any) => u.email === email && u.password === password);
        if (dynUser) {
          const u: User = { id: dynUser.id, name: dynUser.name, email: dynUser.email, role: dynUser.role, siteId: dynUser.siteId };
          setUser(u);
          localStorage.setItem("ag_currentUser", JSON.stringify(u));
          return;
        }
      }

      throw new Error("Email ou mot de passe incorrect");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ag_currentUser");
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(permission) || PERMISSIONS[user.role]?.includes("view_all") || false;
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    return Array.isArray(role) ? role.includes(user.role) : user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
