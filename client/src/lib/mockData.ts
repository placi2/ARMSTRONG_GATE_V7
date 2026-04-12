// Mock data for the gold mining application
export const sites = [
  {
    id: "S001",
    name: "Site Principal - Vallée de l'Or",
    location: "Région Nord, Coordonnées: 5.2°N, 10.5°W",
    manager: "Jean Dupont",
    teams: ["T001", "T002", "T003"],
    totalProduction: 2850,
    totalExpenses: 4200,
  },
  {
    id: "S002",
    name: "Site Secondaire - Plateau Est",
    location: "Région Est, Coordonnées: 4.8°N, 9.2°W",
    manager: "Marie Sow",
    teams: ["T004", "T005"],
    totalProduction: 1650,
    totalExpenses: 2100,
  },
];

export const teams = [
  {
    id: "T001",
    name: "Équipe Excavation A",
    siteId: "S001",
    manager: "Ahmed Traore",
    createdDate: "2025-01-15",
    employees: ["E001", "E002", "E003", "E004"],
    totalProduction: 950,
    totalExpenses: 1400,
  },
  {
    id: "T002",
    name: "Équipe Excavation B",
    siteId: "S001",
    manager: "Fatima Diallo",
    createdDate: "2025-01-20",
    employees: ["E005", "E006", "E007"],
    totalProduction: 950,
    totalExpenses: 1300,
  },
  {
    id: "T003",
    name: "Équipe Raffinage",
    siteId: "S001",
    manager: "Kofi Mensah",
    createdDate: "2025-02-01",
    employees: ["E008", "E009"],
    totalProduction: 950,
    totalExpenses: 1500,
  },
  {
    id: "T004",
    name: "Équipe Plateau A",
    siteId: "S002",
    manager: "Ibrahim Kone",
    createdDate: "2025-02-10",
    employees: ["E010", "E011", "E012"],
    totalProduction: 850,
    totalExpenses: 1100,
  },
  {
    id: "T005",
    name: "Équipe Plateau B",
    siteId: "S002",
    manager: "Aissatou Ba",
    createdDate: "2025-02-15",
    employees: ["E013", "E014"],
    totalProduction: 800,
    totalExpenses: 1000,
  },
];

export const employees = [
  {
    id: "E001",
    name: "Moussa Diallo",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T001",
    role: "Employé",
    status: "Actif",
    totalAdvances: 100,
  },
  {
    id: "E002",
    name: "Samba Ndiaye",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T001",
    role: "Employé",
    status: "Actif",
    totalAdvances: 50,
  },
  {
    id: "E003",
    name: "Ousmane Cisse",
    function: "Chef d'équipe",
    monthlySalary: 500,
    teamId: "T001",
    role: "Manager",
    status: "Actif",
    totalAdvances: 150,
  },
  {
    id: "E004",
    name: "Lamine Ba",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T001",
    role: "Employé",
    status: "Actif",
    totalAdvances: 75,
  },
  {
    id: "E005",
    name: "Aminata Sow",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T002",
    role: "Employé",
    status: "Actif",
    totalAdvances: 0,
  },
  {
    id: "E006",
    name: "Mariama Diop",
    function: "Chef d'équipe",
    monthlySalary: 500,
    teamId: "T002",
    role: "Manager",
    status: "Actif",
    totalAdvances: 100,
  },
  {
    id: "E007",
    name: "Issa Kone",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T002",
    role: "Employé",
    status: "Actif",
    totalAdvances: 50,
  },
  {
    id: "E008",
    name: "Adama Toure",
    function: "Technicien Raffinage",
    monthlySalary: 450,
    teamId: "T003",
    role: "Manager",
    status: "Actif",
    totalAdvances: 200,
  },
  {
    id: "E009",
    name: "Fatoumata Sall",
    function: "Technicien Raffinage",
    monthlySalary: 450,
    teamId: "T003",
    role: "Employé",
    status: "Actif",
    totalAdvances: 75,
  },
  {
    id: "E010",
    name: "Sekou Diallo",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T004",
    role: "Employé",
    status: "Actif",
    totalAdvances: 125,
  },
  {
    id: "E011",
    name: "Hawa Traore",
    function: "Chef d'équipe",
    monthlySalary: 500,
    teamId: "T004",
    role: "Manager",
    status: "Actif",
    totalAdvances: 0,
  },
  {
    id: "E012",
    name: "Mamadou Bah",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T004",
    role: "Employé",
    status: "Actif",
    totalAdvances: 50,
  },
  {
    id: "E013",
    name: "Oumou Diallo",
    function: "Mineur",
    monthlySalary: 350,
    teamId: "T005",
    role: "Employé",
    status: "Actif",
    totalAdvances: 100,
  },
  {
    id: "E014",
    name: "Bah Kante",
    function: "Chef d'équipe",
    monthlySalary: 500,
    teamId: "T005",
    role: "Manager",
    status: "Actif",
    totalAdvances: 75,
  },
];

