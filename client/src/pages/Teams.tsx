import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import RbacGuard, { ReadOnlyBanner } from "@/components/RbacGuard";
import { useRbac } from "@/hooks/useRbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddProductionForm from "@/components/AddProductionForm";
import AddExpenseForm from "@/components/AddExpenseForm";
import AddTeamForm from "@/components/AddTeamForm";
import FavoriteButton from "@/components/FavoriteButton";
import TeamsFilters from "@/components/TeamsFilters";
import EditTeamForm from "@/components/EditTeamForm";
import DeleteConfirmDialog, { DeleteButton } from "@/components/DeleteConfirmDialog";
import { useData } from "@/contexts/DataContext";
import { teams, sites, employees, calculateTeamMetrics } from "@/lib/mockData";
import { Users, TrendingUp, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Teams() {
  const [selectedSiteId, setSelectedSiteId] = useState("all");

  const teamMetrics = teams.map((team) => {
    const site = sites.find((s) => s.id === team.siteId);
    const teamEmployees = employees.filter((e) => e.teamId === team.id);
    const metrics = calculateTeamMetrics(team.id);

    return {
      ...team,
      siteName: site?.name || "Unknown",
      employeeCount: teamEmployees.length,
      ...metrics,
    };
  });

  // Filter by site
  const filteredTeams = selectedSiteId === "all"
    ? teamMetrics
    : teamMetrics.filter((t) => t.siteId === selectedSiteId);

  // Sort by production (volume of gold)
  const sortedTeams = [...filteredTeams].sort((a, b) => b.totalProduction - a.totalProduction);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Gestion des Équipes
            </h1>
            <p className="text-slate-600">
              Suivi des performances et rentabilité des équipes
            </p>
          </div>
          <div className="flex gap-2">
            <AddProductionForm />
            <AddExpenseForm />
            <AddTeamForm />
          </div>
        </div>

        {/* Filters */}
        <TeamsFilters onFilterChange={setSelectedSiteId} />

        {/* Teams Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Classement des Équipes par Volume de Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900 w-10">
                      ★
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Équipe
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Site
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Responsable
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Employés
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Production (g)
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Valeur (€)
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Dépenses (€)
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Résultat (€)
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Rentabilité
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Statut
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((team, index) => (
                    <tr key={team.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-center">
                        <FavoriteButton
                          id={team.id || ""}
                          type="team"
                          name={team.name || ""}
                          size="sm"
                          variant="ghost"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">
                            {index + 1}
                          </span>
                          <Link href={`/team/${team.id}`}>
                            <a className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                              {team.name}
                              <ExternalLink size={14} />
                            </a>
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {team.siteName.split(" ")[0]}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{team.manager}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-bold text-blue-700">
                          {team.employeeCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {team.totalProduction}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-600">
                        {Math.round(team.totalValue / 1000)}k
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">
                        {Math.round(team.totalExpenses / 1000)}k
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span
                          className={
                            team.netResult > 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {Math.round(team.netResult / 1000)}k
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-900">
                          {team.profitability.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                            team.status === "Rentable"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {team.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <EditTeamForm
                          teamId={team.id}
                          teamName={team.name}
                          manager={team.manager}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Team Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Productive Team */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                Équipe la Plus Productive
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedTeams.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 text-lg">
                        {sortedTeams[0].name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {sortedTeams[0].siteName}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">
                      {sortedTeams[0].totalProduction}g
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Valeur:</span>
                      <span className="font-bold text-slate-900">
                        {Math.round(sortedTeams[0].totalValue / 1000)}k €
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Dépenses:</span>
                      <span className="font-bold text-slate-900">
                        {Math.round(sortedTeams[0].totalExpenses / 1000)}k €
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Rentabilité:</span>
                      <span className="font-bold text-green-600">
                        {sortedTeams[0].profitability.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Statistics */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Statistiques Globales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Nombre d'équipes</span>
                  <span className="font-bold text-slate-900">{teams.length}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Production moyenne</span>
                  <span className="font-bold text-slate-900">
                    {Math.round(
                      teamMetrics.reduce((sum, t) => sum + t.totalProduction, 0) /
                        teams.length
                    )}
                    g
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Rentabilité moyenne</span>
                  <span className="font-bold text-slate-900">
                    {(
                      teamMetrics.reduce((sum, t) => sum + t.profitability, 0) /
                      teams.length
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Équipes rentables</span>
                  <span className="font-bold text-green-600">
                    {teamMetrics.filter((t) => t.status === "Rentable").length}/
                    {teams.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
