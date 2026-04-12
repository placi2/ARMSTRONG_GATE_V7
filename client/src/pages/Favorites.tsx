import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FavoriteButton from "@/components/FavoriteButton";
import FavoritesFiltersSort, { SortOption, FilterType } from "@/components/FavoritesFiltersSort";
import { useFavorites } from "@/contexts/FavoritesContext";
import { employees, teams, calculateEmployeeMetrics, calculateTeamMetrics } from "@/lib/mockData";
import { Star, Trash2, Edit2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Favorites() {
  const { favorites, removeFavorite, updateNotes, getFavoritesByType } = useFavorites();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Apply filters and sorting
  const applyFiltersAndSort = (items: any[], type: "employee" | "team") => {
    let filtered = items;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const name = type === "employee" ? item.employee?.name : item.team?.name;
        return name?.toLowerCase().includes(query);
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "recent":
          return b.addedAt - a.addedAt;
        case "oldest":
          return a.addedAt - b.addedAt;
        case "performance":
          const metricsA = a.metrics;
          const metricsB = b.metrics;
          if (type === "employee") {
            return (metricsB?.netSalary || 0) - (metricsA?.netSalary || 0);
          } else {
            return (metricsB?.profitability || 0) - (metricsA?.profitability || 0);
          }
        case "name":
          const nameA = type === "employee" ? a.employee?.name : a.team?.name;
          const nameB = type === "employee" ? b.employee?.name : b.team?.name;
          return (nameA || "").localeCompare(nameB || "");
        default:
          return 0;
      }
    });

    return sorted;
  };

  const rawFavoriteEmployees = getFavoritesByType("employee");
  const rawFavoriteTeams = getFavoritesByType("team");

  const handleEditNotes = (id: string, currentNotes: string) => {
    setEditingId(id);
    setEditNotes(currentNotes || "");
  };

  const handleSaveNotes = (id: string) => {
    updateNotes(id, "employee", editNotes);
    setEditingId(null);
    toast.success("Notes mises à jour");
  };

  const handleSaveTeamNotes = (id: string) => {
    updateNotes(id, "team", editNotes);
    setEditingId(null);
    toast.success("Notes mises à jour");
  };

  const handleRemove = (id: string, type: "employee" | "team", name: string) => {
    removeFavorite(id, type);
    toast.success(`${name} retiré des favoris`);
  };

  // Get employee details
  const employeeDetails = rawFavoriteEmployees.map((fav) => {
    const emp = employees.find((e) => e.id === fav.id);
    const metrics = emp ? calculateEmployeeMetrics(emp.id) : null;
    return { ...fav, employee: emp, metrics };
  });

  // Get team details
  const teamDetails = rawFavoriteTeams.map((fav) => {
    const t = teams.find((tm) => tm.id === fav.id);
    const metrics = t ? calculateTeamMetrics(t.id) : null;
    return { ...fav, team: t, metrics };
  });

  // Apply filters and sorting based on filter type
  const filteredEmployees = filterType === "all" || filterType === "employee" 
    ? applyFiltersAndSort(employeeDetails, "employee")
    : [];
  const filteredTeams = filterType === "all" || filterType === "team"
    ? applyFiltersAndSort(teamDetails, "team")
    : [];

  const favoriteEmployees = filteredEmployees;
  const favoriteTeams = filteredTeams;
  const totalFiltered = favoriteEmployees.length + favoriteTeams.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-600" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mes Favoris</h1>
            <p className="text-slate-600">
              {favorites.length} élément{favorites.length !== 1 ? "s" : ""} marqué{favorites.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-dashed border-2 border-slate-300">
            <CardContent className="pt-12 pb-12 text-center">
              <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Aucun favori pour le moment
              </h3>
              <p className="text-slate-600 mb-6">
                Marquez vos employés et équipes les plus performants pour les suivre facilement
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/employees">
                  <a>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Voir les Employés
                    </Button>
                  </a>
                </Link>
                <Link href="/teams">
                  <a>
                    <Button variant="outline">Voir les Équipes</Button>
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters and Sort */}
            <FavoritesFiltersSort
              onSortChange={setSortOption}
              onFilterChange={setFilterType}
              onSearchChange={setSearchQuery}
              currentSort={sortOption}
              currentFilter={filterType}
              currentSearch={searchQuery}
            />

            {/* Results Summary */}
            {totalFiltered > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  📊 {totalFiltered} résultat{totalFiltered !== 1 ? "s" : ""} trouvé{totalFiltered !== 1 ? "s" : ""} 
                  {searchQuery && ` pour "${searchQuery}"`}
                </p>
              </div>
            )}

            {totalFiltered === 0 && (
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-slate-600">
                    Aucun résultat ne correspond à vos critères de filtrage
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Favorite Employees */}
            {favoriteEmployees.length > 0 && (
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    Employés Favoris ({favoriteEmployees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {favoriteEmployees.map((fav) => {
                      const emp = fav.employee;
                      const metrics = fav.metrics;

                      if (!emp) return null;

                      return (
                        <div
                          key={fav.id}
                          className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <Link href={`/employee/${emp.id}`}>
                                <a className="text-lg font-semibold text-blue-600 hover:text-blue-700">
                                  {emp.name}
                                </a>
                              </Link>
                              <p className="text-sm text-slate-600">{emp.function}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Ajouté le {new Date(fav.addedAt).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNotes(fav.id, fav.notes || "")}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemove(fav.id, "employee", emp.name)
                                }
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </div>
                          </div>

                          {/* Notes Section */}
                          {editingId === fav.id ? (
                            <div className="mb-3">
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Ajouter des notes..."
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                rows={2}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNotes(fav.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Enregistrer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            fav.notes && (
                              <div className="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-900">{fav.notes}</p>
                              </div>
                            )
                          )}

                          {/* Metrics */}
                          {metrics && (
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                              <div>
                                <p className="text-xs text-slate-600">Production</p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {(metrics as any).totalProduction || 0}g
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">Valeur</p>
                                <p className="text-sm font-semibold text-amber-600">
                                  {((metrics as any).totalValue || 0).toLocaleString("fr-FR")}€
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">Salaire Net</p>
                                <p className="text-sm font-semibold text-green-600">
                                  {((metrics as any).netSalary || 0).toLocaleString("fr-FR")}€
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Favorite Teams */}
            {favoriteTeams.length > 0 && (
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    Équipes Favoris ({favoriteTeams.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {favoriteTeams.map((fav) => {
                      const team = fav.team;
                      const metrics = fav.metrics;

                      if (!team) return null;

                      return (
                        <div
                          key={fav.id}
                          className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <Link href={`/team/${team.id}`}>
                                <a className="text-lg font-semibold text-blue-600 hover:text-blue-700">
                                  {team.name}
                                </a>
                              </Link>
                              <p className="text-sm text-slate-600">
                                {team.employees} employé{team.employees !== 1 ? "s" : ""}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Ajouté le {new Date(fav.addedAt).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNotes(fav.id, fav.notes || "")}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemove(fav.id, "team", team.name)
                                }
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </div>
                          </div>

                          {/* Notes Section */}
                          {editingId === fav.id ? (
                            <div className="mb-3">
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Ajouter des notes..."
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                rows={2}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveTeamNotes(fav.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Enregistrer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            fav.notes && (
                              <div className="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-900">{fav.notes}</p>
                              </div>
                            )
                          )}

                          {/* Metrics */}
                          {metrics && (
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                              <div>
                                <p className="text-xs text-slate-600">Production</p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {(metrics as any).totalProduction || 0}g
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">Dépenses</p>
                                <p className="text-sm font-semibold text-red-600">
                                  {((metrics as any).totalExpenses || 0).toLocaleString("fr-FR")}€
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">Rentabilité</p>
                                <p className={`text-sm font-semibold ${(metrics as any).profitability >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {((metrics as any).profitability || 0).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
