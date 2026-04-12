import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sites, cashMovements } from "@/lib/mockData";
import { Download, Mail, Calendar } from "lucide-react";
import CurrencyDisplay from "@/components/CurrencyDisplay";

interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  siteReports: Array<{
    siteId: string;
    siteName: string;
    location: string;
    openingBalance: number;
    income: number;
    expenses: number;
    closingBalance: number;
    transactionCount: number;
  }>;
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  generatedAt: Date;
}

export default function WeeklyReportGenerator() {
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [report, setReport] = useState<WeeklyReport | null>(null);

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date): Date => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const generateReport = () => {
    const weekStart = getWeekStart(selectedWeek);
    const weekEnd = getWeekEnd(selectedWeek);

    const siteReports = sites.map((site) => {
      const siteMovements = cashMovements.filter(
        (m) =>
          m.siteId === site.id &&
          new Date(m.date) >= weekStart &&
          new Date(m.date) <= weekEnd
      );

      const income = siteMovements
        .filter((m) => m.type === "Entrée")
        .reduce((sum, m) => sum + m.amount, 0);

      const expenses = siteMovements
        .filter((m) => m.type === "Sortie")
        .reduce((sum, m) => sum + m.amount, 0);

      // Simulated opening balance (in production, fetch from database)
      const openingBalance = 50000;
      const closingBalance = openingBalance + income - expenses;

      return {
        siteId: site.id,
        siteName: site.name,
        location: site.location,
        openingBalance,
        income,
        expenses,
        closingBalance,
        transactionCount: siteMovements.length,
      };
    });

    const totalIncome = siteReports.reduce((sum, r) => sum + r.income, 0);
    const totalExpenses = siteReports.reduce((sum, r) => sum + r.expenses, 0);
    const totalBalance = siteReports.reduce((sum, r) => sum + r.closingBalance, 0);

    const newReport: WeeklyReport = {
      weekStart,
      weekEnd,
      siteReports,
      totalIncome,
      totalExpenses,
      totalBalance,
      generatedAt: new Date(),
    };

    setReport(newReport);
  };

  const exportToPDF = () => {
    if (!report) return;

    const htmlContent = `
      <html>
        <head>
          <title>Rapport Hebdomadaire - ARMSTRONG GATE</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e293b; text-align: center; }
            h2 { color: #334155; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .summary { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .total { font-weight: bold; background-color: #fef3c7; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>📊 Rapport Hebdomadaire de Caisse</h1>
          <p style="text-align: center; color: #64748b;">
            Semaine du ${report.weekStart.toLocaleDateString("fr-FR")} au ${report.weekEnd.toLocaleDateString("fr-FR")}
          </p>

          <div class="summary">
            <h2>Résumé Global</h2>
            <table>
              <tr>
                <th>Métrique</th>
                <th style="text-align: right;">Montant</th>
              </tr>
              <tr>
                <td>Total Entrées</td>
                <td style="text-align: right;" class="positive">+${report.totalIncome.toLocaleString()} EUR</td>
              </tr>
              <tr>
                <td>Total Sorties</td>
                <td style="text-align: right;" class="negative">-${report.totalExpenses.toLocaleString()} EUR</td>
              </tr>
              <tr class="total">
                <td>Solde Total</td>
                <td style="text-align: right;">${report.totalBalance.toLocaleString()} EUR</td>
              </tr>
            </table>
          </div>

          <h2>Détails par Site</h2>
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th style="text-align: right;">Solde Ouverture</th>
                <th style="text-align: right;">Entrées</th>
                <th style="text-align: right;">Sorties</th>
                <th style="text-align: right;">Solde Clôture</th>
                <th style="text-align: center;">Transactions</th>
              </tr>
            </thead>
            <tbody>
              ${report.siteReports
                .map(
                  (sr) => `
                <tr>
                  <td><strong>${sr.siteName}</strong><br><small>${sr.location}</small></td>
                  <td style="text-align: right;">${sr.openingBalance.toLocaleString()} EUR</td>
                  <td style="text-align: right;" class="positive">+${sr.income.toLocaleString()} EUR</td>
                  <td style="text-align: right;" class="negative">-${sr.expenses.toLocaleString()} EUR</td>
                  <td style="text-align: right;" class="total">${sr.closingBalance.toLocaleString()} EUR</td>
                  <td style="text-align: center;">${sr.transactionCount}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>Rapport généré le ${report.generatedAt.toLocaleDateString("fr-FR")} à ${report.generatedAt.toLocaleTimeString("fr-FR")}</p>
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

    let csv = "RAPPORT HEBDOMADAIRE DE CAISSE - ARMSTRONG GATE\n";
    csv += `Semaine du ${report.weekStart.toLocaleDateString("fr-FR")} au ${report.weekEnd.toLocaleDateString("fr-FR")}\n\n`;

    csv += "RÉSUMÉ GLOBAL\n";
    csv += "Métrique,Montant\n";
    csv += `Total Entrées,${report.totalIncome}\n`;
    csv += `Total Sorties,${report.totalExpenses}\n`;
    csv += `Solde Total,${report.totalBalance}\n\n`;

    csv += "DÉTAILS PAR SITE\n";
    csv += "Site,Location,Solde Ouverture,Entrées,Sorties,Solde Clôture,Transactions\n";
    report.siteReports.forEach((sr) => {
      csv += `"${sr.siteName}","${sr.location}",${sr.openingBalance},${sr.income},${sr.expenses},${sr.closingBalance},${sr.transactionCount}\n`;
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute(
      "download",
      `rapport_caisse_${report.weekStart.toISOString().split("T")[0]}.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const scheduleEmailReport = () => {
    alert(
      "📧 Rapport programmé pour être envoyé chaque lundi à 08:00\n\nEmails destinataires :\n- manager@armstrong-gate.com\n- finance@armstrong-gate.com"
    );
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar size={24} />
          Rapport Hebdomadaire de Caisse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week Selection */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sélectionner la semaine
            </label>
            <input
              type="date"
              value={selectedWeek.toISOString().split("T")[0]}
              onChange={(e) => setSelectedWeek(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <Button
            onClick={generateReport}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Générer Rapport
          </Button>
        </div>

        {/* Report Display */}
        {report && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Résumé - Semaine du {report.weekStart.toLocaleDateString("fr-FR")} au{" "}
                {report.weekEnd.toLocaleDateString("fr-FR")}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border border-green-200">
                  <p className="text-sm text-slate-600 mb-1">Total Entrées</p>
                  <p className="text-2xl font-bold text-green-600">
                    <CurrencyDisplay amount={report.totalIncome / 1000} decimals={1} />
                  </p>
                </div>
                <div className="bg-white p-4 rounded border border-red-200">
                  <p className="text-sm text-slate-600 mb-1">Total Sorties</p>
                  <p className="text-2xl font-bold text-red-600">
                    <CurrencyDisplay amount={report.totalExpenses / 1000} decimals={1} />
                  </p>
                </div>
                <div className="bg-white p-4 rounded border border-blue-200">
                  <p className="text-sm text-slate-600 mb-1">Solde Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    <CurrencyDisplay amount={report.totalBalance / 1000} decimals={1} />
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Site
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Solde Ouverture
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Entrées
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Sorties
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Solde Clôture
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.siteReports.map((sr) => (
                    <tr
                      key={sr.siteId}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{sr.siteName}</p>
                        <p className="text-xs text-slate-500">{sr.location}</p>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {sr.openingBalance.toLocaleString()} EUR
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        +{sr.income.toLocaleString()} EUR
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-medium">
                        -{sr.expenses.toLocaleString()} EUR
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        {sr.closingBalance.toLocaleString()} EUR
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {sr.transactionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={exportToPDF}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                <Download size={18} className="mr-2" />
                Télécharger PDF
              </Button>
              <Button
                onClick={exportToCSV}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <Download size={18} className="mr-2" />
                Exporter CSV
              </Button>
              <Button
                onClick={scheduleEmailReport}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Mail size={18} className="mr-2" />
                Programmer Email
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
