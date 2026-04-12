import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ArrowLeft, User, CalendarCheck } from "lucide-react";
import Pagination, { usePagination } from "@/components/Pagination";
import AttendanceTracker from "@/components/AttendanceTracker";
import AddAdvanceForm from "@/components/AddAdvanceForm";

function useFormatMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const goldPrice = s?.goldPriceUsd || s?.goldPrice || 65;
  return { settings: ctx.settings, fmt, goldPrice };
}

export default function EmployeeProfile() {
  const [location] = useLocation();
  const empId = location.split("/employee/")[1]?.split("?")[0] || "";

  const data = useData();
  // Safe access - advances might not exist in old DataContext
  const employees = data?.employees || [];
  const teams = data?.teams || [];
  const sites = data?.sites || [];
  const productions = data?.productions || [];
  const expenses = data?.expenses || [];
  const advances = (data as any)?.advances || [];

  const { fmt } = useFormatMoney();

  const employee = employees.find(e => e.id === empId);

  if (!employee) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <User size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Employé non trouvé</h2>
        <p className="text-sm text-slate-400 mb-4">ID: "{empId}"</p>
        <Link href="/employees">
          <Button className="bg-amber-500 hover:bg-amber-600 text-white"><ArrowLeft size={15} className="mr-1" />Retour</Button>
        </Link>
      </div>
    </DashboardLayout>
  );

  const team = teams.find(t => t.id === employee.teamId);
  const site = sites.find(s => s.id === team?.siteId);
  const empAdvances = advances.filter((a: any) => a.employeeId === empId);
  const totalAdvances = empAdvances.reduce((s: number, a: any) => s + a.amount, 0);
  const baseSalary = employee.monthlySalary || (employee as any).salary || 0;
  const netSalary = baseSalary - totalAdvances;

  const teamProds = [...productions.filter(p => p.teamId === employee.teamId)]
    .sort((a, b) => b.date.localeCompare(a.date));
  const teamExps = [...expenses.filter(e => e.teamId === employee.teamId)]
    .sort((a, b) => b.date.localeCompare(a.date));
  const advList = [...empAdvances].sort((a: any, b: any) => b.date.localeCompare(a.date));

  const { page: pp, perPage: ppp, paginated: ppag, total: pt, setPage: spp, setPerPage: sppp } = usePagination(teamProds, 5);
  const { page: ep, perPage: epp, paginated: epag, total: et, setPage: sep, setPerPage: sepp } = usePagination(advList, 10);

  // Load attendance from localStorage - reactive on tick change
  const now = new Date();
  const [attendanceTick, setAttendanceTick] = useState(0);
  const refreshAttendance = () => setAttendanceTick(t => t + 1);

  // Re-read localStorage every time tick changes (after dialog closes)
  const attendance = useMemo((): Record<string, string> => {
    const key = `att_${empId}_${now.getFullYear()}_${now.getMonth()}`;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId, attendanceTick]);

  const presentDays = useMemo(() => Object.values(attendance).filter(v => v === "present").length, [attendance]);
  const halfDays = useMemo(() => Object.values(attendance).filter(v => v === "half").length, [attendance]);
  const absentDays = useMemo(() => Object.values(attendance).filter(v => v === "absent").length, [attendance]);
  const totalMarked = presentDays + halfDays + absentDays;
  const dailySalary = baseSalary / 30;
  const earnedSalary = Math.round(presentDays * dailySalary + halfDays * dailySalary * 0.5);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="sm"><ArrowLeft size={14} className="mr-1" />Retour</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
            <p className="text-slate-400 text-sm">{employee.function || "Employé"} · {team?.name || "—"} · {site?.name || "—"}</p>
          </div>
          <span className={`ml-auto px-2 py-0.5 rounded-full text-sm font-bold ${(employee.status || "Actif") === "Actif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {employee.status || "Actif"}
          </span>
        </div>

        {/* Salary summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Salaire Base", v: fmt(baseSalary), c: "text-blue-600", bg: "bg-blue-50" },
            { l: "Total Avances", v: fmt(totalAdvances), c: "text-orange-600", bg: "bg-orange-50" },
            { l: "Salaire Net", v: fmt(netSalary), c: "text-green-600", bg: "bg-green-50" },
            { l: "Salaire Gagné (pointage)", v: fmt(earnedSalary), c: "text-amber-600", bg: "bg-amber-50" },
          ].map(s => (
            <Card key={s.l} className={`${s.bg} border-0`}>
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">{s.l}</p>
                <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Attendance */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck size={18} className="text-amber-500" />
                Pointage du Mois
              </CardTitle>
              <div className="flex gap-2"><AddAdvanceForm /><AttendanceTracker employeeId={empId} employeeName={employee.name} onClose={refreshAttendance} /></div>
            </div>
          </CardHeader>
          <CardContent>
            {totalMarked === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Aucun pointage ce mois. Cliquez sur "Pointer" pour commencer.</p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { l: "Présents", v: presentDays, c: "text-green-600", bg: "bg-green-50" },
                    { l: "½ Journées", v: halfDays, c: "text-orange-600", bg: "bg-orange-50" },
                    { l: "Absents", v: absentDays, c: "text-red-600", bg: "bg-red-50" },
                    { l: "Jours marqués", v: totalMarked, c: "text-blue-600", bg: "bg-blue-50" },
                  ].map(s => (
                    <div key={s.l} className={`${s.bg} rounded-lg p-3 text-center`}>
                      <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Calcul salaire</span>
                    <span className="font-medium">
                      {presentDays} j × {fmt(dailySalary)} + {halfDays} × {fmt(dailySalary * 0.5)} = <strong className="text-amber-600">{fmt(earnedSalary)}</strong>
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Informations Personnelles</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Fonction", employee.function || "—"],
                ["Équipe", team?.name || "—"],
                ["Site", site?.name || "—"],
                ["Date d'entrée", (employee as any).joinDate || "—"],
                ["Salaire journalier", fmt(dailySalary)],
                ["Rôle", (employee as any).role || "Employé"],
              ].map(([l, v]) => (
                <div key={l as string} className="bg-slate-50 rounded p-2">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="font-medium text-sm">{v}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advances history */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Historique des Avances ({advList.length})</CardTitle></CardHeader>
          <CardContent>
            {advList.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Aucune avance enregistrée</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b"><tr>
                  {["Date", "Montant", "Motif", "Statut"].map(h =>
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {epag.map((a: any) => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3">{a.date}</td>
                      <td className="py-2 px-3 font-bold text-orange-600">{fmt(a.amount)}</td>
                      <td className="py-2 px-3 text-slate-500 text-xs">{a.motif || "—"}</td>
                      <td className="py-2 px-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{a.status || "Validé"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Pagination total={et} page={ep} perPage={epp} onPageChange={sep} onPerPageChange={sepp} />
          </CardContent>
        </Card>

        {/* Team productions */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Productions de l'Équipe ({teamProds.length})</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b"><tr>
                {["Date", "Poids", "Valeur"].map(h =>
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>
                )}
              </tr></thead>
              <tbody>
                {ppag.length === 0 ? <tr><td colSpan={3} className="text-center py-4 text-slate-400">Aucune production</td></tr>
                  : ppag.map(p => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2 px-3">{p.date}</td>
                    <td className="py-2 px-3 text-amber-600 font-bold">{(p.weight || 0).toFixed(1)}g</td>
                    <td className="py-2 px-3 text-green-600">{fmt((p.weight || 0) * (p.pricePerGram || 65))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={pt} page={pp} perPage={ppp} onPageChange={spp} onPerPageChange={sppp} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
