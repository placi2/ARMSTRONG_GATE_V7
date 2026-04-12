import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Pagination, { usePagination } from "@/components/Pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { Search, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

function useMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const goldPrice = s?.goldPriceUsd || s?.goldPrice || 65;
  return { fmt, goldPrice };
}

export default function TransactionHistory() {
  const data = useData() as any;
  const productions = data?.productions || [];
  const expenses = data?.expenses || [];
  const cashMovements = data?.cashMovements || [];
  const advances = data?.advances || [];
  const teams = data?.teams || [];
  const sites = data?.sites || [];
  const employees = data?.employees || [];
  const deleteProduction = data?.deleteProduction;
  const deleteExpense = data?.deleteExpense;
  const deleteCashMovement = data?.deleteCashMovement;
  const deleteAdvance = data?.deleteAdvance;

  const { fmt, goldPrice } = useMoney();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSite, setFilterSite] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Merge all transactions
  const allTransactions = useMemo(() => {
    const list: any[] = [];
    productions.forEach((p: any) => {
      const team = teams.find((t: any) => t.id === p.teamId);
      const site = sites.find((s: any) => s.id === (p.siteId || team?.siteId));
      const val = (p.weight || 0) * (p.pricePerGram || goldPrice);
      list.push({
        id: p.id, type: "production", date: p.date,
        label: `Production — ${(p.weight || 0).toFixed(1)}g`,
        amount: val, teamName: team?.name || "—", siteName: site?.name || "—",
        siteId: site?.id || "", teamId: p.teamId,
        color: "text-green-600", badge: "bg-green-100 text-green-700",
        canDelete: user?.role === "admin",
        onDelete: () => deleteProduction?.(p.id),
      });
    });
    expenses.forEach((e: any) => {
      const team = teams.find((t: any) => t.id === e.teamId);
      const site = sites.find((s: any) => s.id === (e.siteId || team?.siteId));
      list.push({
        id: e.id, type: "expense", date: e.date,
        label: `Dépense — ${e.category}`,
        amount: -e.amount, teamName: team?.name || "—", siteName: site?.name || "—",
        siteId: site?.id || "", teamId: e.teamId,
        color: "text-red-600", badge: "bg-red-100 text-red-700",
        comment: e.comment || "",
        canDelete: user?.role === "admin",
        onDelete: () => deleteExpense?.(e.id),
      });
    });
    cashMovements.forEach((m: any) => {
      const site = sites.find((s: any) => s.id === m.siteId);
      const isIn = m.type === "entrée";
      list.push({
        id: m.id, type: "cash", date: m.date,
        label: `Caisse ${m.type} — ${m.category || ""}`,
        amount: isIn ? m.amount : -m.amount,
        teamName: "—", siteName: site?.name || m.siteName || "—",
        siteId: m.siteId || "", teamId: "",
        color: isIn ? "text-blue-600" : "text-orange-600",
        badge: isIn ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700",
        comment: m.comment || "",
        canDelete: user?.role === "admin",
        onDelete: () => deleteCashMovement?.(m.id),
      });
    });
    advances.forEach((a: any) => {
      const emp = employees.find((e: any) => e.id === a.employeeId);
      const team = teams.find((t: any) => t.id === emp?.teamId);
      const site = sites.find((s: any) => s.id === team?.siteId);
      list.push({
        id: a.id, type: "advance", date: a.date,
        label: `Avance — ${emp?.name || "Employé"}`,
        amount: -a.amount,
        teamName: team?.name || "—", siteName: site?.name || "—",
        siteId: site?.id || "", teamId: team?.id || "",
        color: "text-amber-600", badge: "bg-amber-100 text-amber-700",
        comment: a.motif || "",
        canDelete: user?.role === "admin",
        onDelete: () => deleteAdvance?.(a.id),
      });
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [productions, expenses, cashMovements, advances, teams, sites, employees, goldPrice, user?.role]);

  const filtered = allTransactions.filter(tx => {
    const ms = !search || tx.label.toLowerCase().includes(search.toLowerCase()) ||
      tx.teamName.toLowerCase().includes(search.toLowerCase()) ||
      tx.siteName.toLowerCase().includes(search.toLowerCase()) ||
      (tx.comment || "").toLowerCase().includes(search.toLowerCase());
    const mt = filterType === "all" || tx.type === filterType;
    const mSite = filterSite === "all" || tx.siteId === filterSite;
    const mTeam = filterTeam === "all" || tx.teamId === filterTeam;
    const mFrom = !dateFrom || tx.date >= dateFrom;
    const mTo = !dateTo || tx.date <= dateTo;
    return ms && mt && mSite && mTeam && mFrom && mTo;
  });

  const { page, perPage, paginated, total, setPage, setPerPage } = usePagination(filtered);

  const totalIn = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const handleExport = () => {
    const lines = [
      "Date,Type,Libellé,Équipe,Site,Montant,Commentaire",
      ...filtered.map(tx => `${tx.date},${tx.type},"${tx.label}","${tx.teamName}","${tx.siteName}",${tx.amount},"${tx.comment || ""}"`)
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "historique.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé !");
  };

  const handleClearAll = () => {
    // Delete all transactions
    productions.forEach((p: any) => deleteProduction?.(p.id));
    expenses.forEach((e: any) => deleteExpense?.(e.id));
    cashMovements.forEach((m: any) => deleteCashMovement?.(m.id));
    advances.forEach((a: any) => deleteAdvance?.(a.id));
    toast.success("Toutes les données ont été supprimées");
    setShowClearDialog(false);
  };

  const TYPE_LABELS: Record<string, string> = {
    production: "⚖️ Production",
    expense: "💸 Dépense",
    cash: "🏦 Caisse",
    advance: "💰 Avance",
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Historique des Transactions</h1>
            <p className="text-slate-500 text-sm">{allTransactions.length} transaction(s) au total</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download size={14} className="mr-2" /> Exporter CSV
            </Button>
            {user?.role === "admin" && (
              <Button onClick={() => setShowClearDialog(true)} variant="outline" size="sm"
                className="text-red-600 hover:bg-red-50 border-red-200">
                <Trash2 size={14} className="mr-2" /> Vider l'historique
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Entrées (filtrées)", v: fmt(totalIn), c: "text-green-600" },
            { l: "Sorties (filtrées)", v: fmt(totalOut), c: "text-red-600" },
            { l: "Solde net", v: fmt(totalIn - totalOut), c: totalIn - totalOut >= 0 ? "text-blue-600" : "text-red-600" },
          ].map(s => (
            <Card key={s.l} className="bg-white">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-400">{s.l}</p>
                <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous types</option>
            <option value="production">Productions</option>
            <option value="expense">Dépenses</option>
            <option value="cash">Caisse</option>
            <option value="advance">Avances</option>
          </select>
          <select value={filterSite} onChange={e => { setFilterSite(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Tous les sites</option>
            {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterTeam} onChange={e => { setFilterTeam(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="all">Toutes équipes</option>
            {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
          {(search || filterType !== "all" || filterSite !== "all" || filterTeam !== "all" || dateFrom || dateTo) && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterType("all"); setFilterSite("all"); setFilterTeam("all"); setDateFrom(""); setDateTo(""); setPage(1); }}>
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">
              Transactions <span className="text-sm font-normal text-slate-400">({filtered.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    {["Date","Type","Libellé","Équipe","Site","Montant","Commentaire",""].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-slate-400">Aucune transaction trouvée</td></tr>
                  ) : paginated.map(tx => (
                    <tr key={`${tx.type}-${tx.id}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 whitespace-nowrap">{tx.date}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tx.badge}`}>
                          {TYPE_LABELS[tx.type] || tx.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{tx.label}</td>
                      <td className="py-2 px-3 text-xs text-slate-400">{tx.teamName}</td>
                      <td className="py-2 px-3 text-xs text-slate-400">{tx.siteName}</td>
                      <td className={`py-2 px-3 font-bold whitespace-nowrap ${tx.color}`}>
                        {tx.amount >= 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-400 max-w-24 truncate">{tx.comment || "—"}</td>
                      <td className="py-2 px-3">
                        {tx.canDelete && (
                          <button onClick={() => { tx.onDelete(); toast.success("Supprimé"); }}
                            className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />
          </CardContent>
        </Card>
      </div>

      {/* Clear all dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Vider tout l'historique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement <strong>toutes les productions, dépenses, mouvements de caisse et avances</strong>.
              Cette action est <strong>irréversible</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
              Oui, tout supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
