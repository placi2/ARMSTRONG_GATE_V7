import { ComparisonPeriods } from "@/components/PeriodComparisonFilters";

export interface PeriodMetrics {
  totalProduction: number;
  totalExpenses: number;
  totalValue: number;
  netResult: number;
  profitability: number;
  teamCount: number;
  averageTeamProfitability: number;
}

export interface ComparisonResult {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
  variations: {
    productionChange: number;
    expensesChange: number;
    valueChange: number;
    resultChange: number;
    profitabilityChange: number;
  };
  trends: {
    productionTrend: "up" | "down" | "stable";
    expensesTrend: "up" | "down" | "stable";
    profitabilityTrend: "up" | "down" | "stable";
  };
}

// Store for live data - updated by DataContext
let _productions: any[] = [];
let _expenses: any[] = [];
let _teams: any[] = [];
let _sites: any[] = [];

export function updateComparisonData(data: { productions: any[]; expenses: any[]; teams: any[]; sites: any[] }) {
  _productions = data.productions;
  _expenses = data.expenses;
  _teams = data.teams;
  _sites = data.sites;
}

function calcValue(p: any) {
  return (p.weight || 0) * (p.pricePerGram || 60);
}

function getPeriodMetrics(startDate: string, endDate: string): PeriodMetrics {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const pp = _productions.filter(p => { const d = new Date(p.date); return d >= start && d <= end; });
  const pe = _expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });

  const totalProduction = pp.reduce((s, p) => s + (p.weight || 0), 0);
  const totalValue = pp.reduce((s, p) => s + calcValue(p), 0);
  const totalExpenses = pe.reduce((s, e) => s + e.amount, 0);
  const netResult = totalValue - totalExpenses;
  const profitability = totalValue > 0 ? (netResult / totalValue) * 100 : 0;

  const tps = _teams.map(team => {
    const tv = pp.filter(p => p.teamId === team.id).reduce((s, p) => s + calcValue(p), 0);
    const te = pe.filter(e => e.teamId === team.id).reduce((s, e) => s + e.amount, 0);
    return tv > 0 ? ((tv - te) / tv) * 100 : 0;
  });

  return {
    totalProduction, totalExpenses, totalValue, netResult, profitability,
    teamCount: _teams.length,
    averageTeamProfitability: tps.length > 0 ? tps.reduce((a, b) => a + b, 0) / tps.length : 0,
  };
}

export function comparePeriodsMetrics(periods: ComparisonPeriods): ComparisonResult {
  const p1 = getPeriodMetrics(periods.period1Start, periods.period1End);
  const p2 = getPeriodMetrics(periods.period2Start, periods.period2End);

  const pct = (a: number, b: number) => a > 0 ? ((b - a) / a) * 100 : 0;
  const productionChange = pct(p1.totalProduction, p2.totalProduction);
  const expensesChange = pct(p1.totalExpenses, p2.totalExpenses);
  const valueChange = pct(p1.totalValue, p2.totalValue);
  const resultChange = p1.netResult !== 0 ? ((p2.netResult - p1.netResult) / Math.abs(p1.netResult)) * 100 : 0;
  const profitabilityChange = p2.profitability - p1.profitability;

  return {
    period1: p1, period2: p2,
    variations: { productionChange, expensesChange, valueChange, resultChange, profitabilityChange },
    trends: {
      productionTrend: productionChange > 2 ? "up" : productionChange < -2 ? "down" : "stable",
      expensesTrend: expensesChange > 2 ? "up" : expensesChange < -2 ? "down" : "stable",
      profitabilityTrend: profitabilityChange > 1 ? "up" : profitabilityChange < -1 ? "down" : "stable",
    },
  };
}

export function getTeamComparisonData(periods: ComparisonPeriods) {
  const p1S = new Date(periods.period1Start), p1E = new Date(periods.period1End);
  const p2S = new Date(periods.period2Start), p2E = new Date(periods.period2End);

  return _teams.map(team => {
    const calc = (s: Date, e: Date) => {
      const prods = _productions.filter(p => { const d = new Date(p.date); return p.teamId === team.id && d >= s && d <= e; });
      const exps = _expenses.filter(x => { const d = new Date(x.date); return x.teamId === team.id && d >= s && d <= e; });
      const val = prods.reduce((s, p) => s + calcValue(p), 0);
      const exp = exps.reduce((s, e) => s + e.amount, 0);
      return { value: val, expenses: exp, result: val - exp, profitability: val > 0 ? ((val - exp) / val) * 100 : 0 };
    };
    const c1 = calc(p1S, p1E), c2 = calc(p2S, p2E);
    return {
      name: team.name,
      period1: { value: Math.round(c1.value / 1000), expenses: Math.round(c1.expenses / 1000), result: Math.round(c1.result / 1000), profitability: c1.profitability },
      period2: { value: Math.round(c2.value / 1000), expenses: Math.round(c2.expenses / 1000), result: Math.round(c2.result / 1000), profitability: c2.profitability },
      variation: { valueChange: c1.value > 0 ? ((c2.value - c1.value) / c1.value) * 100 : 0, profitabilityChange: c2.profitability - c1.profitability },
    };
  });
}

export function getSiteComparisonData(periods: ComparisonPeriods) {
  const p1S = new Date(periods.period1Start), p1E = new Date(periods.period1End);
  const p2S = new Date(periods.period2Start), p2E = new Date(periods.period2End);

  return _sites.map(site => {
    const siteTeamIds = _teams.filter(t => t.siteId === site.id).map(t => t.id);
    const calc = (s: Date, e: Date) => {
      const prods = _productions.filter(p => { const d = new Date(p.date); return siteTeamIds.includes(p.teamId) && d >= s && d <= e; });
      const exps = _expenses.filter(x => { const d = new Date(x.date); return siteTeamIds.includes(x.teamId) && d >= s && d <= e; });
      const val = prods.reduce((s, p) => s + calcValue(p), 0);
      const exp = exps.reduce((s, e) => s + e.amount, 0);
      return { value: val, expenses: exp, result: val - exp, profitability: val > 0 ? ((val - exp) / val) * 100 : 0 };
    };
    const c1 = calc(p1S, p1E), c2 = calc(p2S, p2E);
    return {
      name: site.name,
      period1: { value: Math.round(c1.value / 1000), expenses: Math.round(c1.expenses / 1000), result: Math.round(c1.result / 1000), profitability: c1.profitability },
      period2: { value: Math.round(c2.value / 1000), expenses: Math.round(c2.expenses / 1000), result: Math.round(c2.result / 1000), profitability: c2.profitability },
      variation: { valueChange: c1.value > 0 ? ((c2.value - c1.value) / c1.value) * 100 : 0, profitabilityChange: c2.profitability - c1.profitability },
    };
  });
}
