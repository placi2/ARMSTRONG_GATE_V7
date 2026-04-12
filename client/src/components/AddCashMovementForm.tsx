import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";

const CATEGORIES_ENTREE = ["Vente or", "Virement reçu", "Paiement client", "Remboursement", "Autre entrée"];
const CATEGORIES_SORTIE = ["Salaires", "Avances salaires", "Dépenses opérationnelles", "Achat matériel", "Transport", "Carburant", "Alimentation", "Autre sortie"];
const MODES = ["Espèces", "Virement", "Chèque", "Mobile money"];

export default function AddCashMovementForm() {
  const [open, setOpen] = useState(false);
  const { sites, addCashMovement, goldStocks, updateGoldStock } = useData();
  const { settings, currencySymbol } = useSettings();

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "entrée",
    siteId: "",
    categorie: "",
    montant: "",
    goldQty: "",
    modePaiement: "Espèces",
    commentaire: "",
  });

  const isVenteOr = form.categorie === "Vente or";
  const goldPrice = settings.goldPrice || 60;
  const currentStock = goldStocks?.find(s => s.siteId === form.siteId)?.currentStock || 0;
  const categories = form.type === "entrée" ? CATEGORIES_ENTREE : CATEGORIES_SORTIE;

  const handleGoldQtyChange = (qty: string) => {
    setForm({ ...form, goldQty: qty, montant: qty ? String(Math.round(parseFloat(qty) * goldPrice)) : "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.montant || !form.siteId || !form.categorie) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (isVenteOr && form.goldQty) {
      const qty = parseFloat(form.goldQty);
      if (qty > currentStock) {
        toast.error(`Stock insuffisant ! Stock actuel: ${currentStock.toFixed(2)}g`);
        return;
      }
      updateGoldStock(form.siteId, qty, false);
    }
    const site = sites.find(s => s.id === form.siteId);
    addCashMovement({
      date: form.date,
      type: form.type,
      amount: parseFloat(form.montant),
      siteId: form.siteId,
      siteName: site?.name || "",
      category: form.categorie,
      paymentMethod: form.modePaiement,
      description: form.commentaire,
      comment: form.commentaire,
    });
    toast.success("Mouvement de caisse enregistré !");
    setForm({ date: new Date().toISOString().split("T")[0], type: "entrée", siteId: "", categorie: "", montant: "", goldQty: "", modePaiement: "Espèces", commentaire: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus size={16} className="mr-2" /> Ajouter Mouvement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Nouveau Mouvement de Caisse</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Type *</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
                value={form.type} onChange={e => setForm({ ...form, type: e.target.value, categorie: "" })}>
                <option value="entrée">Entrée</option>
                <option value="sortie">Sortie</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Site *</Label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
              value={form.siteId} onChange={e => setForm({ ...form, siteId: e.target.value })}>
              <option value="">Sélectionner un site...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <Label>Catégorie *</Label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
              value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
              <option value="">Sélectionner...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {isVenteOr && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-amber-800">⚖️ Vente d'or</p>
              {form.siteId && <p className="text-xs text-slate-600">Stock actuel: <strong>{currentStock.toFixed(2)}g</strong></p>}
              <div>
                <Label>Quantité vendue (grammes) *</Label>
                <Input type="number" step="0.01" placeholder="Ex: 25.5"
                  value={form.goldQty} onChange={e => handleGoldQtyChange(e.target.value)} className="mt-1" />
              </div>
              <p className="text-xs text-amber-700">
                Prix: {currencySymbol}{goldPrice}/g — Montant: {currencySymbol}{form.goldQty ? Math.round(parseFloat(form.goldQty) * goldPrice).toLocaleString("fr-FR") : 0}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Montant ({currencySymbol}) *</Label>
              <Input type="number" step="0.01" value={form.montant}
                onChange={e => setForm({ ...form, montant: e.target.value })}
                readOnly={isVenteOr && !!form.goldQty} className="mt-1" />
            </div>
            <div>
              <Label>Mode paiement</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
                value={form.modePaiement} onChange={e => setForm({ ...form, modePaiement: e.target.value })}>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Commentaire</Label>
            <Input placeholder="Description..." value={form.commentaire}
              onChange={e => setForm({ ...form, commentaire: e.target.value })} className="mt-1" />
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
