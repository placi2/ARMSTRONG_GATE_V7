import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import Pagination, { usePagination } from "@/components/Pagination";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Search, Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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


const CATS_IN = ["Vente or","Virement reçu","Paiement client","Remboursement","Autre entrée"];
const CATS_OUT = ["Salaires","Avances salaires","Dépenses opérationnelles","Achat matériel","Transport","Carburant","Alimentation","Autre sortie"];
const MODES = ["Espèces","Virement","Chèque","Mobile money"];

function AddMvtDialog() {
  const [open, setOpen] = useState(false);
  const dataCtx = useData() as any;
  const { sites, addCashMovement } = dataCtx;
  const goldStocks = dataCtx?.goldStocks || [];
  const updateGoldStock = dataCtx?.updateGoldStock || (() => {});
  const productions = dataCtx?.productions || [];
  const teams = dataCtx?.teams || [];
  const { settings, fmt, sym, goldPrice } = useMoney();
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], type:"entrée", siteId:"", categorie:"", montant:"", goldQty:"", mode:"Espèces", comment:"" });

  const isGold = form.categorie === "Vente or";
  const stock = (() => {
    const gs = goldStocks?.find((s: any) => s.siteId === form.siteId)?.currentStock;
    if (gs !== undefined && gs > 0) return gs;
    // Fallback: compute from productions
    const siteTeamIds = teams.filter((t: any) => t.siteId === form.siteId).map((t: any) => t.id);
    const totalProduced = productions.filter((p: any) => siteTeamIds.includes(p.teamId) || p.siteId === form.siteId).reduce((s: number, p: any) => s + (p.weight || 0), 0);
    return totalProduced;
  })();
  const cats = form.type==="entrée" ? CATS_IN : CATS_OUT;

  const handleGoldQty = (qty: string) => setForm({...form, goldQty:qty, montant: qty ? String(Math.round(parseFloat(qty)*settings.goldPriceUsd)) : ""});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.montant||!form.siteId||!form.categorie) { toast.error("Champs obligatoires"); return; }
    if (isGold && form.goldQty && parseFloat(form.goldQty) > stock) { toast.error(`Stock insuffisant (${stock.toFixed(1)}g dispo)`); return; }
    if (isGold && form.goldQty) updateGoldStock(form.siteId, parseFloat(form.goldQty), false);
    const site = sites.find(s=>s.id===form.siteId);
    addCashMovement({ date:form.date, type:form.type, amount:parseFloat(form.montant), siteId:form.siteId, siteName:site?.name||"", category:form.categorie, paymentMethod:form.mode, comment:form.comment });
    toast.success("Mouvement enregistré");
    setForm({ date:new Date().toISOString().split("T")[0], type:"entrée", siteId:"", categorie:"", montant:"", goldQty:"", mode:"Espèces", comment:"" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-amber-500 hover:bg-amber-600 text-white"><Plus size={16} className="mr-2"/>Ajouter Mouvement</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>Nouveau Mouvement de Caisse</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="mt-1"/></div>
            <div><Label>Type</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={form.type} onChange={e=>setForm({...form,type:e.target.value,categorie:""})}>
                <option value="entrée">Entrée</option><option value="sortie">Sortie</option>
              </select>
            </div>
          </div>
          <div><Label>Site *</Label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={form.siteId} onChange={e=>setForm({...form,siteId:e.target.value})}>
              <option value="">Sélectionner...</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><Label>Catégorie *</Label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={form.categorie} onChange={e=>setForm({...form,categorie:e.target.value})}>
              <option value="">Sélectionner...</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {isGold && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-amber-800">⚖️ Vente d'or — Stock dispo: <strong>{stock.toFixed(1)}g</strong></p>
              <div><Label>Quantité (g)</Label>
                <Input type="number" step="0.01" value={form.goldQty} onChange={e=>handleGoldQty(e.target.value)} className="mt-1"/>
                <p className="text-xs text-amber-600 mt-1">Prix: {sym}{settings.goldPriceUsd}/g · Montant: {sym}{form.goldQty?Math.round(parseFloat(form.goldQty)*settings.goldPriceUsd).toLocaleString("fr-FR"):0}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Montant ({sym}) *</Label><Input type="number" step="0.01" value={form.montant} onChange={e=>setForm({...form,montant:e.target.value})} readOnly={isGold&&!!form.goldQty} className="mt-1"/></div>
            <div><Label>Mode paiement</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}>
                {MODES.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div><Label>Commentaire</Label><Input value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} className="mt-1"/></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={()=>setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Cash() {
  const { cashMovements, sites, deleteCashMovement } = useData();
  const { settings, fmt, sym, goldPrice } = useMoney();
  const [search, setSearch] = useState(""); const [filterType, setFilterType] = useState("all");
  const [filterSite, setFilterSite] = useState("all"); const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState("");

  const filtered = [...cashMovements].sort((a,b)=>b.date.localeCompare(a.date)).filter(m=>{
    const ms=!search||m.category?.toLowerCase().includes(search.toLowerCase())||(m.comment||"").toLowerCase().includes(search.toLowerCase())||m.siteName?.toLowerCase().includes(search.toLowerCase());
    const mt=filterType==="all"||m.type===filterType; const mSite=filterSite==="all"||m.siteId===filterSite;
    const mf=!dateFrom||m.date>=dateFrom; const mtd=!dateTo||m.date<=dateTo;
    return ms&&mt&&mSite&&mf&&mtd;
  });
  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);
  const In=cashMovements.filter(m=>m.type==="entrée").reduce((s,m)=>s+m.amount,0);
  const Out=cashMovements.filter(m=>m.type==="sortie").reduce((s,m)=>s+m.amount,0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div><h1 className="text-2xl font-bold text-slate-900">Gestion de la Caisse</h1><p className="text-slate-500 text-sm">{cashMovements.length} mouvement(s)</p></div>
          <AddMvtDialog/>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{l:"Entrées",v:fmt(In),c:"text-green-600",bg:"bg-green-50"},{l:"Sorties",v:fmt(Out),c:"text-red-600",bg:"bg-red-50"},{l:"Solde",v:fmt(In-Out),c:In-Out>=0?"text-blue-600":"text-red-600",bg:"bg-blue-50"}].map(s=>(
            <Card key={s.l} className="bg-white"><CardContent className="pt-4"><p className="text-xs text-slate-400">{s.l}</p><p className={`text-xl font-bold ${s.c}`}>{s.v}</p></CardContent></Card>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Rechercher..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="pl-9"/>
          </div>
          <select value={filterType} onChange={e=>{setFilterType(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous types</option><option value="entrée">Entrées</option><option value="sortie">Sorties</option>
          </select>
          <select value={filterSite} onChange={e=>{setFilterSite(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous sites</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"/>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"/>
          {(search||filterType!=="all"||filterSite!=="all"||dateFrom||dateTo)&&<Button variant="outline" size="sm" onClick={()=>{setSearch("");setFilterType("all");setFilterSite("all");setDateFrom("");setDateTo("");setPage(1);}}>Réinitialiser</Button>}
        </div>
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Mouvements <span className="text-sm font-normal text-slate-400">({filtered.length})</span></CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>{["Date","Type","Site","Catégorie","Mode","Montant","Commentaire",""].map(h=><th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody>
                {paginated.length===0?<tr><td colSpan={8} className="text-center py-8 text-slate-400">Aucun mouvement</td></tr>:
                paginated.map(m=>(
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3">{m.date}</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.type==="entrée"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{m.type==="entrée"?"▲":"▼"} {m.type}</span></td>
                    <td className="py-2 px-3 text-xs text-slate-400">{m.siteName||"—"}</td>
                    <td className="py-2 px-3 text-xs">{m.category||"—"}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{m.paymentMethod||"—"}</td>
                    <td className={`py-2 px-3 font-bold ${m.type==="entrée"?"text-green-600":"text-red-600"}`}>{m.type==="entrée"?"+":"-"}{fmt(m.amount)}</td>
                    <td className="py-2 px-3 text-xs text-slate-400">{m.comment||"—"}</td>
                    <td className="py-2 px-3"><DeleteConfirmButton itemName={`Mvt ${m.date}`} onDelete={()=>deleteCashMovement(m.id)}/></td>
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
