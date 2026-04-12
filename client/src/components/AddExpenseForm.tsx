import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import SearchableSelect from "./SearchableSelect";

const CATS = ["Alimentation","Salaires","Transport","Carburant","Matériel","Équipement","Sécurité","Médical","Autre"];

export default function AddExpenseForm() {
  const [open, setOpen] = useState(false);
  const { teams, sites, addExpense } = useData();
  const { user } = useAuth();
  const ctx = useSettings() as any;
  const sym = ctx.sym || ctx.currencySymbol || "$";
  const fmt = ctx.fmt || ctx.formatAmount || ctx.getFormattedPrice || ((v: number) => `$${v}`);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    teamId: "", category: "", amount: "", comment: "",
  });

  // Manager sees only his site's teams
  const availableTeams = user?.role === "manager" && user.siteId
    ? teams.filter(t => t.siteId === user.siteId)
    : teams;

  const teamOptions = availableTeams.map(t => {
    const site = sites.find(s => s.id === t.siteId);
    return { value: t.id, label: t.name, subtitle: site?.name || "" };
  });

  const amt = parseFloat(form.amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamId || !form.category || !form.amount) {
      toast.error("Remplir tous les champs obligatoires"); return;
    }
    const team = teams.find(t => t.id === form.teamId);
    addExpense({
      date: form.date, teamId: form.teamId,
      siteId: team?.siteId, category: form.category,
      amount: amt, comment: form.comment,
    });
    toast.success(`Dépense de ${fmt(amt)} enregistrée`);
    setForm({ date: new Date().toISOString().split("T")[0], teamId: "", category: "", amount: "", comment: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Plus size={15} className="mr-1" /> Ajouter Dépense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader><DialogTitle>Enregistrer une Dépense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Catégorie *</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
                value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Sélectionner...</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Équipe *</Label>
            <SearchableSelect className="mt-1" options={teamOptions} value={form.teamId}
              onChange={v => setForm({...form, teamId: v})} placeholder="Sélectionner une équipe..." />
          </div>

          <div>
            <Label>Montant ({sym}) *</Label>
            <Input type="number" step="any" min="0" value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})} className="mt-1"
              placeholder={`Ex: 150`} />
            {amt > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                = {fmt(amt)}
              </p>
            )}
          </div>

          <div>
            <Label>Commentaire</Label>
            <Input value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} className="mt-1" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setForm({ date: new Date().toISOString().split("T")[0], teamId: "", category: "", amount: "", comment: "" }); setOpen(false); }} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
