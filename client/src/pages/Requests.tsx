import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

const TYPES = [
  { value: "avance_salaire",    label: "Avance sur Salaire" },
  { value: "equipement",        label: "Équipement" },
  { value: "engin",             label: "Engin / Véhicule" },
  { value: "carburant",         label: "Carburant" },
  { value: "paiement_etat",     label: "Paiement Agent de l'État" },
];

const STATUS_COLOR: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-800",
  approuve:   "bg-blue-100 text-blue-800",
  modifie:    "bg-purple-100 text-purple-800",
  decaisse:   "bg-green-100 text-green-800",
  refuse:     "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente",
  approuve:   "Approuvé",
  modifie:    "Modifié",
  decaisse:   "Décaissé",
  refuse:     "Refusé",
};

export default function Requests() {
  const { requests, addRequest, updateRequest, employees } = useData();
  const { user, canWrite } = useAuth();
  const role = user?.role;

  const isChef    = role === "chef_equipe";
  const isPDG     = role === "pdg";
  const isFinance = role === "finance";

  // Formulaire soumission (Chef d'Équipe)
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "avance_salaire", title: "", description: "", amount: "", employeeId: "", employeeName: "" });
  const [saving, setSaving] = useState(false);

  // Modal PDG (approuver/modifier/refuser)
  const [selected, setSelected] = useState<any>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [refuseNote, setRefuseNote] = useState("");

  // Modal Finance (décaisser)
  const [decaisse, setDecaisse] = useState<any>(null);
  const [transferMode, setTransferMode] = useState("Mobile Money");
  const [transferNote, setTransferNote] = useState("");

  const teamEmployees = employees.filter((e: any) => e.teamId === user?.teamId);

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return;
    setSaving(true);
    try {
      await addRequest({
        type: form.type,
        title: form.title,
        description: form.description,
        amount: parseFloat(form.amount),
        requestedBy: user?.id,
        requestedByName: user?.name,
        siteId: user?.siteId,
        teamId: user?.teamId,
        employeeId: form.employeeId || null,
        employeeName: form.employeeName || null,
      });
      setForm({ type: "avance_salaire", title: "", description: "", amount: "", employeeId: "", employeeName: "" });
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleApprove = async (withModification = false) => {
    if (!selected) return;
    await updateRequest(selected.id, {
      status: withModification ? "modifie" : "approuve",
      approvedAmount: withModification ? parseFloat(approvedAmount) : selected.amount,
    });
    setSelected(null);
    setApprovedAmount("");
  };

  const handleRefuse = async () => {
    if (!selected) return;
    await updateRequest(selected.id, { status: "refuse", transferNote: refuseNote });
    setSelected(null);
    setRefuseNote("");
  };

  const handleDecaisse = async () => {
    if (!decaisse) return;
    await updateRequest(decaisse.id, {
      status: "decaisse",
      transferMode,
      transferNote,
    });
    setDecaisse(null);
    setTransferMode("Mobile Money");
    setTransferNote("");
  };

  // Filtrer selon le rôle
  const visible = isChef
    ? requests.filter((r: any) => r.requestedBy === user?.id)
    : requests;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Demandes</h1>
        {isChef && (
          <button onClick={() => setShowForm(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700">
            + Nouvelle demande
          </button>
        )}
      </div>

      {/* Formulaire soumission Chef d'Équipe */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Nouvelle demande</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Type de demande</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {(form.type === "avance_salaire") && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Employé concerné</label>
                  <select value={form.employeeId} onChange={e => {
                    const emp = teamEmployees.find((x: any) => x.id === e.target.value);
                    setForm({...form, employeeId: e.target.value, employeeName: emp?.name || ""});
                  }} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">-- Sélectionner --</option>
                    {teamEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Titre / Objet</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: Avance salaire Moussa Diallo" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Montant demandé</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description / Motif</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Détails de la demande..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
                {saving ? "Envoi..." : "Soumettre"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-slate-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDG — Approuver / Modifier / Refuser */}
      {selected && isPDG && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
            <p className="text-xs text-slate-500 mb-3">{selected.requestedByName} — {TYPES.find(t=>t.value===selected.type)?.label}</p>
            <p className="text-sm mb-1">Montant demandé : <strong>{selected.amount} $</strong></p>
            {selected.employeeName && <p className="text-sm mb-3">Employé : <strong>{selected.employeeName}</strong></p>}
            {selected.description && <p className="text-sm text-slate-600 mb-4">{selected.description}</p>}
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Montant approuvé (si différent)</label>
              <input type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={selected.amount} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Note de refus (si refusé)</label>
              <input value={refuseNote} onChange={e => setRefuseNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motif du refus..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(false)} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">Approuver</button>
              <button onClick={() => handleApprove(true)} disabled={!approvedAmount} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-40">Modifier montant</button>
              <button onClick={handleRefuse} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700">Refuser</button>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-2 border py-2 rounded-lg text-sm hover:bg-slate-50">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Finance — Décaisser */}
      {decaisse && isFinance && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1">Décaisser — {decaisse.title}</h2>
            <p className="text-sm mb-4">Montant approuvé : <strong>{decaisse.approvedAmount || decaisse.amount} $</strong></p>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Mode de transfert</label>
              <select value={transferMode} onChange={e => setTransferMode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option>Mobile Money</option>
                <option>Présentiel</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Note / Référence transaction</label>
              <input value={transferNote} onChange={e => setTransferNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Numéro transaction, observation..." />
            </div>
            <div className="flex gap-2">
              <button onClick={handleDecaisse} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">Confirmer décaissement</button>
              <button onClick={() => setDecaisse(null)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-slate-50">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des demandes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Titre</th>
              {!isChef && <th className="px-4 py-2">Demandeur</th>}
              <th className="px-4 py-2">Montant</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 text-xs">{TYPES.find(t=>t.value===r.type)?.label || r.type}</td>
                <td className="px-4 py-2 font-medium">{r.title}</td>
                {!isChef && <td className="px-4 py-2 text-slate-500">{r.requestedByName}</td>}
                <td className="px-4 py-2">
                  {r.approvedAmount && r.approvedAmount !== r.amount
                    ? <span>{r.approvedAmount} $ <span className="line-through text-slate-400 text-xs">{r.amount}$</span></span>
                    : <span>{r.amount} $</span>}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLOR[r.status] || "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                  {r.transferMode && <span className="text-xs text-slate-400 ml-1">— {r.transferMode}</span>}
                </td>
                <td className="px-4 py-2 space-x-2">
                  {isPDG && r.status === "en_attente" && (
                    <button onClick={() => { setSelected(r); setApprovedAmount(""); }}
                      className="text-blue-600 hover:underline text-xs">Examiner</button>
                  )}
                  {isFinance && (r.status === "approuve" || r.status === "modifie") && (
                    <button onClick={() => setDecaisse(r)}
                      className="text-green-600 hover:underline text-xs">Décaisser</button>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucune demande</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}