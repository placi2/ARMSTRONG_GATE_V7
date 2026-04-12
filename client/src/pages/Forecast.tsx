import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import {
  generateProductionForecast,
  analyzeTrend,
  getForecastSummary,
} from "@/lib/forecastUtils";
import { sites, teams } from "@/lib/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function Forecast() {
  const [selectedType, setSelectedType] = useState<"global" | "site" | "team">(
    "global"
  );
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Generate forecast based on selection
  const forecast =
    selectedType === "global"
      ? generateProductionForecast()
      : selectedType === "site"
        ? generateProductionForecast(undefined, selectedSiteId)
        : generateProductionForecast(selectedTeamId);

  // Analyze trend
  const trend =
    selectedType === "global"
      ? analyzeTrend()
      : selectedType === "site"
        ? analyzeTrend(undefined, selectedSiteId)
        : analyzeTrend(selectedTeamId);

  // Get summary
  const summary = getForecastSummary(forecast);

  // Get filtered teams for site
  const filteredTeams = selectedSiteId
    ? teams.filter((t) => t.siteId === selectedSiteId)
    : teams;

  // Get site/team name
  const selectedSiteName = sites.find((s) => s.id === selectedSiteId)?.name || "";
  const selectedTeamName = teams.find((t) => t.id === selectedTeamId)?.name || "";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Prévisions de Production
            </h1>
            <p className="text-sm md:text-base text-slate-600">
              Analyse des tendances et prévisions pour les 6 prochains mois
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {/* Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Niveau d'analyse
                </label>
                <Select value={selectedType} onValueChange={(value: any) => {
                  setSelectedType(value);
                  setSelectedSiteId("");
                  setSelectedTeamId("");
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="site">Par Site</SelectItem>
                    <SelectItem value="team">Par Équipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Site Selection */}
              {selectedType !== "global" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Site
                  </label>
                  <Select value={selectedSiteId} onValueChange={(value) => {
                    setSelectedSiteId(value);
                    setSelectedTeamId("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Team Selection */}
              {selectedType === "team" && selectedSiteId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    Équipe
                  </label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une équipe" />
                    </SelectTrigger>
                    <SelectContent>
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
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Tendance"
            value={trend.trend === "up" ? "↗ Hausse" : trend.trend === "down" ? "↘ Baisse" : "→ Stable"}
            icon={
              trend.trend === "up" ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )
            }
          />
          <StatCard
            title="Force de Tendance"
            value={`${trend.trendStrength}%`}
          />
          <StatCard
            title="Volatilité"
            value={`${trend.volatility}%`}
          />
          <StatCard
            title="Confiance"
            value={`${trend.confidence}%`}
          />
        </div>

        {/* Forecast Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Production Moyenne (6 mois)"
            value={`${summary.averageForecast}g`}
          />
          <StatCard
            title="Production Minimale"
            value={`${summary.minForecast}g`}
          />
          <StatCard
            title="Production Maximale"
            value={`${summary.maxForecast}g`}
          />
          <StatCard
            title="Total Prévu (6 mois)"
            value={`${summary.totalForecast}g`}
          />
        </div>

        {/* Forecast Chart */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Prévision de Production - 12 Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: any) => [
                      typeof value === "number" ? `${Math.round(value)}g` : value,
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    fill="url(#colorForecast)"
                    stroke="none"
                    name="Intervalle inférieur"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    fill="none"
                    stroke="none"
                    name="Intervalle supérieur"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Production réelle"
                    dot={{ fill: "#10b981", r: 4 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Prévision"
                    dot={{ fill: "#f59e0b", r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seasonality */}
          <Card className="bg-blue-50 border border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Saisonnalité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-900">
                {trend.seasonality
                  ? "Une saisonnalité a été détectée dans les données. Les variations mensuelles peuvent être significatives."
                  : "Aucune saisonnalité majeure détectée. La production est relativement stable."}
              </p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-green-50 border border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Recommandations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-900">
                {trend.trend === "up"
                  ? "La tendance est à la hausse. Continuez à optimiser les processus actuels."
                  : trend.trend === "down"
                    ? "La tendance est à la baisse. Envisagez une révision des stratégies."
                    : "La production est stable. Maintenez les pratiques actuelles."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Forecast Table */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Détails des Prévisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Mois
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Réelle
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Prévision
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Min
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Max
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 text-slate-900">{row.month}</td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {row.actual ? `${row.actual}g` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-600">
                        {row.forecast}g
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {Math.round(row.lower)}g
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {Math.round(row.upper)}g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
