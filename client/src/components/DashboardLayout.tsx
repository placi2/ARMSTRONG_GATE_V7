import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/contexts/SettingsContext";
import { ROLE_NAV, ROLE_LABELS, ROLE_COLORS } from "@/contexts/AuthContext";
import {
  LayoutDashboard, MapPin, Users, UserCheck, Scale, DollarSign,
  Landmark, BarChart2, History, Package, Settings, TrendingUp,
  GitCompare, FileText, LogOut, ChevronLeft, ChevronRight, Building2, ClipboardList,
} from "lucide-react";

const ALL_NAV = [
  { path:"/",                    label:"Tableau de Bord",      icon:LayoutDashboard },
  { path:"/sites",               label:"Sites",                icon:MapPin          },
  { path:"/teams",               label:"Équipes",              icon:Users           },
  { path:"/employees",           label:"Employés",             icon:UserCheck       },
  { path:"/production",          label:"Production",           icon:Scale           },
  { path:"/expenses",            label:"Dépenses",             icon:DollarSign      },
  { path:"/cash",                label:"Caisse",               icon:Landmark        },
  { path:"/site-cash",           label:"Caisse par Site",      icon:Building2       },
  { path:"/equipment",           label:"Équipements",          icon:Package         },
  { path:"/financial",           label:"Résultats Financiers", icon:BarChart2       },
  { path:"/transaction-history", label:"Historique",           icon:History         },
  { path:"/comparison",          label:"Comparaison",          icon:GitCompare      },
  { path:"/performance-comparison",label:"Perf. Globale",      icon:TrendingUp      },
  { path:"/weekly-reports",      label:"Rapports Hebdo",       icon:FileText        },
  { path:"/custom-reports",      label:"Rapports PDF",         icon:FileText        },
  { path:"/settings",            label:"Paramètres",           icon:Settings        },
  { path:"/audit",                label:"Journal d'Audit",      icon:ClipboardList   },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, canWrite } = useAuth();
  const { settings } = useSettings();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const primaryColor = localStorage.getItem("ag_primaryColor") || "#b8860b";
  const r=parseInt(primaryColor.slice(1,3),16), g=parseInt(primaryColor.slice(3,5),16), b=parseInt(primaryColor.slice(5,7),16);
  const textOnPrimary = (0.299*r+0.587*g+0.114*b)/255 > 0.5 ? "#1a1a1a" : "#ffffff";

  const role = user?.role;
  const allowedPaths = role ? ROLE_NAV[role] || [] : [];
  const visibleNav = ALL_NAV.filter(n => allowedPaths.includes(n.path));
  const roleLabel = role ? ROLE_LABELS[role] : "";
  const roleColor = role ? ROLE_COLORS[role] : "";

  // Site name for scoped roles
  const siteName = user?.siteId
    ? (() => { try { const s=JSON.parse(localStorage.getItem("ag_sites")||"[]"); return s.find((x:any)=>x.id===user.siteId)?.name||user.siteId; } catch { return user.siteId; } })()
    : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${collapsed?"w-16":"w-64"} flex flex-col fixed h-full z-50 transition-all duration-200 shadow-lg`}
        style={{backgroundColor:primaryColor}}>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b" style={{borderColor:"rgba(255,255,255,0.15)"}}>
          {(() => {
            const logo = settings.customLogo || (() => { try { return localStorage.getItem("ag_logo_image"); } catch { return null; } })();
            return (
              <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden bg-white/20">
                {logo ? <img src={logo} alt="logo" className="w-full h-full object-cover"/> : <span className="text-lg">⛏</span>}
              </div>
            );
          })()}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{color:textOnPrimary}}>{settings.companyName||"ARMSTRONG GATE"}</p>
              <p className="text-xs opacity-70 truncate" style={{color:textOnPrimary}}>Gestion Aurifère</p>
            </div>
          )}
          <button onClick={()=>setCollapsed(!collapsed)} className="p-1 rounded hover:bg-white/10 shrink-0" style={{color:textOnPrimary}}>
            {collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && role && (
          <div className="mx-3 mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium w-full justify-center ${roleColor} bg-white/90`}>
              {roleLabel}
            </span>
            {siteName && (
              <p className="text-xs text-center mt-1 opacity-70 truncate px-1" style={{color:textOnPrimary}}>
                🏭 {siteName}
              </p>
            )}
            {!canWrite && (
              <p className="text-xs text-center mt-1 opacity-60" style={{color:textOnPrimary}}>
                👁 Lecture seule
              </p>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNav.map(({path,label,icon:Icon})=>{
            const active = location===path;
            return (
              <Link key={path} href={path}>
                <a className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                  style={{
                    color:textOnPrimary,
                    backgroundColor:active?"rgba(255,255,255,0.2)":"transparent",
                    borderLeft:active?`3px solid ${textOnPrimary}`:"3px solid transparent",
                  }}
                  onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLElement).style.backgroundColor="rgba(255,255,255,0.1)";}}
                  onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLElement).style.backgroundColor="transparent";}}>
                  <Icon size={18} className="shrink-0"/>
                  {!collapsed && <span className="truncate font-medium">{label}</span>}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t p-4" style={{borderColor:"rgba(255,255,255,0.15)"}}>
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium truncate" style={{color:textOnPrimary}}>{user?.name}</p>
              <p className="text-xs opacity-60 truncate" style={{color:textOnPrimary}}>{user?.email}</p>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100" style={{color:textOnPrimary}}>
            <LogOut size={16}/>{!collapsed && "Déconnexion"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${collapsed?"ml-16":"ml-64"} transition-all duration-200`}>
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
          </p>
          <div className="flex items-center gap-3">
            {!canWrite && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Lecture seule</span>}
            <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{backgroundColor:primaryColor}}>
              {(user?.name||"U")[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
