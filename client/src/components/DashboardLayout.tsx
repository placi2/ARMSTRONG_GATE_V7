import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/contexts/SettingsContext";
import {
  LayoutDashboard, MapPin, Users, UserCheck, Scale, DollarSign,
  Landmark, BarChart2, History, Package, Settings, TrendingUp,
  GitCompare, Clock, FileText, LogOut, ChevronLeft, ChevronRight, Building2,
} from "lucide-react";

const NAV = [
  { path: "/", label: "Tableau de Bord", icon: LayoutDashboard, roles: ["admin","manager"] },
  { path: "/sites", label: "Sites", icon: MapPin, roles: ["admin"] },
  { path: "/teams", label: "Équipes", icon: Users, roles: ["admin","manager"] },
  { path: "/employees", label: "Employés", icon: UserCheck, roles: ["admin","manager"] },
  { path: "/production", label: "Production", icon: Scale, roles: ["admin","manager"] },
  { path: "/expenses", label: "Dépenses", icon: DollarSign, roles: ["admin","manager"] },
  { path: "/cash", label: "Caisse", icon: Landmark, roles: ["admin","manager"] },
  { path: "/site-cash", label: "Caisse par Site", icon: Building2, roles: ["admin"] },
  { path: "/equipment", label: "Équipements", icon: Package, roles: ["admin","manager"] },
  { path: "/financial", label: "Résultats Financiers", icon: BarChart2, roles: ["admin","manager"] },
  { path: "/transaction-history", label: "Historique", icon: History, roles: ["admin","manager"] },
  { path: "/comparison", label: "Comparaison", icon: GitCompare, roles: ["admin"] },
  { path: "/performance-comparison", label: "Perf. Globale", icon: TrendingUp, roles: ["admin"] },
  { path: "/weekly-reports", label: "Rapports Hebdo", icon: Clock, roles: ["admin"] },
  { path: "/custom-reports", label: "Rapports PDF", icon: FileText, roles: ["admin","manager"] },
  { path: "/settings", label: "Paramètres", icon: Settings, roles: ["admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Get theme color from localStorage
  const primaryColor = localStorage.getItem("ag_primaryColor") || "#b8860b";

  // Calculate text color based on background luminance
  const r = parseInt(primaryColor.slice(1,3),16), g = parseInt(primaryColor.slice(3,5),16), b = parseInt(primaryColor.slice(5,7),16);
  const lum = (0.299*r + 0.587*g + 0.114*b)/255;
  const textOnPrimary = lum > 0.5 ? "#1a1a1a" : "#ffffff";

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role || ""));

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-64"} flex flex-col fixed h-full z-50 transition-all duration-200 shadow-lg`}
        style={{ backgroundColor: primaryColor }}>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          {(() => {
            const logo = settings.customLogo;
            return (
              <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden bg-white/20">
                {logo ? <img src={logo} alt="logo" className="w-full h-full object-cover" /> : <span className="text-lg">⛏</span>}
              </div>
            );
          })()}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: textOnPrimary }}>{settings.companyName || "ARMSTRONG GATE"}</p>
              <p className="text-xs truncate opacity-70" style={{ color: textOnPrimary }}>Gestion Aurifère</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-white/10 shrink-0" style={{ color: textOnPrimary }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Manager badge */}
        {user?.role === "manager" && !collapsed && (
          <div className="mx-3 mt-2 px-2 py-1 rounded text-xs text-center font-medium bg-white/20" style={{ color: textOnPrimary }}>
            Vue Manager — Site assigné
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNav.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link key={path} href={path}>
                <a className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                  style={{
                    color: textOnPrimary,
                    backgroundColor: active ? "rgba(255,255,255,0.2)" : "transparent",
                    borderLeft: active ? `3px solid ${textOnPrimary}` : "3px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate font-medium">{label}</span>}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t p-4" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium truncate" style={{ color: textOnPrimary }}>{user?.name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium" style={{ color: textOnPrimary }}>
                {user?.role === "admin" ? "👑 Admin" : "👤 Manager"}
              </span>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100" style={{ color: textOnPrimary }}>
            <LogOut size={16} />{!collapsed && "Déconnexion"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${collapsed ? "ml-16" : "ml-64"} transition-all duration-200`}>
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.name}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: primaryColor }}>
              {(user?.name || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
