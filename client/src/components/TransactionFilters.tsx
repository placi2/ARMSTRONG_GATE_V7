import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { teams, employees } from "@/lib/mockData";
import { TransactionFilters as TransactionFiltersType } from "@/lib/transactionHistory";

interface TransactionFiltersComponentProps {
  onFilterChange: (filters: TransactionFiltersType) => void;
}

const TRANSACTION_TYPES = [
  { value: "all", label: "Tous les types" },
  { value: "production", label: "Productions" },
  { value: "expense", label: "Dépenses" },
  { value: "advance", label: "Avances" },
  { value: "cash", label: "Mouvements de caisse" },
];

const CATEGORIES = [
  { value: "all", label: "Toutes les catégories" },
  { value: "Production", label: "Production" },
  { value: "Salaires", label: "Salaires" },
  { value: "Équipement", label: "Équipement" },
  { value: "Transport", label: "Transport" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Avance", label: "Avance" },
];

export default function TransactionFiltersComponent({ onFilterChange }: TransactionFiltersComponentProps) {
  const [filters, setFilters] = useState<TransactionFiltersType>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    type: "",
    teamId: "",
    employeeId: "",
    category: "",
    searchText: "",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof TransactionFiltersType, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const defaultFilters: TransactionFiltersType = {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      type: "",
      teamId: "",
      employeeId: "",
      category: "",
      searchText: "",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-blue-600" />
            <CardTitle>Filtres Avancés</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-600"
          >
            {isExpanded ? "Masquer" : "Afficher"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rechercher
            </label>
            <Input
              type="text"
              placeholder="Rechercher par description, référence, équipe..."
              value={filters.searchText}
              onChange={(e) => handleFilterChange("searchText", e.target.value)}
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de début
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de fin
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type de transaction
              </label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Catégorie
              </label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team and Employee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Équipe
              </label>
              <Select value={filters.teamId} onValueChange={(value) => handleFilterChange("teamId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les équipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les équipes</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employé
              </label>
              <Select value={filters.employeeId} onValueChange={(value) => handleFilterChange("employeeId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les employés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-slate-600 border-slate-300"
            >
              <X size={16} className="mr-2" />
              Réinitialiser les filtres
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
