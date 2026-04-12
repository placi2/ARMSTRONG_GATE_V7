import { FilterState } from "@/components/AdvancedFilters";

// Live data store - updated by Dashboard
let _productions: any[] = [];
let _expenses: any[] = [];
let _teams: any[] = [];
let _sites: any[] = [];
let _goldPrice = 60;

export function updateFilterData(data: {
  productions: any[]; expenses: any[]; teams: any[]; sites: any[]; goldPrice?: number;
}) {
  _productions = data.productions;
  _expenses = data.expenses;
  _teams = data.teams;
  _sites = data.sites;
  if (data.goldPrice) _goldPrice = data.goldPrice;
}

function calcValue(p: any) {
  return (p.weight || 0) * (p.pricePerGram || _goldPrice);
}

export function filterProductionsByDateRange(startDate: string, endDate: string) {
  return _productions.filter(p => {
    const d = new Date(p.date);
    return d >= new Date(startDate) && d <= new Date(endDate);
  });
}

export function filterExpensesByDateRange(startDate: string, endDate: string) {
  return _expenses.filter(e => {
    const d = new Date(e.date);
    return d >= new Date(startDate) && d <= new Date(endDate);
  });
}

export function applyFilters(filters: FilterState) {
  let filteredTeams = _teams;
  if (filters.siteId) filteredTeams = filteredTeams.filter(t => t.siteId === filters.siteId);
  if (filters.teamId) filteredTeams = filteredTeams.filter(t => t.id === filters.teamId);
  return filteredTeams;
}

export function getFilteredTeamMetrics(filters: FilterState) {
  const filteredTeams = applyFilters(filters);
  
  let filteredProductions = _productions;
  let filteredExpenses = _expenses;
  
  if (filters.startDate && filters.endDate) {
    filteredProductions = filterProductionsByDateRange(filters.startDate, filters.endDate);
    filteredExpenses = filterExpensesByDateRange(filters.startDate, filters.endDate);
  }

  return filteredTeams.map(team => {
    const teamProds = filteredProductions.filter(p => p.teamId === team.id);
    const teamExps = filteredExpenses.filter(e => e.teamId === team.id);
    const totalProduction = teamProds.reduce((s, p) => s + (p.weight || 0), 0);
    const totalValue = teamProds.reduce((s, p) => s + calcValue(p), 0);
    const totalExpenses = teamExps.reduce((s, e) => s + e.amount, 0);
    const netResult = totalValue - totalExpenses;
    const profitability = totalValue > 0 ? (netResult / totalValue) * 100 : 0;
    const site = _sites.find(s => s.id === team.siteId);
    return {
      ...team, siteName: site?.name || "—",
      totalProduction, totalValue, totalExpenses, netResult, profitability,
      status: netResult > 0 ? "Rentable" : "Non rentable",
    };
  });
}

export function getFilteredSiteMetrics(filters: FilterState) {
  let filteredSites = _sites;
  if (filters.siteId) filteredSites = filteredSites.filter(s => s.id === filters.siteId);

  return filteredSites.map(site => {
    const siteTeams = _teams.filter(t => t.siteId === site.id);
    let prods = _productions.filter(p => siteTeams.some(t => t.id === p.teamId));
    let exps = _expenses.filter(e => siteTeams.some(t => t.id === e.teamId));
    
    if (filters.startDate && filters.endDate) {
      prods = prods.filter(p => p.date >= filters.startDate! && p.date <= filters.endDate!);
      exps = exps.filter(e => e.date >= filters.startDate! && e.date <= filters.endDate!);
    }

    const totalProduction = prods.reduce((s, p) => s + (p.weight || 0), 0);
    const totalValue = prods.reduce((s, p) => s + calcValue(p), 0);
    const totalExpenses = exps.reduce((s, e) => s + e.amount, 0);
    const netResult = totalValue - totalExpenses;
    return {
      ...site, totalProduction, totalValue, totalExpenses, netResult,
      profitability: totalValue > 0 ? (netResult / totalValue) * 100 : 0,
      status: netResult > 0 ? "Rentable" : "Non rentable",
      teamCount: siteTeams.length,
    };
  });
}

export function getGlobalMetrics(filters: FilterState) {
  const teamMetrics = getFilteredTeamMetrics(filters);
  const totalProduction = teamMetrics.reduce((s, t) => s + t.totalProduction, 0);
  const totalValue = teamMetrics.reduce((s, t) => s + t.totalValue, 0);
  const totalExpenses = teamMetrics.reduce((s, t) => s + t.totalExpenses, 0);
  const netResult = totalValue - totalExpenses;
  return {
    totalProduction, totalValue, totalExpenses, netResult,
    profitability: totalValue > 0 ? (netResult / totalValue) * 100 : 0,
    teamCount: teamMetrics.length,
    rentableTeams: teamMetrics.filter(t => t.status === "Rentable").length,
  };
}
