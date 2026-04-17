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
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, DollarSign, Palette, Users, Settings as SI } from "lucide-react";

const THEME_PRESETS = [
  {label:"Or",    color:"#b8860b"},{label:"Bleu",   color:"#2563eb"},
  {label:"Vert",  color:"#16a34a"},{label:"Rouge",  color:"#dc2626"},
  {label:"Violet",color:"#7c3aed"},{label:"Ardoise",color:"#475569"},
];

// Roles that need a siteId
const SITE_ROLES: UserRole[] = ["directeur"];
// Roles that need a teamId
const TEAM_ROLES: UserRole[] = ["chef_equipe"];

function AddUserDialog() {
  const { allSites: sites, allTeams: teams, appUsers, addAppUser } = useData();
  const [open, setOpen] = useState(false);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<UserRole>("directeur");
  const [siteId,   setSiteId]   = useState("");
  const [teamId,   setTeamId]   = useState("");

  const reset = () => { setName(""); setEmail(""); setPassword(""); setRole("directeur"); setSiteId(""); setTeamId(""); };

  const needsSite = SITE_ROLES.includes(role);
  const needsTeam = TEAM_ROLES.includes(role);

  // Sites without a directeur already
  const freeSites = sites.filter(s => {
    if (s.id === "S001") return false; // builtin manager@goldmine.com
    return !(appUsers||[]).some(u => u.role==="directeur" && u.siteId===s.id);
  });

  // Teams for selected site
  const teamsForSite = siteId ? teams.filter(t => t.siteId === siteId) : teams;

  const handleCreate = () => {
    if (!name.trim())     { toast.error("Nom obligatoire");           return; }
    if (!email.trim())    { toast.error("Email obligatoire");         return; }
    if (!password.trim()) { toast.error("Mot de passe obligatoire");  return; }
    if (needsSite && !siteId) { toast.error("Site obligatoire pour ce rôle"); return; }
    if (needsTeam && !teamId) { toast.error("Équipe obligatoire pour Chef d'Équipe"); return; }

    // Email uniqueness
    const taken = ["admin@goldmine.com","manager@goldmine.com",...(appUsers||[]).map(u=>u.email.toLowerCase())];
    if (taken.includes(email.toLowerCase().trim())) { toast.error("Email déjà utilisé"); return; }

    // One directeur per site
    if (role==="directeur" && siteId) {
      const conflict=(appUsers||[]).find(u=>u.role==="directeur"&&u.siteId===siteId);
      if(conflict||siteId==="S001"){toast.error("Ce site a déjà un Directeur. Supprimez-le d'abord.");return;}
    }

    addAppUser({ name:name.trim(), email:email.toLowerCase().trim(), password:password.trim(),
      role, siteId:needsSite?siteId:undefined, teamId:needsTeam?teamId:undefined });
    toast.success(`✅ Compte "${name.trim()}" créé ! Identifiants: ${email.toLowerCase().trim()} / ${password.trim()}`);
    reset(); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={v=>{setOpen(v);if(!v)reset();}}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus size={14} className="mr-1"/>Ajouter Utilisateur</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]" onPointerDownOutside={e=>e.preventDefault()}>
        <DialogHeader><DialogTitle>Créer un Utilisateur</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label>Nom complet *</Label><Input value={name} onChange={e=>setName(e.target.value)} className="mt-1" placeholder="Ex: Jean Dupont"/></div>
          <div><Label>Email *</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1" placeholder="jean@exemple.com"/></div>
          <div><Label>Mot de passe *</Label><Input type="text" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1" placeholder="Ex: motdepasse123"/>
            <p className="text-xs text-slate-400 mt-0.5">Noté en clair pour communication</p>
          </div>
          <div>
            <Label>Rôle *</Label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"
              value={role} onChange={e=>{setRole(e.target.value as UserRole);setSiteId("");setTeamId("");}}>
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r,l])=>(
                <option key={r} value={r}>{l}</option>
              ))}
            </select>
            {/* Role description */}
            <div className="mt-1.5 p-2 bg-slate-50 rounded text-xs text-slate-500">
              {role==="pdg"         && "Accès total à tous les sites, toutes les données, gestion des utilisateurs."}
              {role==="directeur"   && "Accès complet limité à son site uniquement. Gère les opérations locales."}
              {role==="rh"          && "Gestion des employés, pointage et salaires uniquement. Pas accès aux finances."}
              {role==="finance"     && "Résultats financiers, caisse et dépenses. Pas accès aux RH ni équipements."}
              {role==="chef_equipe" && "Saisie de production et présences pour son équipe uniquement."}
              {role==="equipements" && "Gestion complète du parc matériel. Pas accès aux salaires ni finances."}
              {role==="logistique"  && "Production (lecture), véhicules, dépenses transport entre sites."}
              {role==="auditeur"    && "Lecture seule sur tout. Aucune modification possible."}
            </div>
          </div>

          {needsSite && (
            <div>
              <Label>Site assigné *</Label>
              {freeSites.length===0 ? (
                <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  ⚠️ Tous les sites ont déjà un Directeur.
                </div>
              ) : (
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={siteId} onChange={e=>setSiteId(e.target.value)}>
                  <option value="">Sélectionner un site...</option>
                  {freeSites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
          )}

          {needsTeam && (
            <>
              <div>
                <Label>Site (pour filtrer les équipes)</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={siteId} onChange={e=>{setSiteId(e.target.value);setTeamId("");}}>
                  <option value="">Tous les sites</option>
                  {sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Équipe assignée *</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={teamId} onChange={e=>setTeamId(e.target.value)}>
                  <option value="">Sélectionner une équipe...</option>
                  {teamsForSite.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={()=>{reset();setOpen(false);}} className="flex-1">Annuler</Button>
            <Button type="button" onClick={handleCreate}
              disabled={needsSite&&freeSites.length===0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
              ✓ Créer le compte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { allSites:sites, allTeams:teams, appUsers, deleteAppUser } = useData();
  const { user } = useAuth();

  const [goldPrice,    setGoldPrice]    = useState(String(settings.goldPriceUsd));
  const [exchangeRate, setExchangeRate] = useState(String(settings.exchangeRateCdf));
  const [currency,     setCurrency]     = useState(settings.currency);
  const [companyName,  setCompanyName]  = useState(settings.companyName||"");
  const [primaryColor, setPrimaryColor] = useState(()=>localStorage.getItem("ag_primaryColor")||"#b8860b");

  if (user?.role !== "pdg") {
    return <DashboardLayout><div className="text-center py-20 text-slate-400"><SI size={48} className="mx-auto mb-4 opacity-30"/><p>Accès réservé au PDG / Propriétaire</p></div></DashboardLayout>;
  }

  const savePrices = () => {
    const p=parseFloat(goldPrice), r=parseFloat(exchangeRate);
    if(isNaN(p)||p<=0){toast.error("Prix or invalide");return;}
    if(isNaN(r)||r<=0){toast.error("Taux invalide");return;}
    updateSettings({goldPriceUsd:p,goldPrice:p,exchangeRateCdf:r,exchangeRate:r,currency,companyName});
    toast.success("Paramètres sauvegardés ✓");
  };

  const applyTheme=(color:string)=>{
    setPrimaryColor(color);localStorage.setItem("ag_primaryColor",color);
    toast.success("Thème appliqué — rechargement...");
    setTimeout(()=>window.location.reload(),900);
  };

  const handleLogo=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>2*1024*1024){toast.error("Max 2 Mo");return;}
    const reader=new FileReader();
    reader.onload=ev=>{
      const b64=ev.target?.result as string;
      updateSettings({customLogo:b64});
      try{localStorage.setItem("ag_logo_image",b64);localStorage.setItem("ag_logo_v3",JSON.stringify({image:b64}));}catch{}
      toast.success("Logo mis à jour ✓");
    };
    reader.readAsDataURL(file);
  };

  // All users to display
  const allDisplayUsers = [
    {id:"__b1",name:"Admin PDG",      email:"admin@goldmine.com",   role:"pdg"       as UserRole, siteId:undefined, teamId:undefined, createdAt:"Builtin"},
    {id:"__b2",name:"Manager Site 1", email:"manager@goldmine.com", role:"directeur" as UserRole, siteId:"S001",    teamId:undefined, createdAt:"Builtin"},
    ...(appUsers||[]),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prices */}
          <Card className="bg-white">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign size={18} className="text-amber-500"/>Prix & Devise</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom de l'entreprise</Label><Input value={companyName} onChange={e=>setCompanyName(e.target.value)} className="mt-1"/></div>
              <div><Label>Devise</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1" value={currency} onChange={e=>setCurrency(e.target.value as any)}>
                  <option value="USD">$ Dollar (USD)</option><option value="CDF">FC Franc Congolais (CDF)</option>
                </select>
              </div>
              <div><Label>Prix or ($/g)</Label><Input type="number" step="0.01" value={goldPrice} onChange={e=>setGoldPrice(e.target.value)} className="mt-1"/></div>
              <div><Label>1 USD = X FC</Label><Input type="number" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)} className="mt-1"/>
                <p className="text-xs text-slate-400 mt-1">Actuel: 1 USD = {settings.exchangeRateCdf} FC</p>
              </div>
              <Button onClick={savePrices} className="w-full bg-amber-500 hover:bg-amber-600 text-white">Sauvegarder</Button>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card className="bg-white">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette size={18} className="text-amber-500"/>Apparence</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Logo</Label>
                {settings.customLogo&&<div className="mb-2 flex gap-3 items-center"><img src={settings.customLogo} className="w-14 h-14 object-cover rounded-lg border" alt="logo"/><Button variant="outline" size="sm" onClick={()=>{updateSettings({customLogo:null});try{localStorage.removeItem("ag_logo_image");}catch{}}} className="text-red-600">Supprimer</Button></div>}
                <input type="file" accept="image/*" onChange={handleLogo} className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-medium cursor-pointer"/>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG · Max 2 Mo · Apparaît sur la page de connexion</p>
              </div>
              <div>
                <Label className="mb-2 block">Couleur principale</Label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_PRESETS.map(p=>(
                    <button key={p.color} onClick={()=>applyTheme(p.color)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 text-sm ${primaryColor===p.color?"shadow-md":"border-slate-200"}`}
                      style={primaryColor===p.color?{borderColor:p.color,backgroundColor:p.color+"18"}:{}}>
                      <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{backgroundColor:p.color}}/><span className="text-xs">{p.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <input type="color" value={primaryColor} onChange={e=>{setPrimaryColor(e.target.value);localStorage.setItem("ag_primaryColor",e.target.value);}} className="w-10 h-10 rounded cursor-pointer border"/>
                  <div className="flex-1"><p className="text-sm">Personnalisé</p><p className="text-xs text-slate-400 font-mono">{primaryColor}</p></div>
                  <Button size="sm" onClick={()=>applyTheme(primaryColor)}>Appliquer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2"><Users size={18} className="text-blue-500"/>Gestion des Utilisateurs ({allDisplayUsers.length})</CardTitle>
              <AddUserDialog/>
            </div>
          </CardHeader>
          <CardContent>
            {/* Role legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r,l])=>(
                <span key={r} className={`px-2 py-1 rounded text-xs font-medium text-center ${ROLE_COLORS[r]}`}>{l}</span>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead className="border-b"><tr>
                {["Nom","Email","Rôle","Site / Équipe","Créé le",""].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-600">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {allDisplayUsers.map((u:any)=>(
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium">{u.name}</td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{u.email}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role as UserRole]}`}>
                        {ROLE_LABELS[u.role as UserRole]}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {u.siteId && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">🏭 {sites.find((s:any)=>s.id===u.siteId)?.name||u.siteId}</span>}
                      {u.teamId && <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full ml-1">⛏ {teams.find((t:any)=>t.id===u.teamId)?.name||u.teamId}</span>}
                      {!u.siteId && !u.teamId && <span className="text-slate-400">Tous sites</span>}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-400">{u.createdAt}</td>
                    <td className="py-2 px-3">
                      {!u.id.startsWith("__")&&(
                        <button onClick={()=>{deleteAppUser(u.id);toast.success("Supprimé");}}
                          className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
