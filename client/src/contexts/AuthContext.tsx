import { createContext, useState, ReactNode, useEffect } from "react";
import { api } from "@/lib/api";

export type UserRole = "pdg"|"directeur"|"rh"|"finance"|"chef_equipe"|"equipements"|"logistique"|"auditeur";
export interface User { id:string;name:string;email:string;role:UserRole;siteId?:string;teamId?:string; }
export interface AuthContextType {
  user:User|null;isAuthenticated:boolean;isLoading:boolean;
  login:(email:string,password:string)=>Promise<void>;logout:()=>void;
  hasPermission:(p:string)=>boolean;hasRole:(r:UserRole|UserRole[])=>boolean;
  canWrite:boolean;isAdmin:boolean;
}
export const AuthContext = createContext<AuthContextType|undefined>(undefined);

export const ROLE_LABELS:Record<UserRole,string> = {
  pdg:"👑 PDG / Propriétaire",directeur:"🏭 Directeur de Site",rh:"👥 Responsable RH",
  finance:"💰 Chargé de Finance",chef_equipe:"⛏ Chef d'Équipe",equipements:"🔧 Resp. Équipements",
  logistique:"🚛 Resp. Logistique",auditeur:"📋 Auditeur / Comptable",
};
export const ROLE_COLORS:Record<UserRole,string> = {
  pdg:"bg-amber-100 text-amber-800",directeur:"bg-blue-100 text-blue-800",rh:"bg-purple-100 text-purple-800",
  finance:"bg-green-100 text-green-800",chef_equipe:"bg-orange-100 text-orange-800",
  equipements:"bg-gray-100 text-gray-800",logistique:"bg-cyan-100 text-cyan-800",auditeur:"bg-slate-100 text-slate-700",
};
export const ROLE_NAV:Record<UserRole,string[]> = {
  pdg:["/","/sites","/teams","/employees","/production","/expenses","/cash","/site-cash","/equipment","/financial","/transaction-history","/comparison","/performance-comparison","/weekly-reports","/custom-reports","/settings","/audit","/requests","/salary-deductions"],
  directeur:["/teams","/employees","/production","/expenses","/cash","/equipment","/financial","/transaction-history","/weekly-reports","/custom-reports","/equipment-movements"],
  rh:["/employees","/teams","/requests","/attendance","/salary-deductions"],
  finance:["/","/financial","/cash","/site-cash","/expenses","/transaction-history","/weekly-reports","/custom-reports","/requests","/salary-deductions"],
  chef_equipe:["/production","/equipment","/requests","/attendance"],
  equipements:["/equipment","/expenses","/requests","/equipment-stock","/equipment-movements"],
  logistique:["/sites","/production","/equipment","/expenses","/requests"],
  auditeur:["/sites","/teams","/employees","/production","/expenses","/cash","/financial","/equipment","/weekly-reports","/custom-reports"],
};

export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null);
  const [isLoading,setIsLoading]=useState(true);

  useEffect(()=>{
    try {
      const s=localStorage.getItem("ag_currentUser");
      const t=localStorage.getItem("ag_token");
      // Only restore session if BOTH user and token exist
      if(s && t) setUser(JSON.parse(s));
      else {
        // Clean up orphaned data
        localStorage.removeItem("ag_currentUser");
        localStorage.removeItem("ag_token");
      }
    } catch {}
    setIsLoading(false);
  },[]);

  const login=async(email:string,password:string)=>{
    setIsLoading(true);
    try {
      const {token,user:u}=await api.login(email,password);
      // CRITICAL: save BOTH token and user
      localStorage.setItem("ag_token", token);
      localStorage.setItem("ag_currentUser", JSON.stringify(u));
      setUser(u);
    }
    finally { setIsLoading(false); }
  };

  const logout=()=>{
    setUser(null);
    localStorage.removeItem("ag_token");
    localStorage.removeItem("ag_currentUser");
  };

  return <AuthContext.Provider value={{
    user,isAuthenticated:!!user,isLoading,login,logout,
    hasPermission:()=>!!user,
    hasRole:(r)=>!user?false:Array.isArray(r)?r.includes(user.role):user.role===r,
    canWrite:user?.role!=="auditeur",
    isAdmin:user?.role==="pdg",
  }}>{children}</AuthContext.Provider>;
}
