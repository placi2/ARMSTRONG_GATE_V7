import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  userRole?: string;
}

export default function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  itemName,
  itemType,
  userRole = "admin",
}: DeleteConfirmDialogProps) {
  // Only admin can delete
  if (userRole !== "admin") {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer {itemType} <strong>{itemName}</strong> ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Supprimer
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteButton({
  onClick,
  disabled = false,
  userRole = "admin",
}: {
  onClick: () => void;
  disabled?: boolean;
  userRole?: string;
}) {
  // Only admin can see delete button
  if (userRole !== "admin") {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="text-red-600 border-red-200 hover:bg-red-50"
    >
      <Trash2 size={16} className="mr-2" />
      Supprimer
    </Button>
  );
}
