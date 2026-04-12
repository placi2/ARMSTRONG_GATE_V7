import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { sites } from "@/lib/mockData";

interface TeamsFiltersProps {
  onFilterChange: (siteId: string) => void;
}

export default function TeamsFilters({ onFilterChange }: TeamsFiltersProps) {
  const [selectedSite, setSelectedSite] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSiteChange = (value: string) => {
    setSelectedSite(value);
    onFilterChange(value);
  };

  const handleReset = () => {
    setSelectedSite("all");
    onFilterChange("all");
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-blue-600" />
            <span className="font-medium text-slate-900">Filtrer par Site</span>
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

        {isExpanded && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sélectionner un site
              </label>
              <Select value={selectedSite} onValueChange={handleSiteChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSite !== "all" && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="text-slate-600 border-slate-300"
                >
                  <X size={16} className="mr-2" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
