import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Pagination, { usePagination } from "@/components/Pagination";
import SearchableSelect from "@/components/SearchableSelect";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Search, Trash2, CheckCircle, Clock, AlertTriangle, XCircle, Package } from "lucide-react";

function useMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = v.toLocaleString("fr-FR", {minimumFractionDigits:0,maximumFractionDigits:2}); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const sym = (ctx as any).sym || (ctx as any).currencySymbol || (s?.currency === "CDF" ? "FC" : "$");
  return { fmt, sym };
}

const TYPES = ["Pioche","Pelle","Pompe","Générateur","Véhicule","Détecteur","Outillage","Autre"];
const STATUSES = ["Opérationnel","En maintenance","En panne","Détruit"];

const statusIcon = (s: string) => {
  if (s === "Opérationnel") return <CheckCircle size={13} className="text-green-500" />;
  if (s === "En maintenance") return <Clock size={13} className="text-yellow-500" />;
  if (s === "En panne") return <AlertTriangle size={13} className="text-orange-500" />;
  return <XCircle size={13} className="text-red-500" />;
};
const statusColor = (s: string) => {
  if (s === "Opérationnel") return "bg-green-100 text-green-700";
  if (s === "En maintenance") return "bg-yellow-100 text-yellow-700";
  if (s === "En panne") return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
};

