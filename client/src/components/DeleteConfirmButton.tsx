import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Props { itemName: string; onDelete: () => void; adminOnly?: boolean; }

export default function DeleteConfirmButton({ itemName, onDelete, adminOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  if (adminOnly && user?.role !== "admin") return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-red-600 hover:bg-red-50 border-red-200 h-8">
        <Trash2 size={12} />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer "{itemName}" ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(); setOpen(false); }} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
