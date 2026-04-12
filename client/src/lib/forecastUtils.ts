import { productions, teams } from "@/lib/mockData";

export interface ForecastData {
  month: string;
  actual: number | null;
  forecast: number;
  lower: number;
  upper: number;
}

export interface TrendAnalysis {
  trend: "up" | "down" | "stable";
  trendStrength: number; // 0-100
  seasonality: boolean;
  volatility: number; // 0-100
  confidence: number; // 0-100
}

/**
 * Simple Linear Regression for trend analysis
 */
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

/**
 * Calculate standard deviation
 */
function standardDeviation(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Detect seasonality pattern (simplified)
 */
function detectSeasonality(data: number[]): boolean {
  if (data.length < 6) return false;

  // Check if there's a repeating pattern
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const variation = Math.abs(firstMean - secondMean) / firstMean;
  return variation > 0.15; // 15% variation threshold
}

/**
 * Generate forecast for next 6 months
 */
export function generateProductionForecast(
  teamId?: string,
  siteId?: string
): ForecastData[] {
  // Filter productions by team or site
  let filteredProductions = productions;
  if (teamId) {
    filteredProductions = productions.filter((p) => p.teamId === teamId);
  } else if (siteId) {
    const siteTeams = teams.filter((t) => t.siteId === siteId);
    const siteTeamIds = siteTeams.map((t) => t.id);
    filteredProductions = productions.filter((p) =>
      siteTeamIds.includes(p.teamId)
    );
  }

  // Group by month and calculate monthly production
  const monthlyData: Record<string, number> = {};
  filteredProductions.forEach((prod) => {
    const date = new Date(prod.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + prod.weight;
  });

  // Get sorted monthly values
  const sortedMonths = Object.keys(monthlyData).sort();
  const historicalValues = sortedMonths.map((m) => monthlyData[m]);

  // Perform linear regression
  const { slope, intercept } = linearRegression(historicalValues);

  // Calculate standard deviation for confidence intervals
  const stdDev = standardDeviation(historicalValues);
  const confidenceInterval = 1.96 * stdDev; // 95% confidence

  // Generate forecast
  const forecast: ForecastData[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Add historical data points
  for (let i = 0; i < sortedMonths.length; i++) {
    const [year, month] = sortedMonths[i].split("-");
    forecast.push({
      month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
        "fr-FR",
        { month: "short", year: "2-digit" }
      ),
      actual: historicalValues[i],
      forecast: historicalValues[i],
      lower: historicalValues[i] - confidenceInterval * 0.5,
      upper: historicalValues[i] + confidenceInterval * 0.5,
    });
  }

  // Generate future forecast (6 months)
  const lastValue = historicalValues[historicalValues.length - 1];
  for (let i = 1; i <= 6; i++) {
    const futureMonth = new Date(currentYear, currentMonth + i);
    const monthIndex = historicalValues.length + i - 1;
    const forecastValue = Math.max(
      0,
      intercept + slope * monthIndex + lastValue * 0.1 * (Math.random() - 0.5)
    );

    forecast.push({
      month: futureMonth.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      }),
      actual: null,
      forecast: Math.round(forecastValue),
      lower: Math.max(0, Math.round(forecastValue - confidenceInterval)),
      upper: Math.round(forecastValue + confidenceInterval),
    });
  }

  return forecast;
}

/**
 * Analyze production trend
 */
export function analyzeTrend(teamId?: string, siteId?: string): TrendAnalysis {
  // Filter productions
  let filteredProductions = productions;
  if (teamId) {
    filteredProductions = productions.filter((p) => p.teamId === teamId);
  } else if (siteId) {
    const siteTeams = teams.filter((t) => t.siteId === siteId);
    const siteTeamIds = siteTeams.map((t) => t.id);
    filteredProductions = productions.filter((p) =>
      siteTeamIds.includes(p.teamId)
    );
  }

  // Group by month
  const monthlyData: Record<string, number> = {};
  filteredProductions.forEach((prod) => {
    const date = new Date(prod.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + prod.weight;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const values = sortedMonths.map((m) => monthlyData[m]);

  if (values.length < 2) {
    return {
      trend: "stable",
      trendStrength: 0,
      seasonality: false,
      volatility: 0,
      confidence: 50,
    };
  }

  // Calculate trend
  const { slope } = linearRegression(values);
  const trend: "up" | "down" | "stable" =
    slope > 5 ? "up" : slope < -5 ? "down" : "stable";

  // Calculate trend strength (0-100)
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trendStrength = Math.min(
    100,
    Math.abs((secondMean - firstMean) / firstMean) * 100
  );

  // Detect seasonality
  const seasonality = detectSeasonality(values);

  // Calculate volatility (0-100)
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  const stdDev = Math.sqrt(variance);
  const volatility = Math.min(100, (stdDev / mean) * 100);

  // Confidence based on data consistency
  const confidence = Math.max(50, 100 - volatility);

  return {
    trend,
    trendStrength: Math.round(trendStrength),
    seasonality,
    volatility: Math.round(volatility),
    confidence: Math.round(confidence),
  };
}

/**
 * Get forecast summary
 */
export function getForecastSummary(forecast: ForecastData[]) {
  const futureForecasts = forecast.filter((f) => f.actual === null);
  if (futureForecasts.length === 0) {
    return {
      averageForecast: 0,
      minForecast: 0,
      maxForecast: 0,
      totalForecast: 0,
    };
  }

  const values = futureForecasts.map((f) => f.forecast);
  return {
    averageForecast: Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    ),
    minForecast: Math.round(Math.min(...values)),
    maxForecast: Math.round(Math.max(...values)),
    totalForecast: Math.round(values.reduce((a, b) => a + b, 0)),
  };
}
