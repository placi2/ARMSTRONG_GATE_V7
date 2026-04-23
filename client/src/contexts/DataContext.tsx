import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAudit } from "@/contexts/AuditContext";
import { isConfigured, readFromCloud, writeToCloud, collectLocalData, applyCloudData } from "@/lib/jsonbin";
import type { UserRole } from "./AuthContext";

export interface Site        { id:string; name:string; location:string; description?:string; status?:string; manager?:string; }
export interface Team        { id:string; name:string; siteId:string; manager?:string; memberCount?:number; createdDate?:string; }
export interface Employee    { id:string; name:string; function?:string; teamId:string; monthlySalary?:number; salary?:number; joinDate?:string; role?:string; status?:string; totalAdvances?:number; }
export interface Advance     { id:string; employeeId:string; date:string; amount:number; motif?:string; status?:string; }
export interface Production  { id:string; siteId?:string; teamId:string; date:string; weight?:number; pricePerGram?:number; estimatedValue?:number; value?:number; }
export interface Expense     { id:string; siteId?:string; teamId:string; category:string; amount:number; date:string; description?:string; comment?:string; equipmentId?:string; }
export interface CashMovement{ id:string; siteId:string; siteName?:string; type:string; amount:number; date:string; category?:string; paymentMethod?:string; comment?:string; }
export interface Equipment   { id:string; siteId:string; teamId?:string; name:string; type:string; status:string; value:number; serialNumber?:string; purchaseDate?:string; }
export interface GoldStock   { id:string; siteId:string; totalProduced:number; currentStock:number; lastUpdated:string; }
export interface AppUser     { id:string; name:string; email:string; password?:string; role:UserRole; siteId?:string; teamId?:string; createdAt:string; }

interface Ctx {
  allSites:Site[]; allTeams:Team[]; allEmployees:Employee[]; allProductions:Production[];
  allExpenses:Expense[]; allCashMovements:CashMovement[]; allEquipment:Equipment[];
  allAdvances:Advance[]; goldStocks:GoldStock[]; appUsers:AppUser[];
  sites:Site[]; teams:Team[]; employees:Employee[]; productions:Production[];
  expenses:Expense[]; cashMovements:CashMovement[]; equipment:Equipment[]; advances:Advance[];

  addSite:(s:Omit<Site,"id">)=>Site; updateSite:(id:string,s:Partial<Site>)=>void; deleteSite:(id:string)=>void;
  addTeam:(t:Omit<Team,"id">)=>Team; updateTeam:(id:string,t:Partial<Team>)=>void; deleteTeam:(id:string)=>void;
  addEmployee:(e:Omit<Employee,"id">)=>Employee; updateEmployee:(id:string,e:Partial<Employee>)=>void; deleteEmployee:(id:string)=>void;
  addProduction:(p:Omit<Production,"id">)=>void; updateProduction:(id:string,p:Partial<Production>)=>void; deleteProduction:(id:string)=>void;
  addExpense:(e:Omit<Expense,"id">)=>void; updateExpense:(id:string,e:Partial<Expense>)=>void; deleteExpense:(id:string)=>void;
  addCashMovement:(m:Omit<CashMovement,"id">)=>void; updateCashMovement:(id:string,m:Partial<CashMovement>)=>void; deleteCashMovement:(id:string)=>void;
  addEquipment:(e:Omit<Equipment,"id">&{id?:string})=>void; updateEquipment:(id:string,e:Partial<Equipment>)=>void; deleteEquipment:(id:string)=>void;
  addAdvance:(a:Omit<Advance,"id">)=>void; deleteAdvance:(id:string)=>void;
  updateGoldStock:(siteId:string,delta:number,isProd:boolean)=>void;
  addAppUser:(u:Omit<AppUser,"id"|"createdAt">)=>AppUser; updateAppUser:(id:string,u:Partial<AppUser>)=>void; deleteAppUser:(id:string)=>void;
}

