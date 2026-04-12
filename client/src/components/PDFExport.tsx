import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

interface PDFExportProps {
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
  fileName?: string;
  filters?: Record<string, any>;
}

export default function PDFExport({
  title,
  data,
  columns,
  fileName = "export",
  filters,
}: PDFExportProps) {
  const handleExportPDF = () => {
    try {
      // Create a simple HTML table
      let html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                color: #1a1a1a;
              }
              .header p {
                margin: 5px 0 0 0;
                color: #666;
                font-size: 12px;
              }
              .filters {
                background-color: #f5f5f5;
                padding: 10px;
                margin-bottom: 20px;
                border-radius: 4px;
                font-size: 11px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th {
                background-color: #f0a500;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #ddd;
              }
              td {
                padding: 10px 12px;
                border: 1px solid #ddd;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                font-size: 10px;
                color: #666;
              }
              .summary {
                background-color: #f0f0f0;
                padding: 10px;
                margin-bottom: 20px;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <p>Généré le ${new Date().toLocaleDateString("fr-FR")}</p>
            </div>
      `;

      // Add filters if provided
      if (filters && Object.keys(filters).length > 0) {
        html += `<div class="filters"><strong>Filtres appliqués:</strong> `;
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all") {
            html += `${key}: ${value} | `;
          }
        });
        html += `</div>`;
      }

      // Add summary
      html += `<div class="summary"><strong>Nombre d'enregistrements:</strong> ${data.length}</div>`;

      // Add table
      html += `<table><thead><tr>`;
      columns.forEach((col) => {
        html += `<th>${col.label}</th>`;
      });
      html += `</tr></thead><tbody>`;

      data.forEach((row) => {
        html += `<tr>`;
        columns.forEach((col) => {
          const value = row[col.key] || "";
          html += `<td>${value}</td>`;
        });
        html += `</tr>`;
      });

      html += `</tbody></table>`;

      // Add footer
      html += `
        <div class="footer">
          <p>ARMSTRONG GATE - Gestion d'Exploitation Aurifère</p>
          <p>Document confidentiel - Réservé à l'usage interne</p>
        </div>
      </body>
    </html>
      `;

      // Create blob and download
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Export PDF généré avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      className="bg-amber-600 hover:bg-amber-700 text-white"
    >
      <FileDown size={16} className="mr-2" />
      Exporter en PDF
    </Button>
  );
}
