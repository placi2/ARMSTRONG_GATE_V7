import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination, { usePagination } from "@/components/Pagination";
import * as XLSX from "xlsx";
import { useSettings } from "@/contexts/SettingsContext";

const today    = () => new Date().toISOString().split("T")[0];
const firstDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };

const STATUS_OPTIONS = [
  { value: "present", label: "✅ Présent",  color: "bg-green-100 text-green-700" },
  { value: "absent",  label: "❌ Absent",   color: "bg-red-100 text-red-700" },
  { value: "conge",   label: "🏖️ Congé",   color: "bg-blue-100 text-blue-700" },
];

export default function Attendance() {
  const { employees, teams, sites, attendance, advances, salaryDeductions, saveAttendance } = useData() as any;
  const { user } = useAuth();
  const { settings } = useSettings();

  const [date, setDate]       = useState(today());
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  // Filtres RH
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; });
  const [dateTo, setDateTo]         = useState(today());
  const [filterSite, setFilterSite] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [searchEmp, setSearchEmp]   = useState("");
  const [rhTab, setRhTab] = useState<"presences"|"paie">("presences");
  const isRH       = user?.role === "rh";
  const myTeamId   = user?.teamId;
  const mySiteId   = user?.siteId;
  const myTeam     = teams.find((t: any) => t.id === myTeamId);

  const myEmployees = isRH
    ? employees
    : employees.filter((e: any) => e.teamId === myTeamId);

  const existingForDate = attendance.filter((a: any) =>
    a.date === date && (isRH ? true : a.teamId === myTeamId)
  );

  const getStatus = (empId: string) => {
    if (statuses[empId]) return statuses[empId];
    const existing = existingForDate.find((a: any) => a.employeeId === empId);
    return existing?.status || "present";
  };

  const setStatus = (empId: string, status: string) => {
    setStatuses(prev => ({ ...prev, [empId]: status }));
  };

  const handleSave = async () => {
    if (!myEmployees.length) return;
    setSaving(true);
    setSuccess("");
    try {
      const records = myEmployees.map((emp: any) => ({
        id:           `ATT${emp.id}${date.replace(/-/g,"")}`,
        employeeId:   emp.id,
        employeeName: emp.name,
        teamId:       emp.teamId,
        siteId:       teams.find((t:any) => t.id === emp.teamId)?.siteId || null,
        date,
        status:       getStatus(emp.id),
      }));
      await saveAttendance(records);
      setSuccess(`✅ Pointage du ${new Date(date).toLocaleDateString("fr-FR")} enregistré`);
      setStatuses({});
    } finally { setSaving(false); }
  };

  const presents = myEmployees.filter((e: any) => getStatus(e.id) === "present").length;
  const absents  = myEmployees.filter((e: any) => getStatus(e.id) === "absent").length;
  const conges   = myEmployees.filter((e: any) => getStatus(e.id) === "conge").length;

  // ── Vue RH : rapport de présences ──
  const rhTeams = filterSite === "all"
    ? teams
    : teams.filter((t: any) => t.siteId === filterSite);

  const rhEmployees = employees.filter((emp: any) => {
    const inTeam = filterTeam === "all" ? rhTeams.some((t: any) => t.id === emp.teamId) : emp.teamId === filterTeam;
    const inSearch = !searchEmp || emp.name.toLowerCase().includes(searchEmp.toLowerCase());
    return inTeam && inSearch;
  });

  // Calcul rapport par employé
  const rhReport = rhEmployees.map((emp: any) => {
    const empAttendance = attendance.filter((a: any) =>
      a.employeeId === emp.id && a.date >= dateFrom && a.date <= dateTo
    );
    const joursPresent  = empAttendance.filter((a: any) => a.status === "present").length;
    const joursAbsent   = empAttendance.filter((a: any) => a.status === "absent").length;
    const joursConge    = empAttendance.filter((a: any) => a.status === "conge").length;
    const totalJours    = joursPresent + joursAbsent + joursConge;
    const salaireMensuel = emp.monthlySalary || 0;
    const salaireGagne  = workingDays > 0
      ? Math.min((joursPresent / workingDays) * salaireMensuel, salaireMensuel)
      : 0;
    const team = teams.find((t: any) => t.id === emp.teamId);
    const site = sites.find((s: any) => s.id === team?.siteId);
    return { emp, team, site, joursPresent, joursAbsent, joursConge, totalJours, salaireMensuel, salaireGagne };
  });

  const rhPag = usePagination(rhReport);

  // Calcul jours ouvrables entre deux dates (lun-sam)
  const getWorkingDays = (from: string, to: string) => {
    let count = 0;
    const d = new Date(from);
    const end = new Date(to);
    while (d <= end) {
      const day = d.getDay();
      if (day !== 0) count++; // exclure dimanche
      d.setDate(d.getDate() + 1);
    }
    return count;
  };

  const workingDays = getWorkingDays(dateFrom, dateTo);

  const payReport = rhEmployees.map((emp: any) => {
    const empAtt = attendance.filter((a: any) =>
      a.employeeId === emp.id && a.date >= dateFrom && a.date <= dateTo
    );
    const joursPresent  = empAtt.filter((a: any) => a.status === "present").length;
    const joursAbsent   = empAtt.filter((a: any) => a.status === "absent").length;
    const joursConge    = empAtt.filter((a: any) => a.status === "conge").length;
    const salaireMensuel = emp.monthlySalary || 0;
    const salaireJournalier = workingDays > 0 ? salaireMensuel / workingDays : 0;
    const salaireGagne = Math.min(joursPresent * salaireJournalier, salaireMensuel);
    const totalAvances  = emp.totalAdvances || 0;
    // Déduction équipement ce mois
    const empDeds = salaryDeductions.filter((d: any) => d.employeeId === emp.id && d.status === "en_cours");
    const deductionMensuelle = empDeds.reduce((s: number, d: any) => {
      const reste = parseFloat(d.amountTotal) - parseFloat(d.amountPaid);
      const mensuel = (parseFloat(d.monthlyRate) / 100) * salaireMensuel;
      return s + Math.min(reste, mensuel);
    }, 0);
    const salaireNet    = Math.max(0, salaireGagne - totalAvances - deductionMensuelle);
    const team = teams.find((t: any) => t.id === emp.teamId);
    const site = sites.find((s: any) => s.id === team?.siteId);
    return { emp, team, site, joursPresent, joursAbsent, joursConge, workingDays, salaireMensuel, salaireGagne, totalAvances, deductionMensuelle, salaireNet };
  });

  const payPag = usePagination(payReport);

  const exportCSV = () => {
    const headers = ["Employé","Site","Équipe","Jours ouvrables","Présent","Absent","Congé","Salaire base","Salaire gagné","Avances","Net à payer"];
    const rows = payReport.map(({ emp, site, team, joursPresent, joursAbsent, joursConge, workingDays, salaireMensuel, salaireGagne, totalAvances, salaireNet }: any) =>
      [emp.name, site?.name||"", team?.name||"", workingDays, joursPresent, joursAbsent, joursConge, salaireMensuel, salaireGagne.toFixed(2), totalAvances, salaireNet.toFixed(2)]
    );
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `rapport-paie-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const data = payReport.map(({ emp, site, team, joursPresent, joursAbsent, joursConge, workingDays: wd, salaireMensuel, salaireGagne, totalAvances, salaireNet }: any) => ({
      "Employé":          emp.name,
      "Site":             site?.name || "—",
      "Équipe":           team?.name || "—",
      "Jours ouvrables":  wd,
      "Jours présents":   joursPresent,
      "Jours absents":    joursAbsent,
      "Jours congés":     joursConge,
      "Salaire base ($)": salaireMensuel,
      "Salaire gagné ($)":parseFloat(salaireGagne.toFixed(2)),
      "Avances ($)":      totalAvances,
      "Net à payer ($)":  parseFloat(salaireNet.toFixed(2)),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapport de Paie");
    XLSX.writeFile(wb, `rapport-paie-${dateFrom}-${dateTo}.xlsx`);
  };

const exportPDF = () => {
    const logo = settings.customLogo || "";
    const printContent = `
      <html>
      <head>
        <title>Rapport de Paie — ${dateFrom} au ${dateTo}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          .header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; border-bottom: 2px solid #b8860b; padding-bottom: 12px; }
          .logo { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
          .logo-placeholder { width: 60px; height: 60px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
          .company-info h1 { font-size: 18px; font-weight: bold; color: #1a1a1a; margin: 0; }
          .company-info p { font-size: 11px; color: #666; margin: 2px 0; }
          .report-title { margin: 12px 0 4px; font-size: 14px; font-weight: bold; }
          .period { color: #666; font-size: 11px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #fef3c7; padding: 7px 8px; text-align: left; border: 1px solid #e2e8f0; font-size: 11px; }
          td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) { background: #f8fafc; }
          .total-row { font-weight: bold; background: #fef3c7 !important; }
          .footer { position: fixed; bottom: 20px; left: 20px; right: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logo
            ? `<img src="${logo}" class="logo" alt="logo"/>`
            : `<div class="logo-placeholder">⛏</div>`
          }
          <div class="company-info">
            <h1>${settings.companyName || "ARMSTRONG GATE"}</h1>
            ${settings.email ? `<p>📧 ${settings.email}</p>` : ""}
            ${settings.phone ? `<p>📞 ${settings.phone}</p>` : ""}
            ${settings.address ? `<p>📍 ${settings.address}</p>` : ""}
          </div>
        </div>
        <p class="report-title">Rapport de Paie</p>
        <p class="period">Période : ${dateFrom.split("-").reverse().join("/")} au ${dateTo.split("-").reverse().join("/")} — Jours ouvrables : ${workingDays}j</p>
        <table>
          <thead>
            <tr>
              <th>Employé</th><th>Site / Équipe</th><th>Jrs ouvr.</th>
              <th>Présent</th><th>Salaire base</th><th>Salaire gagné</th>
              <th>Avances</th><th>Net à payer</th>
            </tr>
          </thead>
          <tbody>
            ${payReport.map(({ emp, site, team, joursPresent, workingDays: wd, salaireMensuel, salaireGagne, totalAvances, salaireNet }: any) => `
              <tr>
                <td>${emp.name}</td>
                <td>${site?.name||"—"} / ${team?.name||"—"}</td>
                <td>${wd}j</td>
                <td>${joursPresent}j</td>
                <td>$${salaireMensuel}</td>
                <td>$${salaireGagne.toFixed(2)}</td>
                <td>-$${totalAvances}</td>
                <td><strong>$${salaireNet.toFixed(2)}</strong></td>
              </tr>
            `).join("")}
            <tr class="total-row">
              <td colspan="4"><strong>TOTAL</strong></td>
              <td><strong>$${payReport.reduce((s: number,r: any)=>s+r.salaireMensuel,0)}</strong></td>
              <td><strong>$${payReport.reduce((s: number,r: any)=>s+r.salaireGagne,0).toFixed(2)}</strong></td>
              <td><strong>-$${payReport.reduce((s: number,r: any)=>s+r.totalAvances,0)}</strong></td>
              <td><strong>$${payReport.reduce((s: number,r: any)=>s+r.salaireNet,0).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          ${settings.companyName || "ARMSTRONG GATE"}
          ${settings.email ? ` | ${settings.email}` : ""}
          ${settings.phone ? ` | ${settings.phone}` : ""}
          ${settings.address ? ` | ${settings.address}` : ""}
        </div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  if (isRH) {
    return (
      
      <DashboardLayout>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-xl font-bold">
            {rhTab === "presences" ? "Rapport de Présences" : "Rapport de Paie"}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setRhTab("presences")}
              className={`px-3 py-1.5 rounded-lg text-sm ${rhTab==="presences"?"bg-amber-600 text-white":"border hover:bg-slate-50"}`}>
              📋 Présences
            </button>
            <button onClick={() => setRhTab("paie")}
              className={`px-3 py-1.5 rounded-lg text-sm ${rhTab==="paie"?"bg-amber-600 text-white":"border hover:bg-slate-50"}`}>
              📊 Rapport de Paie
            </button>
          </div>
        </div>

        {/* Filtres communs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Du</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Au</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <select value={filterSite} onChange={e => { setFilterSite(e.target.value); setFilterTeam("all"); }}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">Tous les sites</option>
            {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">Toutes les équipes</option>
            {rhTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input value={searchEmp} onChange={e => setSearchEmp(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
            placeholder="🔍 Rechercher employé..." />
        </div>

        {/* ── Onglet Présences ── */}
        {rhTab === "presences" && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-700">{rhReport.length}</p>
                <p className="text-xs text-slate-500">Employés</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{rhReport.reduce((s: number,r: any)=>s+r.joursPresent,0)}</p>
                <p className="text-xs text-green-600">Jours présents</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{rhReport.reduce((s: number,r: any)=>s+r.joursAbsent,0)}</p>
                <p className="text-xs text-red-600">Jours absents</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  ${rhReport.reduce((s: number,r: any)=>s+r.salaireGagne,0).toFixed(0)}
                </p>
                <p className="text-xs text-amber-600">Masse salariale gagnée</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-2">Employé</th>
                    <th className="px-4 py-2">Site</th>
                    <th className="px-4 py-2">Équipe</th>
                    <th className="px-4 py-2 text-green-600">Présent</th>
                    <th className="px-4 py-2 text-red-600">Absent</th>
                    <th className="px-4 py-2 text-blue-600">Congé</th>
                    <th className="px-4 py-2">Salaire base</th>
                    <th className="px-4 py-2 text-amber-600">Salaire gagné</th>
                  </tr>
                </thead>
                <tbody>
                  {(rhPag.paginated as any[]).map(({ emp, team, site, joursPresent, joursAbsent, joursConge, salaireMensuel, salaireGagne }: any) => (
                    <tr key={emp.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{emp.name}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{site?.name || "—"}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{team?.name || "—"}</td>
                      <td className="px-4 py-2 font-bold text-green-700">{joursPresent}j</td>
                      <td className="px-4 py-2 text-red-600">{joursAbsent}j</td>
                      <td className="px-4 py-2 text-blue-600">{joursConge}j</td>
                      <td className="px-4 py-2">${salaireMensuel}</td>
                      <td className="px-4 py-2 font-bold text-amber-600">${salaireGagne.toFixed(2)}</td>
                    </tr>
                  ))}
                  {rhReport.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Aucun pointage pour cette période</td></tr>
                  )}
                </tbody>
              </table>
              <div className="px-4">
                <Pagination total={rhPag.total} page={rhPag.page} perPage={rhPag.perPage}
                  onPageChange={rhPag.setPage} onPerPageChange={rhPag.setPerPage} />
              </div>
            </div>
          </>
        )}

        {/* ── Onglet Rapport de Paie ── */}
        {rhTab === "paie" && (
          <>
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-slate-500">
                Période : <strong>{dateFrom.split("-").reverse().join("/")}</strong> au <strong>{dateTo.split("-").reverse().join("/")}</strong> —
                Jours ouvrables : <strong>{workingDays}j</strong>
              </div>
              <div className="flex gap-2">
                <button onClick={exportCSV}
                  className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-700">
                  📄 CSV
                </button>
                <button onClick={exportExcel}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">
                  📊 Excel
                </button>
                <button onClick={exportPDF}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">
                  🖨️ PDF
                </button>
              </div>
            </div>

            {/* Stats paie */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">${payReport.reduce((s: number,r: any)=>s+r.salaireMensuel,0)}</p>
                <p className="text-xs text-blue-600">Masse salariale totale</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">${payReport.reduce((s: number,r: any)=>s+r.salaireGagne,0).toFixed(0)}</p>
                <p className="text-xs text-amber-600">Total salaires gagnés</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">${payReport.reduce((s: number,r: any)=>s+r.salaireNet,0).toFixed(0)}</p>
                <p className="text-xs text-green-600">Total net à payer</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-2">Employé</th>
                    <th className="px-4 py-2">Site / Équipe</th>
                    <th className="px-4 py-2">Jours ouvr.</th>
                    <th className="px-4 py-2 text-green-600">Présent</th>
                    <th className="px-4 py-2">Salaire base</th>
                    <th className="px-4 py-2 text-amber-600">Salaire gagné</th>
                    <th className="px-4 py-2 text-red-600">Avances</th>
                    <th className="px-4 py-2 text-red-600">Déduction équip.</th>
                    <th className="px-4 py-2 text-green-700">Net à payer</th>
                  </tr>
                </thead>
                <tbody>
                  {(payPag.paginated as any[]).map(({ emp, team, site, joursPresent, workingDays: wd, salaireMensuel, salaireGagne, totalAvances, deductionMensuelle, salaireNet }: any) => (
                    <tr key={emp.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{emp.name}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{site?.name || "—"} / {team?.name || "—"}</td>
                      <td className="px-4 py-2 text-slate-500">{wd}j</td>
                      <td className="px-4 py-2 font-bold text-green-700">{joursPresent}j</td>
                      <td className="px-4 py-2">${salaireMensuel}</td>
                      <td className="px-4 py-2 font-bold text-amber-600">${salaireGagne.toFixed(2)}</td>
                      <td className="px-4 py-2 text-red-500">-${totalAvances}</td>
                      <td className="px-4 py-2 text-red-500">-${deductionMensuelle.toFixed(2)}</td>
                      <td className="px-4 py-2 font-bold text-green-700">${salaireNet.toFixed(2)}</td>
                    </tr>
                  ))}
                  
                  {payReport.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Aucun employé trouvé</td></tr>
                  )}
                </tbody>
              </table>
              <div className="px-4">
                <Pagination total={payPag.total} page={payPag.page} perPage={payPag.perPage}
                  onPageChange={payPag.setPage} onPerPageChange={payPag.setPerPage} />
              </div>
            </div>
          </>
        )}
      </DashboardLayout>
    );
  }
  

  // ── Vue Chef d'Équipe : pointage ──
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Pointage Présence</h1>
          {myTeam && <p className="text-sm text-slate-500">{myTeam.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setStatuses({}); }}
            max={today()} className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleSave} disabled={saving || !myEmployees.length}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </div>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{presents}</p>
          <p className="text-xs text-green-600">Présents</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{absents}</p>
          <p className="text-xs text-red-600">Absents</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{conges}</p>
          <p className="text-xs text-blue-600">Congés</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3">Employé</th>
              <th className="px-4 py-3">Fonction</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {myEmployees.map((emp: any) => (
              <tr key={emp.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{emp.function || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setStatus(emp.id, opt.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          getStatus(emp.id) === opt.value
                            ? opt.color + " ring-2 ring-offset-1 ring-amber-400"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {myEmployees.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Aucun employé dans votre équipe</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}