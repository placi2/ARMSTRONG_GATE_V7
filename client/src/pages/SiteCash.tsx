import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { calcSiteMetrics } from "@/lib/calculations";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Pagination, { usePagination } from "@/components/Pagination";

function useFormatMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const goldPrice = s?.goldPriceUsd || s?.goldPrice || 65;
  return { fmt, goldPrice };
}

export default function SiteCash() {
  const { sites, teams, productions, expenses, cashMovements } = useData();
  const { fmt, goldPrice } = useFormatMoney();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Per-site summary
  const siteSummaries = sites.map(site => {
    const metrics = calcSiteMetrics(site, teams, productions, expenses, goldPrice);
    const siteMvts = cashMovements.filter(m => m.siteId === site.id);
    const cashIn = siteMvts.filter(m => m.type === "entrée").reduce((s, m) => s + m.amount, 0);
    const cashOut = siteMvts.filter(m => m.type === "sortie").reduce((s, m) => s + m.amount, 0);
    // Last 6 productions and expenses for this site
    const siteTeamIds = teams.filter(t => t.siteId === site.id).map(t => t.id);
    const recentProds = [...productions.filter(p => siteTeamIds.includes(p.teamId) || p.siteId === site.id)]
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const recentExps = [...expenses.filter(e => siteTeamIds.includes(e.teamId) || e.siteId === site.id)]
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    return { site, metrics, cashIn, cashOut, cashBalance: cashIn - cashOut, siteMvts, recentProds, recentExps };
  });

  const selected = siteSummaries.find(s => s.site.id === selectedSiteId);
  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(selected?.siteMvts || []);

  if (selectedSiteId && selected) {
    return (
      <DashboardLayout>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedSiteId(null)}>
              <ArrowLeft size={14} className="mr-1" /> Retour
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Caisse — {selected.site.name}</h1>
              <p className="text-slate-400 text-sm">{selected.siteMvts.length} mouvement(s) · Lecture seule</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Entrées Caisse", v: fmt(selected.cashIn), c: "text-green-600", bg: "bg-green-50" },
              { l: "Sorties Caisse", v: fmt(selected.cashOut), c: "text-red-600", bg: "bg-red-50" },
              { l: "Solde Caisse", v: fmt(selected.cashBalance), c: selected.cashBalance >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50" },
              { l: "Dépenses (onglet)", v: fmt(selected.metrics.totalExpenses), c: "text-orange-600", bg: "bg-orange-50" },
            ].map(s => (
              <Card key={s.l} className={`${s.bg} border-0`}>
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-400">{s.l}</p>
                  <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 6 last productions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white">
              <CardHeader><CardTitle className="text-base">6 Dernières Productions</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="border-b"><tr>{["Date","Équipe","Poids","Valeur"].map(h=><th key={h} className="text-left py-1 px-2 text-xs text-slate-600">{h}</th>)}</tr></thead>
                  <tbody>
                    {selected.recentProds.length === 0 ? <tr><td colSpan={4} className="text-center py-3 text-slate-400 text-xs">Aucune production</td></tr>
                    : selected.recentProds.map(p => {
                      const team = teams.find(t => t.id === p.teamId);
                      return (
                        <tr key={p.id} className="border-b border-slate-50">
                          <td className="py-1.5 px-2">{p.date}</td>
                          <td className="py-1.5 px-2 text-xs text-slate-500">{team?.name || "—"}</td>
                          <td className="py-1.5 px-2 text-amber-600 font-bold">{(p.weight||0).toFixed(1)}g</td>
                          <td className="py-1.5 px-2 text-green-600">{fmt((p.weight||0)*(p.pricePerGram||goldPrice))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader><CardTitle className="text-base">6 Dernières Dépenses</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="border-b"><tr>{["Date","Catégorie","Montant"].map(h=><th key={h} className="text-left py-1 px-2 text-xs text-slate-600">{h}</th>)}</tr></thead>
                  <tbody>
                    {selected.recentExps.length === 0 ? <tr><td colSpan={3} className="text-center py-3 text-slate-400 text-xs">Aucune dépense</td></tr>
                    : selected.recentExps.map(e => (
                      <tr key={e.id} className="border-b border-slate-50">
                        <td className="py-1.5 px-2">{e.date}</td>
                        <td className="py-1.5 px-2 text-xs text-slate-500">{e.category}</td>
                        <td className="py-1.5 px-2 text-red-600 font-bold">{fmt(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mouvements de caisse */}
          <Card className="bg-white">
            <CardHeader><CardTitle className="text-base">Mouvements de Caisse ({selected.siteMvts.length})</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>{["Date","Type","Catégorie","Mode","Montant","Commentaire"].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-6 text-slate-400">Aucun mouvement</td></tr>
                  : paginated.map(m => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3">{m.date}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.type==="entrée"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
                          {m.type==="entrée"?"▲":"▼"} {m.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs">{m.category||"—"}</td>
                      <td className="py-2 px-3 text-xs text-slate-400">{m.paymentMethod||"—"}</td>
                      <td className={`py-2 px-3 font-bold ${m.type==="entrée"?"text-green-600":"text-red-600"}`}>
                        {m.type==="entrée"?"+":"-"}{fmt(m.amount)}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-400">{m.comment||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage}/>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Main view - site selection
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Caisse par Site</h1>
          <p className="text-slate-500 text-sm">Vue lecture seule — Les saisies se font dans l'onglet Caisse</p>
        </div>

        {sites.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>Aucun site créé.</p>
            <Link href="/sites"><Button className="mt-3 bg-amber-500 hover:bg-amber-600 text-white">Créer un site</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteSummaries.map(({ site, cashIn, cashOut, cashBalance, metrics, siteMvts }) => (
              <Card key={site.id}
                className="bg-white hover:shadow-lg transition-all cursor-pointer border-2 hover:border-amber-300"
                onClick={() => setSelectedSiteId(site.id)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{site.name}</CardTitle>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cashBalance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {cashBalance >= 0 ? "✓" : "✗"} {cashBalance >= 0 ? "Positif" : "Négatif"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{site.location} · {siteMvts.length} mvt(s)</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-xs text-slate-400">Entrées Caisse</p>
                      <p className="font-bold text-green-600">{fmt(cashIn)}</p>
                    </div>
                    <div className="bg-red-50 rounded p-2">
                      <p className="text-xs text-slate-400">Sorties Caisse</p>
                      <p className="font-bold text-red-600">{fmt(cashOut)}</p>
                    </div>
                    <div className="bg-orange-50 rounded p-2">
                      <p className="text-xs text-slate-400">Dépenses</p>
                      <p className="font-bold text-orange-600">{fmt(metrics.totalExpenses)}</p>
                    </div>
                    <div className="bg-amber-50 rounded p-2">
                      <p className="text-xs text-slate-400">Recettes Or</p>
                      <p className="font-bold text-amber-600">{fmt(metrics.totalValue)}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">Solde Caisse</p>
                      <p className={`text-lg font-bold ${cashBalance >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(cashBalance)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-center text-slate-400 mt-2">Cliquer pour voir les détails →</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