export const productions = [
  {
    id: "P001",
    date: "2026-03-01",
    teamId: "T001",
    weight: 320,
    pricePerGram: 65,
    estimatedValue: 20800,
  },
  {
    id: "P002",
    date: "2026-03-02",
    teamId: "T001",
    weight: 310,
    pricePerGram: 65,
    estimatedValue: 20150,
  },
  {
    id: "P003",
    date: "2026-03-03",
    teamId: "T001",
    weight: 320,
    pricePerGram: 65,
    estimatedValue: 20800,
  },
  {
    id: "P004",
    date: "2026-03-01",
    teamId: "T002",
    weight: 310,
    pricePerGram: 65,
    estimatedValue: 20150,
  },
  {
    id: "P005",
    date: "2026-03-02",
    teamId: "T002",
    weight: 320,
    pricePerGram: 65,
    estimatedValue: 20800,
  },
  {
    id: "P006",
    date: "2026-03-03",
    teamId: "T002",
    weight: 320,
    pricePerGram: 65,
    estimatedValue: 20800,
  },
  {
    id: "P007",
    date: "2026-03-01",
    teamId: "T003",
    weight: 310,
    pricePerGram: 65,
    estimatedValue: 20150,
  },
  {
    id: "P008",
    date: "2026-03-02",
    teamId: "T003",
    weight: 320,
    pricePerGram: 65,
    estimatedValue: 20800,
  },
  {
    id: "P009",
    date: "2026-03-03",
    teamId: "T003",
    weight: 320,
    pricePerGram: 65,
    estimatedValue: 20800,
  },
  {
    id: "P010",
    date: "2026-03-01",
    teamId: "T004",
    weight: 280,
    pricePerGram: 65,
    estimatedValue: 18200,
  },
  {
    id: "P011",
    date: "2026-03-02",
    teamId: "T004",
    weight: 285,
    pricePerGram: 65,
    estimatedValue: 18525,
  },
  {
    id: "P012",
    date: "2026-03-03",
    teamId: "T004",
    weight: 285,
    pricePerGram: 65,
    estimatedValue: 18525,
  },
  {
    id: "P013",
    date: "2026-03-01",
    teamId: "T005",
    weight: 265,
    pricePerGram: 65,
    estimatedValue: 17225,
  },
  {
    id: "P014",
    date: "2026-03-02",
    teamId: "T005",
    weight: 270,
    pricePerGram: 65,
    estimatedValue: 17550,
  },
  {
    id: "P015",
    date: "2026-03-03",
    teamId: "T005",
    weight: 265,
    pricePerGram: 65,
    estimatedValue: 17225,
  },
];

