import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PeriodComparisonFilters, {
  ComparisonPeriods,
} from "@/components/PeriodComparisonFilters";
import {
  comparePeriodsMetrics,
  getTeamComparisonData,
  getSiteComparisonData,
} from "@/lib/comparisonUtils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function Comparison() {
  const { formatAmount, currencySymbol, settings } = useSettings();
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const previousMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1
  )
    .toISOString()
    .split("T")[0];
  const previousMonthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    0
  )
    .toISOString()
    .split("T")[0];

  const [periods, setPeriods] = useState<ComparisonPeriods>({
    period1Start: previousMonthStart,
    period1End: previousMonthEnd,
    period2Start: currentMonth,
    period2End: today,
  });

  const handlePeriodsChange = (newPeriods: ComparisonPeriods) => {
    setPeriods(newPeriods);
  };

  const comparison = comparePeriodsMetrics(periods);
  const teamComparison = getTeamComparisonData(periods);
  const siteComparison = getSiteComparisonData(periods);

  // Prepare chart data
  const comparisonChartData = [
    {
      metric: "Valeur Production",
      "Période 1": Math.round(comparison.period1.totalValue / 1000),
      "Période 2": Math.round(comparison.period2.totalValue / 1000),
    },
    {
      metric: "Dépenses",
      "Période 1": Math.round(comparison.period1.totalExpenses / 1000),
      "Période 2": Math.round(comparison.period2.totalExpenses / 1000),
    },
    {
      metric: "Résultat Net",
      "Période 1": Math.round(comparison.period1.netResult / 1000),
      "Période 2": Math.round(comparison.period2.netResult / 1000),
    },
  ];

  const profitabilityChartData = [
    {
      metric: "Rentabilité (%)",
      "Période 1": comparison.period1.profitability,
      "Période 2": comparison.period2.profitability,
    },
  ];

  const teamChartData = teamComparison.map((team) => ({
    name: team.name.split(" ")[0],
    "Période 1": team.period1.profitability,
    "Période 2": team.period2.profitability,
  }));

  const siteChartData = siteComparison.map((site) => ({
    name: site.name.split(" ")[0],
    "Période 1": site.period1.profitability,
    "Période 2": site.period2.profitability,
  }));

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up")
      return <ArrowUpRight className="w-5 h-5 text-green-600" />;
    if (trend === "down")
      return <ArrowDownRight className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-slate-600" />;
  };

  const formatVariation = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Comparaison de Périodes
          </h1>
          <p className="text-slate-600">
            Analysez l'évolution de vos performances entre deux périodes
          </p>
        </div>

        {/* Period Comparison Filters */}
        <PeriodComparisonFilters onPeriodsChange={handlePeriodsChange} />

        {/* Comparison Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Production Change */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Évolution Production
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatVariation(comparison.variations.productionChange)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {comparison.period1.totalProduction}g → {comparison.period2.totalProduction}g
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  {getTrendIcon(comparison.trends.productionTrend)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Change */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Évolution Dépenses
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatVariation(comparison.variations.expensesChange)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {Math.round(comparison.period1.totalExpenses / 1000)}k€ → {Math.round(comparison.period2.totalExpenses / 1000)}k€
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  {getTrendIcon(comparison.trends.expensesTrend)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profitability Change */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Évolution Rentabilité
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {comparison.variations.profitabilityChange > 0 ? "+" : ""}
                    {comparison.variations.profitabilityChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {comparison.period1.profitability.toFixed(1)}% → {comparison.period2.profitability.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  {getTrendIcon(comparison.trends.profitabilityTrend)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Metrics Comparison */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Comparaison Financière</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Période 1" fill="#3b82f6" />
                  <Bar dataKey="Période 2" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profitability Comparison */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Comparaison Rentabilité</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profitabilityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Période 1"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="Période 2"
                    stroke="#10b981"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance Comparison */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Comparaison Performance des Équipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Équipe
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Période 1
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Période 2
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Variation
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Tendance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamComparison.map((team) => (
                    <tr key={team.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {team.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-900">
                            {team.period1.profitability.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">
                            {team.period1.result}k€
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-900">
                            {team.period2.profitability.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">
                            {team.period2.result}k€
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${
                            team.variation.profitabilityChange > 0
                              ? "text-green-600"
                              : team.variation.profitabilityChange < 0
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                        >
                          {team.variation.profitabilityChange > 0 ? "+" : ""}
                          {team.variation.profitabilityChange.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {team.variation.profitabilityChange > 1 ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600 mx-auto" />
                        ) : team.variation.profitabilityChange < -1 ? (
                          <ArrowDownRight className="w-5 h-5 text-red-600 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Team Profitability Trend Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Tendance Rentabilité des Équipes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="Période 1" fill="#3b82f6" />
                <Bar dataKey="Période 2" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Site Performance Comparison */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Comparaison Performance des Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Site
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Période 1
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Période 2
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Variation
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Tendance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {siteComparison.map((site) => (
                    <tr key={site.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {site.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-900">
                            {site.period1.profitability.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">
                            {site.period1.result}k€
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-900">
                            {site.period2.profitability.toFixed(1)}%
                          </span>
                          <span className="text-xs text-slate-500">
                            {site.period2.result}k€
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${
                            site.variation.profitabilityChange > 0
                              ? "text-green-600"
                              : site.variation.profitabilityChange < 0
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                        >
                          {site.variation.profitabilityChange > 0 ? "+" : ""}
                          {site.variation.profitabilityChange.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {site.variation.profitabilityChange > 1 ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600 mx-auto" />
                        ) : site.variation.profitabilityChange < -1 ? (
                          <ArrowDownRight className="w-5 h-5 text-red-600 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Site Profitability Trend Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Tendance Rentabilité des Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={siteChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="Période 1" fill="#3b82f6" />
                <Bar dataKey="Période 2" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
