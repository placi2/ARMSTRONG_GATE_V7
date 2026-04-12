import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AddAdvanceForm from "@/components/AddAdvanceForm";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import Pagination, { usePagination } from "@/components/Pagination";
import SearchableSelect from "@/components/SearchableSelect";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { calcEmployeeMetrics } from "@/lib/calculations";
import { Search, Plus, ExternalLink, UserCheck } from "lucide-react";
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


function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { addEmployee, teams } = useData();
  const [form, setForm] = useState({ name:"", function:"", teamId:"", monthlySalary:"", joinDate: new Date().toISOString().split("T")[0], status:"Actif" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name || !form.teamId) { toast.error("Nom et équipe obligatoires"); return; }
    addEmployee({ ...form, monthlySalary: parseFloat(form.monthlySalary)||0, totalAdvances: 0 });
    toast.success(`Employé "${form.name}" ajouté`);
    setForm({ name:"", function:"", teamId:"", monthlySalary:"", joinDate:new Date().toISOString().split("T")[0], status:"Actif" });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-amber-500 hover:bg-amber-600 text-white"><Plus size={16} className="mr-2"/>Nouvel Employé</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader><DialogTitle>Ajouter un Employé</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nom complet *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1"/></div>
          <div><Label>Fonction</Label><Input value={form.function} onChange={e=>setForm({...form,function:e.target.value})} className="mt-1"/></div>
          <div><Label>Équipe *</Label>
            <SearchableSelect options={teams.map(t=>({value:t.id,label:t.name}))} value={form.teamId} onChange={v=>setForm({...form,teamId:v})} placeholder="Sélectionner une équipe..." className="mt-1"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Salaire mensuel ($)</Label><Input type="number" value={form.monthlySalary} onChange={e=>setForm({...form,monthlySalary:e.target.value})} className="mt-1"/></div>
            <div><Label>Date d'entrée</Label><Input type="date" value={form.joinDate} onChange={e=>setForm({...form,joinDate:e.target.value})} className="mt-1"/></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={()=>setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Ajouter</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Employees() {
  const { employees, teams, sites, advances, deleteEmployee } = useData();
  const { settings, fmt, sym, goldPrice } = useMoney();
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterSite, setFilterSite] = useState("all");

  const enriched = employees.map(e => {
    const m = calcEmployeeMetrics(e, advances);
    const team = teams.find(t => t.id === e.teamId);
    const site = sites.find(s => s.id === team?.siteId);
    return { ...e, ...m, teamName: team?.name||"—", siteName: site?.name||"—", siteId: team?.siteId||"" };
  });

  const filtered = enriched.filter(e => {
    const ms = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.function?.toLowerCase().includes(search.toLowerCase()) || e.teamName.toLowerCase().includes(search.toLowerCase());
    const mt = filterTeam==="all" || e.teamId===filterTeam;
    const mSite = filterSite==="all" || e.siteId===filterSite;
    return ms && mt && mSite;
  });

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);

  const totalPayroll = enriched.reduce((s,e)=>s+(e.baseSalary||0),0);
  const totalAdv = enriched.reduce((s,e)=>s+(e.totalAdvances||0),0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Employés</h1>
            <p className="text-slate-500 text-sm">{employees.length} employé(s)</p>
          </div>
          <div className="flex gap-2"><AddAdvanceForm /><AddEmployeeDialog /></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {l:"Total employés", v:employees.length, c:"text-slate-900"},
            {l:"Masse salariale", v:fmt(totalPayroll), c:"text-blue-600"},
            {l:"Total avances", v:fmt(totalAdv), c:"text-orange-600"},
          ].map(s=>(
            <Card key={s.l} className="bg-white"><CardContent className="pt-4">
              <p className="text-xs text-slate-400">{s.l}</p>
              <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Rechercher un employé..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="pl-9"/>
          </div>
          <select value={filterSite} onChange={e=>{setFilterSite(e.target.value);setFilterTeam("all");setPage(1);}}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous les sites</option>
            {sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterTeam} onChange={e=>{setFilterTeam(e.target.value);setPage(1);}}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Toutes équipes</option>
            {(filterSite==="all"?teams:teams.filter(t=>t.siteId===filterSite)).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Liste des Employés <span className="text-sm font-normal text-slate-400">({filtered.length})</span></CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>{["Nom","Fonction","Équipe","Site","Salaire Base","Avances","Salaire Net","Statut",""].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paginated.length===0?<tr><td colSpan={9} className="text-center py-8 text-slate-400">Aucun employé</td></tr>:
                paginated.map(e=>(
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3"><Link href={`/employee/${e.id}`}><a className="text-blue-600 hover:underline flex items-center gap-1 font-medium">{e.name}<ExternalLink size={11}/></a></Link></td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{e.function||"—"}</td>
                    <td className="py-2 px-3 text-xs"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{e.teamName}</span></td>
                    <td className="py-2 px-3 text-xs text-slate-400">{e.siteName}</td>
                    <td className="py-2 px-3 font-medium">{fmt(e.baseSalary||0)}</td>
                    <td className="py-2 px-3 text-orange-600">{fmt(e.totalAdvances||0)}</td>
                    <td className="py-2 px-3 font-bold text-green-600">{fmt(e.netSalary||0)}</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${e.status==="Actif"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-600"}`}>{e.status||"Actif"}</span></td>
                    <td className="py-2 px-3"><DeleteConfirmButton itemName={e.name} onDelete={()=>deleteEmployee(e.id)} adminOnly/></td>
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
