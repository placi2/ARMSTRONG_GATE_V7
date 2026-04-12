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
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { calcSiteMetrics } from "@/lib/calculations";
import { Search, Plus, MapPin, ExternalLink } from "lucide-react";
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


function AddSiteDialog({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const { addSite } = useData();
  const [form, setForm] = useState({ name: "", location: "", manager: "", description: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name.trim()) { toast.error("Nom obligatoire"); return; }
    try {
      const site = addSite({ ...form });
      toast.success(`Site "${form.name}" créé`);
    } catch {}
    setForm({ name: "", location: "", manager: "", description: "" });
    setOpen(false);
    onAdded?.();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white"><Plus size={16} className="mr-2"/>Nouveau Site</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader><DialogTitle>Créer un Nouveau Site</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nom du site *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" /></div>
          <div><Label>Localisation</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-1" /></div>
          <div><Label>Responsable</Label><Input value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} placeholder="Modifiable après création des employés" className="mt-1" /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1" /></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Créer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditSiteDialog({ site }: { site: any }) {
  const [open, setOpen] = useState(false);
  const { updateSite, employees } = useData();
  const [form, setForm] = useState({ name: site.name, location: site.location || "", manager: site.manager || "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSite(site.id, form);
    toast.success("Site modifié"); setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">Modifier</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader><DialogTitle>Modifier le Site</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" /></div>
          <div><Label>Localisation</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-1" /></div>
          <div>
            <Label>Responsable</Label>
            <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white mt-1"
              value={form.manager} onChange={e => setForm({...form, manager: e.target.value})}>
              <option value="">Aucun responsable</option>
              {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name} — {emp.function || "Employé"}</option>)}
            </select>
            <Input value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} className="mt-1" placeholder="Ou saisir manuellement" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Sites() {
  const { sites, teams, productions, expenses, deleteSite } = useData();
  const { settings, fmt, sym, goldPrice } = useMoney();
  const [search, setSearch] = useState("");

  const metrics = sites.map(s => ({ ...s, ...calcSiteMetrics(s, teams, productions, expenses, settings.goldPriceUsd) }));
  const filtered = metrics.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase()));
  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);

  const totalProd = metrics.reduce((s, m) => s + m.totalProduction, 0);
  const totalVal = metrics.reduce((s, m) => s + m.totalValue, 0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Sites</h1>
            <p className="text-slate-500 text-sm">{sites.length} site(s) — {totalProd.toFixed(1)}g total — {fmt(totalVal)}</p>
          </div>
          <AddSiteDialog />
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Rechercher un site..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(s => (
            <Card key={s.id} className="bg-white hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={11}/>{s.location || "—"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.status === "Rentable" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    ["Or produit", `${s.totalProduction.toFixed(1)}g`, "text-amber-600"],
                    ["Valeur", fmt(s.totalValue), "text-green-600"],
                    ["Dépenses", fmt(s.totalExpenses), "text-red-600"],
                    ["Résultat Net", fmt(s.netResult), s.netResult >= 0 ? "text-green-600" : "text-red-600"],
                  ].map(([l, v, c]) => (
                    <div key={l as string} className="bg-slate-50 rounded p-2">
                      <p className="text-xs text-slate-400">{l}</p>
                      <p className={`font-bold text-sm ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-between items-center">
                  <div className="text-xs text-slate-400">{s.teamCount} équipe(s) · Resp: {s.manager || "—"}</div>
                  <div className="flex gap-1">
                    <Link href={`/site/${s.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs"><ExternalLink size={12} className="mr-1"/>Détails</Button>
                    </Link>
                    <EditSiteDialog site={s} />
                    <DeleteConfirmButton itemName={s.name} onDelete={() => deleteSite(s.id)} adminOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400">Aucun site trouvé</div>}
        <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />
      </div>
    </DashboardLayout>
  );
}
