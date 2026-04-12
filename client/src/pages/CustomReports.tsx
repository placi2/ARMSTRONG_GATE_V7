import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { FileText, Download, BarChart2, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

function useFormatMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const sym = (ctx as any).sym || (ctx as any).currencySymbol || (s?.currency === "CDF" ? "FC" : "$");
  const goldPrice = s?.goldPriceUsd || s?.goldPrice || 65;
  return { settings: ctx.settings, fmt, sym, goldPrice };
}

const QUICK = [
  { id: "monthly", label: "Rapport Mensuel Complet", icon: <Calendar size={18}/>, color: "bg-blue-50 border-blue-200 text-blue-700", getRange: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0], to: n.toISOString().split("T")[0] }; } },
  { id: "weekly", label: "Résumé Hebdomadaire", icon: <FileText size={18}/>, color: "bg-green-50 border-green-200 text-green-700", getRange: () => { const n = new Date(); return { from: new Date(n.getTime()-7*864e5).toISOString().split("T")[0], to: n.toISOString().split("T")[0] }; } },
  { id: "sites", label: "Comparaison Sites", icon: <BarChart2 size={18}/>, color: "bg-amber-50 border-amber-200 text-amber-700", getRange: () => { const n = new Date(); return { from: new Date(n.getFullYear(), 0, 1).toISOString().split("T")[0], to: n.toISOString().split("T")[0] }; } },
  { id: "expenses", label: "Analyse des Dépenses", icon: <DollarSign size={18}/>, color: "bg-red-50 border-red-200 text-red-700", getRange: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0], to: n.toISOString().split("T")[0] }; } },
];