export default function Equipment() {
  const data = useData() as any;
  const equipment = data?.equipment || [];
  const addEquipment = data?.addEquipment;
  const updateEquipment = data?.updateEquipment;
  const deleteEquipment = data?.deleteEquipment;
  const addExpense = data?.addExpense;
  const deleteExpense = data?.deleteExpense;
  const sites = data?.sites || [];
  const teams = data?.teams || [];

  const { fmt, sym } = useMoney();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<string|null>(null);
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    name: "", type: "Pioche", siteId: "", teamId: "",
    status: "Opérationnel", value: "", serialNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const siteOptions = sites.map((s: any) => ({ value: s.id, label: s.name, subtitle: s.location }));
  const filteredTeams = form.siteId ? teams.filter((t: any) => t.siteId === form.siteId) : teams;
  const teamOptions = filteredTeams.map((t: any) => ({ value: t.id, label: t.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name || !form.siteId) { toast.error("Nom et site obligatoires"); return; }

    const cost = parseFloat(form.value) || 0;
    const eqId = `EQ${Date.now()}`;

    // 1. Add equipment
    addEquipment?.({ ...form, id: eqId, value: cost });

    // 2. Auto-create expense if cost > 0
    if (cost > 0 && addExpense) {
      addExpense({
        date: form.purchaseDate || new Date().toISOString().split("T")[0],
        teamId: form.teamId || "",
        siteId: form.siteId,
        category: "Équipement",
        amount: cost,
        comment: `Achat équipement: ${form.name}`,
        description: `Équipement — ${form.name} (${form.type})`,
        equipmentId: eqId, // Link for later update/delete
      });
    }

    toast.success(`Équipement "${form.name}" ajouté${cost > 0 ? ` — Dépense de ${fmt(cost)} créée automatiquement` : ""}`);
    setForm({ name:"", type:"Pioche", siteId:"", teamId:"", status:"Opérationnel", value:"", serialNumber:"", purchaseDate: new Date().toISOString().split("T")[0] });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    const eq = equipment.find((e: any) => e.id === id);
    deleteEquipment?.(id);
    // Delete linked expense
    if (eq && deleteExpense) {
      const linkedExpenses = (data?.expenses || []).filter((ex: any) => ex.equipmentId === id || (ex.category === "Équipement" && ex.comment?.includes(eq.name)));
      linkedExpenses.forEach((ex: any) => deleteExpense(ex.id));
      if (linkedExpenses.length > 0) toast.info("Dépense liée supprimée automatiquement");
    }
    toast.success(`Équipement supprimé`);
    setDelId(null);
  };

  const filtered = equipment.filter((e: any) => {
    const site = sites.find((s: any) => s.id === e.siteId);
    const ms = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || site?.name?.toLowerCase().includes(search.toLowerCase()) || e.type?.toLowerCase().includes(search.toLowerCase());
    const mSite = filterSite === "all" || e.siteId === filterSite;
    const mSt = filterStatus === "all" || e.status === filterStatus;
    return ms && mSite && mSt;
  });

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);
  const totalValue = equipment.reduce((s: number, e: any) => s + (e.value || 0), 0);
  const operational = equipment.filter((e: any) => e.status === "Opérationnel").length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Équipements</h1>
            <p className="text-slate-500 text-sm">{equipment.length} équipement(s) · Valeur totale: {fmt(totalValue)}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <Plus size={16} className="mr-2" /> Ajouter Équipement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Nouvel Équipement</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="mt-1"/></div>
                  <div>
                    <Label>Type</Label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                      {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Site *</Label>
                  <SearchableSelect options={siteOptions} value={form.siteId}
                    onChange={v=>setForm({...form,siteId:v,teamId:""})} placeholder="Sélectionner un site..." className="mt-1"/>
                </div>
                <div>
                  <Label>Équipe (optionnel)</Label>
                  <SearchableSelect options={teamOptions} value={form.teamId}
                    onChange={v=>setForm({...form,teamId:v})} placeholder="Aucune équipe" className="mt-1"
                    emptyMsg={form.siteId ? "Aucune équipe pour ce site" : "Sélectionner un site d'abord"}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Statut</Label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                      {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Coût d'achat ({sym})</Label>
                    <Input type="number" step="any" min="0" value={form.value} onChange={e=>setForm({...form,value:e.target.value})} className="mt-1" placeholder="0"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>N° Série</Label><Input value={form.serialNumber} onChange={e=>setForm({...form,serialNumber:e.target.value})} className="mt-1"/></div>
                  <div><Label>Date d'achat</Label><Input type="date" value={form.purchaseDate} max={new Date().toISOString().split("T")[0]} onChange={e=>setForm({...form,purchaseDate:e.target.value})} className="mt-1"/></div>
                </div>
                {parseFloat(form.value) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
                    ℹ️ Une dépense de <strong>{fmt(parseFloat(form.value))}</strong> sera automatiquement créée dans l'onglet Dépenses et Résultat Financier.
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={()=>{setForm({name:"",type:"Pioche",siteId:"",teamId:"",status:"Opérationnel",value:"",serialNumber:"",purchaseDate:new Date().toISOString().split("T")[0]});setOpen(false);}} className="flex-1">Annuler</Button>
                  <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Ajouter</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:"Total équipements",v:equipment.length,c:"text-slate-900"},
            {l:"Opérationnels",v:operational,c:"text-green-600"},
            {l:"Hors service",v:equipment.length-operational,c:"text-red-600"},
            {l:"Valeur totale",v:fmt(totalValue),c:"text-amber-600"},
          ].map(s=>(
            <Card key={s.l} className="bg-white"><CardContent className="pt-4">
              <p className="text-xs text-slate-400">{s.l}</p>
              <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Rechercher..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="pl-9"/>
          </div>
          <select value={filterSite} onChange={e=>{setFilterSite(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous les sites</option>
            {sites.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous statuts</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Liste des Équipements <span className="text-sm font-normal text-slate-400">({filtered.length})</span></CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>{["Nom","Type","Site","Équipe","Statut","N° Série","Date Achat","Coût","Dépense liée","Actions"].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paginated.length===0?<tr><td colSpan={10} className="text-center py-8 text-slate-400">Aucun équipement</td></tr>:
                paginated.map((eq:any)=>{
                  const site=sites.find((s:any)=>s.id===eq.siteId);
                  const team=teams.find((t:any)=>t.id===eq.teamId);
                  const linkedExp=(data?.expenses||[]).find((ex:any)=>ex.equipmentId===eq.id || (ex.category==="Équipement"&&ex.comment?.includes(eq.name)));
                  return(
                    <tr key={eq.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">{eq.name}</td>
                      <td className="py-2 px-3 text-xs"><span className="bg-slate-100 px-2 py-0.5 rounded">{eq.type}</span></td>
                      <td className="py-2 px-3 text-xs text-slate-500">{site?.name||"—"}</td>
                      <td className="py-2 px-3 text-xs text-slate-400">{team?.name||"—"}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          {statusIcon(eq.status)}
                          <select value={eq.status} onChange={e=>{updateEquipment?.(eq.id,{status:e.target.value});toast.success("Statut mis à jour");}}
                            className={`text-xs px-1.5 py-0.5 rounded-full border-0 font-medium cursor-pointer ${statusColor(eq.status)}`}>
                            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-400">{eq.serialNumber||"—"}</td>
                      <td className="py-2 px-3 text-xs">{eq.purchaseDate||"—"}</td>
                      <td className="py-2 px-3 font-bold text-amber-600">{fmt(eq.value||0)}</td>
                      <td className="py-2 px-3">
                        {linkedExp ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">✓ {fmt(linkedExp.amount)}</span>
                        ) : (eq.value||0) > 0 ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : <span className="text-xs text-slate-300">Gratuit</span>}
                      </td>
                      <td className="py-2 px-3">
                        {user?.role==="admin"&&<button onClick={()=>setDelId(eq.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage}/>
          </CardContent>
        </Card>

        <AlertDialog open={!!delId} onOpenChange={o=>!o&&setDelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet équipement ?</AlertDialogTitle>
              <AlertDialogDescription>La dépense liée sera aussi supprimée. Action irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end mt-2">
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={()=>delId&&handleDelete(delId)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
