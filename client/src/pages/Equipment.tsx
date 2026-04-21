import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sites, teams } from "@/lib/mockData";
import { Plus, Wrench, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import CurrencyDisplay from "@/components/CurrencyDisplay";

interface Equipment {
  id: string;
  name: string;
  type: string;
  siteId: string;
  teamId: string;
  purchaseDate: string;
  purchasePrice: number;
  status: "Opérationnel" | "En maintenance" | "Hors service";
  lastMaintenance: string;
  nextMaintenance: string;
}

const EQUIPMENT_TYPES = [
  "Pioche",
  "Pelle",
  "Pompe",
  "Générateur",
  "Véhicule",
  "Détecteur",
  "Outillage",
  "Autre",
];

const EQUIPMENT_STATUS = [
  { value: "Opérationnel", label: "Opérationnel", color: "bg-green-100 text-green-700" },
  { value: "En maintenance", label: "En maintenance", color: "bg-yellow-100 text-yellow-700" },
  { value: "Hors service", label: "Hors service", color: "bg-red-100 text-red-700" },
];

export default function Equipment() {
  const [equipments, setEquipments] = useState<Equipment[]>([
    {
      id: "eq1",
      name: "Pioche Standard",
      type: "Pioche",
      siteId: sites[0]?.id || "",
      teamId: teams[0]?.id || "",
      purchaseDate: "2023-01-15",
      purchasePrice: 150000,
      status: "Opérationnel",
      lastMaintenance: "2026-03-10",
      nextMaintenance: "2026-04-10",
    },
    {
      id: "eq2",
      name: "Vehicule de Transport",
      type: "Vehicule",
      siteId: sites[1]?.id || "",
      teamId: teams[1]?.id || "",
      purchaseDate: "2022-06-20",
      purchasePrice: 80000,
      status: "Opérationnel",
      lastMaintenance: "2026-02-28",
      nextMaintenance: "2026-03-28",
    },
  ]);

  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Excavatrice",
    siteId: sites[0]?.id || "",
    teamId: teams[0]?.id || "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: 0,
    status: "Opérationnel" as const,
    lastMaintenance: new Date().toISOString().split("T")[0],
    nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  // Filter equipments
  const filteredEquipments = equipments.filter((eq) => {
    const matchesSite = selectedSite === "all" || eq.siteId === selectedSite;
    const matchesStatus = selectedStatus === "all" || eq.status === selectedStatus;
    return matchesSite && matchesStatus;
  });

  // Calculate statistics
  const totalEquipments = equipments.length;
  const operationalCount = equipments.filter((e) => e.status === "Opérationnel").length;
  const maintenanceCount = equipments.filter((e) => e.status === "En maintenance").length;
  const outOfServiceCount = equipments.filter((e) => e.status === "Hors service").length;
  const totalValue = equipments.reduce((sum, e) => sum + e.purchasePrice, 0);

  const handleAddEquipment = () => {
    if (!formData.name || !formData.type) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const newEquipment: Equipment = {
      id: `eq${Date.now()}`,
      ...formData,
    };

    setEquipments([...equipments, newEquipment]);
    toast.success(`Équipement "${formData.name}" ajouté avec succès`);
    setOpenDialog(false);
    setFormData({
      name: "",
      type: "Excavatrice",
      siteId: sites[0]?.id || "",
      teamId: teams[0]?.id || "",
      purchaseDate: new Date().toISOString().split("T")[0],
      purchasePrice: 0,
      status: "Opérationnel",
      lastMaintenance: new Date().toISOString().split("T")[0],
      nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipments(equipments.filter((e) => e.id !== id));
    toast.success("Équipement supprimé");
  };

  const handleUpdateStatus = (id: string, newStatus: Equipment["status"]) => {
    setEquipments(
      equipments.map((e) =>
        e.id === id ? { ...e, status: newStatus } : e
      )
    );
    toast.success("Statut mis à jour");
  };

  const getStatusIcon = (status: Equipment["status"]) => {
    switch (status) {
      case "Opérationnel":
        return <CheckCircle size={16} className="text-green-600" />;
      case "En maintenance":
        return <Clock size={16} className="text-yellow-600" />;
      case "Hors service":
        return <AlertCircle size={16} className="text-red-600" />;
    }
  };

  const getStatusColor = (status: Equipment["status"]) => {
    const statusObj = EQUIPMENT_STATUS.find((s) => s.value === status);
    return statusObj?.color || "";
  };

  const siteTeams = teams.filter((t) => t.siteId === formData.siteId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <ReadOnlyBanner/>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Gestion des Équipements
            </h1>
            <p className="text-slate-600">
              Suivi du parc d'équipements et de la maintenance
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={20} className="mr-2" />
                Ajouter un Équipement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter un Équipement</DialogTitle>
                <DialogDescription>
                  Enregistrez un nouvel équipement dans le parc
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex: Excavatrice CAT 320"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.type} onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="site" className="text-sm font-medium">
                      Site
                    </Label>
                    <Select value={formData.siteId} onValueChange={(value) =>
                      setFormData({ ...formData, siteId: value, teamId: "" })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="team" className="text-sm font-medium">
                      Équipe
                    </Label>
                    <Select value={formData.teamId} onValueChange={(value) =>
                      setFormData({ ...formData, teamId: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {siteTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate" className="text-sm font-medium">
                      Date d'Achat
                    </Label>
                    <input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-sm font-medium">
                      Prix d'Achat (€)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, purchasePrice: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAddEquipment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Total Équipements
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {totalEquipments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Wrench size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Opérationnel
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {operationalCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {((operationalCount / totalEquipments) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  <CheckCircle size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    En Maintenance
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {maintenanceCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {((maintenanceCount / totalEquipments) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
                  <Clock size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Valeur Totale
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {Math.round(totalValue / 1000)}k
                  </p>
                  <p className="text-xs text-slate-500 mt-1">€</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                  <Wrench size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Site
                </label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statut
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {EQUIPMENT_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipments Table */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Équipements ({filteredEquipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Nom
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Site
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Date d'Achat
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Valeur
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Statut
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipments.map((eq) => {
                    const site = sites.find((s) => s.id === eq.siteId);
                    return (
                      <tr key={eq.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {eq.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{eq.type}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {site?.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(eq.purchaseDate).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-900">
                          <CurrencyDisplay amount={eq.purchasePrice / 1000} decimals={0} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(eq.status)}
                            <Select
                              value={eq.status}
                              onValueChange={(value) =>
                                handleUpdateStatus(eq.id, value as Equipment["status"])
                              }
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EQUIPMENT_STATUS.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEquipment(eq.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
