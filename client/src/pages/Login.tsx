import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLogo } from "@/contexts/LogoContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { logoEmoji, logoColor } = useLogo();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de connexion"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${logoColor} rounded-lg mb-4`}>
            <span className="text-3xl">{logoEmoji}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AMSTRONG GATE</h1>
          <p className="text-slate-400">Gestion d'Exploitation Aurifère</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-900">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@goldmine.com"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-900">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>


          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Application de gestion d'exploitation aurifère
        </p>
      </div>
    </div>
  );
}