export const expenses = [
  {
    id: "EX001",
    date: "2026-03-01",
    teamId: "T001",
    category: "Alimentation",
    amount: 150,
    comment: "Ravitaillement équipe",
  },
  {
    id: "EX002",
    date: "2026-03-01",
    teamId: "T001",
    category: "Transport",
    amount: 200,
    comment: "Carburant",
  },
  {
    id: "EX003",
    date: "2026-03-02",
    teamId: "T001",
    category: "Matériel",
    amount: 300,
    comment: "Outils de travail",
  },
  {
    id: "EX004",
    date: "2026-03-01",
    teamId: "T002",
    category: "Alimentation",
    amount: 140,
    comment: "Ravitaillement équipe",
  },
  {
    id: "EX005",
    date: "2026-03-01",
    teamId: "T002",
    category: "Transport",
    amount: 180,
    comment: "Carburant",
  },
  {
    id: "EX006",
    date: "2026-03-02",
    teamId: "T002",
    category: "Matériel",
    amount: 280,
    comment: "Maintenance équipements",
  },
  {
    id: "EX007",
    date: "2026-03-01",
    teamId: "T003",
    category: "Alimentation",
    amount: 120,
    comment: "Ravitaillement équipe",
  },
  {
    id: "EX008",
    date: "2026-03-01",
    teamId: "T003",
    category: "Transport",
    amount: 250,
    comment: "Carburant raffinage",
  },
  {
    id: "EX009",
    date: "2026-03-02",
    teamId: "T003",
    category: "Matériel",
    amount: 350,
    comment: "Produits chimiques",
  },
  {
    id: "EX010",
    date: "2026-03-01",
    teamId: "T004",
    category: "Alimentation",
    amount: 130,
    comment: "Ravitaillement équipe",
  },
  {
    id: "EX011",
    date: "2026-03-01",
    teamId: "T004",
    category: "Transport",
    amount: 170,
    comment: "Carburant",
  },
  {
    id: "EX012",
    date: "2026-03-02",
    teamId: "T004",
    category: "Matériel",
    amount: 250,
    comment: "Outils de travail",
  },
  {
    id: "EX013",
    date: "2026-03-01",
    teamId: "T005",
    category: "Alimentation",
    amount: 120,
    comment: "Ravitaillement équipe",
  },
  {
    id: "EX014",
    date: "2026-03-01",
    teamId: "T005",
    category: "Transport",
    amount: 160,
    comment: "Carburant",
  },
  {
    id: "EX015",
    date: "2026-03-02",
    teamId: "T005",
    category: "Matériel",
    amount: 220,
    comment: "Maintenance équipements",
  },
];

export const advances = [
  {
    id: "ADV001",
    employeeId: "E001",
    date: "2026-02-28",
    amount: 100,
    reason: "Besoin personnel",
  },
  {
    id: "ADV002",
    employeeId: "E002",
    date: "2026-02-27",
    amount: 50,
    reason: "Frais médicaux",
  },
  {
    id: "ADV003",
    employeeId: "E003",
    date: "2026-02-25",
    amount: 150,
    reason: "Besoin personnel",
  },
  {
    id: "ADV004",
    employeeId: "E004",
    date: "2026-02-26",
    amount: 75,
    reason: "Frais familiaux",
  },
  {
    id: "ADV005",
    employeeId: "E006",
    date: "2026-02-24",
    amount: 100,
    reason: "Besoin personnel",
  },
  {
    id: "ADV006",
    employeeId: "E007",
    date: "2026-02-25",
    amount: 50,
    reason: "Frais médicaux",
  },
  {
    id: "ADV007",
    employeeId: "E008",
    date: "2026-02-20",
    amount: 200,
    reason: "Besoin personnel",
  },
  {
    id: "ADV008",
    employeeId: "E009",
    date: "2026-02-22",
    amount: 75,
    reason: "Frais familiaux",
  },
  {
    id: "ADV009",
    employeeId: "E010",
    date: "2026-02-23",
    amount: 125,
    reason: "Besoin personnel",
  },
  {
    id: "ADV010",
    employeeId: "E012",
    date: "2026-02-24",
    amount: 50,
    reason: "Frais médicaux",
  },
  {
    id: "ADV011",
    employeeId: "E013",
    date: "2026-02-25",
    amount: 100,
    reason: "Besoin personnel",
  },
  {
    id: "ADV012",
    employeeId: "E014",
    date: "2026-02-23",
    amount: 75,
    reason: "Frais familiaux",
  },
];

export const invoices = [
  {
    id: "INV001",
    date: "2026-02-15",
    client: "Acheteur Or Premium",
    products: "Or raffiné - 500g",
    total: 32500,
    received: 32500,
  },
  {
    id: "INV002",
    date: "2026-02-20",
    client: "Joaillerie Luxe",
    products: "Or brut - 300g",
    total: 19500,
    received: 10000,
  },
  {
    id: "INV003",
    date: "2026-02-25",
    client: "Exportateur International",
    products: "Or raffiné - 400g",
    total: 26000,
    received: 26000,
  },
  {
    id: "INV004",
    date: "2026-03-01",
    client: "Acheteur Local",
    products: "Or brut - 250g",
    total: 16250,
    received: 8000,
  },
];

