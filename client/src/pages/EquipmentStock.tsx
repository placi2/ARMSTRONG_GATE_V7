import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

export default function EquipmentStock() {
  const { equipment, equipmentStock, siteStock, equipmentTransfers, transferToSite, sites, load } = useData() as any;
  const { user } = useAuth();

  const [tab, setTab] = useState<"central"|"sites"|"transfer"|"historique">("central");
  const [transferForm, setForm] = useState({ equipmentId:"", siteId:"", qty:"1" });
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [searchHistory, setSearchHistory] = useState("");
  const [snapshotDate, setSnapshotDate]   = useState("");
  useEffect(() => { load?.(); }, []); // eslint-disable-line

  const selectedEq = equipment.find((e: any) => e.id === transferForm.equipmentId);

  const handleTransfer = async () => {
    if (!transferForm.equipmentId || !transferForm.siteId || !transferForm.qty) return;
    const eq  = equipment.find((e: any) => e.id === transferForm.equipmentId);
    const sit = sites.find((s: any) => s.id === transferForm.siteId);
    if (!eq || !sit) return;
    if (parseInt(transferForm.qty) > (eq.stockQty || 0)) {
      setSuccess("❌ Quantité insuffisante en stock central");
      return;
    }
    setSaving(true);
    try {
      await transferToSite({
        equipmentId:   eq.id,
        equipmentName: eq.name,
        siteId:        sit.id,
        siteName:      sit.name,
        qty:           parseInt(transferForm.qty),
        unitValue:     eq.value || 0,
        category:      eq.category || "remboursable",
      });
      setSuccess(`✅ ${transferForm.qty} × ${eq.name} transféré vers ${sit.name}`);
      setForm({ equipmentId:"", siteId:"", qty:"1" });
    } finally { setSaving(false); }
  };

  const centralStock = equipmentStock.filter((e: any) => (e.stockQty || 0) > 0);
  const stockBySite  = sites.map((s: any) => ({
    site: s,
    items: siteStock.filter((ss: any) => ss.siteId === s.id),
  })).filter((g: any) => g.items.length > 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Stock Équipements</h1>
        <div className="flex gap-2 flex-wrap">
          {(["central","sites","transfer","historique"] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`px-3 py-1.5 rounded-lg text-sm ${tab===tb?"bg-amber-600 text-white":"border hover:bg-slate-50"}`}>
              {tb==="central"?"📦 Stock Central":tb==="sites"?"🏗️ Stock par Site":tb==="transfer"?"🔄 Transfert":"📋 Historique"}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Central */}
      {tab === "central" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b">
            <h2 className="font-semibold text-blue-800 text-sm">Stock Central — {centralStock.length} article(s)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Équipement</th>
                <th className="px-4 py-2">Catégorie</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Stock dispo</th>
                <th className="px-4 py-2">Prix unit.</th>
                <th className="px-4 py-2">Valeur totale</th>
              </tr>
            </thead>
            <tbody>
              {centralStock.map((eq: any) => (
                <tr key={eq.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{eq.name}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${eq.category==="epi"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                      {eq.category==="epi"?"EPI":"Remboursable"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{eq.type}</td>
                  <td className="px-4 py-2 font-bold text-green-700">{eq.stockQty || 0}</td>
                  <td className="px-4 py-2">{eq.value || 0}$</td>
                  <td className="px-4 py-2 text-amber-600 font-medium">{((eq.stockQty||0)*(eq.value||0)).toFixed(2)}$</td>
                </tr>
              ))}
              {centralStock.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucun stock disponible</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock par Site */}
      {tab === "sites" && (
        <div className="space-y-4">
          {stockBySite.map(({ site, items }: any) => (
            <div key={site.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-orange-50 border-b">
                <h2 className="font-semibold text-orange-800 text-sm">🏗️ {site.name} — {items.length} article(s)</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-2">Équipement</th>
                    <th className="px-4 py-2">Catégorie</th>
                    <th className="px-4 py-2">Disponible</th>
                    <th className="px-4 py-2">Sur terrain</th>
                    <th className="px-4 py-2">Prix unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{item.equipmentName}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${item.category==="epi"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                          {item.category==="epi"?"EPI":"Remboursable"}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold text-green-700">{item.qtyAvailable || 0}</td>
                      <td className="px-4 py-2 text-orange-600">{item.qtyOnTerrain || 0}</td>
                      <td className="px-4 py-2">{item.unitValue || 0}$</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {stockBySite.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm px-4 py-6 text-center text-slate-400">
              Aucun stock transféré vers les sites
            </div>
          )}
        </div>
      )}

      {/* Transfert */}
      {tab === "transfer" && (
        <div className="max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold mb-4">Transférer du stock vers un site</h2>
            {success && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${success.startsWith("✅")?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>
                {success}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Équipement</label>
                <select value={transferForm.equipmentId}
                  onChange={ev => setForm({...transferForm, equipmentId: ev.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {centralStock.map((eq: any) => (
                    <option key={eq.id} value={eq.id}>{eq.name} (stock: {eq.stockQty||0})</option>
                  ))}
                </select>
              </div>
              {selectedEq && (
                <div className="bg-slate-50 rounded p-2 text-xs text-slate-600">
                  Catégorie : <strong>{selectedEq.category==="epi"?"EPI":"Remboursable"}</strong> —
                  Prix unit. : <strong>{selectedEq.value||0}$</strong> —
                  Stock dispo : <strong>{selectedEq.stockQty||0}</strong>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Site destinataire</label>
                <select value={transferForm.siteId}
                  onChange={ev => setForm({...transferForm, siteId: ev.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {sites.map((si: any) => <option key={si.id} value={si.id}>{si.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Quantité à transférer</label>
                <input type="number" min="1" max={selectedEq?.stockQty||999}
                  value={transferForm.qty}
                  onChange={ev => setForm({...transferForm, qty: ev.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <button onClick={handleTransfer} disabled={saving||!transferForm.equipmentId||!transferForm.siteId}
              className="w-full mt-4 bg-amber-600 text-white py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Transfert en cours..." : "🔄 Transférer vers le site"}
            </button>
          </div>
        </div>
      )}

      {/* Historique */}
    {tab === "historique" && (
  <div className="space-y-3">
    {/* Filtres */}
    <div className="bg-white rounded-lg shadow-sm p-4 flex gap-3 flex-wrap">
      <input value={searchHistory} onChange={e => setSearchHistory(e.target.value)}
        className="flex-1 border rounded-lg px-3 py-2 text-sm min-w-48"
        placeholder="🔍 Rechercher équipement, site..." />
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 whitespace-nowrap">Stock au :</label>
        <input type="date" value={snapshotDate} onChange={e => setSnapshotDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        {snapshotDate && (
          <button onClick={() => setSnapshotDate("")}
            className="text-xs text-red-500 hover:underline">Effacer</button>
        )}
      </div>
    </div>

    {/* Snapshot stock à date X */}
    {snapshotDate && (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 text-sm mb-3">
          📅 Stock transféré jusqu'au {new Date(snapshotDate).toLocaleDateString("fr-FR")}
        </h3>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-left">
            <tr>
              <th className="py-1 pr-4">Équipement</th>
              <th className="py-1 pr-4">Site</th>
              <th className="py-1 pr-4">Qté totale transférée</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(
              equipmentTransfers
                .filter((tr: any) => new Date(tr.createdAt) <= new Date(snapshotDate + "T23:59:59"))
                .reduce((acc: any, tr: any) => {
                  const key = `${tr.equipmentId}-${tr.siteId}`;
                  if (!acc[key]) acc[key] = { name: tr.equipmentName, site: tr.siteName, qty: 0 };
                  acc[key].qty += parseFloat(tr.qty) || 0;
                  return acc;
                }, {})
            ).map((row: any, i: number) => (
              <tr key={i} className="border-t border-amber-100">
                <td className="py-1 pr-4 font-medium">{row.name}</td>
                <td className="py-1 pr-4">{row.site}</td>
                <td className="py-1 font-bold text-amber-700">{row.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Tableau historique filtré */}
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b">
        <h2 className="font-semibold text-slate-700 text-sm">
          📋 Historique des transferts ({equipmentTransfers.filter((tr: any) =>
            !searchHistory || tr.equipmentName?.toLowerCase().includes(searchHistory.toLowerCase()) ||
            tr.siteName?.toLowerCase().includes(searchHistory.toLowerCase())
          ).length})
        </h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Équipement</th>
            <th className="px-4 py-2">Site destinataire</th>
            <th className="px-4 py-2">Catégorie</th>
            <th className="px-4 py-2">Qté</th>
            <th className="px-4 py-2">Prix unit.</th>
            <th className="px-4 py-2">Transféré par</th>
          </tr>
        </thead>
        <tbody>
          {equipmentTransfers
            .filter((tr: any) =>
              !searchHistory ||
              tr.equipmentName?.toLowerCase().includes(searchHistory.toLowerCase()) ||
              tr.siteName?.toLowerCase().includes(searchHistory.toLowerCase())
            )
            .map((tr: any) => (
              <tr key={tr.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 text-xs text-slate-500">
                  {new Date(tr.createdAt).toLocaleDateString("fr-FR", {day:"2-digit",month:"2-digit",year:"numeric"})}
                </td>
                <td className="px-4 py-2 font-medium">{tr.equipmentName}</td>
                <td className="px-4 py-2">{tr.siteName}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${tr.category==="epi"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                    {tr.category==="epi"?"EPI":"Remboursable"}
                  </span>
                </td>
                <td className="px-4 py-2 font-bold">{tr.qty}</td>
                <td className="px-4 py-2">{tr.unitValue}$</td>
                <td className="px-4 py-2 text-slate-500">{tr.transferredByName || "—"}</td>
              </tr>
            ))}
          {equipmentTransfers.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Aucun transfert enregistré</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
    </DashboardLayout>
  );
}