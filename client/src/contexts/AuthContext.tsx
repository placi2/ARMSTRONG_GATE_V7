import { createContext, useState, ReactNode, useEffect } from "react";

export type UserRole = "admin" | "manager";
export interface User { id:string; name:string; email:string; role:UserRole; siteId?:string; }
export interface AuthContextType {
  user:User|null; isAuthenticated:boolean; isLoading:boolean;
  login:(email:string,password:string)=>Promise<void>; logout:()=>void;
  hasPermission:(p:string)=>boolean; hasRole:(r:UserRole|UserRole[])=>boolean;
}

export const AuthContext = createContext<AuthContextType|undefined>(undefined);

// Built-in users — IDs match DataContext seed data
const BUILTIN: Record<string,{password:string;user:User}> = {
  "admin@goldmine.com":   { password:"admin123",   user:{id:"AU001",name:"Admin User",   email:"admin@goldmine.com",   role:"admin"                } },
  "manager@goldmine.com": { password:"manager123", user:{id:"AU002",name:"Manager Site 1",email:"manager@goldmine.com",role:"manager",siteId:"S001"} },
};

const PERMS: Record<UserRole,string[]> = {
  admin:   ["view_all","edit_all","delete_all","manage_users","view_sites","view_teams","view_employees","view_financial","view_cash","view_reports","add_production","add_expense"],
  manager: ["view_sites","view_teams","view_employees","view_financial","view_cash","view_reports","add_production","add_expense"],
};

export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null);
  const [isLoading,setIsLoading]=useState(true);

  useEffect(()=>{
    try {
      const s=localStorage.getItem("ag_currentUser");
      if(s) setUser(JSON.parse(s));
    } catch { localStorage.removeItem("ag_currentUser"); }
    setIsLoading(false);
  },[]);

  const login = async (email:string, password:string) => {
    setIsLoading(true);
    try {
      await new Promise(r=>setTimeout(r,250));
      const key = email.toLowerCase().trim();
      const pw  = password.trim();

      // 1. Check builtin
      const builtin = BUILTIN[key];
      if (builtin && builtin.password === pw) {
        setUser(builtin.user);
        localStorage.setItem("ag_currentUser", JSON.stringify(builtin.user));
        return;
      }

      // 2. Check dynamic appUsers stored in localStorage
      try {
        const raw = localStorage.getItem("ag_appUsers");
        if (raw) {
          const list = JSON.parse(raw) as any[];
          const found = list.find(u => u.email?.toLowerCase() === key && u.password === pw);
          if (found) {
            const u: User = {
              id:      found.id,
              name:    found.name,
              email:   found.email,
              role:    found.role as UserRole,
              siteId:  found.siteId,
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

  const logout = () => { setUser(null); localStorage.removeItem("ag_currentUser"); };
  const hasPermission = (p:string) => { if(!user) return false; return PERMS[user.role]?.includes(p)||PERMS[user.role]?.includes("view_all")||false; };
  const hasRole = (r:UserRole|UserRole[]) => { if(!user) return false; return Array.isArray(r)?r.includes(user.role):user.role===r; };

  return (
    <AuthContext.Provider value={{user,isAuthenticated:!!user,isLoading,login,logout,hasPermission,hasRole}}>
      {children}
    </AuthContext.Provider>
  );
}
