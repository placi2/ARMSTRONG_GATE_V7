import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import RbacGuard, { ReadOnlyBanner } from "@/components/RbacGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import Pagination, { usePagination } from "@/components/Pagination";
import SearchableSelect from "@/components/SearchableSelect";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useRbac } from "@/hooks/useRbac";
import { Search, Plus, Lock } from "lucide-react";
import { toast } from "sonner";

function useFormatMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || ((v: number) => { const n = v.toLocaleString("fr-FR", {maximumFractionDigits:2}); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const sym = (ctx as any).sym || (s?.currency === "CDF" ? "FC" : "$");
  const goldPrice = s?.goldPriceUsd || s?.goldPrice || 65;
  return { fmt, sym, goldPrice };
}

function AddProductionDialog() {
  const { teams, sites, allTeams, addProduction } = useData() as any;
  const { sym, goldPrice } = useFormatMoney();
  const rbac = useRbac();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(rbac.teamId || ""); // pre-fill for chef_equipe
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");

  // Chef d'équipe: locked to his team only
  const availableTeams = rbac.scopedToTeam && rbac.teamId
    ? (allTeams || teams).filter((t: any) => t.id === rbac.teamId)
    : rbac.scopedToSite && rbac.siteId
      ? (allTeams || teams).filter((t: any) => t.siteId === rbac.siteId)
      : teams;

  const teamOptions = availableTeams.map((t: any) => ({
    value: t.id, label: t.name,
    subtitle: (sites || []).find((s: any) => s.id === t.siteId)?.name || "",
  }));

  const w = parseFloat(weight) || 0;
  const estimated = w * goldPrice;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!teamId) { toast.error("Équipe obligatoire"); return; }
    if (!weight || w <= 0) { toast.error("Poids invalide"); return; }

    // Security: chef_equipe can only add for his team
    if (rbac.scopedToTeam && rbac.teamId && teamId !== rbac.teamId) {
      toast.error("Vous ne pouvez enregistrer la production que pour votre équipe");
      return;
    }

    const team = availableTeams.find((t: any) => t.id === teamId);
    const siteId = team?.siteId || "";
    addProduction({ teamId, siteId, date, weight: w, pricePerGram: goldPrice, estimatedValue: estimated, value: estimated });
    toast.success(`Production de ${w}g enregistrée`);
    setWeight(""); if (!rbac.scopedToTeam) setTeamId("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white"><Plus size={15} className="mr-2"/>Ajouter Production</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]" onPointerDownOutside={e=>e.preventDefault()}>
        <DialogHeader><DialogTitle>Enregistrer une Production</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Équipe *{rbac.scopedToTeam && <span className="text-xs text-amber-600 ml-2">⛏ Votre équipe uniquement</span>}</Label>
            {rbac.scopedToTeam ? (
              <div className="mt-1 px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium text-slate-700">
                {teamOptions[0]?.label || "Équipe non trouvée"}
              </div>
            ) : (
              <SearchableSelect options={teamOptions} value={teamId} onChange={setTeamId} placeholder="Sélectionner une équipe..." className="mt-1"/>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={date} max={new Date().toISOString().split("T")[0]} onChange={e=>setDate(e.target.value)} className="mt-1"/></div>
            <div><Label>Poids (g) *</Label><Input type="number" step="0.01" min="0" value={weight} onChange={e=>setWeight(e.target.value)} className="mt-1"/></div>
          </div>
          <div>
            <Label>Prix de l'or</Label>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Lock size={13} className="text-amber-600"/>
              <span className="text-sm font-bold text-amber-700">{sym}{goldPrice}/g</span>
              <span className="text-xs text-slate-400 ml-1">· Modifiable dans Paramètres (PDG uniquement)</span>
            </div>
          </div>
          {w > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between">
              <span className="text-sm text-green-700">Valeur estimée</span>
              <span className="font-bold text-green-700">{sym}{Math.round(estimated).toLocaleString("fr-FR")}</span>
            </div>
          )}
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={()=>setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Production() {
  const { productions, teams, sites, deleteProduction } = useData();
  const { fmt, sym, goldPrice } = useFormatMoney();
  const rbac = useRbac();
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("all");
  const [filterTeam, setFilterTeam] = useState(rbac.teamId || "all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = [...productions].sort((a,b)=>b.date.localeCompare(a.date)).filter(p => {
    const team = teams.find((t:any)=>t.id===p.teamId);
    const site = sites.find((s:any)=>s.id===(p.siteId||team?.siteId));
    const ms = !search || team?.name?.toLowerCase().includes(search.toLowerCase()) || site?.name?.toLowerCase().includes(search.toLowerCase());
    const mSite = filterSite==="all" || (p.siteId||team?.siteId)===filterSite;
    const mTeam = filterTeam==="all" || p.teamId===filterTeam;
    const mFrom = !dateFrom || p.date>=dateFrom;
    const mTo = !dateTo || p.date<=dateTo;
    return ms && mSite && mTeam && mFrom && mTo;
  });

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);
  const totalWeight = productions.reduce((s:number,p:any)=>s+(p.weight||0),0);
  const totalVal = productions.reduce((s:number,p:any)=>s+((p.weight||0)*(p.pricePerGram||goldPrice)),0);

  return (
    <DashboardLayout>
      <ReadOnlyBanner/>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Production d'Or</h1>
            <p className="text-slate-500 text-sm">{productions.length} enreg. · {totalWeight.toFixed(1)}g · {fmt(totalVal)}
              {rbac.scopedToTeam && <span className="ml-2 text-amber-600 font-medium">— Votre équipe uniquement</span>}
            </p>
          </div>
          <RbacGuard allowed={rbac.canAddProduction}>
            <AddProductionDialog/>
          </RbacGuard>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{l:"Poids Total",v:`${totalWeight.toFixed(1)}g`,c:"text-amber-600"},{l:"Valeur Totale",v:fmt(totalVal),c:"text-green-600"},{l:"Prix Or",v:`${sym}${goldPrice}/g`,c:"text-blue-600"}].map(s=>(
            <Card key={s.l} className="bg-white"><CardContent className="pt-4"><p className="text-xs text-slate-400">{s.l}</p><p className={`text-xl font-bold ${s.c}`}>{s.v}</p></CardContent></Card>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Rechercher..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="pl-9"/></div>
          {!rbac.scopedToSite && !rbac.scopedToTeam && (
            <select value={filterSite} onChange={e=>{setFilterSite(e.target.value);setFilterTeam("all");setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="all">Tous les sites</option>{sites.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {!rbac.scopedToTeam && (
            <select value={filterTeam} onChange={e=>{setFilterTeam(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="all">Toutes équipes</option>{teams.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"/>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"/>
        </div>
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Enregistrements <span className="text-sm font-normal text-slate-400">({filtered.length})</span></CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100"><tr>
                {["Date","Site","Équipe","Poids (g)",`Prix/g (${sym})`,"Valeur",""].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>)}
              </tr></thead>
              <tbody>
                {paginated.length===0?<tr><td colSpan={7} className="text-center py-8 text-slate-400">Aucune production</td></tr>:
                paginated.map((p:any)=>{
                  const team=teams.find((t:any)=>t.id===p.teamId);
                  const site=sites.find((s:any)=>s.id===(p.siteId||team?.siteId));
                  const val=(p.weight||0)*(p.pricePerGram||goldPrice);
                  return(<tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3">{p.date}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{site?.name||"—"}</td>
                    <td className="py-2 px-3 text-xs">{team?.name||"—"}</td>
                    <td className="py-2 px-3 font-bold text-amber-600">{(p.weight||0).toFixed(1)}g</td>
                    <td className="py-2 px-3">{sym}{p.pricePerGram||goldPrice}</td>
                    <td className="py-2 px-3 font-bold text-green-600">{fmt(val)}</td>
                    <td className="py-2 px-3">
                      <RbacGuard allowed={rbac.canDeleteProduction}>
                        <DeleteConfirmButton itemName={`Production ${p.date}`} onDelete={()=>deleteProduction(p.id)}/>
                      </RbacGuard>
                    </td>
                  </tr>);
                })}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage}/>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
