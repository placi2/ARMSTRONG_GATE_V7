import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { calcTeamMetrics, calcSiteMetrics } from "@/lib/calculations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Search, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import Pagination, { usePagination } from "@/components/Pagination";

function useFormatMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const sym = (ctx as any).sym || (ctx as any).currencySymbol || (s?.currency === "CDF" ? "FC" : "$");
  const goldPrice = s?.goldPriceUsd || s?.goldPrice || 65;
  return { settings: ctx.settings, fmt, sym, goldPrice };
}

type SortKey = "name" | "production" | "expenses" | "result" | "profitability";

export default function Financial() {
  const { sites, teams, productions, expenses, cashMovements } = useData();
  const { fmt, sym, goldPrice } = useFormatMoney();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("production");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");

  // ── Correct data logic (no double counting) ──────────────────────────────
  // Recettes = valeur des productions
  const totalRecettes = useMemo(() =>
    productions.reduce((s, p) => s + ((p.weight || 0) * (p.pricePerGram || goldPrice)), 0),
    [productions, goldPrice]
  );

  // Dépenses = onglet Dépenses uniquement
  const totalDepenses = useMemo(() =>
    expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  // Caisse: entrées et sorties (SÉPARÉS des dépenses)
  const totalCashIn = useMemo(() =>
    cashMovements.filter(m => m.type === "entrée").reduce((s, m) => s + m.amount, 0),
    [cashMovements]
  );
  const totalCashOut = useMemo(() =>
    cashMovements.filter(m => m.type === "sortie").reduce((s, m) => s + m.amount, 0),
    [cashMovements]
  );

  // Bénéfice Net = Recettes - Dépenses (pas caisse)
  const beneficeNet = totalRecettes - totalDepenses;
  const profitability = totalRecettes > 0 ? (beneficeNet / totalRecettes) * 100 : 0;

  // ── Team details ──────────────────────────────────────────────────────────
  const teamData = useMemo(() =>
    teams.map(t => calcTeamMetrics(t, productions, expenses, goldPrice, sites)),
    [teams, productions, expenses, goldPrice, sites]
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filteredTeams = teamData
    .filter(t => !search || t.teamName.toLowerCase().includes(search.toLowerCase()) || t.siteName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const m = { name: [a.teamName, b.teamName], production: [a.totalValue, b.totalValue], expenses: [a.totalExpenses, b.totalExpenses], result: [a.netResult, b.netResult], profitability: [a.profitability, b.profitability] };
      const [va, vb] = m[sortKey];
      const cmp = typeof va === "string" ? (va as string).localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filteredTeams);

  // Site summary for chart
  const siteData = useMemo(() =>
    sites.map(s => calcSiteMetrics(s, teams, productions, expenses, goldPrice)),
    [sites, teams, productions, expenses, goldPrice]
  );

  const handleExport = () => {
    const lines = [
      "Indicateur,Valeur",
      `Recettes totales,${fmt(totalRecettes)}`,
      `Dépenses totales,${fmt(totalDepenses)}`,
      `Bénéfice Net,${fmt(beneficeNet)}`,
      `Rentabilité,${profitability.toFixed(1)}%`,
      `Entrées Caisse,${fmt(totalCashIn)}`,
      `Sorties Caisse,${fmt(totalCashOut)}`,
      `Solde Caisse,${fmt(totalCashIn - totalCashOut)}`,
      "", "Équipe,Site,Recettes,Dépenses,Résultat,Rentabilité",
      ...teamData.map(t => `${t.teamName},${t.siteName},${fmt(t.totalValue)},${fmt(t.totalExpenses)},${fmt(t.netResult)},${t.profitability.toFixed(1)}%`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "resultats_financiers.csv"; a.click();
    URL.revokeObjectURL(url); toast.success("Export téléchargé !");
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => handleSort(k)} className="flex items-center gap-1 hover:text-slate-900 transition-colors">
      {label} <ArrowUpDown size={11} className={sortKey === k ? "text-amber-500" : "text-slate-300"} />
    </button>
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Résultats Financiers</h1>
            <p className="text-slate-500 text-sm">Analyse sans double comptage Dépenses/Caisse</p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download size={14} className="mr-2" /> Exporter CSV
          </Button>
        </div>

        {/* KPI - 2 sections distinctes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section Production/Dépenses */}
          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">EXPLOITATION (Production vs Dépenses)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                ["Recettes (Ventes Or)", totalRecettes, "text-green-600"],
                ["Dépenses Totales", totalDepenses, "text-red-600"],
                ["─────────", null, ""],
                ["Bénéfice Net", beneficeNet, beneficeNet >= 0 ? "text-green-600 font-bold text-lg" : "text-red-600 font-bold text-lg"],
                [`Rentabilité`, `${profitability.toFixed(1)}%`, profitability >= 0 ? "text-green-600" : "text-red-600"],
              ].map(([l, v, c], i) => (
                l === "─────────" ? <hr key={i} className="border-slate-200" /> :
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{l}</span>
                  <span className={`font-semibold ${c}`}>
                    {typeof v === "number" ? fmt(v) : v}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section Caisse */}
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">TRÉSORERIE (Mouvements Caisse)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                ["Entrées Caisse", totalCashIn, "text-green-600"],
                ["Sorties Caisse", totalCashOut, "text-red-600"],
                ["─────────", null, ""],
                ["Solde Caisse", totalCashIn - totalCashOut, totalCashIn - totalCashOut >= 0 ? "text-blue-600 font-bold text-lg" : "text-red-600 font-bold text-lg"],
                ["Nb mouvements", String(cashMovements.length), "text-slate-600"],
              ].map(([l, v, c], i) => (
                l === "─────────" ? <hr key={i} className="border-slate-200" /> :
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{l}</span>
                  <span className={`font-semibold ${c}`}>
                    {typeof v === "number" ? fmt(v) : v}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Rentabilité bar */}
        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Rentabilité globale</span>
              <span className={`font-bold ${profitability >= 0 ? "text-green-600" : "text-red-600"}`}>{profitability.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className={`h-2 rounded-full ${profitability >= 0 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(Math.abs(profitability), 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        {siteData.length > 0 && (
          <Card className="bg-white">
            <CardHeader><CardTitle className="text-base">Performance par Site ({sym})</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={siteData.map(s => ({ name: s.siteName, Recettes: Math.round(s.totalValue), Dépenses: Math.round(s.totalExpenses), Résultat: Math.round(s.netResult) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Recettes" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="Dépenses" fill="#ef4444" radius={[3,3,0,0]} />
                  <Bar dataKey="Résultat" fill="#b8860b" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Team table with sort */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-3">
              <CardTitle className="text-base">Détail par Équipe <span className="text-sm font-normal text-slate-400">({filteredTeams.length})</span></CardTitle>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600"><SortBtn k="name" label="Équipe"/></th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Site</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Or (g)</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600"><SortBtn k="production" label="Recettes"/></th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600"><SortBtn k="expenses" label="Dépenses"/></th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600"><SortBtn k="result" label="Résultat"/></th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600"><SortBtn k="profitability" label="Rentab."/></th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400">Aucune équipe</td></tr>
                ) : paginated.map(t => (
                  <tr key={t.teamId} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium whitespace-nowrap">{t.teamName}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{t.siteName}</td>
                    <td className="py-2 px-3 text-amber-600 font-bold">{t.totalProduction.toFixed(1)}</td>
                    <td className="py-2 px-3 text-green-600 whitespace-nowrap">{fmt(t.totalValue)}</td>
                    <td className="py-2 px-3 text-red-600 whitespace-nowrap">{fmt(t.totalExpenses)}</td>
                    <td className={`py-2 px-3 font-bold whitespace-nowrap ${t.netResult >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(t.netResult)}</td>
                    <td className="py-2 px-3 text-xs">{t.profitability.toFixed(1)}%</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.status === "Rentable" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
