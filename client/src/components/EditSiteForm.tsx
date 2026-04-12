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
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";

interface EditSiteFormProps {
  siteId: string;
  siteName: string;
  location: string;
  description?: string;
  manager: string;
}

export default function EditSiteForm({
  siteId,
  siteName,
  location,
  description = "",
  manager,
}: EditSiteFormProps) {
  const [open, setOpen] = useState(false);
  const { updateSite } = useData();
  const [formData, setFormData] = useState({
    name: siteName,
    location: location,
    description: description,
    manager: manager,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    updateSite(siteId, {
      name: formData.name,
      location: formData.location,
      description: formData.description,
      manager: formData.manager,
    });
    toast.success(`Site "${formData.name}" modifié avec succès`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Edit2 size={16} className="mr-1" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le Site</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du site d'exploitation
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

          {/* Manager */}
          <div className="space-y-2">
            <Label htmlFor="manager" className="text-sm font-medium">
              Responsable du Site
            </Label>
            <Input
              id="manager"
              placeholder="Ex: Jean Dupont"
              value={formData.manager}
              onChange={(e) =>
                setFormData({ ...formData, manager: e.target.value })
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
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
