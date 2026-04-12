import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sites, cashMovements } from "@/lib/mockData";
import { Download, Save, Filter, X } from "lucide-react";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export interface CustomReportFilters {
  reportName: string;
  selectedSites: string[];
  dateStart: string;
  dateEnd: string;
  categories: string[];
  movementTypes: ("Entrée" | "Sortie")[];
  includeDetails: boolean;
  includeSummary: boolean;
}

export interface CustomReportData {
  id: string;
  filters: CustomReportFilters;
  data: Array<{
    date: string;
    site: string;
    type: string;
    category: string;
    description: string;
    amount: number;
  }>;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
  generatedAt: Date;
}

const EXPENSE_CATEGORIES = [
  "Alimentation",
  "Salaires",
  "Transport",
  "Carburant",
  "Matériel",
  "Équipement",
  "Autre",
];

const INCOME_CATEGORIES = ["Vente", "Paiement partiel", "Autre"];

export default function CustomReportBuilder() {
  const [filters, setFilters] = useState<CustomReportFilters>({
    reportName: "Rapport Personnalisé",
    selectedSites: [sites[0]?.id || ""],
    dateStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    dateEnd: new Date().toISOString().split("T")[0],
    categories: [],
    movementTypes: ["Entrée", "Sortie"],
    includeDetails: true,
    includeSummary: true,
  });

  const [report, setReport] = useState<CustomReportData | null>(null);
  const [savedReports, setSavedReports] = useState<CustomReportData[]>([]);

  const generateReport = () => {
    const filteredMovements = cashMovements.filter((m) => {
      const movementDate = new Date(m.date);
      const startDate = new Date(filters.dateStart);
      const endDate = new Date(filters.dateEnd);

      const siteMatch = filters.selectedSites.includes(m.siteId);
      const dateMatch = movementDate >= startDate && movementDate <= endDate;
      const typeMatch = filters.movementTypes.includes(m.type as "Entrée" | "Sortie");
      const categoryMatch =
        filters.categories.length === 0 || filters.categories.includes(m.category);

      return siteMatch && dateMatch && typeMatch && categoryMatch;
    });

    const totalIncome = filteredMovements
      .filter((m) => m.type === "Entrée")
      .reduce((sum, m) => sum + m.amount, 0);

    const totalExpenses = filteredMovements
      .filter((m) => m.type === "Sortie")
      .reduce((sum, m) => sum + m.amount, 0);

    const newReport: CustomReportData = {
      id: `report_${Date.now()}`,
      filters,
      data: filteredMovements.map((m) => ({
        date: m.date,
        site: m.siteName,
        type: m.type,
        category: m.category,
        description: m.comment,
        amount: m.amount,
      })),
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount: filteredMovements.length,
      },
      generatedAt: new Date(),
    };

    setReport(newReport);
  };

  const toggleSite = (siteId: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedSites: prev.selectedSites.includes(siteId)
        ? prev.selectedSites.filter((id) => id !== siteId)
        : [...prev.selectedSites, siteId],
    }));
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleMovementType = (type: "Entrée" | "Sortie") => {
    setFilters((prev) => ({
      ...prev,
      movementTypes: prev.movementTypes.includes(type)
        ? prev.movementTypes.filter((t) => t !== type)
        : [...prev.movementTypes, type],
    }));
  };

  const saveReport = () => {
    if (report) {
      setSavedReports((prev) => [report, ...prev]);
      alert(`✅ Rapport "${filters.reportName}" sauvegardé avec succès`);
    }
  };

  const exportToPDF = () => {
    if (!report) return;

    const htmlContent = `
      <html>
        <head>
          <title>${report.filters.reportName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e293b; text-align: center; }
            h2 { color: #334155; margin-top: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .summary { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .summary-item { display: inline-block; margin-right: 30px; }
            .positive { color: #16a34a; font-weight: bold; }
            .negative { color: #dc2626; font-weight: bold; }
            .filters { background-color: #f3f4f6; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 12px; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>${report.filters.reportName}</h1>
          
          <div class="filters">
            <strong>Filtres appliqués:</strong><br>
            Sites: ${report.filters.selectedSites.map((id) => sites.find((s) => s.id === id)?.name).join(", ")}<br>
            Période: ${report.filters.dateStart} au ${report.filters.dateEnd}<br>
            Types: ${report.filters.movementTypes.join(", ")}<br>
            ${report.filters.categories.length > 0 ? `Catégories: ${report.filters.categories.join(", ")}<br>` : ""}
          </div>

          ${
            report.filters.includeSummary
              ? `
            <div class="summary">
              <h2>Résumé</h2>
              <div class="summary-item">
                <strong>Total Entrées:</strong><br>
                <span class="positive">${report.summary.totalIncome.toLocaleString()} EUR</span>
              </div>
              <div class="summary-item">
                <strong>Total Sorties:</strong><br>
                <span class="negative">${report.summary.totalExpenses.toLocaleString()} EUR</span>
              </div>
              <div class="summary-item">
                <strong>Solde:</strong><br>
                <span>${report.summary.balance.toLocaleString()} EUR</span>
              </div>
              <div class="summary-item">
                <strong>Transactions:</strong><br>
                ${report.summary.transactionCount}
              </div>
            </div>
          `
              : ""
          }

          ${
            report.filters.includeDetails
              ? `
            <h2>Détails des Transactions</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Site</th>
                  <th>Type</th>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th style="text-align: right;">Montant</th>
                </tr>
              </thead>
              <tbody>
                ${report.data
                  .map(
                    (row) => `
                  <tr>
                    <td>${row.date}</td>
                    <td>${row.site}</td>
                    <td>${row.type}</td>
                    <td>${row.category}</td>
                    <td>${row.description}</td>
                    <td style="text-align: right; ${row.type === "Entrée" ? "color: #16a34a" : "color: #dc2626"}">
                      ${row.type === "Entrée" ? "+" : "-"}${row.amount.toLocaleString()} EUR
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }

          <div class="footer">
            <p>Rapport généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
            <p>ARMSTRONG GATE - Gestion d'Exploitation Aurifère</p>
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open("", "", "width=900,height=600");
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      newWindow.print();
    }
  };

  const exportToCSV = () => {
    if (!report) return;

    let csv = `${report.filters.reportName}\n`;
    csv += `Généré le ${new Date().toLocaleDateString("fr-FR")}\n\n`;

    csv += "FILTRES APPLIQUÉS\n";
    csv += `Sites,${report.filters.selectedSites.map((id) => sites.find((s) => s.id === id)?.name).join("; ")}\n`;
    csv += `Période,${report.filters.dateStart} au ${report.filters.dateEnd}\n`;
    csv += `Types,${report.filters.movementTypes.join("; ")}\n`;
    if (report.filters.categories.length > 0) {
      csv += `Catégories,${report.filters.categories.join("; ")}\n`;
    }
    csv += "\n";

    if (report.filters.includeSummary) {
      csv += "RÉSUMÉ\n";
      csv += "Métrique,Montant\n";
      csv += `Total Entrées,${report.summary.totalIncome}\n`;
      csv += `Total Sorties,${report.summary.totalExpenses}\n`;
      csv += `Solde,${report.summary.balance}\n`;
      csv += `Transactions,${report.summary.transactionCount}\n`;
      csv += "\n";
    }

    if (report.filters.includeDetails) {
      csv += "DÉTAILS DES TRANSACTIONS\n";
      csv += "Date,Site,Type,Catégorie,Description,Montant\n";
      report.data.forEach((row) => {
        csv += `${row.date},"${row.site}",${row.type},${row.category},"${row.description}",${row.type === "Entrée" ? "+" : "-"}${row.amount}\n`;
      });
    }

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute(
      "download",
      `${report.filters.reportName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={24} />
            Créer un Rapport Personnalisé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nom du Rapport
            </label>
            <input
              type="text"
              value={filters.reportName}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, reportName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: Rapport Caisse Mars 2026"
            />
          </div>

          {/* Sites Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Sites
            </label>
            <div className="space-y-2">
              {sites.map((site) => (
                <label key={site.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.selectedSites.includes(site.id)}
                    onChange={() => toggleSite(site.id)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{site.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de Début
              </label>
              <input
                type="date"
                value={filters.dateStart}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateStart: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de Fin
              </label>
              <input
                type="date"
                value={filters.dateEnd}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateEnd: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Movement Types */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Types de Mouvements
            </label>
            <div className="space-y-2">
              {(["Entrée", "Sortie"] as const).map((type) => (
                <label key={type} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.movementTypes.includes(type)}
                    onChange={() => toggleMovementType(type)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Catégories (optionnel - laisser vide pour toutes)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((category) => (
                <label key={category} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Report Options */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Options du Rapport
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeSummary}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      includeSummary: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Inclure le résumé</span>
              </label>
              <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeDetails}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      includeDetails: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Inclure les détails des transactions</span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateReport}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 font-medium"
          >
            Générer le Rapport
          </Button>
        </CardContent>
      </Card>

      {/* Report Display */}
      {report && (
        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{report.filters.reportName}</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Généré le {report.generatedAt.toLocaleDateString("fr-FR")} à{" "}
                  {report.generatedAt.toLocaleTimeString("fr-FR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={exportToPDF}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Download size={18} className="mr-2" />
                  PDF
                </Button>
                <Button
                  onClick={exportToCSV}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Download size={18} className="mr-2" />
                  CSV
                </Button>
                <Button
                  onClick={saveReport}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save size={18} className="mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {report.filters.includeSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-slate-600 mb-2">Total Entrées</p>
                  <p className="text-2xl font-bold text-green-600">
                    <CurrencyDisplay amount={report.summary.totalIncome / 1000} decimals={1} />
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-slate-600 mb-2">Total Sorties</p>
                  <p className="text-2xl font-bold text-red-600">
                    <CurrencyDisplay amount={report.summary.totalExpenses / 1000} decimals={1} />
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600 mb-2">Solde</p>
                  <p className="text-2xl font-bold text-blue-600">
                    <CurrencyDisplay amount={report.summary.balance / 1000} decimals={1} />
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-slate-600 mb-2">Transactions</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {report.summary.transactionCount}
                  </p>
                </div>
              </div>
            )}

            {/* Details Table */}
            {report.filters.includeDetails && report.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Site
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Catégorie
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Description
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(row.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                          {row.site}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{row.type}</td>
                        <td className="py-3 px-4 text-slate-600">{row.category}</td>
                        <td className="py-3 px-4 text-slate-600">{row.description}</td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span
                            className={
                              row.type === "Entrée"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {row.type === "Entrée" ? "+" : "-"}
                            {row.amount.toLocaleString()} EUR
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {report.data.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500">
                  Aucune transaction ne correspond aux filtres appliqués
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Rapports Sauvegardés ({savedReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedReports.map((savedReport) => (
                <div
                  key={savedReport.id}
                  className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {savedReport.filters.reportName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {savedReport.filters.dateStart} au {savedReport.filters.dateEnd} •{" "}
                        {savedReport.summary.transactionCount} transactions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3">
                        <Download size={16} />
                      </Button>
                      <Button className="bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm px-3">
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
