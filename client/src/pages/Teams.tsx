import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
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
import { calcTeamMetrics } from "@/lib/calculations";
import { Search, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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


function AddTeamDialog() {
  const [open, setOpen] = useState(false);
  const { addTeam, sites } = useData();
  const [form, setForm] = useState({ name: "", siteId: "", manager: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name || !form.siteId) { toast.error("Nom et site obligatoires"); return; }
    addTeam(form);
    toast.success(`Équipe "${form.name}" créée`);
    setForm({ name: "", siteId: "", manager: "" }); setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-amber-500 hover:bg-amber-600 text-white"><Plus size={16} className="mr-2"/>Nouvelle Équipe</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Créer une Équipe</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nom *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1"/></div>
          <div><Label>Site *</Label>
            <SearchableSelect options={sites.map(s=>({value:s.id,label:s.name,subtitle:s.location}))}
              value={form.siteId} onChange={v=>setForm({...form,siteId:v})} placeholder="Sélectionner un site..." className="mt-1"/>
          </div>
          <div><Label>Responsable</Label><Input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="mt-1" placeholder="Assignable après création des employés"/></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={()=>setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Créer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTeamDialog({ team }: { team: any }) {
  const [open, setOpen] = useState(false);
  const { updateTeam, sites, employees } = useData();
  const [form, setForm] = useState({ name: team.name, siteId: team.siteId, manager: team.manager||"" });
  const empOptions = employees.map(e => ({ value: e.name, label: e.name, subtitle: e.function }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateTeam(team.id, form);
    toast.success("Équipe modifiée"); setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs text-blue-600">Modifier</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Modifier l'Équipe</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nom *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1"/></div>
          <div><Label>Site</Label>
            <SearchableSelect options={sites.map(s=>({value:s.id,label:s.name}))} value={form.siteId} onChange={v=>setForm({...form,siteId:v})} className="mt-1"/>
          </div>
          <div><Label>Responsable (parmi les employés)</Label>
            <SearchableSelect options={empOptions} value={form.manager} onChange={v=>setForm({...form,manager:v})} placeholder="Sélectionner un employé..." className="mt-1"/>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={()=>setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Teams() {
  const { teams, sites, employees, productions, expenses, deleteTeam } = useData();
  const { settings, fmt, sym, goldPrice } = useMoney();
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("all");

  const enriched = teams.map(t => {
    const m = calcTeamMetrics(t, productions, expenses, settings.goldPriceUsd, sites);
    return { ...t, ...m, employeeCount: employees.filter(e=>e.teamId===t.id).length };
  }).sort((a,b) => b.totalProduction - a.totalProduction);

  const filtered = enriched.filter(t => {
    const ms = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.siteName?.toLowerCase().includes(search.toLowerCase());
    const mSite = filterSite === "all" || t.siteId === filterSite;
    return ms && mSite;
  });

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Équipes</h1>
            <p className="text-slate-500 text-sm">{teams.length} équipe(s)</p>
          </div>
          <AddTeamDialog />
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Rechercher une équipe..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="pl-9"/>
          </div>
          <select value={filterSite} onChange={e=>{setFilterSite(e.target.value);setPage(1);}}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous les sites</option>
            {sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">
              Classement par Production
              <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length} équipe{filtered.length>1?"s":""})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>{["#","Équipe","Site","Resp.","Empl.","Or (g)","Valeur","Dépenses","Résultat","Rentab.","Statut","Actions"].map(h=>(
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {paginated.length===0?<tr><td colSpan={12} className="text-center py-8 text-slate-400">Aucune équipe</td></tr>:
                  paginated.map((t,i)=>{
                    const rank = (page-1)*perPage+i+1;
                    return(<tr key={t.teamId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 text-xs text-slate-400">{rank}</td>
                      <td className="py-2 px-3">
                        <Link href={`/team/${t.teamId}`}><a className="text-blue-600 hover:underline font-medium flex items-center gap-1 whitespace-nowrap">{t.teamName}<ExternalLink size={11}/></a></Link>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-500 whitespace-nowrap">{t.siteName}</td>
                      <td className="py-2 px-3 text-xs text-slate-600">{t.manager||"—"}</td>
                      <td className="py-2 px-3 text-center"><span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-bold">{t.employeeCount}</span></td>
                      <td className="py-2 px-3 font-bold text-amber-600">{t.totalProduction.toFixed(1)}</td>
                      <td className="py-2 px-3 text-green-600 whitespace-nowrap">{fmt(t.totalValue)}</td>
                      <td className="py-2 px-3 text-red-600 whitespace-nowrap">{fmt(t.totalExpenses)}</td>
                      <td className={`py-2 px-3 font-bold whitespace-nowrap ${t.netResult>=0?"text-green-600":"text-red-600"}`}>{fmt(t.netResult)}</td>
                      <td className="py-2 px-3 text-xs">{t.profitability.toFixed(1)}%</td>
                      <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.status==="Rentable"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{t.status}</span></td>
                      <td className="py-2 px-3"><div className="flex gap-1"><EditTeamDialog team={t}/><DeleteConfirmButton itemName={t.teamName} onDelete={()=>deleteTeam(t.teamId)} adminOnly/></div></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage}/>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
