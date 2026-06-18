import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination, { usePagination } from "@/components/Pagination";

export default function SalaryDeductions() {
  const { salaryDeductions, employees, paySalaryDeduction } = useData() as any;
  const { user } = useAuth();

  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [payModal, setPayModal]     = useState<any>(null);
  const [payAmount, setPayAmount]   = useState("");
  const [saving, setSaving]         = useState(false);

  const isPDG     = user?.role === "pdg";
  const isRH      = user?.role === "rh";
  const isFinance = user?.role === "finance";

  const filtered = salaryDeductions.filter((d: any) => {
    const matchSearch = !search ||
      d.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      d.equipmentName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pag = usePagination(filtered);

  const handlePay = async () => {
    if (!payModal || !payAmount) return;
    setSaving(true);
    try {
      await paySalaryDeduction(payModal.id, parseFloat(payAmount));
      setPayModal(null);
      setPayAmount("");
    } finally { setSaving(false); }
  };

  const totalDette  = salaryDeductions.filter((d: any) => d.status === "en_cours").reduce((s: number, d: any) => s + (parseFloat(d.amountTotal) - parseFloat(d.amountPaid)), 0);
  const totalSoldee = salaryDeductions.filter((d: any) => d.status === "soldee").length;

  // Employés bloqués (dette > $500)
  const blockedEmployees = salaryDeductions
    .filter((d: any) => d.status === "en_cours" && parseFloat(d.amountTotal) > 500)
    .map((d: any) => d.employeeId);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold">Déductions Salaire — Équipements</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{salaryDeductions.filter((d:any)=>d.status==="en_cours").length}</p>
          <p className="text-xs text-red-600">Déductions en cours</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">${totalDette.toFixed(2)}</p>
          <p className="text-xs text-amber-600">Dette totale restante</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{totalSoldee}</p>
          <p className="text-xs text-green-600">Déductions soldées</p>
        </div>
      </div>

      {/* Employés bloqués */}
      {blockedEmployees.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">
            🚫 {blockedEmployees.length} employé(s) bloqué(s) pour avance salaire (dette {">"} $500)
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {blockedEmployees.map((empId: string) => {
              const emp = employees.find((e: any) => e.id === empId);
              return emp ? (
                <span key={empId} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                  {emp.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm min-w-48"
          placeholder="🔍 Rechercher employé, équipement..." />
        <select value={filterStatus} onChange={e => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="en_cours">En cours</option>
          <option value="soldee">Soldée</option>
        </select>
      </div>

      {/* Modal paiement */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1">Enregistrer un paiement</h2>
            <p className="text-xs text-slate-500 mb-3">{payModal.employeeName} — {payModal.equipmentName}</p>
            <div className="bg-slate-50 rounded p-3 mb-4 text-sm">
              <p>Dette totale : <strong>${payModal.amountTotal}</strong></p>
              <p>Déjà payé : <strong>${payModal.amountPaid}</strong></p>
              <p>Reste : <strong className="text-red-600">${(parseFloat(payModal.amountTotal) - parseFloat(payModal.amountPaid)).toFixed(2)}</strong></p>
              <p>Taux mensuel : <strong>{payModal.monthlyRate}%</strong></p>
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Montant payé ce mois</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={`Max: ${(parseFloat(payModal.amountTotal) - parseFloat(payModal.amountPaid)).toFixed(2)}`} />
            </div>
            <div className="flex gap-2">
              <button onClick={handlePay} disabled={saving || !payAmount}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? "Enregistrement..." : "✅ Confirmer paiement"}
              </button>
              <button onClick={() => { setPayModal(null); setPayAmount(""); }}
                className="flex-1 border py-2 rounded-lg text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Employé</th>
              <th className="px-4 py-2">Équipement</th>
              <th className="px-4 py-2">Dette totale</th>
              <th className="px-4 py-2">Payé</th>
              <th className="px-4 py-2">Reste</th>
              <th className="px-4 py-2">Taux/mois</th>
              <th className="px-4 py-2">Statut</th>
              {(isPDG || isFinance) && <th className="px-4 py-2">Action</th>}
            </tr>
          </thead>
          <tbody>
            {(pag.paginated as any[]).map((d: any) => {
              const reste = parseFloat(d.amountTotal) - parseFloat(d.amountPaid);
              return (
                <tr key={d.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">
                    {d.employeeName}
                    {parseFloat(d.amountTotal) > 500 && d.status === "en_cours" && (
                      <span className="ml-1 text-xs text-red-500">🚫</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-xs">{d.equipmentName}</td>
                  <td className="px-4 py-2 font-bold text-red-600">${d.amountTotal}</td>
                  <td className="px-4 py-2 text-green-600">${d.amountPaid}</td>
                  <td className="px-4 py-2 font-bold">${reste.toFixed(2)}</td>
                  <td className="px-4 py-2">{d.monthlyRate}%</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${d.status==="soldee"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
                      {d.status==="soldee"?"Soldée":"En cours"}
                    </span>
                  </td>
                  {(isPDG || isFinance) && (
                    <td className="px-4 py-2">
                      {d.status === "en_cours" && (
                        <button onClick={() => { setPayModal(d); setPayAmount(""); }}
                          className="text-green-600 hover:underline text-xs">
                          💰 Paiement
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Aucune déduction</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4">
          <Pagination total={pag.total} page={pag.page} perPage={pag.perPage}
            onPageChange={pag.setPage} onPerPageChange={pag.setPerPage} />
        </div>
      </div>
    </DashboardLayout>
  );
}