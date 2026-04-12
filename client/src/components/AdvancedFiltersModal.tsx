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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";

interface AdvancedFiltersProps {
  onApplyFilters: (filters: any) => void;
  onResetFilters: () => void;
  filterOptions: {
    dateRange?: boolean;
    amountRange?: boolean;
    status?: string[];
    category?: string[];
    team?: string[];
    site?: string[];
  };
}

export default function AdvancedFiltersModal({
  onApplyFilters,
  onResetFilters,
  filterOptions,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    minAmount: 0,
    maxAmount: 999999,
    status: "",
    category: "",
    team: "",
    site: "",
  });

  const handleApply = () => {
    onApplyFilters(filters);
    setOpen(false);
  };

  const handleReset = () => {
    setFilters({
      startDate: "",
      endDate: "",
      minAmount: 0,
      maxAmount: 999999,
      status: "",
      category: "",
      team: "",
      site: "",
    });
    onResetFilters();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-slate-600">
          <Filter size={16} className="mr-2" />
          Filtres Avancés
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtres Avancés</DialogTitle>
          <DialogDescription>
            Affinez votre recherche avec des critères spécifiques
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range */}
          {filterOptions.dateRange && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Date de Début
                </Label>
                <input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium">
                  Date de Fin
                </Label>
                <input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Amount Range */}
          {filterOptions.amountRange && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAmount" className="text-sm font-medium">
                  Montant Min (€)
                </Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) =>
                    setFilters({ ...filters, minAmount: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxAmount" className="text-sm font-medium">
                  Montant Max (€)
                </Label>
                <Input
                  id="maxAmount"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    setFilters({ ...filters, maxAmount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          )}

          {/* Status */}
          {filterOptions.status && filterOptions.status.length > 0 && (
            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Statut
              </Label>
              <Select value={filters.status} onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {filterOptions.status.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          {filterOptions.category && filterOptions.category.length > 0 && (
            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Catégorie
              </Label>
              <Select value={filters.category} onValueChange={(value) =>
                setFilters({ ...filters, category: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {filterOptions.category.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Team */}
          {filterOptions.team && filterOptions.team.length > 0 && (
            <div>
              <Label htmlFor="team" className="text-sm font-medium">
                Équipe
              </Label>
              <Select value={filters.team} onValueChange={(value) =>
                setFilters({ ...filters, team: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les équipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les équipes</SelectItem>
                  {filterOptions.team.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Site */}
          {filterOptions.site && filterOptions.site.length > 0 && (
            <div>
              <Label htmlFor="site" className="text-sm font-medium">
                Site
              </Label>
              <Select value={filters.site} onValueChange={(value) =>
                setFilters({ ...filters, site: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sites</SelectItem>
                  {filterOptions.site.map((site) => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 text-slate-600"
            >
              <X size={16} className="mr-2" />
              Réinitialiser
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Appliquer les Filtres
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
