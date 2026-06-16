import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination, { usePagination } from "@/components/Pagination";

const today = () => new Date().toISOString().split("T")[0];

export default function EquipmentMovements() {
  const { siteStock, equipmentMovements, teams, employees, createSortie, createRetour } = useData() as any;
  const { user } = useAuth();

  const [tab, setTab] = useState<"sortie"|"retour"|"historique">("sortie");

  // Formulaire sortie
  const [sortieForm, setSortieForm] = useState({
    equipmentId: "", teamId: "", qty: "1", date: today(), notes: ""
  });
  const [savingSortie, setSavingSortie] = useState(false);
  const [successSortie, setSuccessSortie] = useState("");

  // Modal retour
  const [qtyGood, setQtyGood]           = useState("");
  const [qtyCasse, setQtyCasse]         = useState("0");
  const [qtyManquant, setQtyManquant]   = useState("0");
  const [responsibleType, setRespType]  = useState("accident");
  const [responsibleId, setRespId]      = useState("");
  const [responsibleName, setRespName]  = useState("");
  const [retourNotes, setRetourNotes]   = useState("");
  const [savingRetour, setSavingRetour] = useState(false);

  // Filtre historique
  const [searchHist, setSearchHist] = useState("");

  // Stock disponible sur ce site
  const mySiteId = user?.siteId;
  const myTeams  = teams.filter((t: any) => t.siteId === mySiteId);
  const siteEquipment = siteStock.filter((ss: any) => ss.siteId === mySiteId && (ss.qtyAvailable || 0) > 0);

  // Mouvements de ce site
  const myMovements = equipmentMovements.filter((mv: any) => mv.siteId === mySiteId);
  const pendingRetours = myMovements.filter((mv: any) => !mv.statusReturn && mv.movementType === "sortie");

  // Historique filtré
  const histFiltered = myMovements.filter((mv: any) =>
    !searchHist ||
    mv.equipmentName?.toLowerCase().includes(searchHist.toLowerCase()) ||
    mv.teamName?.toLowerCase().includes(searchHist.toLowerCase())
  );
  const histPag = usePagination(histFiltered);

  const selectedEq = siteEquipment.find((e: any) => e.equipmentId === sortieForm.equipmentId);

  const handleSortie = async () => {
    if (!sortieForm.equipmentId || !sortieForm.qty) return;
    const eq   = siteEquipment.find((e: any) => e.equipmentId === sortieForm.equipmentId);
    const team = myTeams.find((t: any) => t.id === sortieForm.teamId);
    if (!eq) return;
    if (parseInt(sortieForm.qty) > (eq.qtyAvailable || 0)) {
      setSuccessSortie("❌ Quantité insuffisante sur ce site");
      return;
    }
    setSavingSortie(true);
    try {
      await createSortie({
        equipmentId:   eq.equipmentId,
        equipmentName: eq.equipmentName,
        siteId:        mySiteId,
        teamId:        sortieForm.teamId || null,
        teamName:      team?.name || null,
        qty:           parseInt(sortieForm.qty),
        date:          sortieForm.date,
        notes:         sortieForm.notes || null,
      });
      setSuccessSortie(`✅ ${sortieForm.qty} × ${eq.equipmentName} sorti vers ${team?.name || "équipe"}`);
      setSortieForm({ equipmentId:"", teamId:"", qty:"1", date:today(), notes:"" });
    } finally { setSavingSortie(false); }
  };

  const handleRetour = async () => {
    if (!selectedMv) return;
    const good = parseFloat(qtyGood) || 0;
    const casse = parseFloat(qtyCasse) || 0;
    const manquant = parseFloat(qtyManquant) || 0;
    const total = good + casse + manquant;
    if (total !== parseFloat(selectedMv.qtyOut)) {
      alert(`Total (${total}) doit égaler la quantité sortie (${selectedMv.qtyOut})`);
      return;
    }
    setSavingRetour(true);
    try {
      const emp = employees.find((e: any) => e.id === responsibleId);
      await createRetour(selectedMv.id, {
        qtyGood: good,
        qtyCasse: casse,
        qtyManquant: manquant,
        responsibleType: (casse > 0 || manquant > 0) ? responsibleType : null,
        responsibleId: (casse > 0 || manquant > 0) ? responsibleId || null : null,
        responsibleName: (casse > 0 || manquant > 0) ? (emp?.name || responsibleName || null) : null,
        notes: retourNotes || null,
      });
      setSelectedMv(null);
      setQtyGood("");
      setQtyCasse("0");
      setQtyManquant("0");
      setRespType("accident");
      setRespId("");
      setRespName("");
      setRetourNotes("");
    } finally { setSavingRetour(false); }
  };

  const siteEmployees = employees.filter((e: any) =>
    myTeams.some((t: any) => t.id === e.teamId)
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold">Mouvements Équipements</h1>
        <div className="flex gap-2">
          {(["sortie","retour","historique"] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`px-3 py-1.5 rounded-lg text-sm relative ${tab===tb?"bg-amber-600 text-white":"border hover:bg-slate-50"}`}>
              {tb==="sortie"?"📤 Sortie Matin":tb==="retour"?"📥 Retour Soir":"📋 Historique"}
              {tb==="retour" && pendingRetours.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingRetours.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sortie Matin ── */}
      {tab === "sortie" && (
        <div className="max-w-lg">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold mb-4">📤 Enregistrer une sortie d'équipement</h2>
            {successSortie && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${successSortie.startsWith("✅")?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>
                {successSortie}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Équipement disponible sur site</label>
                <select value={sortieForm.equipmentId}
                  onChange={e => setSortieForm({...sortieForm, equipmentId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {siteEquipment.map((eq: any) => (
                    <option key={eq.equipmentId} value={eq.equipmentId}>
                      {eq.equipmentName} — {eq.category==="epi"?"EPI":"Remboursable"} (dispo: {eq.qtyAvailable||0})
                    </option>
                  ))}
                </select>
              </div>
              {selectedEq && (
                <div className="bg-slate-50 rounded p-2 text-xs text-slate-600">
                  Catégorie : <strong>{selectedEq.category==="epi"?"EPI":"Remboursable"}</strong> —
                  Disponible : <strong>{selectedEq.qtyAvailable||0}</strong> —
                  Sur terrain : <strong>{selectedEq.qtyOnTerrain||0}</strong>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Équipe bénéficiaire</label>
                <select value={sortieForm.teamId}
                  onChange={e => setSortieForm({...sortieForm, teamId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {myTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Quantité</label>
                  <input type="number" min="1" max={selectedEq?.qtyAvailable||999}
                    value={sortieForm.qty}
                    onChange={e => setSortieForm({...sortieForm, qty: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Date</label>
                  <input type="date" value={sortieForm.date}
                    onChange={e => setSortieForm({...sortieForm, date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Notes (optionnel)</label>
                <input value={sortieForm.notes}
                  onChange={e => setSortieForm({...sortieForm, notes: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Observations..." />
              </div>
            </div>
            <button onClick={handleSortie} disabled={savingSortie||!sortieForm.equipmentId}
              className="w-full mt-4 bg-amber-600 text-white py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
              {savingSortie ? "Enregistrement..." : "📤 Enregistrer la sortie"}
            </button>
          </div>
        </div>
      )}

      {/* ── Retour Soir ── */}
      {tab === "retour" && (
        <div className="space-y-3">
          {/* Modal retour */}
          {selectedMv && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h2 className="text-lg font-bold mb-1">Retour — {selectedMv.equipmentName}</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Sorti : {selectedMv.qtyOut} unité(s) — Équipe : {selectedMv.teamName || "—"}
                </p>
                <div className="space-y-3">
                  {/* Résumé quantités */}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs">
                    <p className="font-medium text-slate-600 mb-2">Quantité sortie : <strong>{selectedMv.qtyOut}</strong></p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-green-600 font-medium block mb-1">✅ Bon état</label>
                        <input type="number" min="0" max={selectedMv.qtyOut}
                          value={qtyGood}
                          onChange={e => setQtyGood(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-red-600 font-medium block mb-1">🔴 Cassé</label>
                        <input type="number" min="0" max={selectedMv.qtyOut}
                          value={qtyCasse}
                          onChange={e => setQtyCasse(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-slate-600 font-medium block mb-1">⚫ Manquant</label>
                        <input type="number" min="0" max={selectedMv.qtyOut}
                          value={qtyManquant}
                          onChange={e => setQtyManquant(e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm" placeholder="0" />
                      </div>
                    </div>
                    {/* Validation total */}
                    {(() => {
                      const total = (parseFloat(qtyGood)||0) + (parseFloat(qtyCasse)||0) + (parseFloat(qtyManquant)||0);
                      const ok = total === parseFloat(selectedMv.qtyOut);
                      return (
                        <p className={`mt-2 text-xs font-medium ${ok?"text-green-600":"text-red-500"}`}>
                          Total : {total} / {selectedMv.qtyOut} {ok?"✅":"⚠️ doit égaler la quantité sortie"}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Responsabilité si cassé ou manquant */}
                  {((parseFloat(qtyCasse)||0) > 0 || (parseFloat(qtyManquant)||0) > 0) && (
                    <>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Responsabilité</label>
                        <select value={responsibleType} onChange={e => setRespType(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm">
                          <option value="accident">Accident / Usure normale</option>
                          <option value="employee">Employé précis</option>
                          <option value="equipe">Équipe (Caisse Équipe)</option>
                        </select>
                      </div>
                      {responsibleType === "employee" && (
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Employé responsable</label>
                          <select value={responsibleId} onChange={e => setRespId(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm">
                            <option value="">-- Sélectionner --</option>
                            {siteEmployees.map((emp: any) => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                    <input value={retourNotes} onChange={e => setRetourNotes(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Observations..." />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleRetour} disabled={savingRetour||((parseFloat(qtyGood)||0)+(parseFloat(qtyCasse)||0)+(parseFloat(qtyManquant)||0))===0}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                    {savingRetour ? "Enregistrement..." : "✅ Confirmer retour"}
                  </button>
                  <button onClick={() => setSelectedMv(null)}
                    className="flex-1 border py-2 rounded-lg text-sm">Annuler</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-orange-50 border-b">
              <h2 className="font-semibold text-orange-800 text-sm">
                📥 Retours en attente ({pendingRetours.length})
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Équipement</th>
                  <th className="px-4 py-2">Équipe</th>
                  <th className="px-4 py-2">Qté sortie</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRetours.map((mv: any) => (
                  <tr key={mv.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs text-slate-500">{mv.date}</td>
                    <td className="px-4 py-2 font-medium">{mv.equipmentName}</td>
                    <td className="px-4 py-2">{mv.teamName || "—"}</td>
                    <td className="px-4 py-2 font-bold text-orange-600">{mv.qtyOut}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => { setSelectedMv(mv); setQtyReturned(String(mv.qtyOut)); }}
                        className="text-green-600 hover:underline text-xs">
                        📥 Enregistrer retour
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingRetours.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucun retour en attente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Historique ── */}
      {tab === "historique" && (
        <div className="space-y-3">
          <input value={searchHist} onChange={e => { setSearchHist(e.target.value); histPag.setPage(1); }}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="🔍 Rechercher équipement, équipe..." />
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b">
              <h2 className="font-semibold text-slate-700 text-sm">📋 Historique mouvements ({histFiltered.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Équipement</th>
                  <th className="px-4 py-2">Équipe</th>
                  <th className="px-4 py-2">Qté sortie</th>
                  <th className="px-4 py-2">Retour</th>
                  <th className="px-4 py-2">État retour</th>
                  <th className="px-4 py-2">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {(histPag.paginated as any[]).map((mv: any) => (
                  <tr key={mv.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs text-slate-500">{mv.date}</td>
                    <td className="px-4 py-2 font-medium">{mv.equipmentName}</td>
                    <td className="px-4 py-2">{mv.teamName || "—"}</td>
                    <td className="px-4 py-2 font-bold text-orange-600">{mv.qtyOut}</td>
                    <td className="px-4 py-2 text-green-600">{mv.qtyReturned || "—"}</td>
                    <td className="px-4 py-2">
                      {mv.statusReturn ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          mv.statusReturn==="bon_etat"?"bg-green-100 text-green-700":
                          mv.statusReturn==="casse"?"bg-red-100 text-red-700":
                          "bg-slate-100 text-slate-600"}`}>
                          {mv.statusReturn==="bon_etat"?"Bon état":mv.statusReturn==="casse"?"Cassé":"Manquant"}
                        </span>
                      ) : <span className="text-xs text-amber-500">En attente</span>}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">{mv.responsibleName || mv.responsibleType || "—"}</td>
                  </tr>
                ))}
                {histFiltered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Aucun mouvement</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4">
              <Pagination total={histPag.total} page={histPag.page} perPage={histPag.perPage}
                onPageChange={histPag.setPage} onPerPageChange={histPag.setPerPage} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}