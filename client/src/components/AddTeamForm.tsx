import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function AddTeamForm() {
  const [open, setOpen] = useState(false);
  const { sites, addTeam } = useData();
  const [formData, setFormData] = useState({
    name: "",
    siteId: "",
    memberCount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.siteId || !formData.memberCount) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const memberCount = parseInt(formData.memberCount);
    if (memberCount <= 0) {
      toast.error("Le nombre de membres doit être supérieur à 0");
      return;
    }

    const site = sites.find((s) => s.id === formData.siteId);
    addTeam({ name: formData.name, siteId: formData.siteId, manager: formData.manager, createdDate: new Date().toISOString().split("T")[0] });
    toast.success(`Équipe "${formData.name}" créée sur le site ${site?.name}`);
    setFormData({
      name: "",
      siteId: "",
      memberCount: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus size={20} className="mr-2" />
          Ajouter une Équipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une Nouvelle Équipe</DialogTitle>
          <DialogDescription>
            Saisissez les informations de la nouvelle équipe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-sm font-medium">
              Nom de l'Équipe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="team-name"
              placeholder="Ex: Équipe Excavation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Site Selection */}
          <div className="space-y-2">
            <Label htmlFor="team-site" className="text-sm font-medium">
              Site <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.siteId}
              onValueChange={(value) => setFormData({ ...formData, siteId: value })}
            >
              <SelectTrigger id="team-site">
                <SelectValue placeholder="Sélectionnez un site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Member Count */}
          <div className="space-y-2">
            <Label htmlFor="member-count" className="text-sm font-medium">
              Nombre de Membres <span className="text-red-500">*</span>
            </Label>
            <Input
              id="member-count"
              type="number"
              min="1"
              placeholder="Ex: 5"
              value={formData.memberCount}
              onChange={(e) =>
                setFormData({ ...formData, memberCount: e.target.value })
              }
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600">
              Créer l'Équipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
