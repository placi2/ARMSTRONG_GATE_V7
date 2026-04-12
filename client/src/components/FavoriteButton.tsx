import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useFavorites, FavoriteType } from "@/contexts/FavoritesContext";
import { toast } from "sonner";

interface FavoriteButtonProps {
  id: string;
  type: FavoriteType;
  name: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
  showLabel?: boolean;
}

export default function FavoriteButton({
  id,
  type,
  name,
  size = "md",
  variant = "ghost",
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorited = isFavorite(id, type);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (favorited) {
      removeFavorite(id, type);
      toast.success(`${name} retiré des favoris`);
    } else {
      addFavorite(id, type, name);
      toast.success(`${name} ajouté aux favoris`);
    }
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Button
      onClick={handleToggle}
      variant={variant}
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      className={`${sizeClasses[size]} ${
        favorited
          ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
          : "text-slate-400 hover:text-amber-500"
      }`}
      title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star
        size={iconSizes[size]}
        fill={favorited ? "currentColor" : "none"}
      />
      {showLabel && (
        <span className="ml-2 text-sm">
          {favorited ? "Favori" : "Ajouter"}
        </span>
      )}
    </Button>
  );
}