const K = { sites:"ag_sites", teams:"ag_teams", employees:"ag_employees", productions:"ag_productions",
  expenses:"ag_expenses", cash:"ag_cashMovements", eq:"ag_equipment", adv:"ag_advances",
  gold:"ag_goldStocks", users:"ag_appUsers" };

function load<T>(k:string,fb:T[]):T[]{try{const r=localStorage.getItem(k);if(r===null)return[...fb];const p=JSON.parse(r);if(!Array.isArray(p))return[...fb];return p;}catch{return[...fb];}}
function save<T>(k:string,d:T[]){try{localStorage.setItem(k,JSON.stringify(d));}catch{}}

const IS:Site[]=[{id:"S001",name:"Site Principal — Vallée de l'Or",location:"Région Nord",manager:"Jean Dupont"},{id:"S002",name:"Site Secondaire — Plateau Est",location:"Région Est",manager:"Marie Sow"}];
const IT:Team[]=[{id:"T001",name:"Équipe Excavation A",siteId:"S001"},{id:"T002",name:"Équipe Excavation B",siteId:"S001"},{id:"T003",name:"Équipe Raffinage",siteId:"S001"},{id:"T004",name:"Équipe Plateau A",siteId:"S002"},{id:"T005",name:"Équipe Plateau B",siteId:"S002"}];
const IE:Employee[]=[{id:"E001",name:"Moussa Diallo",function:"Mineur",teamId:"T001",monthlySalary:350,status:"Actif",totalAdvances:0},{id:"E002",name:"Samba Ndiaye",function:"Mineur",teamId:"T001",monthlySalary:350,status:"Actif",totalAdvances:0},{id:"E003",name:"Ousmane Cissé",function:"Chef",teamId:"T001",monthlySalary:500,status:"Actif",totalAdvances:0},{id:"E004",name:"Mamadou Bah",function:"Mineur",teamId:"T002",monthlySalary:320,status:"Actif",totalAdvances:0},{id:"E005",name:"Ibrahim Touré",function:"Technicien",teamId:"T004",monthlySalary:400,status:"Actif",totalAdvances:0}];
const IP:Production[]=[{id:"P001",date:"2026-03-01",teamId:"T001",siteId:"S001",weight:320,pricePerGram:65,estimatedValue:20800,value:20800},{id:"P002",date:"2026-03-05",teamId:"T002",siteId:"S001",weight:290,pricePerGram:65,estimatedValue:18850,value:18850},{id:"P003",date:"2026-03-07",teamId:"T004",siteId:"S002",weight:280,pricePerGram:65,estimatedValue:18200,value:18200},{id:"P004",date:"2026-04-01",teamId:"T001",siteId:"S001",weight:310,pricePerGram:65,estimatedValue:20150,value:20150}];
const IX:Expense[]=[{id:"EX001",date:"2026-03-01",teamId:"T001",siteId:"S001",category:"Alimentation",amount:150,comment:"Ravitaillement"},{id:"EX002",date:"2026-03-02",teamId:"T001",siteId:"S001",category:"Transport",amount:200,comment:"Carburant"},{id:"EX003",date:"2026-04-01",teamId:"T002",siteId:"S001",category:"Équipement",amount:800,comment:"Outils"}];
const IC:CashMovement[]=[{id:"CM001",date:"2026-03-05",siteId:"S001",siteName:"Site Principal",type:"entrée",amount:20000,category:"Vente or",paymentMethod:"Espèces"},{id:"CM002",date:"2026-03-07",siteId:"S002",siteName:"Site Secondaire",type:"entrée",amount:15000,category:"Vente or",paymentMethod:"Virement"},{id:"CM003",date:"2026-04-02",siteId:"S001",siteName:"Site Principal",type:"entrée",amount:18000,category:"Vente or",paymentMethod:"Espèces"}];
const IU:AppUser[]=[{id:"AU001",name:"Admin PDG",email:"admin@goldmine.com",password:"admin123",role:"pdg",createdAt:"2026-01-01"},{id:"AU002",name:"Manager Site 1",email:"manager@goldmine.com",password:"manager123",role:"directeur",siteId:"S001",createdAt:"2026-01-01"}];

