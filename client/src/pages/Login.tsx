import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const [, nav]   = useLocation();

  // Read logo saved in localStorage by Settings
  const logo = (() => {
    try {
      const d = localStorage.getItem("ag_logo_image");
      if (d) return d;
      const v = localStorage.getItem("ag_logo_v3");
      if (v) { const p = JSON.parse(v); if (p.image) return p.image; }
      const s = localStorage.getItem("ag_settings");
      if (s) { const p = JSON.parse(s); if (p.customLogo) return p.customLogo; }
    } catch {}
    return null;
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Veuillez remplir tous les champs"); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie");
      nav("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de connexion");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="px-10 py-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-lg bg-white flex items-center justify-center border border-slate-100">
              {logo
                ? <img src={logo} alt="Armstrong Gate" className="w-full h-full object-cover"/>
                : <span style={{ fontSize: 40, lineHeight: 1 }}>⛏</span>
              }
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-wide">ARMSTRONG GATE</h1>
            <p className="text-slate-400 text-sm mt-1">Gestion d'Exploitation Aurifère</p>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"/>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-slate-400">Connexion</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@goldmine.com"
                disabled={loading}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: "#2563eb" }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin"/>Connexion en cours...</>
                : "Se connecter"
              }
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-slate-300 text-xs mt-8">
            © 2026 ARMSTRONG GATE
          </p>
        </div>
      </div>
    </div>
  );
}
