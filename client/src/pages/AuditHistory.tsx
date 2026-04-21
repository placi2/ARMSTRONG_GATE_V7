import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import RbacGuard from "@/components/RbacGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Pagination, { usePagination } from "@/components/Pagination";
import { useAudit, type AuditLog, type AuditAction } from "@/contexts/AuditContext";
import { useRbac } from "@/hooks/useRbac";
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/contexts/AuthContext";
import { Search, Download, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN:  "bg-purple-100 text-purple-700",
  LOGOUT: "bg-slate-100 text-slate-600",
};
const ACTION_ICONS: Record<AuditAction, string> = {
  CREATE: "✚", UPDATE: "✎", DELETE: "✕", LOGIN: "→", LOGOUT: "←",
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" })
      + " " + d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
  } catch { return iso; }
}

export default function AuditHistory() {
  const { logs, clearLogs } = useAudit();
  const rbac = useRbac();
  const [search, setSearch]         = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterUser,   setFilterUser]   = useState("all");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [showClear,    setShowClear]    = useState(false);

  // Admin-only page
  if (!rbac.canManageUsers) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert size={48} className="text-slate-300 mb-4"/>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Accès réservé au PDG</h2>
          <p className="text-slate-400 text-sm max-w-xs">
            L'historique des modifications est une information confidentielle visible uniquement par le PDG / Propriétaire.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Unique users for filter
  const uniqueUsers = useMemo(() => {
    const map: Record<string, string> = {};
    logs.forEach(l => { map[l.userId] = l.userName; });
    return Object.entries(map);
  }, [logs]);

  const uniqueModules = useMemo(() =>
    [...new Set(logs.map(l => l.module))].sort(), [logs]);

  const filtered = useMemo(() =>
    logs.filter(l => {
      const ms = !search ||
        l.userName?.toLowerCase().includes(search.toLowerCase()) ||
        l.itemName?.toLowerCase().includes(search.toLowerCase()) ||
        l.details?.toLowerCase().includes(search.toLowerCase()) ||
        l.module?.toLowerCase().includes(search.toLowerCase());
      const ma = filterAction === "all" || l.action === filterAction;
      const mm = filterModule === "all" || l.module === filterModule;
      const mu = filterUser   === "all" || l.userId === filterUser;
      const mf = !dateFrom || l.timestamp >= dateFrom;
      const mt = !dateTo   || l.timestamp <= dateTo + "T23:59:59";
      return ms && ma && mm && mu && mf && mt;
    }), [logs, search, filterAction, filterModule, filterUser, dateFrom, dateTo]
  );

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered, 25);

  const handleExport = () => {
    const lines = [
      "Date/Heure,Utilisateur,Rôle,Action,Module,Élément,Détails,Site",
      ...filtered.map(l =>
        `"${formatDate(l.timestamp)}","${l.userName}","${l.userRole}","${l.action}","${l.module}","${l.itemName||""}","${l.details||""}","${l.siteName||""}"`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `audit_armstrong_gate_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`${filtered.length} lignes exportées`);
  };

  // Stats
  const stats = useMemo(() => ({
    total: logs.length,
    creates: logs.filter(l=>l.action==="CREATE").length,
    updates: logs.filter(l=>l.action==="UPDATE").length,
    deletes: logs.filter(l=>l.action==="DELETE").length,
    users:   [...new Set(logs.map(l=>l.userId))].length,
  }), [logs]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Historique des Modifications</h1>
            <p className="text-slate-500 text-sm">{logs.length} entrée(s) · Visible uniquement par le PDG</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download size={14} className="mr-2"/>Exporter CSV
            </Button>
            <Button onClick={() => setShowClear(true)} variant="outline" size="sm"
              className="text-red-600 hover:bg-red-50 border-red-200">
              <Trash2 size={14} className="mr-2"/>Vider
            </Button>
          </div>
        </div>

        {/* Confirm clear dialog */}
        {showClear && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-red-700 font-medium">⚠️ Supprimer tout l'historique d'audit ? Action irréversible.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>setShowClear(false)}>Annuler</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
                onClick={()=>{ clearLogs(); setShowClear(false); toast.success("Historique vidé"); }}>
                Confirmer
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l:"Total entrées", v:stats.total, c:"text-slate-900", bg:"bg-slate-50" },
            { l:"Créations",     v:stats.creates, c:"text-green-700", bg:"bg-green-50" },
            { l:"Modifications", v:stats.updates, c:"text-blue-700",  bg:"bg-blue-50"  },
            { l:"Suppressions",  v:stats.deletes, c:"text-red-700",   bg:"bg-red-50"   },
            { l:"Utilisateurs actifs", v:stats.users, c:"text-purple-700", bg:"bg-purple-50" },
          ].map(s => (
            <Card key={s.l} className={`${s.bg} border-0`}>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-slate-500">{s.l}</p>
                <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap bg-white rounded-xl p-3 border border-slate-100">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Rechercher utilisateur, élément, détail..." value={search}
              onChange={e=>{ setSearch(e.target.value); setPage(1); }} className="pl-9 h-9"/>
          </div>
          <select value={filterAction} onChange={e=>{ setFilterAction(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white h-9">
            <option value="all">Toutes actions</option>
            <option value="CREATE">✚ Création</option>
            <option value="UPDATE">✎ Modification</option>
            <option value="DELETE">✕ Suppression</option>
          </select>
          <select value={filterModule} onChange={e=>{ setFilterModule(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white h-9">
            <option value="all">Tous modules</option>
            {uniqueModules.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterUser} onChange={e=>{ setFilterUser(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white h-9">
            <option value="all">Tous utilisateurs</option>
            {uniqueUsers.map(([uid,uname])=><option key={uid} value={uid}>{uname}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e=>{ setDateFrom(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white h-9"/>
          <input type="date" value={dateTo} onChange={e=>{ setDateTo(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white h-9"/>
          {(search||filterAction!=="all"||filterModule!=="all"||filterUser!=="all"||dateFrom||dateTo) && (
            <Button variant="outline" size="sm" className="h-9"
              onClick={()=>{ setSearch(""); setFilterAction("all"); setFilterModule("all"); setFilterUser("all"); setDateFrom(""); setDateTo(""); setPage(1); }}>
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">
              Journal d'Audit
              <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length} résultat{filtered.length>1?"s":""})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShieldAlert size={40} className="mx-auto mb-3 opacity-20"/>
                <p>Aucune modification enregistrée</p>
                <p className="text-xs mt-1">Les modifications apparaîtront ici dès qu'un utilisateur crée, modifie ou supprime des données</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100">
                      <tr>
                        {["Date & Heure","Utilisateur","Rôle","Action","Module","Élément","Détails"].map(h=>(
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-slate-400">Aucun résultat pour ces filtres</td></tr>
                      ) : paginated.map((l: AuditLog) => (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2 px-3 whitespace-nowrap text-xs font-mono text-slate-500">
                            {formatDate(l.timestamp)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800 text-xs">{l.userName}</div>
                            <div className="text-xs text-slate-400">{l.userId}</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[l.userRole as UserRole] || "bg-slate-100 text-slate-600"}`}>
                              {ROLE_LABELS[l.userRole as UserRole] || l.userRole}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ACTION_COLORS[l.action]}`}>
                              {ACTION_ICONS[l.action]} {l.action}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{l.module}</span>
                          </td>
                          <td className="py-2 px-3 text-xs font-medium text-slate-700 max-w-32 truncate" title={l.itemName}>
                            {l.itemName || "—"}
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-500 max-w-56 truncate" title={l.details}>
                            {l.details || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage}/>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
