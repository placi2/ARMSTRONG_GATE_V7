import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { calcGlobalMetrics, calcTeamMetrics, calcSiteMetrics } from "@/lib/calculations";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Scale, Download, Users } from "lucide-react";
import AddAdvanceForm from "@/components/AddAdvanceForm";
import { toast } from "sonner";

// Safe format helper - works with ANY SettingsContext version
function useSafeSettings() {
  const ctx = useSettings();
  const settings = ctx.settings;

  // Support both old API (getFormattedPrice) and new API (fmt)
  const formatMoney = (ctx as any).fmt
    || (ctx as any).formatAmount
    || (ctx as any).getFormattedPrice
    || ((v: number) => {
      const currency = settings?.currency || "USD";
      const n = Math.round(v).toLocaleString("fr-FR");
      return currency === "CDF" ? `${n} FC` : `$${n}`;
    });

  const symbol = (ctx as any).sym
    || (ctx as any).currencySymbol
    || (settings?.currency === "CDF" ? "FC" : "$");

  const goldPrice = settings?.goldPriceUsd || (settings as any)?.goldPrice || 65;

  return { settings, fmt: formatMoney, sym: symbol, goldPrice };
}

export default function Dashboard() {
  const { sites, teams, productions, expenses, cashMovements, employees } = useData();
  const { settings, fmt, sym, goldPrice } = useSafeSettings();
  const { user } = useAuth();

  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [filterSite, setFilterSite] = useState("");
  const [filterTeam, setFilterTeam] = useState("");

  // Filtered data
  const filteredProds = useMemo(() =>
    productions.filter(p => {
      const inDate = (!dateFrom || p.date >= dateFrom) && (!dateTo || p.date <= dateTo);
      const inSite = !filterSite || (teams.find(t => t.id === p.teamId)?.siteId === filterSite) || p.siteId === filterSite;
      const inTeam = !filterTeam || p.teamId === filterTeam;
      return inDate && inSite && inTeam;
    }), [productions, dateFrom, dateTo, filterSite, filterTeam, teams]
  );

  const filteredExps = useMemo(() =>
    expenses.filter(e => {
      const inDate = (!dateFrom || e.date >= dateFrom) && (!dateTo || e.date <= dateTo);
      const inSite = !filterSite || (teams.find(t => t.id === e.teamId)?.siteId === filterSite) || e.siteId === filterSite;
      const inTeam = !filterTeam || e.teamId === filterTeam;
      return inDate && inSite && inTeam;
    }), [expenses, dateFrom, dateTo, filterSite, filterTeam, teams]
  );

  const global = useMemo(() =>
    calcGlobalMetrics(filteredProds, filteredExps, cashMovements, goldPrice),
    [filteredProds, filteredExps, cashMovements, goldPrice]
  );

  const siteData = useMemo(() =>
    sites.map(s => calcSiteMetrics(s, teams, filteredProds, filteredExps, goldPrice)),
    [sites, teams, filteredProds, filteredExps, goldPrice]
  );

  const teamData = useMemo(() =>
    teams.map(t => calcTeamMetrics(t, filteredProds, filteredExps, goldPrice, sites))
      .sort((a, b) => b.totalValue - a.totalValue),
    [teams, filteredProds, filteredExps, goldPrice, sites]
  );

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { month: string; production: number; depenses: number; resultat: number }> = {};
    productions.forEach(p => {
      const m = (p.date || "").slice(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { month: m, production: 0, depenses: 0, resultat: 0 };
      months[m].production += (p.weight || 0) * (p.pricePerGram || goldPrice);
    });
    expenses.forEach(e => {
      const m = (e.date || "").slice(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { month: m, production: 0, depenses: 0, resultat: 0 };
      months[m].depenses += e.amount;
    });
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(m => ({ ...m, resultat: m.production - m.depenses }));
  }, [productions, expenses, goldPrice]);

  const handleExport = () => {
    const lines = [
      "Indicateur,Valeur",
      `Production totale,${global.totalProduction.toFixed(1)}g`,
      `Valeur production,${fmt(global.totalValue)}`,
      `Depenses totales,${fmt(global.totalExpenses)}`,
      `Resultat net,${fmt(global.netResult)}`,
      `Rentabilite,${global.profitability.toFixed(1)}%`,
      `Solde caisse,${fmt(global.cashBalance)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dashboard.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé !");
  };

  const visibleTeams = filterSite ? teams.filter(t => t.siteId === filterSite) : teams;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
            <p className="text-slate-500 text-sm">
              {user?.role === "manager"
                ? `Vue Manager — ${sites[0]?.name || "Site assigné"}`
                : "Vue globale — Admin"}
            </p>
          </div>
          <div className="flex gap-2">
            <AddAdvanceForm />
            <Button onClick={handleExport} variant="outline" size="sm"><Download size={14} className="mr-2" /> Exporter CSV</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Du</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 text-xs bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Au</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 text-xs bg-white" />
          </div>
          {user?.role === "admin" && (
            <>
              <select value={filterSite} onChange={e => { setFilterSite(e.target.value); setFilterTeam(""); }}
                className="border border-slate-200 rounded px-2 py-1 text-xs bg-white">
                <option value="">Tous les sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs bg-white">
                <option value="">Toutes équipes</option>
                {visibleTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </>
          )}
          {(filterSite || filterTeam) && (
            <button onClick={() => { setFilterSite(""); setFilterTeam(""); }}
              className="text-xs text-slate-400 hover:text-slate-600 underline">
              Réinitialiser
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Production", value: `${global.totalProduction.toFixed(1)}g`, sub: `${productions.length} enreg.`, color: "text-amber-600", bg: "bg-amber-50", icon: <Scale size={18} /> },
            { label: "Valeur Or", value: fmt(global.totalValue), sub: `${sym}${goldPrice}/g`, color: "text-green-600", bg: "bg-green-50", icon: <TrendingUp size={18} /> },
            { label: "Dépenses", value: fmt(global.totalExpenses), sub: `${expenses.length} enreg.`, color: "text-red-600", bg: "bg-red-50", icon: <TrendingDown size={18} /> },
            { label: "Résultat Net", value: fmt(global.netResult), sub: `${global.profitability.toFixed(1)}%`, color: global.netResult >= 0 ? "text-green-600" : "text-red-600", bg: global.netResult >= 0 ? "bg-green-50" : "bg-red-50", icon: <DollarSign size={18} /> },
            { label: "Solde Caisse", value: fmt(global.cashBalance), sub: `${cashMovements.length} mvt`, color: global.cashBalance >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50", icon: <DollarSign size={18} /> },
            { label: "Employés", value: String(employees.length), sub: `${teams.length} équipe(s)`, color: "text-purple-600", bg: "bg-purple-50", icon: <Users size={18} /> },
          ].map(s => (
            <Card key={s.label} className="bg-white shadow-sm">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <div className={`w-7 h-7 ${s.bg} ${s.color} rounded-lg flex items-center justify-center`}>{s.icon}</div>
                </div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rentabilité */}
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Rentabilité globale</span>
              <span className={`font-bold ${global.profitability >= 0 ? "text-green-600" : "text-red-600"}`}>
                {global.profitability.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${global.profitability >= 0 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(Math.abs(global.profitability), 100)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                ["Productions", productions.length, "text-amber-600"],
                ["Dépenses enreg.", expenses.length, "text-red-600"],
                ["Mvt Caisse", cashMovements.length, "text-blue-600"],
              ].map(([l, v, c]) => (
                <div key={l as string} className="text-center bg-slate-50 rounded p-2">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className={`font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {monthlyTrend.length > 0 && (
            <Card className="bg-white shadow-sm">
              <CardHeader><CardTitle className="text-base">Tendance Mensuelle ({sym})</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="production" stroke="#10b981" name="Production" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="depenses" stroke="#ef4444" name="Dépenses" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="resultat" stroke="#b8860b" name="Résultat" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {siteData.length > 0 && (
            <Card className="bg-white shadow-sm">
              <CardHeader><CardTitle className="text-base">Performance Sites ({sym})</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={siteData.map(s => ({
                    name: s.siteName,
                    Production: Math.round(s.totalValue),
                    Dépenses: Math.round(s.totalExpenses),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="Production" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Dépenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Teams table */}
        <Card className="bg-white shadow-sm">
          <CardHeader><CardTitle className="text-base">Performance des Équipes</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    {["#", "Équipe", "Site", "Or (g)", "Valeur", "Dépenses", "Résultat", "Rentabilité", "Statut"].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-semibold text-slate-600 text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamData.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-slate-400">Aucune équipe</td></tr>
                  ) : teamData.slice(0, 10).map((t, i) => (
                    <tr key={t.teamId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 text-xs text-slate-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium whitespace-nowrap">{t.teamName}</td>
                      <td className="py-2 px-3 text-xs text-slate-400 whitespace-nowrap">{t.siteName}</td>
                      <td className="py-2 px-3 font-bold text-amber-600">{t.totalProduction.toFixed(1)}</td>
                      <td className="py-2 px-3 text-green-600 whitespace-nowrap">{fmt(t.totalValue)}</td>
                      <td className="py-2 px-3 text-red-600 whitespace-nowrap">{fmt(t.totalExpenses)}</td>
                      <td className={`py-2 px-3 font-bold whitespace-nowrap ${t.netResult >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(t.netResult)}</td>
                      <td className="py-2 px-3 text-xs">{t.profitability.toFixed(1)}%</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.status === "Rentable" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
