import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination, { usePagination } from "@/components/Pagination";
import { Search } from "lucide-react";

export default function EquipmentStock() {
  const { equipment, equipmentStock, siteStock, equipmentTransfers, transferToSite, sites, load } = useData() as any;
  const { user } = useAuth();

  const [tab, setTab]           = useState<"central"|"sites"|"transfer"|"historique">("central");
  const [transferSiteId, setTransferSiteId] = useState("");
const [transferItems, setTransferItems]   = useState<{equipmentId:string;qty:string}[]>([
  { equipmentId:"", qty:"1" }
]);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");

  // Filtres
  const [searchCentral,   setSearchCentral]   = useState("");
  const [searchSite,      setSearchSite]       = useState("");
  const [searchHistory,   setSearchHistory]   = useState("");
  const [snapshotDate,    setSnapshotDate]     = useState("");
  const [filterSiteId,    setFilterSiteId]     = useState("all");

  useEffect(() => { load?.(); }, []);

  
  const addTransferItem = () => setTransferItems([...transferItems, { equipmentId:"", qty:"1" }]);
  const updateTransferItem = (i: number, field: string, val: string) => {
    const arr = [...transferItems];
    arr[i] = { ...arr[i], [field]: val };
    setTransferItems(arr);
  };
  const removeTransferItem = (i: number) => setTransferItems(transferItems.filter((_, idx) => idx !== i));

  const handleTransfer = async () => {
    const validItems = transferItems.filter(it => it.equipmentId && it.qty);
    if (!validItems.length || !transferSiteId) return;
    const sit = sites.find((s: any) => s.id === transferSiteId);
    if (!sit) return;
    setSaving(true);
    try {
      for (const item of validItems) {
        const eq = equipment.find((e: any) => e.id === item.equipmentId);
        if (!eq) continue;
        if (parseInt(item.qty) > (eq.stockQty || 0)) {
          setSuccess(`❌ Stock insuffisant pour ${eq.name}`);
          setSaving(false);
          return;
        }
        await transferToSite({
          equipmentId:   eq.id,
          equipmentName: eq.name,
          siteId:        sit.id,
          siteName:      sit.name,
          qty:           parseInt(item.qty),
          unitValue:     eq.value || 0,
          category:      eq.category || "remboursable",
        });
      }
      setSuccess(`✅ ${validItems.length} équipement(s) transféré(s) vers ${sit.name}`);
      setTransferItems([{ equipmentId:"", qty:"1" }]);
      setTransferSiteId("");
    } finally { setSaving(false); }
  };

  // Données filtrées
  const centralFiltered = equipmentStock
    .filter((e: any) => (e.stockQty || 0) > 0)
    .filter((e: any) => !searchCentral ||
      e.name?.toLowerCase().includes(searchCentral.toLowerCase()) ||
      e.type?.toLowerCase().includes(searchCentral.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchCentral.toLowerCase())
    );

  const siteStockFiltered = siteStock.filter((ss: any) =>
    (filterSiteId === "all" || ss.siteId === filterSiteId) &&
    (!searchSite ||
      ss.equipmentName?.toLowerCase().includes(searchSite.toLowerCase()) ||
      ss.siteName?.toLowerCase().includes(searchSite.toLowerCase()))
  );

  const historyFiltered = equipmentTransfers.filter((tr: any) =>
    !searchHistory ||
    tr.equipmentName?.toLowerCase().includes(searchHistory.toLowerCase()) ||
    tr.siteName?.toLowerCase().includes(searchHistory.toLowerCase())
  );

  // Pagination
  const centralPag  = usePagination(centralFiltered);
  const sitePag     = usePagination(siteStockFiltered);
  const historyPag  = usePagination(historyFiltered);

  // Snapshot stock à date X
  const snapshotData = snapshotDate
    ? Object.values(
        equipmentTransfers
          .filter((tr: any) => new Date(tr.createdAt) <= new Date(snapshotDate + "T23:59:59"))
          .reduce((acc: any, tr: any) => {
            const key = `${tr.equipmentId}-${tr.siteId}`;
            if (!acc[key]) acc[key] = { name: tr.equipmentName, site: tr.siteName, qty: 0 };
            acc[key].qty += parseFloat(tr.qty) || 0;
            return acc;
          }, {})
      )
    : [];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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

      {/* ── Stock Central ── */}
      {tab === "central" && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchCentral} onChange={e => { setSearchCentral(e.target.value); centralPag.setPage(1); }}
              className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm"
              placeholder="Rechercher équipement, type, catégorie..." />
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b">
              <h2 className="font-semibold text-blue-800 text-sm">Stock Central — {centralFiltered.length} article(s)</h2>
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
                {(centralPag.paginated as any[]).map((eq: any) => (
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
                {centralFiltered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucun stock disponible</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4">
              <Pagination total={centralPag.total} page={centralPag.page} perPage={centralPag.perPage}
                onPageChange={centralPag.setPage} onPerPageChange={centralPag.setPerPage} />
            </div>
          </div>
        </div>
      )}

      {/* ── Stock par Site ── */}
      {tab === "sites" && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchSite} onChange={e => { setSearchSite(e.target.value); sitePag.setPage(1); }}
                className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm"
                placeholder="Rechercher équipement, site..." />
            </div>
            <select value={filterSiteId} onChange={e => { setFilterSiteId(e.target.value); sitePag.setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="all">Tous les sites</option>
              {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-orange-50 border-b">
              <h2 className="font-semibold text-orange-800 text-sm">🏗️ Stock par Site — {siteStockFiltered.length} article(s)</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2">Site</th>
                  <th className="px-4 py-2">Équipement</th>
                  <th className="px-4 py-2">Catégorie</th>
                  <th className="px-4 py-2">Disponible</th>
                  <th className="px-4 py-2">Sur terrain</th>
                  <th className="px-4 py-2">Prix unit.</th>
                </tr>
              </thead>
              <tbody>
                {(sitePag.paginated as any[]).map((item: any) => (
                  <tr key={item.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs text-slate-500">{item.siteName}</td>
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
                {siteStockFiltered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucun stock sur les sites</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4">
              <Pagination total={sitePag.total} page={sitePag.page} perPage={sitePag.perPage}
                onPageChange={sitePag.setPage} onPerPageChange={sitePag.setPerPage} />
            </div>
          </div>
        </div>
      )}

      {/* ── Transfert ── */}
      {tab === "transfer" && (
        <div className="max-w-xl">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold mb-4">Transférer du stock vers un site</h2>
            {success && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${success.startsWith("✅")?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>
                {success}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Site destinataire</label>
                <select value={transferSiteId} onChange={ev => setTransferSiteId(ev.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {sites.map((si: any) => <option key={si.id} value={si.id}>{si.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-2 block font-medium">Équipements à transférer</label>
                {transferItems.map((item, i) => {
                  const eq = equipment.find((e: any) => e.id === item.equipmentId);
                  return (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <select value={item.equipmentId}
                        onChange={ev => updateTransferItem(i, "equipmentId", ev.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm">
                        <option value="">-- Équipement --</option>
                        {equipmentStock.filter((e: any) => (e.stockQty||0) > 0).map((eq: any) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.name} — {eq.category==="epi"?"EPI":"Remboursable"} (stock: {eq.stockQty||0})
                          </option>
                        ))}
                      </select>
                      <input type="number" min="1" max={eq?.stockQty||999}
                        value={item.qty}
                        onChange={ev => updateTransferItem(i, "qty", ev.target.value)}
                        className="w-16 border rounded-lg px-2 py-2 text-sm" />
                      {eq && (
                        <span className="text-xs text-slate-400 whitespace-nowrap">/{eq.stockQty||0}</span>
                      )}
                      {transferItems.length > 1 && (
                        <button onClick={() => removeTransferItem(i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      )}
                    </div>
                  );
                })}
                <button onClick={addTransferItem}
                  className="text-xs text-amber-600 hover:underline mt-1">
                  + Ajouter un équipement
                </button>
              </div>
            </div>
            <button onClick={handleTransfer} disabled={saving||!transferItems[0]?.equipmentId||!transferSiteId}
              className="w-full mt-4 bg-amber-600 text-white py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Transfert en cours..." : `🔄 Transférer ${transferItems.filter(i=>i.equipmentId).length} équipement(s)`}
            </button>
          </div>
        </div>
      )}

      {/* ── Historique ── */}
      {tab === "historique" && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm p-4 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchHistory} onChange={e => { setSearchHistory(e.target.value); historyPag.setPage(1); }}
                className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm"
                placeholder="Rechercher équipement, site..." />
            </div>
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

          {/* Snapshot */}
          {snapshotDate && snapshotData.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 text-sm mb-3">
                📅 Stock transféré jusqu'au {new Date(snapshotDate).toLocaleDateString("fr-FR")}
              </h3>
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-left">
                  <tr>
                    <th className="py-1 pr-4">Équipement</th>
                    <th className="py-1 pr-4">Site</th>
                    <th className="py-1">Qté totale</th>
                  </tr>
                </thead>
                <tbody>
                  {(snapshotData as any[]).map((row: any, i: number) => (
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

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b">
              <h2 className="font-semibold text-slate-700 text-sm">
                📋 Historique des transferts ({historyFiltered.length})
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
                </tr>
              </thead>
              <tbody>
                {(historyPag.paginated as any[]).map((tr: any) => (
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
                  </tr>
                ))}
                {historyFiltered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucun transfert enregistré</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4">
              <Pagination total={historyPag.total} page={historyPag.page} perPage={historyPag.perPage}
                onPageChange={historyPag.setPage} onPerPageChange={historyPag.setPerPage} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}