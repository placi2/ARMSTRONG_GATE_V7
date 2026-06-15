import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

const TYPES = [
  { value: "avance_salaire", label: "Avance sur Salaire" },
  { value: "equipement",     label: "Équipement" },
  { value: "engin",          label: "Engin / Véhicule" },
  { value: "carburant",      label: "Carburant" },
  { value: "paiement_etat",  label: "Paiement Agent de l'État" },
];

const STATUS_COLOR: Record<string, string> = {
  en_attente:            "bg-amber-100 text-amber-800",
  en_attente_equipement: "bg-orange-100 text-orange-800",
  approuve:              "bg-blue-100 text-blue-800",
  modifie:               "bg-purple-100 text-purple-800",
  decaisse:              "bg-green-100 text-green-800",
  livre:                 "bg-teal-100 text-teal-800",
  refuse:                "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  en_attente:            "En attente",
  en_attente_equipement: "En attente livraison",
  approuve:              "Approuvé",
  modifie:               "Montant modifié",
  decaisse:              "Décaissé",
  livre:                 "Livré",
  refuse:                "Refusé",
};

export default function Requests() {
  const { requests, addRequest, updateRequest, employees } = useData();
  const { user } = useAuth();
  const role = user?.role;

  const isChef      = role === "chef_equipe";
  const isPDG       = role === "pdg";
  const isFinance   = role === "finance";
  const isEquip     = role === "equipements";

  const [showForm, setShowForm]   = useState(false);
  const [formType, setFormType]   = useState("avance_salaire");
  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [amount, setAmount]       = useState("");
  const [employeeId, setEmpId]    = useState("");
  const [equipSubtype, setEquipSubtype] = useState("epi");
  // Items pour équipement (liste)
  const [items, setItems]         = useState<{name:string;qty:string;unit:string;employeeId:string;employeeName:string}[]>([
    { name:"", qty:"1", unit:"unité", employeeId:"", employeeName:"" }
  ]);
  const [saving, setSaving]       = useState(false);

  // Modal PDG
  const [selected, setSelected]   = useState<any>(null);
  const [newAmount, setNewAmount] = useState("");
  const [refuseNote, setRefuseNote] = useState("");

  // Modal Finance
  const [decaisse, setDecaisse]   = useState<any>(null);
  const [tMode, setTMode]         = useState("Mobile Money");
  const [tNote, setTNote]         = useState("");

  const teamEmployees = employees.filter((e: any) => e.teamId === user?.teamId);

  const addItem = () => setItems([...items, { name:"", qty:"1", unit:"unité", employeeId:"", employeeName:"" }]);
  const updateItem = (i: number, field: string, val: string) => {
    const arr = [...items];
    if (field === "employeeId") {
      const emp = teamEmployees.find((e: any) => e.id === val);
      arr[i] = { ...arr[i], employeeId: val, employeeName: emp?.name || "" };
    } else {
      arr[i] = { ...arr[i], [field]: val };
    }
    setItems(arr);
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setTitle(""); setDesc(""); setAmount(""); setEmpId("");
    setEquipSubtype("epi");
    setItems([{ name:"", qty:"1", unit:"unité", employeeId:"", employeeName:"" }]);
    setFormType("avance_salaire");
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title) return;
    setSaving(true);
    try {
      const emp = teamEmployees.find((e: any) => e.id === employeeId);
      await addRequest({
        type: formType,
        title,
        description,
        amount: amount ? parseFloat(amount) : null,
        requestedBy: user?.id,
        requestedByName: user?.name,
        siteId: user?.siteId,
        teamId: user?.teamId,
        employeeId: employeeId || null,
        employeeName: emp?.name || null,
        equipmentSubtype: formType === "equipement" ? equipSubtype : null,
        items: formType === "equipement" ? items : null,
      });
      resetForm();
    } finally { setSaving(false); }
  };

  const handleApprove = async (modified = false) => {
    if (!selected) return;
    await updateRequest(selected.id, {
      status: modified ? "modifie" : "approuve",
      approvedAmount: modified ? parseFloat(newAmount) : selected.amount,
    });
    setSelected(null); setNewAmount(""); setRefuseNote("");
  };

  const handleRefuse = async () => {
    if (!selected) return;
    await updateRequest(selected.id, { status: "refuse", transferNote: refuseNote });
    setSelected(null); setNewAmount(""); setRefuseNote("");
  };

  const handleDecaisse = async () => {
    if (!decaisse) return;
    await updateRequest(decaisse.id, {
      status: "decaisse", transferMode: tMode, transferNote: tNote,
      approvedAmount: decaisse.approvedAmount || decaisse.amount,
    });
    setDecaisse(null); setTMode("Mobile Money"); setTNote("");
  };

  const handleLivrer = async (r: any) => {
    await updateRequest(r.id, { status: "livre" });
  };

  // Filtrage vue selon rôle
  const visible = requests.filter((r: any) => {
    if (isChef)    return r.requestedBy === user?.id;
    if (role === "rh")         return r.type === "avance_salaire";
    if (isEquip)               return r.type === "equipement";
    if (role === "logistique") return r.type === "engin";
    return true; // PDG, Finance voient tout
  });

  // Types disponibles selon rôle (chef_equipe uniquement)
  const availableTypes = isChef ? TYPES : TYPES;

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

      {/* ── Formulaire soumission Chef d'Équipe ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Nouvelle demande</h2>
            <div className="space-y-3">

              {/* Type */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Type de demande</label>
                <select value={formType} onChange={e => setFormType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Sous-type équipement */}
              {formType === "equipement" && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Catégorie équipement</label>
                  <select value={equipSubtype} onChange={e => setEquipSubtype(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="epi">EPI (Protection individuelle — déduit du salaire)</option>
                    <option value="remboursable">Remboursable (retournable le soir)</option>
                  </select>
                </div>
              )}

              {/* Employé (avance salaire) */}
              {formType === "avance_salaire" && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Employé concerné</label>
                  <select value={employeeId} onChange={e => setEmpId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">-- Sélectionner --</option>
                    {teamEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}

              {/* Items équipement */}
              {formType === "equipement" && (
                <div>
                  <label className="text-xs text-slate-500 mb-2 block font-medium">Équipements demandés</label>
                  {items.map((item, i) => (
                    <div key={i} className="border rounded-lg p-3 mb-2 space-y-2 bg-slate-50">
                      <div className="flex gap-2">
                        <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Nom équipement" />
                        <input type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)}
                          className="w-16 border rounded px-2 py-1 text-sm" placeholder="Qté" />
                        <select value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)}
                          className="border rounded px-2 py-1 text-sm">
                          <option>unité</option>
                          <option>litre</option>
                          <option>mètre</option>
                          <option>kg</option>
                        </select>
                      </div>
                      {equipSubtype === "epi" && (
                        <select value={item.employeeId} onChange={e => updateItem(i, "employeeId", e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm">
                          <option value="">-- Employé bénéficiaire --</option>
                          {teamEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                      )}
                      {items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addItem} className="text-xs text-amber-600 hover:underline">+ Ajouter un équipement</button>
                </div>
              )}

              {/* Titre */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Titre / Objet</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: Avance salaire Moussa Diallo" />
              </div>

              {/* Montant (pas pour équipement remboursable) */}
              {!(formType === "equipement" && equipSubtype === "remboursable") && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Montant {formType === "carburant" ? "(litres)" : formType === "engin" ? "($)" : "($)"}
                  </label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description / Motif</label>
                <textarea value={description} onChange={e => setDesc(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Détails..." />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
                {saving ? "Envoi..." : "Soumettre"}
              </button>
              <button onClick={resetForm}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-slate-50">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal PDG ── */}
      {selected && isPDG && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
            <p className="text-xs text-slate-500 mb-3">
              {selected.requestedByName} — {TYPES.find(t => t.value === selected.type)?.label}
            </p>
            {selected.employeeName && (
              <p className="text-sm mb-2">Employé : <strong>{selected.employeeName}</strong></p>
            )}
            {selected.items && (
              <div className="mb-3 bg-slate-50 rounded p-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Équipements :</p>
                {JSON.parse(typeof selected.items === "string" ? selected.items : JSON.stringify(selected.items)).map((it: any, i: number) => (
                  <p key={i} className="text-xs">• {it.name} × {it.qty} {it.unit} {it.employeeName ? `→ ${it.employeeName}` : ""}</p>
                ))}
              </div>
            )}
            <p className="text-sm mb-4">Montant demandé : <strong>{selected.amount} $</strong></p>
            {selected.description && <p className="text-sm text-slate-600 mb-4">{selected.description}</p>}
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Montant approuvé (si modification)</label>
              <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={selected.amount} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Note de refus</label>
              <input value={refuseNote} onChange={e => setRefuseNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motif du refus..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(false)} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm">Approuver</button>
              <button onClick={() => handleApprove(true)} disabled={!newAmount}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm disabled:opacity-40">Modifier</button>
              <button onClick={handleRefuse} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Refuser</button>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-2 border py-2 rounded-lg text-sm">Fermer</button>
          </div>
        </div>
      )}

      {/* ── Modal Finance ── */}
      {decaisse && isFinance && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1">Décaisser — {decaisse.title}</h2>
            {decaisse.employeeName && (
              <p className="text-sm mb-2">Employé : <strong>{decaisse.employeeName}</strong></p>
            )}
            <p className="text-sm mb-4">
              Montant approuvé : <strong>{decaisse.approvedAmount || decaisse.amount} $</strong>
              {decaisse.approvedAmount && decaisse.approvedAmount !== decaisse.amount && (
                <span className="text-xs text-slate-400 ml-2 line-through">(demandé: {decaisse.amount}$)</span>
              )}
            </p>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Mode de transfert</label>
              <select value={tMode} onChange={e => setTMode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option>Mobile Money</option>
                <option>Présentiel</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Référence / Note transaction</label>
              <input value={tNote} onChange={e => setTNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Numéro transaction, observation..." />
            </div>
            <div className="flex gap-2">
              <button onClick={handleDecaisse} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm">Confirmer décaissement</button>
              <button onClick={() => setDecaisse(null)} className="flex-1 border py-2 rounded-lg text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tableau ── */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
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
                <td className="px-4 py-2 text-xs">{TYPES.find(t => t.value === r.type)?.label || r.type}</td>
                <td className="px-4 py-2 font-medium">{r.title}</td>
                {!isChef && <td className="px-4 py-2 text-slate-500">{r.requestedByName}</td>}
                <td className="px-4 py-2">
                  {r.approvedAmount && r.approvedAmount != r.amount
                    ? <span>{r.approvedAmount}$ <span className="line-through text-slate-400 text-xs">{r.amount}$</span></span>
                    : <span>{r.amount ? `${r.amount}$` : "—"}</span>}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLOR[r.status] || "bg-slate-100"}`}>
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                  {r.transferMode && <span className="text-xs text-slate-400 ml-1">— {r.transferMode}</span>}
                </td>
                <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                  {isPDG && r.status === "en_attente" && (
                    <button onClick={() => { setSelected(r); setNewAmount(""); }}
                      className="text-blue-600 hover:underline text-xs">Examiner</button>
                  )}
                  {isFinance && (r.status === "approuve" || r.status === "modifie") && (
                    <button onClick={() => setDecaisse(r)}
                      className="text-green-600 hover:underline text-xs">Décaisser</button>
                  )}
                  {isEquip && r.status === "en_attente_equipement" && (
                    <button onClick={() => handleLivrer(r)}
                      className="text-teal-600 hover:underline text-xs">Livrer</button>
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