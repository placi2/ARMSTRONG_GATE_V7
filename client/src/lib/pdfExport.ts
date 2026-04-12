import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface PDFSettings {
  currency: string;
  currencySymbol: string;
  exchangeRate?: number;
}

export function formatCurrencyForPDF(amount: number, settings: PDFSettings): string {
  let converted = amount;

  if (settings.currency === "USD") {
    converted = amount; // Assuming base is EUR
  } else if (settings.currency === "CDF" && settings.exchangeRate) {
    converted = amount * settings.exchangeRate;
  }

  if (settings.currency === "CDF") {
    return `${Math.round(converted).toLocaleString("fr-FR")} ${settings.currencySymbol}`;
  }

  return `${converted.toFixed(2)} ${settings.currencySymbol}`;
}

export function generateFinancialReportPDF(
  data: any,
  settings: PDFSettings,
  fileName: string = "rapport-financier.pdf"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header with Logo
  doc.setFontSize(20);
  doc.setTextColor(255, 165, 0);
  doc.text("⛏ AMSTRONG GATE", pageWidth / 2, yPosition, { align: "center" });
  doc.setTextColor(0, 0, 0);

  yPosition += 10;
  doc.setFontSize(12);
  doc.text("Rapport Financier", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString("fr-FR");
  doc.text(`Généré le: ${today} | Devise: ${settings.currency}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.text("Résumé Financier", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(11);

  const summaryData = [
    ["Revenu Total", formatCurrencyForPDF(data.totalInvoiced / 1000, settings)],
    ["Paiements Reçus", formatCurrencyForPDF(data.totalReceived / 1000, settings)],
    ["Reste Dû", formatCurrencyForPDF(data.totalDue / 1000, settings)],
    ["Solde Caisse", formatCurrencyForPDF(data.cashBalance / 1000, settings)],
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [["Description", "Montant"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [255, 165, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { textColor: [0, 0, 0] },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: 20, right: 20 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Team Financial Details
  if (data.teamFinancials && data.teamFinancials.length > 0) {
    doc.setFontSize(14);
    doc.text("Performance par Équipe", 20, yPosition);

    yPosition += 10;

    const teamTableData = data.teamFinancials.map((team: any) => [
      team.name,
      formatCurrencyForPDF(team.production / 1000, settings),
      formatCurrencyForPDF(team.expenses / 1000, settings),
      formatCurrencyForPDF(team.netResult / 1000, settings),
      `${team.profitability}%`,
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [["Équipe", "Production", "Dépenses", "Résultat Net", "Rentabilité"]],
      body: teamTableData,
      theme: "grid",
      headStyles: { fillColor: [255, 165, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [0, 0, 0] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Site Financial Details
  if (data.siteFinancials && data.siteFinancials.length > 0) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text("Performance par Site", 20, yPosition);

    yPosition += 10;

    const siteTableData = data.siteFinancials.map((site: any) => [
      site.name,
      formatCurrencyForPDF(site.production / 1000, settings),
      formatCurrencyForPDF(site.expenses / 1000, settings),
      formatCurrencyForPDF(site.netResult / 1000, settings),
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [["Site", "Production", "Dépenses", "Résultat Net"]],
      body: siteTableData,
      theme: "grid",
      headStyles: { fillColor: [255, 165, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [0, 0, 0] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left: 20, right: 20 },
    });
  }

  // Footer
  const totalPages = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(
      `Page ${i} sur ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Save PDF
  doc.save(fileName);
}

export function generateDashboardPDF(
  data: any,
  settings: PDFSettings,
  fileName: string = "tableau-de-bord.pdf"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header with Logo
  doc.setFontSize(20);
  doc.setTextColor(255, 165, 0);
  doc.text("⛏ AMSTRONG GATE", pageWidth / 2, yPosition, { align: "center" });
  doc.setTextColor(0, 0, 0);

  yPosition += 10;
  doc.setFontSize(12);
  doc.text("Tableau de Bord Global", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString("fr-FR");
  doc.text(`Généré le: ${today} | Devise: ${settings.currency}`, pageWidth / 2, yPosition, {
    align: "center",
  });

  yPosition += 15;

  // Key Metrics
  doc.setFontSize(14);
  doc.text("Métriques Clés", 20, yPosition);

  yPosition += 10;

  const metricsData = [
    ["Production Totale", `${Math.round(data.totalProduction)}g`],
    ["Valeur Production", formatCurrencyForPDF(data.totalValue / 1000, settings)],
    ["Dépenses Totales", formatCurrencyForPDF(data.totalExpenses / 1000, settings)],
    ["Résultat Net", formatCurrencyForPDF(data.netResult / 1000, settings)],
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [["Métrique", "Valeur"]],
    body: metricsData,
    theme: "grid",
    headStyles: { fillColor: [255, 165, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { textColor: [0, 0, 0] },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: 20, right: 20 },
  });

  doc.save(fileName);
}

export function generateComparisonPDF(
  data: any,
  settings: PDFSettings,
  fileName: string = "comparaison-periodes.pdf"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.text("AMSTRONG GATE", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(12);
  doc.text("Comparaison de Périodes", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(10);
  doc.text(`Devise: ${settings.currency}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  // Comparison Data
  doc.setFontSize(14);
  doc.text("Analyse Comparative", 20, yPosition);

  yPosition += 10;

  const comparisonData = [
    [
      "Production",
      formatCurrencyForPDF(data.period1?.totalValue / 1000 || 0, settings),
      formatCurrencyForPDF(data.period2?.totalValue / 1000 || 0, settings),
      data.productionChange ? `${data.productionChange}%` : "N/A",
    ],
    [
      "Dépenses",
      formatCurrencyForPDF(data.period1?.totalExpenses / 1000 || 0, settings),
      formatCurrencyForPDF(data.period2?.totalExpenses / 1000 || 0, settings),
      data.expensesChange ? `${data.expensesChange}%` : "N/A",
    ],
    [
      "Résultat Net",
      formatCurrencyForPDF(data.period1?.netResult / 1000 || 0, settings),
      formatCurrencyForPDF(data.period2?.netResult / 1000 || 0, settings),
      data.resultChange ? `${data.resultChange}%` : "N/A",
    ],
  ];

  (doc as any).autoTable({
    startY: yPosition,
    head: [["Métrique", "Période 1", "Période 2", "Variation"]],
    body: comparisonData,
    theme: "grid",
    headStyles: { fillColor: [255, 165, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { textColor: [0, 0, 0] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    margin: { left: 20, right: 20 },
  });

  doc.save(fileName);
}
