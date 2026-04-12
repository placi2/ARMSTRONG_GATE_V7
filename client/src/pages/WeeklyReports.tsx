import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { Search, Download, Eye, Settings2 } from "lucide-react";
import Pagination, { usePagination } from "@/components/Pagination";

const MOCK_REPORTS = [
  { id: "1", date: "2026-03-15", type: "Hebdomadaire", status: "Généré", size: "245 KB" },
  { id: "2", date: "2026-03-08", type: "Hebdomadaire", status: "Généré", size: "198 KB" },
  { id: "3", date: "2026-03-01", type: "Hebdomadaire", status: "Généré", size: "312 KB" },
  { id: "4", date: "2026-02-22", type: "Hebdomadaire", status: "Généré", size: "276 KB" },
];

export default function WeeklyReports() {
  const { settings, updateSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [reportDay, setReportDay] = useState(String(settings.reportDay || 1));
  const [recipients, setRecipients] = useState(settings.reportRecipients || "");
  const [format, setFormat] = useState(settings.reportFormat || "PDF");
  const [search, setSearch] = useState("");

  const filtered = MOCK_REPORTS.filter(r =>
    r.date.includes(search) || r.type.toLowerCase().includes(search.toLowerCase())
  );
  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);

  const handleSave = () => {
    updateSettings({
      reportDay: parseInt(reportDay) || 1,
      reportRecipients: recipients,
      reportFormat: format,
    });
    setIsEditing(false);
    toast.success("Paramètres d'automatisation sauvegardés !");
  };

  const handleView = (id: string) => {
    toast.info(`Aperçu du rapport #${id} — Fonctionnalité disponible après déploiement sur serveur`);
  };

  const handleDownload = (id: string) => {
    toast.success(`Téléchargement du rapport #${id} initié`);
    // In production, this would fetch from server
    const blob = new Blob([`Rapport ARMSTRONG GATE #${id}\nDate: ${new Date().toLocaleDateString("fr-FR")}\nCe rapport sera généré automatiquement après déploiement.`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rapport_${id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Rapports Hebdomadaires</h1>
          <p className="text-slate-600">Gestion des rapports automatiques</p>
        </div>

        {/* Automatisation Settings */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Settings2 size={20} className="text-amber-500" />
                Paramètres d'Automatisation
              </CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Annuler</Button>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSave}>Sauvegarder</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-2">Jour d'envoi (1-28)</p>
                {isEditing ? (
                  <Input type="number" min={1} max={28} value={reportDay} onChange={e => setReportDay(e.target.value)} />
                ) : (
                  <p className="font-bold text-slate-900">Chaque {settings.reportDay || 1} du mois</p>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Destinataires (emails)</p>
                {isEditing ? (
                  <Input value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="email1@ex.com, email2@ex.com" />
                ) : (
                  <p className="font-bold text-slate-900">{settings.reportRecipients || "Non configuré"}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Format d'export</p>
                {isEditing ? (
                  <select value={format} onChange={e => setFormat(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="PDF">PDF</option>
                    <option value="Excel">Excel (CSV)</option>
                    <option value="PDF+Excel">PDF + Excel</option>
                  </select>
                ) : (
                  <p className="font-bold text-slate-900">{settings.reportFormat || "PDF"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report history */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Historique des Rapports</CardTitle>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Rechercher..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>{["Date","Type","Taille","Statut","Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-slate-700">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">{r.date}</td>
                    <td className="py-3 px-4">{r.type}</td>
                    <td className="py-3 px-4 text-slate-500">{r.size}</td>
                    <td className="py-3 px-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{r.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(r.id)}>
                          <Eye size={14} className="mr-1" /> Voir
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(r.id)}>
                          <Download size={14} className="mr-1" /> Télécharger
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
