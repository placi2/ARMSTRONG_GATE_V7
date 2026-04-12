import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

const FUNCTIONS = [
  "Chef d'équipe",
  "Opérateur",
  "Mécanicien",
  "Superviseur",
  "Ouvrier",
];

const ROLES = ["Admin", "Manager", "User"];

export default function AddEmployeeForm() {
  const [open, setOpen] = useState(false);
  const { teams, addEmployee } = useData();
  const [formData, setFormData] = useState({
    name: "",
    teamId: "",
    function: "",
    role: "User",
    monthlySalary: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.teamId ||
      !formData.function ||
      !formData.monthlySalary
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const salary = parseFloat(formData.monthlySalary);
    if (salary <= 0) {
      toast.error("Le salaire doit être supérieur à 0");
      return;
    }

    const team = teams.find((t) => t.id === formData.teamId);
    addEmployee({ name: formData.name, teamId: formData.teamId, function: formData.function, role: formData.role, monthlySalary: parseFloat(formData.monthlySalary)||0, salary: parseFloat(formData.monthlySalary)||0, status: "actif" });
    toast.success(
      `Employé "${formData.name}" créé dans l'équipe ${team?.name}`
    );
    setFormData({
      name: "",
      teamId: "",
      function: "",
      role: "User",
      monthlySalary: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus size={20} className="mr-2" />
          Ajouter un Employé
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un Nouvel Employé</DialogTitle>
          <DialogDescription>
            Saisissez les informations du nouvel employé
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Name */}
          <div className="space-y-2">
            <Label htmlFor="emp-name" className="text-sm font-medium">
              Nom Complet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emp-name"
              placeholder="Ex: Jean Dupont"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <Label htmlFor="emp-team" className="text-sm font-medium">
              Équipe <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.teamId}
              onValueChange={(value) => setFormData({ ...formData, teamId: value })}
            >
              <SelectTrigger id="emp-team">
                <SelectValue placeholder="Sélectionnez une équipe" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Function */}
          <div className="space-y-2">
            <Label htmlFor="emp-function" className="text-sm font-medium">
              Fonction <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.function}
              onValueChange={(value) => setFormData({ ...formData, function: value })}
            >
              <SelectTrigger id="emp-function">
                <SelectValue placeholder="Sélectionnez une fonction" />
              </SelectTrigger>
              <SelectContent>
                {FUNCTIONS.map((func) => (
                  <SelectItem key={func} value={func}>
                    {func}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="emp-role" className="text-sm font-medium">
              Rôle
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger id="emp-role">
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Salary */}
          <div className="space-y-2">
            <Label htmlFor="emp-salary" className="text-sm font-medium">
              Salaire Mensuel (€) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emp-salary"
              type="number"
              step="0.01"
              placeholder="Ex: 1500"
              value={formData.monthlySalary}
              onChange={(e) =>
                setFormData({ ...formData, monthlySalary: e.target.value })
              }
              className="w-full"
            />
          </div>

          {/* Salary Display */}
          {formData.monthlySalary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Salaire mensuel:</span>{" "}
                <span className="font-bold">
                  {parseFloat(formData.monthlySalary).toLocaleString("fr-FR")}€
                </span>
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600">
              Créer l'Employé
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
