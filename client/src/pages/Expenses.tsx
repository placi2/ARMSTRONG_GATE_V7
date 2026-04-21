import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import RbacGuard, { ReadOnlyBanner } from "@/components/RbacGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Pagination, { usePagination } from "@/components/Pagination";
import SearchableSelect from "@/components/SearchableSelect";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useRbac } from "@/hooks/useRbac";
import { Search, Plus, Info } from "lucide-react";
import { toast } from "sonner";

function useFormatMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || ((v:number)=>{ const n=v.toLocaleString("fr-FR",{maximumFractionDigits:2}); return s?.currency==="CDF"?`${n} FC`:`$${n}`; });
  const sym = (ctx as any).sym || (s?.currency==="CDF"?"FC":"$");
  return { fmt, sym };
}

const ALL_CATS = ["Alimentation","Salaires","Transport","Carburant","Matériel","Équipement","Sécurité","Médical","Autre"];

function AddExpenseDialog() {
  const { teams, sites, allTeams, addExpense } = useData() as any;
  const { fmt, sym } = useFormatMoney();
  const rbac = useRbac();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], teamId:"", category:"", amount:"", comment:"" });

  // Restrict categories per role
  const allowedCats = rbac.allowedExpenseCategories === "all" ? ALL_CATS : rbac.allowedExpenseCategories as string[];

  // Restrict teams per role
  const availableTeams = rbac.scopedToSite && rbac.siteId
    ? (allTeams||teams).filter((t:any)=>t.siteId===rbac.siteId)
    : teams;

  const teamOptions = availableTeams.map((t:any)=>({
    value:t.id, label:t.name,
    subtitle:(sites||[]).find((s:any)=>s.id===t.siteId)?.name||""
  }));

  const amt = parseFloat(form.amount)||0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!form.teamId||!form.category||!form.amount) { toast.error("Champs obligatoires"); return; }
    if (amt <= 0) { toast.error("Montant invalide"); return; }
    // Enforce category restriction
    if (rbac.allowedExpenseCategories !== "all" && !allowedCats.includes(form.category)) {
      toast.error(`Votre rôle n'autorise que les catégories: ${allowedCats.join(", ")}`); return;
    }
    const team = availableTeams.find((t:any)=>t.id===form.teamId);
    addExpense({ date:form.date, teamId:form.teamId, siteId:team?.siteId, category:form.category, amount:amt, comment:form.comment });
    toast.success(`Dépense de ${fmt(amt)} enregistrée`);
    setForm({ date:new Date().toISOString().split("T")[0], teamId:"", category:"", amount:"", comment:"" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white"><Plus size={15} className="mr-2"/>Ajouter Dépense</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]" onPointerDownOutside={e=>e.preventDefault()}>
        <DialogHeader><DialogTitle>Enregistrer une Dépense</DialogTitle></DialogHeader>
        {rbac.allowedExpenseCategories !== "all" && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <Info size={13} className="mt-0.5 shrink-0"/>
            <span>Votre rôle est limité aux catégories : <strong>{allowedCats.join(", ")}</strong></span>
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="mt-1"/></div>
            <div><Label>Catégorie *</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value="">Sélectionner...</option>
                {allowedCats.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><Label>Équipe *</Label>
            <SearchableSelect className="mt-1" options={teamOptions} value={form.teamId} onChange={v=>setForm({...form,teamId:v})} placeholder="Sélectionner une équipe..."/>
          </div>
          <div><Label>Montant ({sym}) *</Label>
            <Input type="number" step="any" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="mt-1"/>
            {amt>0&&<p className="text-xs text-slate-400 mt-0.5">= {fmt(amt)}</p>}
          </div>
          <div><Label>Commentaire</Label><Input value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} className="mt-1"/></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={()=>setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Expenses() {
  const { expenses, teams, sites, deleteExpense } = useData();
  const { fmt } = useFormatMoney();
  const rbac = useRbac();
  const [search, setSearch] = useState(""); const [filterCat, setFilterCat] = useState("all");
  const [filterSite, setFilterSite] = useState("all"); const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(()=>
    [...expenses].sort((a,b)=>b.date.localeCompare(a.date)).filter(e=>{
      const team=(teams as any[]).find(t=>t.id===e.teamId);
      const site=(sites as any[]).find(s=>s.id===(e.siteId||team?.siteId));
      const ms=!search||e.category?.toLowerCase().includes(search.toLowerCase())||(e.comment||"").toLowerCase().includes(search.toLowerCase())||team?.name?.toLowerCase().includes(search.toLowerCase());
      const mc=filterCat==="all"||e.category===filterCat;
      const mSite=filterSite==="all"||(e.siteId||team?.siteId)===filterSite;
      const mFrom=!dateFrom||e.date>=dateFrom; const mTo=!dateTo||e.date<=dateTo;
      return ms&&mc&&mSite&&mFrom&&mTo;
    }),[expenses,teams,sites,search,filterCat,filterSite,dateFrom,dateTo]);

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);
  const totalAmt = useMemo(()=>filtered.reduce((s,e)=>s+e.amount,0),[filtered]);
  const allowedCats = rbac.allowedExpenseCategories==="all" ? ALL_CATS : rbac.allowedExpenseCategories as string[];

  return (
    <DashboardLayout>
      <ReadOnlyBanner/>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dépenses</h1>
            <p className="text-slate-500 text-sm">{expenses.length} enreg. · Total filtré: <strong>{fmt(totalAmt)}</strong>
              {rbac.scopedToTransport && <span className="ml-2 text-cyan-600 font-medium">— Transport uniquement</span>}
            </p>
          </div>
          <RbacGuard allowed={rbac.canAddExpense}><AddExpenseDialog/></RbacGuard>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Rechercher..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="pl-9"/></div>
          <select value={filterCat} onChange={e=>{setFilterCat(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Toutes catégories</option>
            {allowedCats.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          {!rbac.scopedToSite&&<select value={filterSite} onChange={e=>{setFilterSite(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous sites</option>{(sites as any[]).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>}
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"/>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"/>
          {(search||filterCat!=="all"||filterSite!=="all"||dateFrom||dateTo)&&<Button variant="outline" size="sm" onClick={()=>{setSearch("");setFilterCat("all");setFilterSite("all");setDateFrom("");setDateTo("");setPage(1);}}>Réinitialiser</Button>}
        </div>
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Dépenses <span className="text-sm font-normal text-slate-400">({filtered.length})</span></CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100"><tr>
                {["Date","Site","Équipe","Catégorie","Montant","Commentaire",""].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>)}
              </tr></thead>
              <tbody>
                {paginated.length===0?<tr><td colSpan={7} className="text-center py-8 text-slate-400">Aucune dépense</td></tr>:
                paginated.map((e:any)=>{
                  const team=(teams as any[]).find(t=>t.id===e.teamId);
                  const site=(sites as any[]).find(s=>s.id===(e.siteId||team?.siteId));
                  return(<tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3">{e.date}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{site?.name||"—"}</td>
                    <td className="py-2 px-3 text-xs">{team?.name||"—"}</td>
                    <td className="py-2 px-3"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{e.category}</span></td>
                    <td className="py-2 px-3 font-bold text-red-600">{fmt(e.amount)}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{e.comment||"—"}</td>
                    <td className="py-2 px-3">
                      <RbacGuard allowed={rbac.canDeleteExpense}>
                        <button onClick={()=>deleteExpense(e.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
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
