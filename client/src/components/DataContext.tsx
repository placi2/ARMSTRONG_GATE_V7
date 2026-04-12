import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Site {
  id: string; name: string; location: string;
  description?: string; status?: string; manager?: string;
}

export interface Team {
  id: string; name: string; siteId: string;
  manager?: string; memberCount?: number; createdDate?: string;
}

export interface Employee {
  id: string; name: string; function?: string; teamId: string;
  monthlySalary?: number; salary?: number; joinDate?: string;
  role?: string; status?: string; totalAdvances?: number;
}

export interface Advance {
  id: string; employeeId: string; date: string;
  amount: number; motif?: string; status?: string;
}

export interface Production {
  id: string; siteId?: string; teamId: string; date: string;
  weight?: number; pricePerGram?: number; estimatedValue?: number; value?: number;
}

export interface Expense {
  id: string; siteId?: string; teamId: string; category: string;
  amount: number; date: string; description?: string; comment?: string;
}

export interface CashMovement {
  id: string; siteId: string; siteName?: string; type: string;
  amount: number; date: string; category?: string;
  paymentMethod?: string; description?: string; comment?: string;
}

export interface Equipment {
  id: string; siteId: string; teamId?: string; name: string;
  type: string; status: string; value: number;
  serialNumber?: string; purchaseDate?: string;
}

export interface GoldStock {
  id: string; siteId: string;
  totalProduced: number; currentStock: number; lastUpdated: string;
}

