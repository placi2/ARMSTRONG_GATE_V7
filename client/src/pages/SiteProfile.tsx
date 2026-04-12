import { useLocation, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { calcSiteMetrics, calcTeamMetrics } from "@/lib/calculations";
import { ArrowLeft, MapPin } from "lucide-react";

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


export default function SiteProfile() {
  const [location] = useLocation();
  const siteId = location.split("/site/")[1]?.split("?")[0] || "";
  const { sites, teams, productions, expenses, goldStocks } = useData();
  const { settings, fmt, sym, goldPrice } = useMoney();
  const site = sites.find(s => s.id === siteId);

  if (!site) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <MapPin size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Site non trouvé</h2>
        <p className="text-slate-400 text-sm mb-4">ID: "{siteId}" | Sites disponibles: {sites.map(s=>s.name).join(", ")||"Aucun"}</p>
        <Link href="/sites"><Button className="bg-amber-500 hover:bg-amber-600 text-white"><ArrowLeft size={16} className="mr-2"/>Retour</Button></Link>
      </div>
    </DashboardLayout>
  );

  const m = calcSiteMetrics(site, teams, productions, expenses, settings.goldPriceUsd);
  const siteTeams = teams.filter(t => t.siteId === site.id);
  const stock = goldStocks?.find(s => s.siteId === site.id);
  const totalProd = productions.filter(p => siteTeams.some(t => t.id === p.teamId)).reduce((s, p) => s + (p.weight||0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Link href="/sites"><Button variant="outline" size="sm"><ArrowLeft size={15} className="mr-1"/>Retour</Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{site.name}</h1>
            <p className="text-slate-400 text-sm flex items-center gap-1"><MapPin size={12}/>{site.location}</p>
          </div>
          <span className={`ml-auto px-2 py-0.5 rounded-full text-sm font-bold ${m.status==="Rentable"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{m.status}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:"Or Produit", v:`${m.totalProduction.toFixed(1)}g`, c:"text-amber-600", bg:"bg-amber-50"},
            {l:"Valeur Production", v:fmt(m.totalValue), c:"text-green-600", bg:"bg-green-50"},
            {l:"Dépenses", v:fmt(m.totalExpenses), c:"text-red-600", bg:"bg-red-50"},
            {l:"Résultat Net", v:fmt(m.netResult), c:m.netResult>=0?"text-green-600":"text-red-600", bg:"bg-slate-50"},
          ].map(s=>(
            <Card key={s.l} className={`${s.bg} border-0`}><CardContent className="pt-4">
              <p className="text-xs text-slate-400">{s.l}</p><p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white"><CardContent className="pt-4">
            <div className="flex justify-between mb-1"><span className="text-sm font-medium">Rentabilité</span><span className="font-bold">{m.profitability.toFixed(1)}%</span></div>
            <div className="w-full bg-slate-200 rounded-full h-2"><div className={`h-2 rounded-full ${m.profitability>=0?"bg-green-500":"bg-red-500"}`} style={{width:`${Math.min(Math.abs(m.profitability),100)}%`}}/></div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="text-center bg-slate-50 rounded p-2"><p className="text-xs text-slate-400">Équipes</p><p className="font-bold text-blue-600">{m.teamCount}</p></div>
              <div className="text-center bg-slate-50 rounded p-2"><p className="text-xs text-slate-400">Responsable</p><p className="font-medium text-sm">{site.manager||"—"}</p></div>
            </div>
          </CardContent></Card>
          <Card className="bg-amber-50 border-amber-200"><CardHeader className="pb-2"><CardTitle className="text-amber-700 text-base">⚖️ Stock d'Or</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[["Total produit",`${totalProd.toFixed(2)}g`,"text-amber-700"],["Stock actuel",`${(stock?.currentStock??totalProd).toFixed(2)}g`,"text-amber-600"],["Valeur stock",fmt((stock?.currentStock??totalProd)*settings.goldPriceUsd),"text-green-600"]].map(([l,v,c])=>(
                <div key={l as string} className="flex justify-between"><span className="text-slate-600 text-sm">{l}</span><span className={`font-bold ${c}`}>{v}</span></div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white"><CardHeader><CardTitle className="text-base">Équipes ({siteTeams.length})</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b"><tr>{["Équipe","Responsable","Or (g)","Valeur","Dépenses","Résultat","Rentabilité","Statut"].map(h=>(
                <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>
              ))}</tr></thead>
              <tbody>
                {siteTeams.length===0?<tr><td colSpan={8} className="text-center py-6 text-slate-400">Aucune équipe</td></tr>:
                siteTeams.map(team=>{
                  const tm=calcTeamMetrics(team,productions,expenses,settings.goldPriceUsd,sites);
                  return(<tr key={team.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3"><Link href={`/team/${team.id}`}><a className="text-blue-600 hover:underline">{team.name}</a></Link></td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{team.manager||"—"}</td>
                    <td className="py-2 px-3 font-bold text-amber-600">{tm.totalProduction.toFixed(1)}</td>
                    <td className="py-2 px-3 text-green-600">{fmt(tm.totalValue)}</td>
                    <td className="py-2 px-3 text-red-600">{fmt(tm.totalExpenses)}</td>
                    <td className={`py-2 px-3 font-bold ${tm.netResult>=0?"text-green-600":"text-red-600"}`}>{fmt(tm.netResult)}</td>
                    <td className="py-2 px-3">{tm.profitability.toFixed(1)}%</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tm.status==="Rentable"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{tm.status}</span></td>
                  </tr>);
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
