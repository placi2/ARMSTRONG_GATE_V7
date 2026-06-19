import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination, { usePagination } from "@/components/Pagination";

const GROUPS: Record<string, string[]> = {
  "Équipements":  ["Équipement","Matériel","Sécurité"],
  "Logistique":   ["Transport","Carburant","Location"],
  "Employés":     ["Salaires","Avance Salaire","Avances salaires","Alimentation","Médical"],
  "Autre":        ["Autre"],
};

const GROUP_COLORS: Record<string, string> = {
  "Équipements": "bg-blue-50 text-blue-700 border-blue-200",
  "Logistique":  "bg-orange-50 text-orange-700 border-orange-200",
  "Employés":    "bg-purple-50 text-purple-700 border-purple-200",
  "Autre":       "bg-slate-50 text-slate-700 border-slate-200",
};

const GROUP_ICONS: Record<string, string> = {
  "Équipements": "🔧",
  "Logistique":  "🚛",
  "Employés":    "👥",
  "Autre":       "📦",
};

const today = () => new Date().toISOString().split("T")[0];
const firstDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };

export default function FinanceDashboard() {
  const { expenses, sites, teams, salaryDeductions, advances } = useData() as any;

  const [dateFrom, setDateFrom] = useState(firstDay());
  const [dateTo, setDateTo]     = useState(today());
  const [filterSite, setFilterSite] = useState("all");
  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch]     = useState("");

  // Filtrer les dépenses
  const filtered = expenses.filter((e: any) => {
    const team = teams.find((t: any) => t.id === e.teamId);
    const inSite = filterSite === "all" || team?.siteId === filterSite || e.siteId === filterSite;
    const inDate = (!dateFrom || e.date >= dateFrom) && (!dateTo || e.date <= dateTo);
    const inSearch = !search || e.category?.toLowerCase().includes(search.toLowerCase()) ||
      (e.comment||"").toLowerCase().includes(search.toLowerCase());
    return inSite && inDate && inSearch;
  });

  // Grouper les dépenses
  const getGroup = (category: string) => {
    for (const [group, cats] of Object.entries(GROUPS)) {
      if (cats.includes(category)) return group;
    }
    return "Autre";
  };

  const groupTotals = Object.keys(GROUPS).map(group => {
    const groupExpenses = filtered.filter((e: any) => getGroup(e.category) === group);
    const total = groupExpenses.reduce((s: number, e: any) => s + parseFloat(e.amount||0), 0);
    return { group, total, count: groupExpenses.length };
  });

  // Déductions équipement en cours
  const deductionsEnCours = salaryDeductions.filter((d: any) => d.status === "en_cours");
  const totalDeductions = deductionsEnCours.reduce((s: number, d: any) =>
    s + (parseFloat(d.amountTotal) - parseFloat(d.amountPaid)), 0);

  // Avances en cours
  const filteredAdvances = advances.filter((a: any) => {
    const inSite = filterSite === "all" || a.siteId === filterSite;
    const inDate = (!dateFrom || a.date >= dateFrom) && (!dateTo || a.date <= dateTo);
    return inSite && inDate;
  });
  const totalAdvances = filteredAdvances.reduce((s: number, a: any) => s + parseFloat(a.amount||0), 0);

  const totalGeneral = filtered.reduce((s: number, e: any) => s + parseFloat(e.amount||0), 0);

  // Dépenses filtrées par groupe actif
  const displayExpenses = activeGroup === "all"
    ? filtered
    : filtered.filter((e: any) => getGroup(e.category) === activeGroup);

  const pag = usePagination(displayExpenses);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold">Tableau de Bord Finance</h1>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Du</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Au</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <select value={filterSite} onChange={e => setFilterSite(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous les sites</option>
          {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
          placeholder="🔍 Rechercher catégorie, commentaire..." />
      </div>

      {/* Total général */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex justify-between items-center">
        <p className="text-sm text-amber-700 font-medium">Total général des dépenses</p>
        <p className="text-2xl font-bold text-amber-700">${totalGeneral.toFixed(2)}</p>
      </div>

      {/* Cards par groupe */}
      <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4">
        <button onClick={() => setActiveGroup("all")}
          className={`rounded-lg p-4 border text-left transition-all ${activeGroup==="all"?"ring-2 ring-amber-400 bg-amber-50 border-amber-200":"bg-white border-slate-200 hover:bg-slate-50"}`}>
          <p className="text-lg font-bold">📊 Tout</p>
          <p className="text-2xl font-bold text-slate-700">${totalGeneral.toFixed(0)}</p>
          <p className="text-xs text-slate-500">{filtered.length} dépenses</p>
        </button>
        {groupTotals.map(({ group, total, count }) => (
          <button key={group} onClick={() => setActiveGroup(group)}
            className={`rounded-lg p-4 border text-left transition-all ${activeGroup===group?"ring-2 ring-amber-400":""} ${GROUP_COLORS[group]} hover:opacity-90`}>
            <p className="text-sm font-medium">{GROUP_ICONS[group]} {group}</p>
            <p className="text-2xl font-bold">${total.toFixed(0)}</p>
            <p className="text-xs opacity-70">{count} dépenses</p>
          </button>
        ))}
      </div>

      {/* Tableau dépenses */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-700 text-sm">
            {activeGroup === "all" ? "Toutes les dépenses" : `${GROUP_ICONS[activeGroup]} ${activeGroup}`}
            <span className="ml-2 text-slate-400">({displayExpenses.length})</span>
          </h2>
          <span className="font-bold text-amber-600">
            ${displayExpenses.reduce((s: number, e: any) => s + parseFloat(e.amount||0), 0).toFixed(2)}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Catégorie</th>
              <th className="px-4 py-2">Groupe</th>
              <th className="px-4 py-2">Site / Équipe</th>
              <th className="px-4 py-2">Commentaire</th>
              <th className="px-4 py-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {(pag.paginated as any[]).map((e: any) => {
              const team = teams.find((t: any) => t.id === e.teamId);
              const site = sites.find((s: any) => s.id === (team?.siteId || e.siteId));
              const group = getGroup(e.category);
              return (
                <tr key={e.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-500">{e.date}</td>
                  <td className="px-4 py-2">{e.category}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${GROUP_COLORS[group]}`}>
                      {GROUP_ICONS[group]} {group}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {site?.name || "—"} / {team?.name || "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{e.comment || "—"}</td>
                  <td className="px-4 py-2 text-right font-bold text-red-600">${parseFloat(e.amount||0).toFixed(2)}</td>
                </tr>
              );
            })}
            {displayExpenses.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucune dépense</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4">
          <Pagination total={pag.total} page={pag.page} perPage={pag.perPage}
            onPageChange={pag.setPage} onPerPageChange={pag.setPerPage} />
        </div>
      </div>
    </DashboardLayout>
  );
}