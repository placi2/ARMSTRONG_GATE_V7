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
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";

export default function AddSiteForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
  });

  const { addSite } = useData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    addSite({
      name: formData.name,
      location: formData.location,
      description: formData.description,
      status: "Rentable",
    });

    toast.success(`Site "${formData.name}" créé avec succès`);
    setFormData({
      name: "",
      location: "",
      description: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus size={20} className="mr-2" />
          Ajouter un Site
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un Nouveau Site</DialogTitle>
          <DialogDescription>
            Saisissez les informations du nouveau site d'exploitation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="site-name" className="text-sm font-medium">
              Nom du Site <span className="text-red-500">*</span>
            </Label>
            <Input
              id="site-name"
              placeholder="Ex: Site Nord"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Localisation <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              placeholder="Ex: Région Nord, Pays"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez le site (optionnel)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full"
              rows={3}
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
              Créer le Site
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
