import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { calcTeamMetrics, calcSiteMetrics } from "@/lib/calculations";
import {
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

function useMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const goldPrice = s?.goldPriceUsd || s?.goldPrice || 65;
  return { fmt, goldPrice };
}

type ComparisonType = "sites" | "teams";

export default function PerformanceComparison() {
  const data = useData();
  // Safe access for both old and new DataContext
  const sites = data?.sites || [];
  const teams = data?.teams || [];
  const employees = data?.employees || [];
  const productions = data?.productions || [];
  const expenses = data?.expenses || [];

  const { fmt, goldPrice } = useMoney();
  const [comparisonType, setComparisonType] = useState<ComparisonType>("sites");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Sites comparison data (live)
  const sitesComparison = useMemo(() =>
    sites.map(site => {
      const m = calcSiteMetrics(site, teams, productions, expenses, goldPrice);
      const siteEmployees = teams.filter(t => t.siteId === site.id)
        .flatMap(t => employees.filter(e => e.teamId === t.id));
      return { id: site.id, name: site.name, ...m, employeeCount: siteEmployees.length };
    }),
    [sites, teams, productions, expenses, employees, goldPrice]
  );

  // Teams comparison data (live)
  const teamsComparison = useMemo(() =>
    teams.map(team => {
      const m = calcTeamMetrics(team, productions, expenses, goldPrice, sites);
      const teamEmployees = employees.filter(e => e.teamId === team.id);
      return { id: team.id, name: team.name, siteName: m.siteName, ...m, employeeCount: teamEmployees.length };
    }),
    [teams, productions, expenses, employees, sites, goldPrice]
  );

  const comparisonData = comparisonType === "sites" ? sitesComparison : teamsComparison;
  const available = comparisonData.map(i => i.id);

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedData = comparisonData.filter(i => selectedItems.includes(i.id));

  const barData = selectedData.map(i => ({
    name: i.name,
    "Recettes": Math.round((i as any).totalValue || 0),
    "Dépenses": Math.round((i as any).totalExpenses || 0),
    "Résultat": Math.round((i as any).netResult || 0),
  }));

  const radarData = [
    { subject: "Production", ...Object.fromEntries(selectedData.map(i => [i.name, (i as any).totalProduction || 0])) },
    { subject: "Rentabilité", ...Object.fromEntries(selectedData.map(i => [i.name, Math.max(0, (i as any).profitability || 0)])) },
    { subject: "Employés", ...Object.fromEntries(selectedData.map(i => [i.name, (i as any).employeeCount || 0])) },
  ];

  const COLORS = ["#b8860b", "#2563eb", "#16a34a", "#dc2626", "#7c3aed"];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Comparaison de Performance</h1>
          <p className="text-slate-500 text-sm">Analysez et comparez les performances entre {comparisonType === "sites" ? "sites" : "équipes"}</p>
        </div>

        {/* Type selector */}
        <div className="flex gap-3">
          {(["sites", "teams"] as ComparisonType[]).map(t => (
            <button key={t} onClick={() => { setComparisonType(t); setSelectedItems([]); }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${comparisonType === t ? "bg-amber-500 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
              {t === "sites" ? "🏭 Sites" : "👥 Équipes"}
            </button>
          ))}
        </div>

        {/* Item selector */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">
            Sélectionner les {comparisonType === "sites" ? "sites" : "équipes"} à comparer
          </CardTitle></CardHeader>
          <CardContent>
            {comparisonData.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun élément disponible</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedItems(available)}
                  className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200">
                  Tout sélectionner
                </button>
                <button onClick={() => setSelectedItems([])}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  Tout désélectionner
                </button>
                {comparisonData.map((item, i) => (
                  <button key={item.id} onClick={() => toggleItem(item.id)}
                    className={`px-3 py-1 text-xs rounded-full border-2 transition-all font-medium ${
                      selectedItems.includes(item.id)
                        ? "text-white border-transparent shadow"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                    style={selectedItems.includes(item.id) ? { backgroundColor: COLORS[i % COLORS.length] } : {}}>
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100">
            <Zap size={40} className="mx-auto mb-3 opacity-30" />
            <p>Sélectionnez au moins un {comparisonType === "sites" ? "site" : "équipe"} pour voir la comparaison</p>
          </div>
        ) : (
          <>
            {/* KPI comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedData.map((item, i) => {
                const m = item as any;
                return (
                  <Card key={item.id} className="bg-white border-l-4" style={{ borderLeftColor: COLORS[i % COLORS.length] }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm" style={{ color: COLORS[i % COLORS.length] }}>{item.name}</CardTitle>
                      {(m as any).siteName && <p className="text-xs text-slate-400">{(m as any).siteName}</p>}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        ["Or produit", `${(m.totalProduction || 0).toFixed(1)}g`],
                        ["Recettes", fmt(m.totalValue || 0)],
                        ["Dépenses", fmt(m.totalExpenses || 0)],
                        ["Résultat Net", fmt(m.netResult || 0)],
                        ["Rentabilité", `${(m.profitability || 0).toFixed(1)}%`],
                        ["Employés", String(m.employeeCount || 0)],
                      ].map(([l, v]) => (
                        <div key={l as string} className="flex justify-between">
                          <span className="text-xs text-slate-500">{l}</span>
                          <span className="text-xs font-semibold">{v}</span>
                        </div>
                      ))}
                      <div className={`mt-2 px-2 py-1 rounded-full text-center text-xs font-bold ${m.status === "Rentable" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {m.status}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Bar chart */}
            <Card className="bg-white">
              <CardHeader><CardTitle className="text-base">Comparaison Financière</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
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

            {/* Radar chart */}
            {selectedData.length >= 2 && (
              <Card className="bg-white">
                <CardHeader><CardTitle className="text-base">Radar de Performance</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fontSize: 9 }} />
                      {selectedData.map((item, i) => (
                        <Radar key={item.id} name={item.name} dataKey={item.name}
                          stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} />
                      ))}
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
