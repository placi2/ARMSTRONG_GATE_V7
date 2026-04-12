import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, DollarSign, Palette, Users, Settings as SettingsIcon } from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────
const THEME_PRESETS = [
  {label:"Or/Noir",  color:"#b8860b"},
  {label:"Bleu",     color:"#2563eb"},
  {label:"Vert",     color:"#16a34a"},
  {label:"Rouge",    color:"#dc2626"},
  {label:"Violet",   color:"#7c3aed"},
  {label:"Ardoise",  color:"#475569"},
];

// ── AddUserDialog — standalone, no form submit ─────────────────────────────
function AddUserDialog() {
  const { allSites: sites, appUsers, addAppUser } = useData();
  const [open, setOpen] = useState(false);

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<"admin"|"manager">("manager");
  const [siteId,   setSiteId]   = useState("");

  const reset = () => { setName(""); setEmail(""); setPassword(""); setRole("manager"); setSiteId(""); };

  // Sites still available (no manager yet)
  const freeSites = (sites||[]).filter(s => {
    if (s.id === "S001") return false; // builtin manager owns S001
    return !(appUsers||[]).some(u => u.role==="manager" && u.siteId===s.id);
  });

  const handleCreate = () => {
    // ── Validation ──────────────────────────────────────────────────────
    if (!name.trim())     { toast.error("Nom obligatoire");             return; }
    if (!email.trim())    { toast.error("Email obligatoire");           return; }
    if (!password.trim()) { toast.error("Mot de passe obligatoire");    return; }
    if (role==="manager" && !siteId) { toast.error("Site obligatoire pour un manager"); return; }

    // Email uniqueness
    const taken = ["admin@goldmine.com","manager@goldmine.com",
      ...(appUsers||[]).map(u=>u.email.toLowerCase())];
    if (taken.includes(email.toLowerCase().trim())) {
      toast.error("Cet email est déjà utilisé"); return;
    }

    // One manager per site
    if (role==="manager" && siteId) {
      const conflict = (appUsers||[]).find(u=>u.role==="manager" && u.siteId===siteId);
      if (conflict || siteId==="S001") {
        const sn = (sites||[]).find(s=>s.id===siteId)?.name || siteId;
        toast.error(`"${sn}" a déjà un manager. Supprimez-le d'abord.`); return;
      }
    }

    // ── Create ──────────────────────────────────────────────────────────
    addAppUser({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: password.trim(),
      role,
      siteId:   role==="manager" ? siteId : undefined,
    });

    toast.success(`✅ Compte créé ! Identifiants: ${email.toLowerCase().trim()} / ${password.trim()}`);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={v=>{ setOpen(v); if(!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={14} className="mr-1"/> Ajouter Utilisateur
        </Button>
      </DialogTrigger>

      {/* onPointerDownOutside prevents accidental close when clicking inside */}
      <DialogContent className="sm:max-w-[420px]" onPointerDownOutside={e=>e.preventDefault()}>
        <DialogHeader><DialogTitle>Créer un Utilisateur</DialogTitle></DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label>Nom complet *</Label>
            <Input value={name} onChange={e=>setName(e.target.value)} className="mt-1" placeholder="Ex: Jean Dupont"/>
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1" placeholder="jean@exemple.com"/>
          </div>
          <div>
            <Label>Mot de passe *</Label>
            <Input type="text" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1" placeholder="Ex: motdepasse123"/>
            <p className="text-xs text-slate-400 mt-0.5">Affiché en clair pour communication</p>
          </div>
          <div>
            <Label>Rôle</Label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
              value={role} onChange={e=>{setRole(e.target.value as any); setSiteId("");}}>
              <option value="admin">👑 Admin — Accès complet</option>
              <option value="manager">👤 Manager — Accès limité à un site</option>
            </select>
          </div>

          {role==="manager" && (
            <div>
              <Label>Site assigné *</Label>
              {freeSites.length===0 ? (
                <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  ⚠️ Tous les sites ont déjà un manager. Supprimez-en un pour créer un nouveau manager.
                </div>
              ) : (
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
                  value={siteId} onChange={e=>setSiteId(e.target.value)}>
                  <option value="">Sélectionner un site...</option>
                  {freeSites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              <p className="text-xs text-slate-400 mt-0.5">Seuls les sites sans manager sont listés</p>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="outline" onClick={()=>{reset();setOpen(false);}} className="flex-1">
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={role==="manager" && freeSites.length===0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
              ✓ Créer le compte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Settings page ──────────────────────────────────────────────────────────
export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { allSites: sites, appUsers, deleteAppUser } = useData();
  const { user } = useAuth();

  const [goldPrice,     setGoldPrice]     = useState(String(settings.goldPriceUsd));
  const [exchangeRate,  setExchangeRate]  = useState(String(settings.exchangeRateCdf));
  const [currency,      setCurrency]      = useState(settings.currency);
  const [companyName,   setCompanyName]   = useState(settings.companyName||"");
  const [primaryColor,  setPrimaryColor]  = useState(()=>localStorage.getItem("ag_primaryColor")||"#b8860b");

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-400">
          <SettingsIcon size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="font-medium">Accès réservé aux administrateurs</p>
        </div>
      </DashboardLayout>
    );
  }

  const savePrices = () => {
    const p=parseFloat(goldPrice), r=parseFloat(exchangeRate);
    if(isNaN(p)||p<=0) { toast.error("Prix or invalide"); return; }
    if(isNaN(r)||r<=0) { toast.error("Taux de change invalide"); return; }
    updateSettings({ goldPriceUsd:p, goldPrice:p, exchangeRateCdf:r, exchangeRate:r, currency, companyName });
    toast.success("Paramètres sauvegardés ✓");
  };

  const applyTheme = (color:string) => {
    setPrimaryColor(color);
    localStorage.setItem("ag_primaryColor", color);
    toast.success("Thème appliqué — rechargement dans 1s…");
    setTimeout(()=>window.location.reload(), 900);
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    if(file.size > 2*1024*1024) { toast.error("Image trop grande (max 2 Mo)"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      updateSettings({ customLogo: b64 });
      // Also save to shared key so Login page reads it without context
      try {
        localStorage.setItem("ag_logo_image", b64);
        localStorage.setItem("ag_logo_v3", JSON.stringify({ image: b64 }));
      } catch {}
      toast.success("Logo mis à jour ✓");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    updateSettings({ customLogo: null });
    try { localStorage.removeItem("ag_logo_image"); localStorage.removeItem("ag_logo_v3"); } catch {}
    toast.success("Logo supprimé");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres de l'Application</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Prices & currency ── */}
          <Card className="bg-white">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign size={18} className="text-amber-500"/>Prix & Devise</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom de l'entreprise</Label>
                <Input value={companyName} onChange={e=>setCompanyName(e.target.value)} className="mt-1"/>
              </div>
              <div>
                <Label>Devise d'affichage</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={currency} onChange={e=>setCurrency(e.target.value as any)}>
                  <option value="USD">$ Dollar américain (USD)</option>
                  <option value="CDF">FC Franc congolais (CDF)</option>
                </select>
              </div>
              <div>
                <Label>Prix de l'or ($/g) — verrouillé dans Production</Label>
                <Input type="number" step="0.01" value={goldPrice} onChange={e=>setGoldPrice(e.target.value)} className="mt-1"/>
              </div>
              <div>
                <Label>Taux de change (1 USD = X FC)</Label>
                <Input type="number" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)} className="mt-1"/>
                <p className="text-xs text-slate-400 mt-1">Actuel : 1 USD = {settings.exchangeRateCdf} FC</p>
              </div>
              <Button onClick={savePrices} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                Sauvegarder les prix
              </Button>
            </CardContent>
          </Card>

          {/* ── Theme & logo ── */}
          <Card className="bg-white">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette size={18} className="text-amber-500"/>Apparence</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Logo de l'entreprise</Label>
                {settings.customLogo && (
                  <div className="mb-2 flex items-center gap-3">
                    <img src={settings.customLogo} alt="logo" className="w-14 h-14 object-cover rounded-lg border"/>
                    <Button variant="outline" size="sm" onClick={removeLogo} className="text-red-600 hover:bg-red-50">Supprimer</Button>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogo}
                  className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-medium cursor-pointer"/>
                <p className="text-xs text-slate-400 mt-1">Formats: PNG, JPG, SVG · Max 2 Mo · Visible sur la page de connexion</p>
              </div>
              <div>
                <Label className="mb-2 block">Couleur principale</Label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_PRESETS.map(p=>(
                    <button key={p.color} onClick={()=>applyTheme(p.color)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 text-sm transition-all ${primaryColor===p.color?"shadow-md":"border-slate-200 hover:border-slate-300"}`}
                      style={primaryColor===p.color?{borderColor:p.color,backgroundColor:p.color+"18"}:{}}>
                      <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{backgroundColor:p.color}}/>
                      <span className="text-xs font-medium">{p.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <input type="color" value={primaryColor} onChange={e=>{setPrimaryColor(e.target.value);localStorage.setItem("ag_primaryColor",e.target.value);}}
                    className="w-10 h-10 rounded-lg border cursor-pointer"/>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Couleur personnalisée</p>
                    <p className="text-xs text-slate-400 font-mono">{primaryColor}</p>
                  </div>
                  <Button size="sm" onClick={()=>applyTheme(primaryColor)}>Appliquer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── User management ── */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={18} className="text-blue-500"/>
                Gestion des Utilisateurs ({1 + 1 + (appUsers?.length||0)} comptes)
              </CardTitle>
              <AddUserDialog/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-400 mb-3 bg-slate-50 rounded p-2 space-y-0.5">
              <p>👑 <strong>Admin</strong> : accès total, tous les sites, tous les onglets</p>
              <p>👤 <strong>Manager</strong> : accès limité à son site uniquement</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b"><tr>
                  {["Nom","Email","Rôle","Site assigné","Créé le","Actions"].map(h=>(
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {/* Builtin users */}
                  {[
                    {id:"__bi1",name:"Admin User",    email:"admin@goldmine.com",   role:"admin",   siteId:undefined,  createdAt:"Builtin"},
                    {id:"__bi2",name:"Manager Site 1",email:"manager@goldmine.com", role:"manager", siteId:"S001",     createdAt:"Builtin"},
                    ...(appUsers||[]),
                  ].map((u:any)=>(
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium">{u.name}</td>
                      <td className="py-2 px-3 text-slate-500 text-xs">{u.email}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role==="admin"?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700"}`}>
                          {u.role==="admin"?"👑 Admin":"👤 Manager"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {u.siteId ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            🏭 {(sites||[]).find((s:any)=>s.id===u.siteId)?.name || u.siteId}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">🌍 Tous</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-400">{u.createdAt}</td>
                      <td className="py-2 px-3">
                        {!u.id.startsWith("__") && (
                          <button onClick={()=>{deleteAppUser(u.id);toast.success("Utilisateur supprimé");}}
                            className="text-red-400 hover:text-red-600 transition-colors" title="Supprimer">
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
