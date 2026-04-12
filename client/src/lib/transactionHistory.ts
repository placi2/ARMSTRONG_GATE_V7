import { productions, expenses, advances, cashMovements } from "@/lib/mockData";

export interface Transaction {
  id: string;
  date: string;
  type: "production" | "expense" | "advance" | "cash";
  description: string;
  teamId?: string;
  teamName?: string;
  employeeId?: string;
  employeeName?: string;
  amount: number;
  category?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export function getAllTransactions(): Transaction[] {
  const transactions: Transaction[] = [];

  // Add productions
  productions.forEach((prod) => {
    transactions.push({
      id: `prod-${prod.id}`,
      date: prod.date,
      type: "production",
      description: `Production d'or - ${prod.weight}g`,
      teamId: prod.teamId,
      teamName: `Équipe ${prod.teamId}`,
      amount: prod.estimatedValue,
      category: "Production",
      reference: `PROD-${prod.id}`,
      notes: `Poids: ${prod.weight}g, Prix: ${prod.pricePerGram}€/g`,
    });
  });

  // Add expenses
  expenses.forEach((exp) => {
    transactions.push({
      id: `exp-${exp.id}`,
      date: exp.date,
      type: "expense",
      description: `Dépense - ${exp.category}`,
      teamId: exp.teamId,
      teamName: `Équipe ${exp.teamId}`,
      amount: -exp.amount,
      category: exp.category,
      reference: `EXP-${exp.id}`,
      notes: exp.comment,
    });
  });

  // Add advances
  advances.forEach((adv) => {
    transactions.push({
      id: `adv-${adv.id}`,
      date: adv.date,
      type: "advance",
      description: `Avance de salaire`,
      employeeId: adv.employeeId,
      employeeName: `Employé ${adv.employeeId}`,
      amount: -adv.amount,
      category: "Avance",
      reference: `ADV-${adv.id}`,
      notes: adv.reason,
    });
  });

  // Add cash movements
  cashMovements.forEach((cash) => {
    transactions.push({
      id: `cash-${cash.id}`,
      date: cash.date,
      type: "cash",
      description: `Mouvement de caisse - ${cash.category}`,
      amount: cash.type === "Entrée" ? cash.amount : -cash.amount,
      category: cash.category,
      reference: `CASH-${cash.id}`,
      notes: cash.comment,
    });
  });

  // Sort by date descending
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface TransactionFilters {
  startDate: string;
  endDate: string;
  type: string;
  teamId: string;
  employeeId: string;
  category: string;
  searchText: string;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return transactions.filter((transaction) => {
    // Date filter
    if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(transaction.date) > new Date(filters.endDate)) {
      return false;
    }

    // Type filter
    if (filters.type && transaction.type !== filters.type) {
      return false;
    }

    // Team filter
    if (filters.teamId && transaction.teamId !== filters.teamId) {
      return false;
    }

    // Employee filter
    if (filters.employeeId && transaction.employeeId !== filters.employeeId) {
      return false;
    }

    // Category filter
    if (filters.category && transaction.category !== filters.category) {
      return false;
    }

    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.reference?.toLowerCase().includes(searchLower) ||
        transaction.notes?.toLowerCase().includes(searchLower) ||
        transaction.teamName?.toLowerCase().includes(searchLower) ||
        transaction.employeeName?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });
}

export function sortTransactions(
  transactions: Transaction[],
  sortBy: string,
  sortOrder: "asc" | "desc"
): Transaction[] {
  const sorted = [...transactions];

  sorted.sort((a, b) => {
    let aValue: any = a[sortBy as keyof Transaction];
    let bValue: any = b[sortBy as keyof Transaction];

    if (sortBy === "date") {
      aValue = new Date(a.date).getTime();
      bValue = new Date(b.date).getTime();
    } else if (sortBy === "amount") {
      aValue = Math.abs(a.amount);
      bValue = Math.abs(b.amount);
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

export function getTransactionStats(transactions: Transaction[]) {
  const stats = {
    totalTransactions: transactions.length,
    totalIncome: 0,
    totalExpenses: 0,
    netResult: 0,
    byType: {
      production: 0,
      expense: 0,
      advance: 0,
      cash: 0,
    },
  };

  transactions.forEach((t) => {
    if (t.amount > 0) {
      stats.totalIncome += t.amount;
    } else {
      stats.totalExpenses += Math.abs(t.amount);
    }
    stats.byType[t.type]++;
  });

  stats.netResult = stats.totalIncome - stats.totalExpenses;

  return stats;
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  fileName: string = "historique-transactions.csv"
) {
  const headers = [
    "Date",
    "Type",
    "Description",
    "Équipe",
    "Employé",
    "Catégorie",
    "Montant",
    "Référence",
    "Notes",
  ];

  const rows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString("fr-FR"),
    t.type,
    t.description,
    t.teamName || "",
    t.employeeName || "",
    t.category || "",
    t.amount.toFixed(2),
    t.reference || "",
    t.notes || "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
