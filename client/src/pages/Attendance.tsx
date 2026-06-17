import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

const today = () => new Date().toISOString().split("T")[0];

const STATUS_OPTIONS = [
  { value: "present",  label: "✅ Présent",  color: "bg-green-100 text-green-700" },
  { value: "absent",   label: "❌ Absent",   color: "bg-red-100 text-red-700" },
  { value: "conge",    label: "🏖️ Congé",    color: "bg-blue-100 text-blue-700" },
];

export default function Attendance() {
  const { employees, teams, attendance, saveAttendance } = useData() as any;
  const { user } = useAuth();

  const [date, setDate]     = useState(today());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const myTeamId    = user?.teamId;
  const mySiteId    = user?.siteId;
  const isRH        = user?.role === "rh";
  const myTeam      = teams.find((t: any) => t.id === myTeamId);
  const myEmployees = isRH
    ? employees
    : employees.filter((e: any) => e.teamId === myTeamId);

  // Pointage existant pour la date sélectionnée
  const existingForDate = attendance.filter((a: any) => a.date === date && a.teamId === myTeamId);

  // État local du pointage (initialisé depuis la DB ou "present" par défaut)
  const [statuses, setStatuses] = useState<Record<string, string>>({});

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
        teamId:       myTeamId,
        siteId: isRH ? (teams.find((t:any)=>t.id===emp.teamId)?.siteId || null) : (mySiteId || myTeam?.siteId),
        date,
        status:       getStatus(emp.id),
      }));
      await saveAttendance(records);
      setSuccess(`✅ Pointage du ${new Date(date).toLocaleDateString("fr-FR")} enregistré`);
      setStatuses({});
    } finally { setSaving(false); }
  };

  // Stats du jour
  const presents  = myEmployees.filter((e: any) => getStatus(e.id) === "present").length;
  const absents   = myEmployees.filter((e: any) => getStatus(e.id) === "absent").length;
  const conges    = myEmployees.filter((e: any) => getStatus(e.id) === "conge").length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Pointage Présence</h1>
          {myTeam && <p className="text-sm text-slate-500">{myTeam.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setStatuses({}); }}
            max={today()}
            className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleSave} disabled={saving || !myEmployees.length}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
      )}

      {/* Stats */}
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

      {/* Liste employés */}
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
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt.value}
                        onClick={() => setStatus(emp.id, opt.value)}
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