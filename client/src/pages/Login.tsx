import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/contexts/SettingsContext";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useSettings();
  const [, nav] = useLocation();

  const primaryColor = localStorage.getItem("ag_primaryColor") || "#b8860b";
  // Read logo from shared localStorage key (updated by Settings page)
  const logo = (() => {
    try {
      const direct = localStorage.getItem("ag_logo_image");
      if (direct) return direct;
      const logoData = localStorage.getItem("ag_logo_v3");
      if (logoData) {
        const parsed = JSON.parse(logoData);
        if (parsed.image) return parsed.image;
      }
      return settings.customLogo;
    } catch { return settings.customLogo; }
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Champs obligatoires"); return; }
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
      style={{ background: `linear-gradient(135deg, ${primaryColor}33 0%, ${primaryColor}11 100%)` }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5" style={{ backgroundColor: primaryColor }} />
        <div className="p-8">
          {/* Logo + Name */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 overflow-hidden shadow-md"
              style={logo ? {} : { backgroundColor: primaryColor }}>
              {logo ? <img src={logo} alt="logo" className="w-full h-full object-cover" /> : <span className="text-3xl">⛏</span>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{settings.companyName || "ARMSTRONG GATE"}</h1>
            <p className="text-slate-400 text-sm mt-1">Gestion d'Exploitation Aurifère</p>
          </div>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-slate-400">Connexion</span></div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: primaryColor, color: "#fff" }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Connexion...</> : "Se connecter"}
            </button>
          </form>
          <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-400 space-y-1">
            <p>👑 Admin: admin@goldmine.com / admin123</p>
            <p>👤 Manager: manager@goldmine.com / manager123</p>
          </div>
          <p className="text-center text-slate-300 text-xs mt-4">© 2026 {settings.companyName || "Armstrong Gate"}</p>
        </div>
      </div>
    </div>
  );
}
