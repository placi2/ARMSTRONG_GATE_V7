import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";

function useMoney() {
  const ctx = useSettings();
  const s = ctx.settings as any;
  const fmt = (ctx as any).fmt || (ctx as any).formatAmount || (ctx as any).getFormattedPrice ||
    ((v: number) => { const n = Math.round(v).toLocaleString("fr-FR"); return s?.currency === "CDF" ? `${n} FC` : `$${n}`; });
  const sym = (ctx as any).sym || (ctx as any).currencySymbol || (s?.currency === "CDF" ? "FC" : "$");
  return { fmt, sym };
}

export default function AddAdvanceForm() {
  const [open, setOpen] = useState(false);
  const data = useData() as any;
  const employees = data?.employees || [];
  const teams = data?.teams || [];
  const sites = data?.sites || [];
  const addAdvance = data?.addAdvance;
  const addCashMovement = data?.addCashMovement;
  const updateEmployee = data?.updateEmployee;
  const advances = data?.advances || [];
  const { fmt, sym } = useMoney();

  const [search, setSearch] = useState("");
  const [empId, setEmpId] = useState("");
  const [amount, setAmount] = useState("");
  const [motif, setMotif] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const filtered = useMemo(() =>
    employees.filter((e: any) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.function?.toLowerCase().includes(search.toLowerCase())
    ), [employees, search]
  );

  const selectedEmp = employees.find((e: any) => e.id === empId);
  const currentAdvances = advances.filter((a: any) => a.employeeId === empId).reduce((s: number, a: any) => s + a.amount, 0);
  const baseSalary = selectedEmp?.monthlySalary || selectedEmp?.salary || 0;

  const reset = () => {
    setEmpId(""); setSearch(""); setAmount(""); setMotif("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || !amount) { toast.error("Employé et montant obligatoires"); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Montant invalide"); return; }

    // Add advance
    if (addAdvance) {
      addAdvance({ employeeId: empId, date, amount: amt, motif, status: "Validé" });
    }

    // Update employee totalAdvances
    if (updateEmployee && selectedEmp) {
      updateEmployee(empId, { totalAdvances: (selectedEmp.totalAdvances || 0) + amt });
    }

    // Auto-create cash movement sortie
    if (addCashMovement && selectedEmp) {
      const team = teams.find((t: any) => t.id === selectedEmp.teamId);
      const siteId = team?.siteId || sites[0]?.id || "";
      const site = sites.find((s: any) => s.id === siteId);
      addCashMovement({
        date, type: "sortie", amount: amt, siteId,
        siteName: site?.name || "", category: "Avances salaires",
        paymentMethod: "Espèces",
        comment: `Avance — ${selectedEmp.name} — ${motif || ""}`,
      });
    }

    toast.success(`Avance de ${fmt(amt)} enregistrée pour ${selectedEmp?.name}`);
    reset(); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
          <Plus size={15} className="mr-2" /> Avance Salaire
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader><DialogTitle>Enregistrer une Avance sur Salaire</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">

          {/* Searchable employee */}
          <div>
            <Label>Employé *</Label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher un employé..."
                value={search || (selectedEmp ? selectedEmp.name : "")}
                onChange={e => { setSearch(e.target.value); setEmpId(""); }}
                className="pl-8"
                onFocus={() => setSearch("")}
              />
            </div>
            {/* Dropdown */}
            {search && !empId && (
              <div className="border border-slate-200 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white shadow-lg z-10">
                {filtered.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">Aucun employé trouvé</p>
                ) : filtered.map((emp: any) => (
                  <div key={emp.id}
                    className="p-3 cursor-pointer hover:bg-amber-50 border-b border-slate-50 last:border-0"
                    onClick={() => { setEmpId(emp.id); setSearch(""); }}>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-slate-400">{emp.function || "Employé"} · Salaire: {fmt(emp.monthlySalary || 0)}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Selected emp summary */}
            {selectedEmp && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{selectedEmp.name}</span>
                  <button type="button" onClick={() => { setEmpId(""); setSearch(""); }}
                    className="text-slate-400 hover:text-slate-600 text-xs">× Changer</button>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Salaire base: {fmt(baseSalary)}</span>
                  <span>Avances actuelles: {fmt(currentAdvances)}</span>
                  <span>Net restant: {fmt(baseSalary - currentAdvances)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Montant ({sym}) *</Label>
              <Input type="number" step="0.01" min="0" value={amount}
                onChange={e => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Motif</Label>
            <Input placeholder="Raison de l'avance..." value={motif}
              onChange={e => setMotif(e.target.value)} className="mt-1" />
          </div>

          <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-500">
            ℹ️ Une sortie caisse sera automatiquement créée pour cette avance.
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              Enregistrer l'Avance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
