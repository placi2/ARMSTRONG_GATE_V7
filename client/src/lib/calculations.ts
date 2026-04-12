import type { Production, Expense, Team, Site, Advance, Employee } from "@/contexts/DataContext";

// ─── Core value calculation ───────────────────────────────────────────────────

export function prodValue(p: Production, goldPriceUsd: number): number {
  return (p.weight || 0) * (p.pricePerGram || goldPriceUsd);
}

// ─── Team metrics ─────────────────────────────────────────────────────────────

export interface TeamMetrics {
  teamId: string; teamName: string; siteId: string; siteName: string;
  totalProduction: number; totalValue: number; totalExpenses: number;
  netResult: number; profitability: number; status: string;
}

export function calcTeamMetrics(
  team: Team, productions: Production[], expenses: Expense[],
  goldPriceUsd: number, sites: Site[]
): TeamMetrics {
  const tp = productions.filter(p => p.teamId === team.id);
  const te = expenses.filter(e => e.teamId === team.id);
  const totalProduction = tp.reduce((s, p) => s + (p.weight || 0), 0);
  const totalValue = tp.reduce((s, p) => s + prodValue(p, goldPriceUsd), 0);
  const totalExpenses = te.reduce((s, e) => s + e.amount, 0);
  const netResult = totalValue - totalExpenses;
  const profitability = totalValue > 0 ? (netResult / totalValue) * 100 : 0;
  const site = sites.find(s => s.id === team.siteId);
  return {
    teamId: team.id, teamName: team.name,
    siteId: team.siteId, siteName: site?.name || "—",
    totalProduction, totalValue, totalExpenses, netResult, profitability,
    status: netResult >= 0 ? "Rentable" : "Non rentable",
  };
}

// ─── Site metrics ─────────────────────────────────────────────────────────────

export interface SiteMetrics {
  siteId: string; siteName: string; teamCount: number;
  totalProduction: number; totalValue: number; totalExpenses: number;
  netResult: number; profitability: number; status: string;
}

export function calcSiteMetrics(
  site: Site, teams: Team[], productions: Production[],
  expenses: Expense[], goldPriceUsd: number
): SiteMetrics {
  const siteTeams = teams.filter(t => t.siteId === site.id);
  let totalProduction = 0, totalValue = 0, totalExpenses = 0;
  siteTeams.forEach(team => {
    const m = calcTeamMetrics(team, productions, expenses, goldPriceUsd, [site]);
    totalProduction += m.totalProduction;
    totalValue += m.totalValue;
    totalExpenses += m.totalExpenses;
  });
  const netResult = totalValue - totalExpenses;
  return {
    siteId: site.id, siteName: site.name, teamCount: siteTeams.length,
    totalProduction, totalValue, totalExpenses, netResult,
    profitability: totalValue > 0 ? (netResult / totalValue) * 100 : 0,
    status: netResult >= 0 ? "Rentable" : "Non rentable",
  };
}

// ─── Global metrics ───────────────────────────────────────────────────────────

export interface GlobalMetrics {
  totalProduction: number; totalValue: number; totalExpenses: number;
  netResult: number; profitability: number; cashIn: number; cashOut: number; cashBalance: number;
}

export function calcGlobalMetrics(
  productions: Production[], expenses: Expense[],
  cashMovements: any[], goldPriceUsd: number
): GlobalMetrics {
  const totalProduction = productions.reduce((s, p) => s + (p.weight || 0), 0);
  const totalValue = productions.reduce((s, p) => s + prodValue(p, goldPriceUsd), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const cashIn = cashMovements.filter(m => m.type === "entrée").reduce((s, m) => s + m.amount, 0);
  const cashOut = cashMovements.filter(m => m.type === "sortie").reduce((s, m) => s + m.amount, 0);
  const netResult = totalValue - totalExpenses;
  return {
    totalProduction, totalValue, totalExpenses, netResult,
    profitability: totalValue > 0 ? (netResult / totalValue) * 100 : 0,
    cashIn, cashOut, cashBalance: cashIn - cashOut,
  };
}

// ─── Employee metrics ─────────────────────────────────────────────────────────

export function calcEmployeeMetrics(emp: Employee, advances: Advance[]) {
  const totalAdvances = advances.filter(a => a.employeeId === emp.id).reduce((s, a) => s + a.amount, 0);
  const baseSalary = emp.monthlySalary || emp.salary || 0;
  return { ...emp, baseSalary, totalAdvances, netSalary: baseSalary - totalAdvances };
}

// ─── Monthly trend ────────────────────────────────────────────────────────────

export function calcMonthlyTrend(productions: Production[], expenses: Expense[], goldPriceUsd: number) {
  const months: Record<string, { month: string; production: number; depenses: number; resultat: number }> = {};
  productions.forEach(p => {
    const m = (p.date || "").substring(0, 7);
    if (!m) return;
    if (!months[m]) months[m] = { month: m, production: 0, depenses: 0, resultat: 0 };
    months[m].production += prodValue(p, goldPriceUsd);
  });
  expenses.forEach(e => {
    const m = (e.date || "").substring(0, 7);
    if (!m) return;
    if (!months[m]) months[m] = { month: m, production: 0, depenses: 0, resultat: 0 };
    months[m].depenses += e.amount;
  });
  return Object.values(months)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({ ...m, resultat: m.production - m.depenses }))
    .slice(-6);
}
