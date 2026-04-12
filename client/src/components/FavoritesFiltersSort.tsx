import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, X } from "lucide-react";

export type SortOption = "recent" | "oldest" | "performance" | "name";
export type FilterType = "all" | "employee" | "team";

interface FavoritesFiltersSortProps {
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterType) => void;
  onSearchChange: (search: string) => void;
  currentSort?: SortOption;
  currentFilter?: FilterType;
  currentSearch?: string;
}

export default function FavoritesFiltersSort({
  onSortChange,
  onFilterChange,
  onSearchChange,
  currentSort = "recent",
  currentFilter = "all",
  currentSearch = "",
}: FavoritesFiltersSortProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onSearchChange(value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onSearchChange("");
  };

  const sortOptions = [
    { value: "recent" as const, label: "Plus récents" },
    { value: "oldest" as const, label: "Plus anciens" },
    { value: "performance" as const, label: "Meilleure performance" },
    { value: "name" as const, label: "Nom (A-Z)" },
  ];

  const filterOptions = [
    { value: "all" as const, label: "Tous" },
    { value: "employee" as const, label: "Employés uniquement" },
    { value: "team" as const, label: "Équipes uniquement" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filtres et Tri</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-600"
        >
          {isOpen ? "Masquer" : "Afficher"}
        </Button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Rechercher
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Nom ou équipe..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filter by Type */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Type
            </label>
            <Select value={currentFilter} onValueChange={onFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort by */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Trier par
            </label>
            <Select value={currentSort} onValueChange={onSortChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
