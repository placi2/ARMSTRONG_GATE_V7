import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";

interface DeleteSiteButtonProps {
  siteId: string;
  siteName: string;
}

export default function DeleteSiteButton({ siteId, siteName }: DeleteSiteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteSite } = useData();
  const { user } = useAuth();

  if (user?.role !== "admin") return null;

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      deleteSite(siteId);
      toast.success(`Site "${siteName}" supprimé avec succès`);
      setIsDeleting(false);
    }, 300);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 size={16} className="mr-1" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le site "{siteName}" ? Cette action est
            irréversible et supprimera toutes les données associées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3">
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