export const cashMovements = [
  {
    id: "CASH001",
    siteId: "S001",
    siteName: "Site Principal - Vallée de l'Or",
    date: "2026-02-15",
    type: "Entrée",
    amount: 32500,
    category: "Vente",
    paymentMethod: "Virement",
    comment: "Vente or raffiné",
  },
  {
    id: "CASH002",
    siteId: "S001",
    siteName: "Site Principal - Vallée de l'Or",
    date: "2026-02-16",
    type: "Sortie",
    amount: 2500,
    category: "Salaire",
    paymentMethod: "Espèces",
    comment: "Paiement salaires",
  },
  {
    id: "CASH003",
    siteId: "S002",
    siteName: "Site Secondaire - Plateau Est",
    date: "2026-02-20",
    type: "Entrée",
    amount: 10000,
    category: "Paiement partiel",
    paymentMethod: "Virement",
    comment: "Acompte facture INV002",
  },
  {
    id: "CASH004",
    siteId: "S002",
    siteName: "Site Secondaire - Plateau Est",
    date: "2026-02-22",
    type: "Sortie",
    amount: 1500,
    category: "Dépenses",
    paymentMethod: "Espèces",
    comment: "Dépenses opérationnelles",
  },
  {
    id: "CASH005",
    siteId: "S001",
    siteName: "Site Principal - Vallée de l'Or",
    date: "2026-02-25",
    type: "Entrée",
    amount: 26000,
    category: "Vente",
    paymentMethod: "Virement",
    comment: "Vente or raffiné",
  }
];

export const bankTransactions = [
  {
    id: "BANK001",
    date: "2026-02-15",
    label: "Virement reçu - Acheteur Or Premium",
    credit: 32500,
    debit: 0,
    category: "Vente",
    reference: "REF-2026-001",
  },
  {
    id: "BANK002",
    date: "2026-02-16",
    label: "Prélèvement - Frais bancaires",
    credit: 0,
    debit: 50,
    category: "Frais",
    reference: "FRAIS-FEV",
  },
  {
    id: "BANK003",
    date: "2026-02-20",
    label: "Virement reçu - Joaillerie Luxe (acompte)",
    credit: 10000,
    debit: 0,
    category: "Paiement partiel",
    reference: "REF-2026-002",
  },
  {
    id: "BANK004",
    date: "2026-02-25",
    label: "Virement reçu - Exportateur International",
    credit: 26000,
    debit: 0,
    category: "Vente",
    reference: "REF-2026-003",
  },
  {
    id: "BANK005",
    date: "2026-03-01",
    label: "Virement reçu - Acheteur Local (acompte)",
    credit: 8000,
    debit: 0,
    category: "Paiement partiel",
    reference: "REF-2026-004",
  },
];

// Helper functions to calculate derived data
export const calculateTeamMetrics = (teamId: string) => {
  const teamProductions = productions.filter((p) => p.teamId === teamId);
  const teamExpenses = expenses.filter((e) => e.teamId === teamId);

  const totalProduction = teamProductions.reduce((sum, p) => sum + p.weight, 0);
  const totalExpenses = teamExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalValue = teamProductions.reduce((sum, p) => sum + p.estimatedValue, 0);
  const netResult = totalValue - totalExpenses;
  const profitability = totalValue > 0 ? (netResult / totalValue) * 100 : 0;
  const status = netResult > 0 ? "Rentable" : "Non rentable";

  return {
    totalProduction,
    totalExpenses,
    totalValue,
    netResult,
    profitability,
    status,
  };
};

export const calculateSiteMetrics = (siteId: string) => {
  const siteTeams = teams.filter((t) => t.siteId === siteId);
  let totalProduction = 0;
  let totalExpenses = 0;
  let totalValue = 0;

  siteTeams.forEach((team) => {
    const metrics = calculateTeamMetrics(team.id);
    totalProduction += metrics.totalProduction;
    totalExpenses += metrics.totalExpenses;
    totalValue += metrics.totalValue;
  });

  const netResult = totalValue - totalExpenses;
  const profitability = totalValue > 0 ? (netResult / totalValue) * 100 : 0;
  const status = netResult > 0 ? "Rentable" : "Non rentable";

  return {
    totalProduction,
    totalExpenses,
    totalValue,
    netResult,
    profitability,
    status,
  };
};

export const calculateEmployeeMetrics = (employeeId: string) => {
  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) return null;

  const totalAdvances = advances
    .filter((a) => a.employeeId === employeeId)
    .reduce((sum, a) => sum + a.amount, 0);

  const netSalary = employee.monthlySalary - totalAdvances;

  return {
    ...employee,
    totalAdvances,
    netSalary,
  };
};