export interface AppUser {
  id: string; name: string; email: string; password?: string;
  role: "admin" | "manager"; siteId?: string; createdAt: string;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface DataContextType {
  // Raw data (unfiltered - for admin)
  allSites: Site[]; allTeams: Team[]; allEmployees: Employee[];
  allProductions: Production[]; allExpenses: Expense[];
  allCashMovements: CashMovement[]; allEquipment: Equipment[];
  allAdvances: Advance[]; goldStocks: GoldStock[];
  appUsers: AppUser[];

  // RBAC-filtered data (use these in pages)
  sites: Site[]; teams: Team[]; employees: Employee[];
  productions: Production[]; expenses: Expense[];
  cashMovements: CashMovement[]; equipment: Equipment[];
  advances: Advance[];

  // CRUD
  addSite: (s: Omit<Site, "id">) => Site;
  updateSite: (id: string, s: Partial<Site>) => void;
  deleteSite: (id: string) => void;

  addTeam: (t: Omit<Team, "id">) => Team;
  updateTeam: (id: string, t: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  addEmployee: (e: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, e: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addProduction: (p: Omit<Production, "id">) => void;
  updateProduction: (id: string, p: Partial<Production>) => void;
  deleteProduction: (id: string) => void;

  addExpense: (e: Omit<Expense, "id">) => void;
  updateExpense: (id: string, e: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addCashMovement: (m: Omit<CashMovement, "id">) => void;
  updateCashMovement: (id: string, m: Partial<CashMovement>) => void;
  deleteCashMovement: (id: string) => void;

  addEquipment: (e: Omit<Equipment, "id">) => void;
  updateEquipment: (id: string, e: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;

  addAdvance: (a: Omit<Advance, "id">) => void;
  deleteAdvance: (id: string) => void;

  updateGoldStock: (siteId: string, delta: number, isProduction: boolean) => void;

  addAppUser: (u: Omit<AppUser, "id" | "createdAt">) => AppUser;
  updateAppUser: (id: string, u: Partial<AppUser>) => void;
  deleteAppUser: (id: string) => void;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const KEYS = {
  sites: "ag_sites", teams: "ag_teams", employees: "ag_employees",
  productions: "ag_productions", expenses: "ag_expenses",
  cashMovements: "ag_cashMovements", equipment: "ag_equipment",
  advances: "ag_advances", goldStocks: "ag_goldStocks", appUsers: "ag_appUsers",
};

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─── Initial data (only used if localStorage is empty) ─────────────────────

const INIT_SITES: Site[] = [
  { id: "S001", name: "Site Principal - Vallée de l'Or", location: "Région Nord", manager: "Jean Dupont" },
  { id: "S002", name: "Site Secondaire - Plateau Est", location: "Région Est", manager: "Marie Sow" },
];
const INIT_TEAMS: Team[] = [
  { id: "T001", name: "Équipe Excavation A", siteId: "S001", manager: "Ahmed Traore" },
  { id: "T002", name: "Équipe Excavation B", siteId: "S001", manager: "Fatima Diallo" },
  { id: "T003", name: "Équipe Raffinage", siteId: "S001", manager: "Kofi Mensah" },
  { id: "T004", name: "Équipe Plateau A", siteId: "S002", manager: "Ibrahim Kone" },
  { id: "T005", name: "Équipe Plateau B", siteId: "S002", manager: "Aissatou Ba" },
];
const INIT_EMPLOYEES: Employee[] = [
  { id: "E001", name: "Moussa Diallo", function: "Mineur", monthlySalary: 350, teamId: "T001", status: "Actif" },
  { id: "E002", name: "Samba Ndiaye", function: "Mineur", monthlySalary: 350, teamId: "T001", status: "Actif" },
  { id: "E003", name: "Ousmane Cisse", function: "Chef d'équipe", monthlySalary: 500, teamId: "T001", status: "Actif" },
  { id: "E004", name: "Mamadou Bah", function: "Mineur", monthlySalary: 320, teamId: "T002", status: "Actif" },
  { id: "E005", name: "Ibrahim Touré", function: "Technicien", monthlySalary: 400, teamId: "T002", status: "Actif" },
];
const INIT_PRODUCTIONS: Production[] = [
  { id: "P001", date: "2026-03-01", teamId: "T001", siteId: "S001", weight: 320, pricePerGram: 65, estimatedValue: 20800 },
  { id: "P002", date: "2026-03-02", teamId: "T001", siteId: "S001", weight: 310, pricePerGram: 65, estimatedValue: 20150 },
  { id: "P003", date: "2026-03-05", teamId: "T002", siteId: "S001", weight: 290, pricePerGram: 65, estimatedValue: 18850 },
  { id: "P004", date: "2026-03-06", teamId: "T004", siteId: "S002", weight: 280, pricePerGram: 65, estimatedValue: 18200 },
  { id: "P005", date: "2026-03-07", teamId: "T005", siteId: "S002", weight: 260, pricePerGram: 65, estimatedValue: 16900 },
];
const INIT_EXPENSES: Expense[] = [
  { id: "EX001", date: "2026-03-01", teamId: "T001", siteId: "S001", category: "Alimentation", amount: 150, comment: "Ravitaillement" },
  { id: "EX002", date: "2026-03-01", teamId: "T001", siteId: "S001", category: "Transport", amount: 200, comment: "Carburant" },
  { id: "EX003", date: "2026-03-03", teamId: "T002", siteId: "S001", category: "Équipement", amount: 800, comment: "Outils" },
  { id: "EX004", date: "2026-03-04", teamId: "T004", siteId: "S002", category: "Salaires", amount: 1200, comment: "Paye équipe" },
];
const INIT_CASH: CashMovement[] = [
  { id: "CM001", date: "2026-03-01", siteId: "S001", siteName: "Site Principal", type: "entrée", amount: 20000, category: "Vente or", paymentMethod: "Espèces" },
  { id: "CM002", date: "2026-03-02", siteId: "S001", siteName: "Site Principal", type: "sortie", amount: 1500, category: "Dépenses opérationnelles", paymentMethod: "Espèces" },
  { id: "CM003", date: "2026-03-03", siteId: "S002", siteName: "Site Secondaire", type: "entrée", amount: 15000, category: "Vente or", paymentMethod: "Virement" },
];
const INIT_USERS: AppUser[] = [
  { id: "AU001", name: "Admin User", email: "admin@goldmine.com", password: "admin123", role: "admin", createdAt: "2026-01-01" },
  { id: "AU002", name: "Manager Site 1", email: "manager@goldmine.com", password: "manager123", role: "manager", siteId: "S001", createdAt: "2026-01-01" },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch { /* AuthContext not ready */ }

  const [allSites, setAllSites] = useState<Site[]>(() => load(KEYS.sites, INIT_SITES));
  const [allTeams, setAllTeams] = useState<Team[]>(() => load(KEYS.teams, INIT_TEAMS));
  const [allEmployees, setAllEmployees] = useState<Employee[]>(() => load(KEYS.employees, INIT_EMPLOYEES));
  const [allProductions, setAllProductions] = useState<Production[]>(() => load(KEYS.productions, INIT_PRODUCTIONS));
  const [allExpenses, setAllExpenses] = useState<Expense[]>(() => load(KEYS.expenses, INIT_EXPENSES));
  const [allCashMovements, setAllCashMovements] = useState<CashMovement[]>(() => load(KEYS.cashMovements, INIT_CASH));
  const [allEquipment, setAllEquipment] = useState<Equipment[]>(() => load(KEYS.equipment, []));
  const [allAdvances, setAllAdvances] = useState<Advance[]>(() => load(KEYS.advances, []));
  const [goldStocks, setGoldStocks] = useState<GoldStock[]>(() => load(KEYS.goldStocks, []));
  const [appUsers, setAppUsers] = useState<AppUser[]>(() => load(KEYS.appUsers, INIT_USERS));

  // Persist on every change
  useEffect(() => { save(KEYS.sites, allSites); }, [allSites]);
  useEffect(() => { save(KEYS.teams, allTeams); }, [allTeams]);
  useEffect(() => { save(KEYS.employees, allEmployees); }, [allEmployees]);
  useEffect(() => { save(KEYS.productions, allProductions); }, [allProductions]);
  useEffect(() => { save(KEYS.expenses, allExpenses); }, [allExpenses]);
  useEffect(() => { save(KEYS.cashMovements, allCashMovements); }, [allCashMovements]);
  useEffect(() => { save(KEYS.equipment, allEquipment); }, [allEquipment]);
  useEffect(() => { save(KEYS.advances, allAdvances); }, [allAdvances]);
  useEffect(() => { save(KEYS.goldStocks, goldStocks); }, [goldStocks]);
  useEffect(() => { save(KEYS.appUsers, appUsers); }, [appUsers]);

  // ─── RBAC filtering ─────────────────────────────────────────────────────────
  const isManager = user?.role === "manager";
  const mgrSiteId = user?.siteId;

  const filterBySite = useCallback(<T extends { siteId?: string }>(items: T[]): T[] => {
    if (!isManager || !mgrSiteId) return items;
    return items.filter(i => i.siteId === mgrSiteId);
  }, [isManager, mgrSiteId]);

  const filterTeamsBySite = useCallback((items: Team[]): Team[] => {
    if (!isManager || !mgrSiteId) return items;
    return items.filter(t => t.siteId === mgrSiteId);
  }, [isManager, mgrSiteId]);

  // RBAC-filtered views
  const sites = useMemo(() => isManager && mgrSiteId ? allSites.filter(s => s.id === mgrSiteId) : allSites, [allSites, isManager, mgrSiteId]);
  const teams = useMemo(() => filterTeamsBySite(allTeams), [allTeams, filterTeamsBySite]);
  
  const employees = useMemo(() => {
    if (!isManager || !mgrSiteId) return allEmployees;
    const teamIds = allTeams.filter(t => t.siteId === mgrSiteId).map(t => t.id);
    return allEmployees.filter(e => teamIds.includes(e.teamId));
  }, [allEmployees, allTeams, isManager, mgrSiteId]);

  const productions = useMemo(() => {
    if (!isManager || !mgrSiteId) return allProductions;
    const teamIds = allTeams.filter(t => t.siteId === mgrSiteId).map(t => t.id);
    return allProductions.filter(p => teamIds.includes(p.teamId) || p.siteId === mgrSiteId);
  }, [allProductions, allTeams, isManager, mgrSiteId]);

  const expenses = useMemo(() => {
    if (!isManager || !mgrSiteId) return allExpenses;
    const teamIds = allTeams.filter(t => t.siteId === mgrSiteId).map(t => t.id);
    return allExpenses.filter(e => teamIds.includes(e.teamId) || e.siteId === mgrSiteId);
  }, [allExpenses, allTeams, isManager, mgrSiteId]);

  const cashMovements = useMemo(() =>
    filterBySite(allCashMovements), [allCashMovements, filterBySite]);

  const equipment = useMemo(() =>
    filterBySite(allEquipment), [allEquipment, filterBySite]);

  const advances = useMemo(() => {
    if (!isManager || !mgrSiteId) return allAdvances;
    const empIds = employees.map(e => e.id);
    return allAdvances.filter(a => empIds.includes(a.employeeId));
  }, [allAdvances, employees, isManager, mgrSiteId]);

  // ─── CRUD Operations ────────────────────────────────────────────────────────

  const addSite = useCallback((s: Omit<Site, "id">): Site => {
    const n = { ...s, id: `S${Date.now()}` };
    setAllSites(p => [...p, n]); return n;
  }, []);
  const updateSite = useCallback((id: string, s: Partial<Site>) => setAllSites(p => p.map(x => x.id === id ? { ...x, ...s } : x)), []);
  const deleteSite = useCallback((id: string) => setAllSites(p => p.filter(x => x.id !== id)), []);

  const addTeam = useCallback((t: Omit<Team, "id">): Team => {
    const n = { ...t, id: `T${Date.now()}` };
    setAllTeams(p => [...p, n]); return n;
  }, []);
  const updateTeam = useCallback((id: string, t: Partial<Team>) => setAllTeams(p => p.map(x => x.id === id ? { ...x, ...t } : x)), []);
  const deleteTeam = useCallback((id: string) => setAllTeams(p => p.filter(x => x.id !== id)), []);

  const addEmployee = useCallback((e: Omit<Employee, "id">): Employee => {
    const n = { ...e, id: `E${Date.now()}`, totalAdvances: 0 };
    setAllEmployees(p => [...p, n]); return n;
  }, []);
  const updateEmployee = useCallback((id: string, e: Partial<Employee>) => setAllEmployees(p => p.map(x => x.id === id ? { ...x, ...e } : x)), []);
  const deleteEmployee = useCallback((id: string) => setAllEmployees(p => p.filter(x => x.id !== id)), []);

  const addProduction = useCallback((prod: Omit<Production, "id">) => {
    const price = prod.pricePerGram || 65;
    const weight = prod.weight || 0;
    const n = { ...prod, id: `P${Date.now()}`, pricePerGram: price, estimatedValue: weight * price, value: weight * price };
    setAllProductions(p => [n, ...p]);
    // Update gold stock
    if (prod.siteId) {
      setGoldStocks(prev => {
        const existing = prev.find(s => s.siteId === prod.siteId);
        const now = new Date().toISOString().split("T")[0];
        if (existing) return prev.map(s => s.siteId === prod.siteId ? { ...s, totalProduced: s.totalProduced + weight, currentStock: s.currentStock + weight, lastUpdated: now } : s);
        return [...prev, { id: `GS${Date.now()}`, siteId: prod.siteId!, totalProduced: weight, currentStock: weight, lastUpdated: now }];
      });
    }
  }, []);
  const updateProduction = useCallback((id: string, p: Partial<Production>) => setAllProductions(prev => prev.map(x => x.id === id ? { ...x, ...p } : x)), []);
  const deleteProduction = useCallback((id: string) => setAllProductions(p => p.filter(x => x.id !== id)), []);

  const addExpense = useCallback((e: Omit<Expense, "id">) => {
    const n = { ...e, id: `EX${Date.now()}` };
    setAllExpenses(p => [n, ...p]);
  }, []);
  const updateExpense = useCallback((id: string, e: Partial<Expense>) => setAllExpenses(p => p.map(x => x.id === id ? { ...x, ...e } : x)), []);
  const deleteExpense = useCallback((id: string) => setAllExpenses(p => p.filter(x => x.id !== id)), []);

  const addCashMovement = useCallback((m: Omit<CashMovement, "id">) => {
    const n = { ...m, id: `CM${Date.now()}` };
    setAllCashMovements(p => [n, ...p]);
  }, []);
  const updateCashMovement = useCallback((id: string, m: Partial<CashMovement>) => setAllCashMovements(p => p.map(x => x.id === id ? { ...x, ...m } : x)), []);
  const deleteCashMovement = useCallback((id: string) => setAllCashMovements(p => p.filter(x => x.id !== id)), []);

  const addEquipment = useCallback((e: Omit<Equipment, "id">) => {
    const n = { ...e, id: `EQ${Date.now()}` };
    setAllEquipment(p => [n, ...p]);
  }, []);
  const updateEquipment = useCallback((id: string, e: Partial<Equipment>) => setAllEquipment(p => p.map(x => x.id === id ? { ...x, ...e } : x)), []);
  const deleteEquipment = useCallback((id: string) => setAllEquipment(p => p.filter(x => x.id !== id)), []);

  const addAdvance = useCallback((a: Omit<Advance, "id">) => {
    const n = { ...a, id: `AV${Date.now()}`, status: "approved" };
    setAllAdvances(p => [n, ...p]);
    // Update employee totalAdvances
    setAllEmployees(prev => prev.map(e =>
      e.id === a.employeeId ? { ...e, totalAdvances: (e.totalAdvances || 0) + a.amount } : e
    ));
    // Auto cash movement
    setAllCashMovements(prev => [{
      id: `CM${Date.now()}`, date: a.date, type: "sortie",
      amount: a.amount, siteId: "", category: "Avances salaires",
      paymentMethod: "Espèces", comment: `Avance — ${a.motif || ""}`,
    }, ...prev]);
  }, []);
  const deleteAdvance = useCallback((id: string) => setAllAdvances(p => p.filter(x => x.id !== id)), []);

  const updateGoldStock = useCallback((siteId: string, delta: number, isProduction: boolean) => {
    setGoldStocks(prev => {
      const now = new Date().toISOString().split("T")[0];
      const existing = prev.find(s => s.siteId === siteId);
      if (existing) {
        return prev.map(s => s.siteId === siteId ? {
          ...s,
          totalProduced: isProduction ? s.totalProduced + delta : s.totalProduced,
          currentStock: s.currentStock + (isProduction ? delta : -delta),
          lastUpdated: now,
        } : s);
      }
      return [...prev, { id: `GS${Date.now()}`, siteId, totalProduced: isProduction ? delta : 0, currentStock: isProduction ? delta : 0, lastUpdated: now }];
    });
  }, []);

  const addAppUser = useCallback((u: Omit<AppUser, "id" | "createdAt">): AppUser => {
    const n: AppUser = { ...u, id: `AU${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] };
    setAppUsers(p => [...p, n]); return n;
  }, []);
  const updateAppUser = useCallback((id: string, u: Partial<AppUser>) => setAppUsers(p => p.map(x => x.id === id ? { ...x, ...u } : x)), []);
  const deleteAppUser = useCallback((id: string) => setAppUsers(p => p.filter(x => x.id !== id)), []);

  return (
    <DataContext.Provider value={{
      allSites, allTeams, allEmployees, allProductions, allExpenses,
      allCashMovements, allEquipment, allAdvances, goldStocks, appUsers,
      sites, teams, employees, productions, expenses, cashMovements, equipment, advances,
      addSite, updateSite, deleteSite,
      addTeam, updateTeam, deleteTeam,
      addEmployee, updateEmployee, deleteEmployee,
      addProduction, updateProduction, deleteProduction,
      addExpense, updateExpense, deleteExpense,
      addCashMovement, updateCashMovement, deleteCashMovement,
      addEquipment, updateEquipment, deleteEquipment,
      addAdvance, deleteAdvance, updateGoldStock,
      addAppUser, updateAppUser, deleteAppUser,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
