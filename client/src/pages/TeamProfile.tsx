import { useLocation, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { calcTeamMetrics } from "@/lib/calculations";
import { ArrowLeft, Users } from "lucide-react";
import Pagination, { usePagination } from "@/components/Pagination";

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


export default function TeamProfile() {
  const [location] = useLocation();
  const teamId = location.split("/team/")[1]?.split("?")[0]||"";
  const { teams, sites, employees, productions, expenses, advances } = useData();
  const { settings, fmt, sym, goldPrice } = useMoney();
  const team = teams.find(t=>t.id===teamId);

  if (!team) return (
    <DashboardLayout><div className="text-center py-20"><Users size={48} className="mx-auto mb-4 text-slate-300"/>
      <h2 className="text-xl font-bold text-slate-700 mb-2">Équipe non trouvée</h2>
      <p className="text-sm text-slate-400 mb-4">ID: "{teamId}" | Équipes: {teams.map(t=>t.name).join(", ")||"Aucune"}</p>
      <Link href="/teams"><Button className="bg-amber-500 hover:bg-amber-600 text-white"><ArrowLeft size={15} className="mr-1"/>Retour</Button></Link>
    </div></DashboardLayout>
  );

  const site = sites.find(s=>s.id===team.siteId);
  const m = calcTeamMetrics(team, productions, expenses, settings.goldPriceUsd, sites);
  const teamEmps = employees.filter(e=>e.teamId===team.id);
  const teamProds = [...productions.filter(p=>p.teamId===team.id)].sort((a,b)=>b.date.localeCompare(a.date));
  const teamExps = [...expenses.filter(e=>e.teamId===team.id)].sort((a,b)=>b.date.localeCompare(a.date));

  const {page:pp,perPage:ppp,paginated:ppag,total:pt,setPage:spp,setPerPage:sppp} = usePagination(teamProds,5);
  const {page:ep,perPage:epp,paginated:epag,total:et,setPage:sep,setPerPage:sepp} = usePagination(teamExps,5);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Link href="/teams"><Button variant="outline" size="sm"><ArrowLeft size={14} className="mr-1"/>Retour</Button></Link>
          <div><h1 className="text-2xl font-bold text-slate-900">{team.name}</h1><p className="text-slate-400 text-sm">Site: {site?.name||"—"} · Resp: {team.manager||"—"}</p></div>
          <span className={`ml-auto px-2 py-0.5 rounded-full text-sm font-bold ${m.status==="Rentable"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{m.status}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{l:"Or Produit",v:`${m.totalProduction.toFixed(1)}g`,c:"text-amber-600",bg:"bg-amber-50"},{l:"Valeur",v:fmt(m.totalValue),c:"text-green-600",bg:"bg-green-50"},{l:"Dépenses",v:fmt(m.totalExpenses),c:"text-red-600",bg:"bg-red-50"},{l:"Résultat",v:fmt(m.netResult),c:m.netResult>=0?"text-green-600":"text-red-600",bg:"bg-slate-50"}].map(s=>(
            <Card key={s.l} className={`${s.bg} border-0`}><CardContent className="pt-4"><p className="text-xs text-slate-400">{s.l}</p><p className={`text-lg font-bold ${s.c}`}>{s.v}</p></CardContent></Card>
          ))}
        </div>
        <Card className="bg-white"><CardContent className="pt-4">
          <div className="flex justify-between mb-1"><span className="text-sm font-medium">Rentabilité</span><span className="font-bold">{m.profitability.toFixed(1)}%</span></div>
          <div className="w-full bg-slate-200 rounded-full h-2"><div className={`h-2 rounded-full ${m.profitability>=0?"bg-green-500":"bg-red-500"}`} style={{width:`${Math.min(Math.abs(m.profitability),100)}%`}}/></div>
        </CardContent></Card>
        <Card className="bg-white"><CardHeader><CardTitle className="text-base">Membres ({teamEmps.length})</CardTitle></CardHeader>
          <CardContent><table className="w-full text-sm">
            <thead className="border-b"><tr>{["Nom","Fonction","Salaire","Avances","Net"].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>)}</tr></thead>
            <tbody>{teamEmps.length===0?<tr><td colSpan={5} className="text-center py-4 text-slate-400">Aucun membre</td></tr>:teamEmps.map(emp=>{
              const adv=advances.filter(a=>a.employeeId===emp.id).reduce((s,a)=>s+a.amount,0);
              const sal=emp.monthlySalary||0;
              return(<tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 px-3"><Link href={`/employee/${emp.id}`}><a className="text-blue-600 hover:underline">{emp.name}</a></Link></td>
                <td className="py-2 px-3 text-xs text-slate-400">{emp.function||"—"}</td>
                <td className="py-2 px-3">{fmt(sal)}</td>
                <td className="py-2 px-3 text-orange-600">{fmt(adv)}</td>
                <td className="py-2 px-3 font-bold text-green-600">{fmt(sal-adv)}</td>
              </tr>);
            })}</tbody>
          </table></CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white"><CardHeader><CardTitle className="text-base">Productions ({teamProds.length})</CardTitle></CardHeader>
            <CardContent><table className="w-full text-sm">
              <thead className="border-b"><tr>{["Date","Poids","Prix/g","Valeur"].map(h=><th key={h} className="text-left py-2 px-2 text-xs font-semibold text-slate-600">{h}</th>)}</tr></thead>
              <tbody>{ppag.length===0?<tr><td colSpan={4} className="text-center py-4 text-slate-400">Aucune production</td></tr>:ppag.map(p=>(
                <tr key={p.id} className="border-b border-slate-50"><td className="py-1.5 px-2">{p.date}</td><td className="py-1.5 px-2 text-amber-600 font-bold">{(p.weight||0).toFixed(1)}g</td><td className="py-1.5 px-2 text-xs">${p.pricePerGram||settings.goldPriceUsd}</td><td className="py-1.5 px-2 text-green-600">{fmt((p.weight||0)*(p.pricePerGram||settings.goldPriceUsd))}</td></tr>
              ))}</tbody>
            </table><Pagination total={pt} page={pp} perPage={ppp} onPageChange={spp} onPerPageChange={sppp}/></CardContent>
          </Card>
          <Card className="bg-white"><CardHeader><CardTitle className="text-base">Dépenses ({teamExps.length})</CardTitle></CardHeader>
            <CardContent><table className="w-full text-sm">
              <thead className="border-b"><tr>{["Date","Catégorie","Montant"].map(h=><th key={h} className="text-left py-2 px-2 text-xs font-semibold text-slate-600">{h}</th>)}</tr></thead>
              <tbody>{epag.length===0?<tr><td colSpan={3} className="text-center py-4 text-slate-400">Aucune dépense</td></tr>:epag.map(e=>(
                <tr key={e.id} className="border-b border-slate-50"><td className="py-1.5 px-2">{e.date}</td><td className="py-1.5 px-2 text-xs"><span className="bg-slate-100 px-1.5 py-0.5 rounded">{e.category}</span></td><td className="py-1.5 px-2 text-red-600 font-bold">{fmt(e.amount)}</td></tr>
              ))}</tbody>
            </table><Pagination total={et} page={ep} perPage={epp} onPageChange={sep} onPerPageChange={sepp}/></CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
