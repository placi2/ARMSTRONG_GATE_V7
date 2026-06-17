import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination, { usePagination } from "@/components/Pagination";

const today    = () => new Date().toISOString().split("T")[0];
const firstDay = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

const STATUS_OPTIONS = [
  { value: "present", label: "✅ Présent",  color: "bg-green-100 text-green-700" },
  { value: "absent",  label: "❌ Absent",   color: "bg-red-100 text-red-700" },
  { value: "conge",   label: "🏖️ Congé",   color: "bg-blue-100 text-blue-700" },
];

export default function Attendance() {
  const { employees, teams, sites, attendance, saveAttendance } = useData() as any;
  const { user } = useAuth();

  const [date, setDate]       = useState(today());
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  // Filtres RH
  const [dateFrom, setDateFrom]     = useState(firstDay());
  const [dateTo, setDateTo]         = useState(today());
  const [filterSite, setFilterSite] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [searchEmp, setSearchEmp]   = useState("");

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
    const salaireGagne  = totalJours > 0
      ? (joursPresent / totalJours) * salaireMensuel
      : 0;
    const team = teams.find((t: any) => t.id === emp.teamId);
    const site = sites.find((s: any) => s.id === team?.siteId);
    return { emp, team, site, joursPresent, joursAbsent, joursConge, totalJours, salaireMensuel, salaireGagne };
  });

  const rhPag = usePagination(rhReport);

  if (isRH) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-xl font-bold">Rapport de Présences</h1>
        </div>

        {/* Filtres */}
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

        {/* Stats globales */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-700">{rhReport.length}</p>
            <p className="text-xs text-slate-500">Employés</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{rhReport.reduce((s,r)=>s+r.joursPresent,0)}</p>
            <p className="text-xs text-green-600">Total jours présents</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{rhReport.reduce((s,r)=>s+r.joursAbsent,0)}</p>
            <p className="text-xs text-red-600">Total jours absents</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">
              ${rhReport.reduce((s,r)=>s+r.salaireGagne,0).toFixed(0)}
            </p>
            <p className="text-xs text-amber-600">Masse salariale gagnée</p>
          </div>
        </div>

        {/* Tableau rapport */}
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