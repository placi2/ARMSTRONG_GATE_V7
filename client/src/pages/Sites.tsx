import DashboardLayout from "@/components/DashboardLayout";
import RbacGuard, { ReadOnlyBanner } from "@/components/RbacGuard";
import { useRbac } from "@/hooks/useRbac";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddSiteForm from "@/components/AddSiteForm";
import EditSiteForm from "@/components/EditSiteForm";
import DeleteSiteButton from "@/components/DeleteSiteButton";
import { calculateSiteMetrics } from "@/lib/mockData";
import { useData } from "@/contexts/DataContext";
import { MapPin, Users, TrendingUp, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Sites() {
  const { sites, teams } = useData();
  const siteMetrics = sites.map((site) => ({
    ...site,
    ...calculateSiteMetrics(site.id),
    teamCount: teams.filter((t) => t.siteId === site.id).length,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Gestion des Sites
            </h1>
            <p className="text-slate-600">
              Suivi de tous les sites d'exploitation
            </p>
          </div>
          <AddSiteForm />
        </div>

        {/* Sites Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {siteMetrics.map((site) => (
            <Card key={site.id} className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-slate-900">
                      {site.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={16} />
                      {site.location}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      site.status === "Rentable"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {site.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Production</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {site.totalProduction}
                    </p>
                    <p className="text-xs text-slate-500">grammes</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Valeur</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {Math.round(site.totalValue / 1000)}k
                    </p>
                    <p className="text-xs text-slate-500">€</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Dépenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Math.round(site.totalExpenses / 1000)}k
                    </p>
                    <p className="text-xs text-slate-500">€</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Résultat Net</p>
                    <p
                      className={`text-2xl font-bold ${
                        site.netResult > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {Math.round(site.netResult / 1000)}k
                    </p>
                    <p className="text-xs text-slate-500">€</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-900">
                      Rentabilité
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {site.profitability.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        site.profitability > 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(site.profitability, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    <span className="text-sm text-blue-900">
                      {site.teamCount} équipe{site.teamCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <Link href={`/site/${site.id}`}>
                    <a className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      Détails <ExternalLink size={14} />
                    </a>
                  </Link>
                </div>

                <div className="text-xs text-slate-500 mb-3">
                  <p>Responsable: {site.manager}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <EditSiteForm
                    siteId={site.id}
                    siteName={site.name}
                    location={site.location}
                    manager={site.manager || ""}
                  />
                  <DeleteSiteButton siteId={site.id} siteName={site.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Nombre de Sites"
            value={sites.length}
            icon={<MapPin size={24} />}
          />
          <StatCard
            title="Total Équipes"
            value={teams.length}
            icon={<Users size={24} />}
          />
          <StatCard
            title="Production Globale"
            value={siteMetrics.reduce((sum, s) => sum + s.totalProduction, 0)}
            unit="g"
            icon={<TrendingUp size={24} />}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
