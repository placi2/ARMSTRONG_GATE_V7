import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";

interface Props { teamId: string; teamName: string; manager?: string; }

export default function EditTeamForm({ teamId, teamName, manager }: Props) {
  const [open, setOpen] = useState(false);
  const { updateTeam, sites, teams } = useData();
  const team = teams.find(t => t.id === teamId);
  const [form, setForm] = useState({ name: teamName, manager: manager || "", siteId: team?.siteId || "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Le nom est obligatoire"); return; }
    updateTeam(teamId, { name: form.name, manager: form.manager, siteId: form.siteId });
    toast.success(`Équipe "${form.name}" modifiée avec succès`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
          <Edit2 size={14} className="mr-1" /> Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Modifier l'Équipe</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nom de l'équipe *</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label>Responsable</Label>
            <Input value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label>Site</Label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
              value={form.siteId} onChange={e => setForm({...form, siteId: e.target.value})}>
              <option value="">Sélectionner...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