const DataContext = createContext<Ctx|undefined>(undefined);

export function DataProvider({children}:{children:React.ReactNode}) {
  const {user} = useAuth();
  const { log } = useAudit();

  const [aS,setAS]=useState<Site[]>(()=>load(K.sites,IS));
  const [aT,setAT]=useState<Team[]>(()=>load(K.teams,IT));
  const [aE,setAE]=useState<Employee[]>(()=>load(K.employees,IE));
  const [aP,setAP]=useState<Production[]>(()=>load(K.productions,IP));
  const [aX,setAX]=useState<Expense[]>(()=>load(K.expenses,IX));
  const [aC,setAC]=useState<CashMovement[]>(()=>load(K.cash,IC));
  const [aQ,setAQ]=useState<Equipment[]>(()=>load(K.eq,[]));
  const [aV,setAV]=useState<Advance[]>(()=>load(K.adv,[]));
  const [gS,setGS]=useState<GoldStock[]>(()=>load(K.gold,[]));
  const [aU,setAU]=useState<AppUser[]>(()=>load(K.users,IU));

  // ── Track if initial cloud load is done ───────────────────────────────────
  const [cloudReady, setCloudReady] = useState(false);

  // ── Load from JSONBin on mount (overrides localStorage with shared data) ──
  useEffect(() => {
    if (!isConfigured()) { setCloudReady(true); return; }
    readFromCloud().then(cloud => {
      if (cloud) {
        applyCloudData(cloud);
        // Reload state from localStorage (now updated from cloud)
        if (cloud.ag_sites?.length)        setAS(cloud.ag_sites);
        if (cloud.ag_teams?.length)        setAT(cloud.ag_teams);
        if (cloud.ag_employees?.length)    setAE(cloud.ag_employees);
        if (cloud.ag_productions?.length)  setAP(cloud.ag_productions);
        if (cloud.ag_expenses?.length)     setAX(cloud.ag_expenses);
        if (cloud.ag_cashMovements?.length)setAC(cloud.ag_cashMovements);
        if (cloud.ag_equipment?.length)    setAQ(cloud.ag_equipment);
        if (cloud.ag_advances?.length)     setAV(cloud.ag_advances);
        if (cloud.ag_goldStocks?.length)   setGS(cloud.ag_goldStocks);
        if (cloud.ag_appUsers?.length)     setAU(cloud.ag_appUsers);
        console.log("[JSONBin] ✅ Data loaded from cloud");
      }
      setCloudReady(true);
    });
  }, []); // run once on mount

  // ── Auto-sync every 30 seconds (picks up other users' changes) ────────────
  useEffect(() => {
    if (!isConfigured()) return;
    const interval = setInterval(() => {
      readFromCloud().then(cloud => {
        if (!cloud) return;
        // Only update if cloud has more recent/more data
        if (cloud.ag_sites?.length > aS.length)        setAS(cloud.ag_sites);
        if (cloud.ag_teams?.length > aT.length)        setAT(cloud.ag_teams);
        if (cloud.ag_employees?.length > aE.length)    setAE(cloud.ag_employees);
        if (cloud.ag_productions?.length > aP.length)  setAP(cloud.ag_productions);
        if (cloud.ag_expenses?.length > aX.length)     setAX(cloud.ag_expenses);
        if (cloud.ag_cashMovements?.length > aC.length)setAC(cloud.ag_cashMovements);
        if (cloud.ag_equipment?.length > aQ.length)    setAQ(cloud.ag_equipment);
        if (cloud.ag_advances?.length > aV.length)     setAV(cloud.ag_advances);
        if (cloud.ag_appUsers?.length > aU.length)     setAU(cloud.ag_appUsers);
      });
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [aS.length, aT.length, aE.length, aP.length, aX.length, aC.length, aQ.length, aV.length, aU.length]);

  // ── Push to cloud after every local save ──────────────────────────────────
  const pushToCloud = useCallback(() => {
    if (!isConfigured() || !cloudReady) return;
    setTimeout(() => {
      writeToCloud(collectLocalData());
    }, 500); // small delay to let localStorage settle
  }, [cloudReady]);

  // ── Save to localStorage + push to cloud ──────────────────────────────────
  useEffect(()=>{save(K.sites,aS);    if(cloudReady) pushToCloud();},[aS]);
  useEffect(()=>{save(K.teams,aT);    if(cloudReady) pushToCloud();},[aT]);
  useEffect(()=>{save(K.employees,aE);if(cloudReady) pushToCloud();},[aE]);
  useEffect(()=>{save(K.productions,aP);if(cloudReady) pushToCloud();},[aP]);
  useEffect(()=>{save(K.expenses,aX); if(cloudReady) pushToCloud();},[aX]);
  useEffect(()=>{save(K.cash,aC);     if(cloudReady) pushToCloud();},[aC]);
  useEffect(()=>{save(K.eq,aQ);       if(cloudReady) pushToCloud();},[aQ]);
  useEffect(()=>{save(K.adv,aV);      if(cloudReady) pushToCloud();},[aV]);
  useEffect(()=>{save(K.gold,gS);     if(cloudReady) pushToCloud();},[gS]);
  useEffect(()=>{save(K.users,aU);    if(cloudReady) pushToCloud();},[aU]);

  // ── Audit helper ─────────────────────────────────────────────────────────
  const audit = useCallback((action:"CREATE"|"UPDATE"|"DELETE", module:any, itemId:string, itemName:string, details:string, siteId?:string) => {
    if (!user) return;
    log({ userId:user.id, userName:user.name, userRole:user.role,
      action, module, itemId, itemName, details, siteId });
  }, [user, log]);

  // ── RBAC ─────────────────────────────────────────────────────────────────
  const role = user?.role as UserRole|undefined;
  const mSite = useMemo(()=>{
    if(role!=="directeur") return undefined;
    if(user?.siteId) return user.siteId;
    try{const r=localStorage.getItem(K.users);if(r){const l=JSON.parse(r);return l.find((u:any)=>u.email===user?.email)?.siteId;}}catch{}
    return undefined;
  },[role,user?.siteId,user?.email]);
  const mTeam = user?.teamId;

  const {sites,teams,employees,productions,expenses,cashMovements,equipment,advances} = useMemo(()=>{
    if(!role) return {sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV};
    switch(role){
      case "pdg": return {sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV};
      case "directeur":{const st=mSite?aS.filter(s=>s.id===mSite):aS;const tm=mSite?aT.filter(t=>t.siteId===mSite):aT;const tids=tm.map(t=>t.id);const em=aE.filter(e=>tids.includes(e.teamId));const eids=em.map(e=>e.id);return{sites:st,teams:tm,employees:em,productions:aP.filter(p=>tids.includes(p.teamId)||p.siteId===mSite),expenses:aX.filter(e=>tids.includes(e.teamId)||e.siteId===mSite),cashMovements:mSite?aC.filter(m=>m.siteId===mSite):aC,equipment:mSite?aQ.filter(e=>e.siteId===mSite):aQ,advances:aV.filter(a=>eids.includes(a.employeeId))};}
      case "rh": return {sites:aS,teams:aT,employees:aE,productions:[],expenses:[],cashMovements:[],equipment:[],advances:aV};
      case "finance": return {sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:[],advances:[]};
      case "chef_equipe":{const myT=mTeam?aT.filter(t=>t.id===mTeam):aT;const tids=myT.map(t=>t.id);return{sites:aS,teams:myT,employees:aE.filter(e=>tids.includes(e.teamId)),productions:aP.filter(p=>tids.includes(p.teamId)),expenses:[],cashMovements:[],equipment:aQ,advances:[]};}
      case "equipements": return {sites:aS,teams:aT,employees:[],productions:[],expenses:aX,cashMovements:[],equipment:aQ,advances:[]};
      case "logistique": return {sites:aS,teams:aT,employees:[],productions:aP,expenses:aX.filter(e=>["Transport","Carburant"].includes(e.category)),cashMovements:[],equipment:aQ,advances:[]};
      case "auditeur": return {sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV};
      default: return {sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV};
    }
  },[role,mSite,mTeam,aS,aT,aE,aP,aX,aC,aQ,aV]);

  // ── CRUD with audit ───────────────────────────────────────────────────────
  const addSite=useCallback((s:Omit<Site,"id">):Site=>{
    const n={...s,id:`S${Date.now()}`};setAS(p=>[...p,n]);
    audit("CREATE","Site",n.id,n.name,`Créé: ${n.name} (${n.location||""})`);
    return n;
  },[audit]);
  const updateSite=useCallback((id:string,s:Partial<Site>)=>{
    setAS(p=>p.map(x=>{if(x.id!==id)return x;audit("UPDATE","Site",id,x.name,`Modifié: ${JSON.stringify(s)}`);return{...x,...s};}));
  },[audit]);
  const deleteSite=useCallback((id:string)=>{
    setAS(p=>{const x=p.find(s=>s.id===id);if(x)audit("DELETE","Site",id,x.name,`Supprimé: ${x.name}`);return p.filter(s=>s.id!==id);});
  },[audit]);

  const addTeam=useCallback((t:Omit<Team,"id">):Team=>{
    const n={...t,id:`T${Date.now()}`};setAT(p=>[...p,n]);
    audit("CREATE","Équipe",n.id,n.name,`Créée: ${n.name} (site: ${n.siteId})`,n.siteId);
    return n;
  },[audit]);
  const updateTeam=useCallback((id:string,t:Partial<Team>)=>{
    setAT(p=>p.map(x=>{if(x.id!==id)return x;audit("UPDATE","Équipe",id,x.name,`Modifiée: ${JSON.stringify(t)}`,x.siteId);return{...x,...t};}));
  },[audit]);
  const deleteTeam=useCallback((id:string)=>{
    setAT(p=>{const x=p.find(t=>t.id===id);if(x)audit("DELETE","Équipe",id,x.name,`Supprimée: ${x.name}`,x.siteId);return p.filter(t=>t.id!==id);});
  },[audit]);

  const addEmployee=useCallback((e:Omit<Employee,"id">):Employee=>{
    const n={...e,id:`E${Date.now()}`,totalAdvances:0};setAE(p=>[...p,n]);
    audit("CREATE","Employé",n.id,n.name,`Embauché: ${n.name}, ${n.function||""}, Salaire: $${n.monthlySalary||0}`);
    return n;
  },[audit]);
  const updateEmployee=useCallback((id:string,e:Partial<Employee>)=>{
    setAE(p=>p.map(x=>{if(x.id!==id)return x;const changes=[];if(e.monthlySalary!==undefined&&e.monthlySalary!==x.monthlySalary)changes.push(`salaire $${x.monthlySalary}→$${e.monthlySalary}`);if(e.status!==undefined&&e.status!==x.status)changes.push(`statut ${x.status}→${e.status}`);if(e.function!==undefined&&e.function!==x.function)changes.push(`fonction ${x.function}→${e.function}`);audit("UPDATE","Employé",id,x.name,changes.length?changes.join(", "):"Mis à jour");return{...x,...e};}));
  },[audit]);
  const deleteEmployee=useCallback((id:string)=>{
    setAE(p=>{const x=p.find(e=>e.id===id);if(x)audit("DELETE","Employé",id,x.name,`Supprimé: ${x.name}`);return p.filter(e=>e.id!==id);});
  },[audit]);

  const addProduction=useCallback((prod:Omit<Production,"id">)=>{
    const price=prod.pricePerGram||65;const w=prod.weight||0;const val=w*price;
    const n={...prod,id:`P${Date.now()}`,pricePerGram:price,estimatedValue:val,value:val};
    setAP(p=>[n,...p]);
    audit("CREATE","Production",n.id,`${w}g le ${prod.date}`,`Production: ${w}g à $${price}/g = $${Math.round(val)} (équipe: ${prod.teamId})`,prod.siteId);
    if(prod.siteId){const sid=prod.siteId;const now=new Date().toISOString().split("T")[0];setGS(prev=>{const ex=prev.find(s=>s.siteId===sid);if(ex)return prev.map(s=>s.siteId===sid?{...s,totalProduced:s.totalProduced+w,currentStock:s.currentStock+w,lastUpdated:now}:s);return[...prev,{id:`GS${Date.now()}`,siteId:sid,totalProduced:w,currentStock:w,lastUpdated:now}];});}
  },[audit]);
  const updateProduction=useCallback((id:string,p:Partial<Production>)=>setAP(prev=>prev.map(x=>x.id===id?{...x,...p}:x)),[]);
  const deleteProduction=useCallback((id:string)=>{
    setAP(p=>{const x=p.find(p=>p.id===id);if(x)audit("DELETE","Production",id,`${x.weight}g`,`Supprimé: ${x.weight}g du ${x.date}`,x.siteId);return p.filter(p=>p.id!==id);});
  },[audit]);

  const addExpense=useCallback((e:Omit<Expense,"id">)=>{
    const n={...e,id:`EX${Date.now()}`};setAX(p=>[n,...p]);
    audit("CREATE","Dépense",n.id,`${e.category} $${e.amount}`,`Dépense: ${e.category}, $${e.amount}, "${e.comment||""}"`,e.siteId);
  },[audit]);
  const updateExpense=useCallback((id:string,e:Partial<Expense>)=>setAX(p=>p.map(x=>x.id===id?{...x,...e}:x)),[]);
  const deleteExpense=useCallback((id:string)=>{
    setAX(p=>{const x=p.find(e=>e.id===id);if(x)audit("DELETE","Dépense",id,`${x.category}`,`Supprimée: ${x.category} $${x.amount}`,x.siteId);return p.filter(e=>e.id!==id);});
  },[audit]);

  const addCashMovement=useCallback((m:Omit<CashMovement,"id">)=>{
    const n={...m,id:`CM${Date.now()}`};setAC(p=>[n,...p]);
    audit("CREATE","Caisse",n.id,`${m.type} $${m.amount}`,`Mouvement caisse: ${m.type} $${m.amount}, ${m.category||""}, ${m.paymentMethod||""}`,m.siteId);
  },[audit]);
  const updateCashMovement=useCallback((id:string,m:Partial<CashMovement>)=>setAC(p=>p.map(x=>x.id===id?{...x,...m}:x)),[]);
  const deleteCashMovement=useCallback((id:string)=>{
    setAC(p=>{const x=p.find(m=>m.id===id);if(x)audit("DELETE","Caisse",id,`${x.type}`,`Supprimé: ${x.type} $${x.amount}`,x.siteId);return p.filter(m=>m.id!==id);});
  },[audit]);

  const addEquipment=useCallback((e:Omit<Equipment,"id">&{id?:string})=>{
    const n={...e,id:e.id||`EQ${Date.now()}`};setAQ(p=>[n,...p]);
    audit("CREATE","Équipement",n.id,n.name,`Ajouté: ${n.name} (${n.type}), $${n.value}, statut: ${n.status}`,n.siteId);
  },[audit]);
  const updateEquipment=useCallback((id:string,e:Partial<Equipment>)=>{
    setAQ(p=>p.map(x=>{if(x.id!==id)return x;if(e.status&&e.status!==x.status)audit("UPDATE","Équipement",id,x.name,`Statut: ${x.status} → ${e.status}`,x.siteId);else audit("UPDATE","Équipement",id,x.name,`Modifié: ${JSON.stringify(e)}`,x.siteId);return{...x,...e};}));
  },[audit]);
  const deleteEquipment=useCallback((id:string)=>{
    setAQ(p=>{const x=p.find(e=>e.id===id);if(x)audit("DELETE","Équipement",id,x.name,`Supprimé: ${x.name}`,x.siteId);return p.filter(e=>e.id!==id);});
  },[audit]);

  const addAdvance=useCallback((a:Omit<Advance,"id">)=>{
    const n={...a,id:`AV${Date.now()}`,status:"Validé"};setAV(p=>[n,...p]);
    setAE(prev=>prev.map(e=>e.id===a.employeeId?{...e,totalAdvances:(e.totalAdvances||0)+a.amount}:e));
    const empName=aE.find(e=>e.id===a.employeeId)?.name||a.employeeId;
    audit("CREATE","Avance",n.id,empName,`Avance de $${a.amount} à ${empName}, motif: ${a.motif||"—"}`);
  },[audit,aE]);
  const deleteAdvance=useCallback((id:string)=>{
    setAV(p=>{const x=p.find(a=>a.id===id);if(x){const empName=aE.find(e=>e.id===x.employeeId)?.name||x.employeeId;audit("DELETE","Avance",id,empName,`Avance supprimée: $${x.amount} de ${empName}`);}return p.filter(a=>a.id!==id);});
  },[audit,aE]);

  const updateGoldStock=useCallback((siteId:string,delta:number,isProd:boolean)=>{
    const now=new Date().toISOString().split("T")[0];
    setGS(prev=>{const ex=prev.find(s=>s.siteId===siteId);if(ex)return prev.map(s=>s.siteId===siteId?{...s,totalProduced:isProd?s.totalProduced+delta:s.totalProduced,currentStock:s.currentStock+(isProd?delta:-delta),lastUpdated:now}:s);return[...prev,{id:`GS${Date.now()}`,siteId,totalProduced:isProd?delta:0,currentStock:isProd?delta:0,lastUpdated:now}];});
  },[]);

  const addAppUser=useCallback((u:Omit<AppUser,"id"|"createdAt">):AppUser=>{
    const n:AppUser={...u,id:`AU${Date.now()}`,createdAt:new Date().toISOString().split("T")[0]};
    setAU(p=>[...p,n]);
    audit("CREATE","Utilisateur",n.id,n.name,`Nouvel utilisateur: ${n.name}, rôle: ${n.role}, email: ${n.email}`);
    return n;
  },[audit]);
  const updateAppUser=useCallback((id:string,u:Partial<AppUser>)=>{
    setAU(p=>p.map(x=>{if(x.id!==id)return x;audit("UPDATE","Utilisateur",id,x.name,`Modifié: ${JSON.stringify(u)}`);return{...x,...u};}));
  },[audit]);
  const deleteAppUser=useCallback((id:string)=>{
    setAU(p=>{const x=p.find(u=>u.id===id);if(x)audit("DELETE","Utilisateur",id,x.name,`Supprimé: ${x.name} (${x.email})`);return p.filter(u=>u.id!==id);});
  },[audit]);

  return <DataContext.Provider value={{
    allSites:aS,allTeams:aT,allEmployees:aE,allProductions:aP,allExpenses:aX,
    allCashMovements:aC,allEquipment:aQ,allAdvances:aV,goldStocks:gS,appUsers:aU,
    sites,teams,employees,productions,expenses,cashMovements,equipment,advances,
    addSite,updateSite,deleteSite,addTeam,updateTeam,deleteTeam,
    addEmployee,updateEmployee,deleteEmployee,addProduction,updateProduction,deleteProduction,
    addExpense,updateExpense,deleteExpense,addCashMovement,updateCashMovement,deleteCashMovement,
    addEquipment,updateEquipment,deleteEquipment,addAdvance,deleteAdvance,updateGoldStock,
    addAppUser,updateAppUser,deleteAppUser,
  }}>{children}</DataContext.Provider>;
}

export function useData():Ctx{const ctx=useContext(DataContext);if(!ctx)throw new Error("useData must be inside DataProvider");return ctx;}
