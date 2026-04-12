import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Lock } from "lucide-react";

export default function Unauthorized() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <Lock className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Accès Refusé</h1>
        <p className="text-slate-300 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            Retour au Tableau de Bord
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-white border-white hover:bg-white/10"
          >
            Se Déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
