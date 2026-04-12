import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddExpenseForm from "@/components/AddExpenseForm";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import Pagination, { usePagination } from "@/components/Pagination";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Search } from "lucide-react";

// ── Safe settings helper (works with any SettingsContext version) ──────────────
function useMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmtFn = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice || (ctx as any).currencyDisplay ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const symbol = (ctx as any).sym || (ctx as any).currencySymbol || (s?.currency === "CDF" ? "FC" : "$");
  const gp = s?.goldPriceUsd || s?.goldPrice || 65;
  return { settings: ctx.settings, fmt: fmtFn, sym: symbol, goldPrice: gp };
}


const CATS = ["Alimentation","Salaires","Transport","Carburant","Matériel","Équipement","Sécurité","Médical","Autre"];

export default function Expenses() {
  const { expenses, teams, sites, deleteExpense } = useData();
  const { settings, fmt, sym, goldPrice } = useMoney();
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = [...expenses].sort((a,b) => b.date.localeCompare(a.date)).filter(e => {
    const team = teams.find(t => t.id === e.teamId);
    const ms = !search || team?.name?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase()) || (e.comment||"").toLowerCase().includes(search.toLowerCase());
    const mt = filterTeam === "all" || e.teamId === filterTeam;
    const mc = filterCat === "all" || e.category === filterCat;
    const mf = !dateFrom || e.date >= dateFrom;
    const mt2 = !dateTo || e.date <= dateTo;
    return ms && mt && mc && mf && mt2;
  });

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);
  const totalAmount = filtered.reduce((s,e) => s + e.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div><h1 className="text-2xl font-bold text-slate-900">Dépenses</h1><p className="text-slate-500 text-sm">{expenses.length} dépense(s)</p></div>
          <AddExpenseForm/>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total (filtrées)", value: fmt(Math.round(totalAmount)), color: "text-red-600" },
            { label: "Nombre", value: filtered.length, color: "text-slate-900" },
            { label: "Moyenne", value: fmt(filtered.length > 0 ? Math.round(totalAmount/filtered.length) : 0), color: "text-blue-600" },
          ].map(s => <Card key={s.label} className="bg-white"><CardContent className="pt-4">
            <p className="text-xs text-slate-500">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </CardContent></Card>)}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9"/></div>
          <select value={filterTeam} onChange={e => { setFilterTeam(e.target.value); setPage(1); }} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Toutes équipes</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Toutes catégories</option>{CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-1 text-xs text-slate-500">Du <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white ml-1"/></div>
          <div className="flex items-center gap-1 text-xs text-slate-500">Au <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white ml-1"/></div>
          {(search||filterTeam!=="all"||filterCat!=="all"||dateFrom||dateTo) && <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterTeam("all"); setFilterCat("all"); setDateFrom(""); setDateTo(""); setPage(1); }}>Réinitialiser</Button>}
        </div>

        <Card className="bg-white"><CardHeader><CardTitle className="text-sm">Dépenses ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b"><tr>{["Date","Équipe","Site","Catégorie","Montant","Commentaire",""].map(h => (
                <th key={h} className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">{h}</th>
              ))}</tr></thead>
              <tbody>{paginated.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-slate-400">Aucune dépense</td></tr>
                : paginated.map(e => {
                  const team = teams.find(t => t.id === e.teamId);
                  const site = sites.find(s => s.id === (e.siteId || team?.siteId));
                  return (
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3">{e.date}</td>
                      <td className="py-2 px-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{team?.name||"—"}</span></td>
                      <td className="py-2 px-3 text-xs text-slate-500">{site?.name||"—"}</td>
                      <td className="py-2 px-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{e.category}</span></td>
                      <td className="py-2 px-3 font-bold text-red-600">{fmt(e.amount)}</td>
                      <td className="py-2 px-3 text-xs text-slate-500">{e.comment||e.description||"—"}</td>
                      <td className="py-2 px-3"><DeleteConfirmButton itemName={`Dépense ${e.category}`} onDelete={() => deleteExpense(e.id)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage}/>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
