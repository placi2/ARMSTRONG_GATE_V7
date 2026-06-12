import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

export default function Requests() {
  const { requests, updateRequestStatus } = useData();
  const { canWrite } = useAuth();

  const statusColor = (s: string) =>
    s === "approuve" ? "bg-green-100 text-green-800" :
    s === "refuse" ? "bg-red-100 text-red-800" :
    "bg-amber-100 text-amber-800";

  const statusLabel = (s: string) =>
    s === "approuve" ? "Approuvé" : s === "refuse" ? "Refusé" : "En attente";

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold mb-4">Demandes</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Titre</th>
              <th className="px-4 py-2">Demandeur</th>
              <th className="px-4 py-2">Statut</th>
              {canWrite && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.title}</td>
                <td className="px-4 py-2">{r.requestedByName}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColor(r.status)}`}>
                    {statusLabel(r.status)}
                  </span>
                </td>
                {canWrite && (
                  <td className="px-4 py-2 space-x-2">
                    {r.status === "en_attente" && (
                      <>
                        <button onClick={() => updateRequestStatus(r.id, "approuve")} className="text-green-600 hover:underline">Approuver</button>
                        <button onClick={() => updateRequestStatus(r.id, "refuse")} className="text-red-600 hover:underline">Refuser</button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucune demande</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}