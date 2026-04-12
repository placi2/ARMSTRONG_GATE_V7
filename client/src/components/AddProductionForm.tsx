import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";

export default function AddProductionForm() {
  const [open, setOpen] = useState(false);
  const { addProduction, teams, updateGoldStock } = useData();
  const { settings, currencySymbol } = useSettings();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    teamId: "",
    weight: "",
    // Always pre-fill with the price from settings
    pricePerGram: String(settings.goldPrice),
  });

  // Recalculate estimated value
  const estimatedValue = formData.weight && formData.pricePerGram
    ? parseFloat(formData.weight) * parseFloat(formData.pricePerGram)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamId || !formData.weight) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const weight = parseFloat(formData.weight);
    const pricePerGram = parseFloat(formData.pricePerGram) || settings.goldPrice;

    if (weight <= 0) {
      toast.error("Le poids doit être supérieur à 0");
      return;
    }

    const team = teams.find(t => t.id === formData.teamId);
    const siteId = team?.siteId || "";

    addProduction({
      date: formData.date,
      teamId: formData.teamId,
      siteId,
      weight,
      pricePerGram,
      estimatedValue: weight * pricePerGram,
      value: weight * pricePerGram,
    });

    if (siteId && weight > 0) {
      updateGoldStock(siteId, weight, true);
    }

    toast.success(`Production de ${weight}g enregistrée — Valeur: ${currencySymbol}${Math.round(weight * pricePerGram).toLocaleString("fr-FR")}`);

    setFormData({
      date: new Date().toISOString().split("T")[0],
      teamId: "",
      weight: "",
      pricePerGram: String(settings.goldPrice),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus size={20} className="mr-2" /> Ajouter Production
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enregistrer une Production d'Or</DialogTitle>
          <DialogDescription>
            Le prix de l'or est défini dans les Paramètres ({currencySymbol}{settings.goldPrice}/g)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label>Équipe *</Label>
            <Select value={formData.teamId} onValueChange={v => setFormData({...formData, teamId: v})}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une équipe" /></SelectTrigger>
              <SelectContent>
                {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label>Poids d'Or (grammes) *</Label>
            <Input type="number" step="0.01" placeholder="Ex: 25.5" value={formData.weight}
              onChange={e => setFormData({...formData, weight: e.target.value})} />
          </div>

          {/* Price per gram - pre-filled from settings, editable */}
          <div className="space-y-2">
            <Label>
              Prix de Rachat ({currencySymbol}/g)
              <span className="ml-2 text-xs text-slate-500">
                (Prix paramétré: {currencySymbol}{settings.goldPrice}/g)
              </span>
            </Label>
            <Input type="number" step="0.01" value={formData.pricePerGram}
              onChange={e => setFormData({...formData, pricePerGram: e.target.value})} />
            {parseFloat(formData.pricePerGram) !== settings.goldPrice && (
              <p className="text-xs text-orange-500">
                ⚠️ Prix différent du prix paramétré ({currencySymbol}{settings.goldPrice}/g)
                <button type="button" className="ml-2 underline"
                  onClick={() => setFormData({...formData, pricePerGram: String(settings.goldPrice)})}>
                  Réinitialiser
                </button>
              </p>
            )}
          </div>

          {/* Estimated value */}
          {estimatedValue > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-amber-800">Valeur Estimée</span>
                <span className="text-xl font-bold text-amber-700">
                  {currencySymbol}{Math.round(estimatedValue).toLocaleString("fr-FR")}
                </span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                {formData.weight}g × {currencySymbol}{formData.pricePerGram}/g
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