function buildHTML(title: string, from: string, to: string, siteName: string, teamName: string, prods: any[], exps: any[], mvts: any[], teams: any[], fmt: Function, sym: string, goldPrice: number) {
  const totalW = prods.reduce((s, p) => s + (p.weight||0), 0);
  const totalProd = prods.reduce((s, p) => s + ((p.weight||0)*(p.pricePerGram||goldPrice)), 0);
  const totalExp = exps.reduce((s, e) => s + e.amount, 0);
  const totalIn = mvts.filter(m => m.type==="entrée").reduce((s, m) => s + m.amount, 0);
  const totalOut = mvts.filter(m => m.type==="sortie").reduce((s, m) => s + m.amount, 0);
  const benef = totalProd - totalExp;

  const prodRows = prods.map(p => {
    const team = teams.find((t: any) => t.id === p.teamId);
    const val = (p.weight||0)*(p.pricePerGram||goldPrice);
    return `<tr><td>${p.date}</td><td>${team?.name||"?"}</td><td>${(p.weight||0).toFixed(2)}g</td><td>${sym}${p.pricePerGram||goldPrice}/g</td><td>${fmt(Math.round(val))}</td></tr>`;
  }).join("");

  const expRows = exps.map(e => {
    const team = teams.find((t: any) => t.id === e.teamId);
    return `<tr><td>${e.date}</td><td>${team?.name||"?"}</td><td>${e.category}</td><td>${fmt(e.amount)}</td></tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Armstrong Gate - ${title}</title>
<style>
body{font-family:Arial,sans-serif;padding:30px;color:#333;max-width:900px;margin:0 auto}
h1{color:#b8860b;border-bottom:3px solid #b8860b;padding-bottom:10px}
h2{color:#555;margin-top:25px;border-left:4px solid #b8860b;padding-left:10px}
.meta{background:#f9f9f9;padding:12px;border-radius:8px;margin:15px 0;font-size:13px}
.kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:15px 0}
.kpi-card{padding:15px;background:#f5f5f5;border-radius:10px;text-align:center;border:1px solid #ddd}
.kpi-value{font-size:20px;font-weight:bold;color:#b8860b}
.kpi-label{font-size:11px;color:#888;margin-top:4px}
.section{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:15px;margin:15px 0}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#b8860b;color:white;padding:8px;text-align:left}
td{padding:7px 8px;border-bottom:1px solid #eee}
tr:nth-child(even) td{background:#fafafa}
.pos{color:#16a34a;font-weight:bold}.neg{color:#dc2626;font-weight:bold}
.note{background:#fffbeb;border:1px solid #fde68a;padding:10px;border-radius:6px;font-size:11px;color:#92400e;margin:10px 0}
.footer{margin-top:30px;text-align:center;color:#aaa;font-size:11px;padding-top:15px;border-top:1px solid #eee}
@media print{button{display:none!important} body{padding:15px}}
</style></head><body>
<div style="text-align:center;margin-bottom:20px">
  <h1>⛏ ARMSTRONG GATE</h1>
  <p style="color:#888;font-size:13px">Rapport : ${title}</p>
</div>
<div class="meta">
  <strong>Période :</strong> ${from} → ${to} &nbsp;|&nbsp;
  <strong>Site :</strong> ${siteName} &nbsp;|&nbsp;
  <strong>Équipe :</strong> ${teamName} &nbsp;|&nbsp;
  <strong>Généré le :</strong> ${new Date().toLocaleDateString("fr-FR")}
</div>
<div class="note">ℹ️ Les Dépenses et la Caisse sont comptabilisées séparément — Bénéfice Net = Recettes Or − Dépenses (sans double comptage)</div>
<h2>📊 Résumé Exploitation</h2>
<div class="kpi">
  <div class="kpi-card"><div class="kpi-value">${totalW.toFixed(2)}g</div><div class="kpi-label">Or produit</div></div>
  <div class="kpi-card"><div class="kpi-value">${fmt(Math.round(totalProd))}</div><div class="kpi-label">Recettes Or</div></div>
  <div class="kpi-card"><div class="kpi-value neg">${fmt(Math.round(totalExp))}</div><div class="kpi-label">Dépenses</div></div>
  <div class="kpi-card"><div class="kpi-value ${benef>=0?'pos':'neg'}">${fmt(Math.round(benef))}</div><div class="kpi-label">Bénéfice Net</div></div>
  <div class="kpi-card"><div class="kpi-value">${totalProd>0?((benef/totalProd)*100).toFixed(1):0}%</div><div class="kpi-label">Rentabilité</div></div>
  <div class="kpi-card"><div class="kpi-value ${(totalIn-totalOut)>=0?'pos':'neg'}">${fmt(Math.round(totalIn-totalOut))}</div><div class="kpi-label">Solde Caisse</div></div>
</div>
<h2>⚖️ Productions (${prods.length})</h2>
<div class="section"><table><tr><th>Date</th><th>Équipe</th><th>Poids</th><th>Prix/g</th><th>Valeur</th></tr>${prodRows||'<tr><td colspan="5" style="text-align:center;color:#999">Aucune production</td></tr>'}</table></div>
<h2>💸 Dépenses (${exps.length})</h2>
<div class="section"><table><tr><th>Date</th><th>Équipe</th><th>Catégorie</th><th>Montant</th></tr>${expRows||'<tr><td colspan="4" style="text-align:center;color:#999">Aucune dépense</td></tr>'}</table></div>
<div class="footer">Armstrong Gate © 2026 — Document généré automatiquement<br>Pour sauvegarder en PDF : Ctrl+P → Destination: Enregistrer en PDF</div>
<div style="text-align:center;margin:20px 0">
  <button onclick="window.print()" style="background:#b8860b;color:white;border:none;padding:12px 30px;font-size:14px;border-radius:8px;cursor:pointer">🖨️ Imprimer / Sauvegarder en PDF</button>
</div>
</body></html>`;
}

export default function CustomReports() {
  const { productions, expenses, teams, sites, cashMovements } = useData();
  const { settings, fmt, sym, goldPrice } = useFormatMoney();
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = (title: string, from: string, to: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      const fp = productions.filter(p => {
        const inDate = p.date >= from && p.date <= to;
        const team = teams.find(t => t.id === p.teamId);
        const inSite = selectedSite === "all" || team?.siteId === selectedSite || p.siteId === selectedSite;
        const inTeam = selectedTeam === "all" || p.teamId === selectedTeam;
        return inDate && inSite && inTeam;
      });
      const fe = expenses.filter(e => {
        const inDate = e.date >= from && e.date <= to;
        const team = teams.find(t => t.id === e.teamId);
        const inSite = selectedSite === "all" || team?.siteId === selectedSite || e.siteId === selectedSite;
        const inTeam = selectedTeam === "all" || e.teamId === selectedTeam;
        return inDate && inSite && inTeam;
      });
      const fm = cashMovements.filter(m => {
        const inDate = m.date >= from && m.date <= to;
        const inSite = selectedSite === "all" || m.siteId === selectedSite;
        return inDate && inSite;
      });
      const siteName = selectedSite === "all" ? "Tous les sites" : sites.find(s => s.id === selectedSite)?.name || "";
      const teamName = selectedTeam === "all" ? "Toutes les équipes" : teams.find(t => t.id === selectedTeam)?.name || "";
      const html = buildHTML(title, from, to, siteName, teamName, fp, fe, fm, teams, fmt, sym, goldPrice);
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 800); }
      else { toast.error("Popup bloqué — autorisez les popups pour ce site"); }
      toast.success(`Rapport "${title}" généré — Ctrl+P pour sauvegarder en PDF`);
      setIsGenerating(false);
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports Personnalisés</h1>
          <p className="text-slate-500 text-sm">Génération PDF via impression navigateur (Ctrl+P)</p>
        </div>

        {/* Quick models */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">⚡ Modèles Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUICK.map(m => (
              <Card key={m.id} className={`border-2 cursor-pointer hover:shadow-md transition-all ${m.color}`}
                onClick={() => { const r = m.getRange(); generateReport(m.label, r.from, r.to); }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="mt-0.5">{m.icon}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{m.label}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs"
                      onClick={e => { e.stopPropagation(); const r = m.getRange(); generateReport(m.label, r.from, r.to); }}>
                      <Download size={13} className="mr-1" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom builder */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp size={18} className="text-amber-500"/>Rapport Personnalisé</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm text-slate-600 mb-1 block">Date début</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" /></div>
              <div><label className="text-sm text-slate-600 mb-1 block">Date fin</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" /></div>
              <div><label className="text-sm text-slate-600 mb-1 block">Site</label>
                <select value={selectedSite} onChange={e => { setSelectedSite(e.target.value); setSelectedTeam("all"); }} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="all">Tous les sites</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <div><label className="text-sm text-slate-600 mb-1 block">Équipe</label>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="all">Toutes les équipes</option>
                  {(selectedSite === "all" ? teams : teams.filter(t => t.siteId === selectedSite)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select></div>
            </div>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={isGenerating}
              onClick={() => generateReport("Rapport Personnalisé", dateFrom, dateTo)}>
              {isGenerating ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Génération...</span>
                : <span className="flex items-center gap-2"><Download size={16}/>Générer le Rapport PDF</span>}
            </Button>
            <p className="text-xs text-slate-400 text-center">
              Le rapport s'ouvre dans un nouvel onglet → <strong>Ctrl+P</strong> → "Enregistrer en PDF"
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
