import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Filter, X } from "lucide-react";
import { sites, teams } from "@/lib/mockData";

export interface FilterState {
  startDate: string;
  endDate: string;
  siteId: string;
  teamId: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  showTeamFilter?: boolean;
}

export default function AdvancedFilters({
  onFilterChange,
  showTeamFilter = true,
}: AdvancedFiltersProps) {
  const today = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [filters, setFilters] = useState<FilterState>({
    startDate: firstDayOfMonth,
    endDate: today,
    siteId: "all",
    teamId: "all",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      startDate: firstDayOfMonth,
      endDate: today,
      siteId: "all",
      teamId: "all",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Get teams for the selected site
  const filteredTeams = filters.siteId && filters.siteId !== "all"
    ? teams.filter((t) => t.siteId === filters.siteId)
    : teams;

  // Check if any filters are active
  const hasActiveFilters = filters.siteId !== "all" || filters.teamId !== "all";

  return (
    <Card className="bg-white border border-slate-200">
      <CardContent className="pt-6">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-amber-600" />
            <span className="font-semibold text-slate-900">Filtres Avancés</span>
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full">
                {(filters.siteId ? 1 : 0) + (filters.teamId ? 1 : 0)}
              </span>
            )}
          </div>
          <div className="text-slate-500">
            {isExpanded ? "▼" : "▶"}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 space-y-4 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Date Début
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  Date Fin
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Site Selection */}
              <div className="space-y-2">
                <Label htmlFor="site-filter" className="text-sm font-medium">
                  Site
                </Label>
                <Select
                  value={filters.siteId}
                  onValueChange={(value) => {
                    handleFilterChange("siteId", value);
                    // Reset team filter when site changes
                    if (value !== filters.siteId) {
                      handleFilterChange("teamId", "all");
                    }
                  }}
                >
                  <SelectTrigger id="site-filter">
                    <SelectValue placeholder="Tous les sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name.split(" ")[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Selection */}
              {showTeamFilter && (
                <div className="space-y-2">
                  <Label htmlFor="team-filter" className="text-sm font-medium">
                    Équipe
                  </Label>
                  <Select
                    value={filters.teamId}
                    onValueChange={(value) => handleFilterChange("teamId", value)}
                    disabled={!filters.siteId || filters.siteId === "all"}
                  >
                    <SelectTrigger id="team-filter">
                      <SelectValue placeholder="Toutes les équipes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les équipes</SelectItem>
                      {filteredTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X size={16} />
                Réinitialiser
              </Button>
              <Button
                onClick={() => setIsExpanded(false)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              >
                Appliquer les Filtres
              </Button>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">Filtres actifs:</span>
                  {filters.siteId && filters.siteId !== "all" && (
                    <span className="ml-2">
                      Site: <strong>{sites.find((s) => s.id === filters.siteId)?.name.split(" ")[0]}</strong>
                    </span>
                  )}
                  {filters.teamId && filters.teamId !== "all" && (
                    <span className="ml-2">
                      Équipe: <strong>{teams.find((t) => t.id === filters.teamId)?.name}</strong>
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
