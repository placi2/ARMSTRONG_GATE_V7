import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

export default function EquipmentStock() {
  const { equipment, equipmentStock, siteStock, equipmentTransfers, transferToSite, sites, load } = useData() as any;
useEffect(() => { load?.(); }, []);
  const [refreshed, setRefreshed] = useState(false);
useEffect(() => { if (!refreshed) { load?.(); setRefreshed(true); } }, []);
  
  const { user } = useAuth();

  const [tab, setTab] = useState<"central"|"sites"|"transfer"|"historique">("central");
  const [transferForm, setForm]   = useState({ equipmentId:"", siteId:"", qty:"1" });
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState("");

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

  // Stock central groupé
  const centralStock = equipmentStock.filter((e: any) => (e.stockQty || 0) > 0);

  // Stock par site
  const stockBySite = sites.map((s: any) => ({
    site: s,
    items: siteStock.filter((ss: any) => ss.siteId === s.id),
  })).filter((g: any) => g.items.length > 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Stock Équipements</h1>
        <div className="flex gap-2">
    {(["central","sites","transfer","historique"] as const).map(t => (
  <button key={t} onClick={() => setTab(t)}
    className={`px-3 py-1.5 rounded-lg text-sm ${tab===t?"bg-amber-600 text-white":"border hover:bg-slate-50"}`}>
    {t==="central"?"📦 Stock Central":t==="sites"?"🏗️ Stock par Site":t==="transfer"?"🔄 Transfert":"📋 Historique"}
  </button>
))}
        </div>
      </div>

      {/* ── Stock Central ── */}
      {tab === "central" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b flex items-center justify-between">
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
              {centralStock.map((e: any) => (
                <tr key={e.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${e.category==="epi"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                      {e.category==="epi"?"EPI":"Remboursable"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{e.type}</td>
                  <td className="px-4 py-2 font-bold text-green-700">{e.stockQty || 0}</td>
                  <td className="px-4 py-2">{e.value || 0}$</td>
                  <td className="px-4 py-2 text-amber-600 font-medium">{((e.stockQty||0)*(e.value||0)).toFixed(2)}$</td>
                </tr>
              ))}
              {centralStock.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucun stock disponible</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Stock par Site ── */}
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

      {/* ── Transfert Central → Site ── */}
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
                  onChange={e => setForm({...transferForm, equipmentId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {centralStock.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name} (stock: {e.stockQty||0})</option>
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
                  onChange={e => setForm({...transferForm, siteId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Quantité à transférer</label>
                <input type="number" min="1" max={selectedEq?.stockQty||999}
                  value={transferForm.qty}
                  onChange={e => setForm({...transferForm, qty: e.target.value})}
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
      {/* ── Historique Transferts ── */}
      {tab === "history" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b">
            <h2 className="font-semibold text-slate-700 text-sm">📋 Historique des transferts ({equipmentTransfers.length})</h2>
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
              {equipmentTransfers.map((t: any) => (
                <tr key={t.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-2 font-medium">{t.equipmentName}</td>
                  <td className="px-4 py-2">{t.siteName}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${t.category==="epi"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                      {t.category==="epi"?"EPI":"Remboursable"}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-bold">{t.qty}</td>
                  <td className="px-4 py-2">{t.unitValue}$</td>
                  <td className="px-4 py-2 text-slate-500">{t.transferredByName || t.transferredBy || "—"}</td>
                </tr>
              ))}
              {equipmentTransfers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Aucun transfert effectué</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* ── Historique Transferts ── */}
      {tab === "historique" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b">
            <h2 className="font-semibold text-slate-700 text-sm">📋 Historique des transferts ({equipmentTransfers.length})</h2>
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
              {equipmentTransfers.map((t: any) => (
                <tr key={t.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString("fr-FR", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </td>
                  <td className="px-4 py-2 font-medium">{t.equipmentName}</td>
                  <td className="px-4 py-2">{t.siteName}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${t.category==="epi"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                      {t.category==="epi"?"EPI":"Remboursable"}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-bold">{t.qty}</td>
                  <td className="px-4 py-2">{t.unitValue}$</td>
                  <td className="px-4 py-2 text-slate-500">{t.transferredByName || t.transferredBy || "—"}</td>
                </tr>
              ))}
              {equipmentTransfers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Aucun transfert enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}