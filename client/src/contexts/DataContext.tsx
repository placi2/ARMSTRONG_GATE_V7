import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
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

const K = {
  sites:"ag_sites", teams:"ag_teams", employees:"ag_employees", productions:"ag_productions",
  expenses:"ag_expenses", cash:"ag_cashMovements", eq:"ag_equipment", adv:"ag_advances",
  gold:"ag_goldStocks", users:"ag_appUsers",
};

function load<T>(key:string, fallback:T[]):T[] {
  try {
    const raw=localStorage.getItem(key);
    if(raw===null) return [...fallback];
    const p=JSON.parse(raw);
    if(!Array.isArray(p)) return [...fallback];
    return p;
  } catch { return [...fallback]; }
}
function save<T>(k:string,d:T[]) { try{localStorage.setItem(k,JSON.stringify(d));}catch{} }

const IS:Site[]=[{id:"S001",name:"Site Principal — Vallée de l'Or",location:"Région Nord",manager:"Jean Dupont"},{id:"S002",name:"Site Secondaire — Plateau Est",location:"Région Est",manager:"Marie Sow"}];
const IT:Team[]=[{id:"T001",name:"Équipe Excavation A",siteId:"S001"},{id:"T002",name:"Équipe Excavation B",siteId:"S001"},{id:"T003",name:"Équipe Raffinage",siteId:"S001"},{id:"T004",name:"Équipe Plateau A",siteId:"S002"},{id:"T005",name:"Équipe Plateau B",siteId:"S002"}];
const IE:Employee[]=[{id:"E001",name:"Moussa Diallo",function:"Mineur",teamId:"T001",monthlySalary:350,status:"Actif",totalAdvances:0},{id:"E002",name:"Samba Ndiaye",function:"Mineur",teamId:"T001",monthlySalary:350,status:"Actif",totalAdvances:0},{id:"E003",name:"Ousmane Cissé",function:"Chef",teamId:"T001",monthlySalary:500,status:"Actif",totalAdvances:0},{id:"E004",name:"Mamadou Bah",function:"Mineur",teamId:"T002",monthlySalary:320,status:"Actif",totalAdvances:0},{id:"E005",name:"Ibrahim Touré",function:"Technicien",teamId:"T004",monthlySalary:400,status:"Actif",totalAdvances:0}];
const IP:Production[]=[{id:"P001",date:"2026-03-01",teamId:"T001",siteId:"S001",weight:320,pricePerGram:65,estimatedValue:20800,value:20800},{id:"P002",date:"2026-03-05",teamId:"T002",siteId:"S001",weight:290,pricePerGram:65,estimatedValue:18850,value:18850},{id:"P003",date:"2026-03-07",teamId:"T004",siteId:"S002",weight:280,pricePerGram:65,estimatedValue:18200,value:18200},{id:"P004",date:"2026-04-01",teamId:"T001",siteId:"S001",weight:310,pricePerGram:65,estimatedValue:20150,value:20150}];
const IX:Expense[]=[{id:"EX001",date:"2026-03-01",teamId:"T001",siteId:"S001",category:"Alimentation",amount:150,comment:"Ravitaillement"},{id:"EX002",date:"2026-03-02",teamId:"T001",siteId:"S001",category:"Transport",amount:200,comment:"Carburant"},{id:"EX003",date:"2026-04-01",teamId:"T002",siteId:"S001",category:"Équipement",amount:800,comment:"Outils"}];
const IC:CashMovement[]=[{id:"CM001",date:"2026-03-05",siteId:"S001",siteName:"Site Principal",type:"entrée",amount:20000,category:"Vente or",paymentMethod:"Espèces"},{id:"CM002",date:"2026-03-07",siteId:"S002",siteName:"Site Secondaire",type:"entrée",amount:15000,category:"Vente or",paymentMethod:"Virement"},{id:"CM003",date:"2026-04-02",siteId:"S001",siteName:"Site Principal",type:"entrée",amount:18000,category:"Vente or",paymentMethod:"Espèces"}];
const IU:AppUser[]=[
  {id:"AU001",name:"Admin PDG",email:"admin@goldmine.com",password:"admin123",role:"pdg",createdAt:"2026-01-01"},
  {id:"AU002",name:"Manager Site 1",email:"manager@goldmine.com",password:"manager123",role:"directeur",siteId:"S001",createdAt:"2026-01-01"},
];

const DataContext=createContext<Ctx|undefined>(undefined);

export function DataProvider({children}:{children:React.ReactNode}) {
  const {user}=useAuth();

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

  useEffect(()=>{save(K.sites,aS);},[aS]);
  useEffect(()=>{save(K.teams,aT);},[aT]);
  useEffect(()=>{save(K.employees,aE);},[aE]);
  useEffect(()=>{save(K.productions,aP);},[aP]);
  useEffect(()=>{save(K.expenses,aX);},[aX]);
  useEffect(()=>{save(K.cash,aC);},[aC]);
  useEffect(()=>{save(K.eq,aQ);},[aQ]);
  useEffect(()=>{save(K.adv,aV);},[aV]);
  useEffect(()=>{save(K.gold,gS);},[gS]);
  useEffect(()=>{save(K.users,aU);},[aU]);

  // ── RBAC filter logic ──────────────────────────────────────────────────────
  const role = user?.role as UserRole | undefined;
  const mSite = useMemo(()=>{
    if(role==="directeur") {
      if(user?.siteId) return user.siteId;
      try { const raw=localStorage.getItem(K.users); if(raw){const l=JSON.parse(raw); return l.find((u:any)=>u.email===user?.email)?.siteId;} } catch {}
    }
    return undefined;
  },[role,user?.siteId,user?.email]);

  const mTeam = user?.teamId; // for chef_equipe

  // Filter helper: by site
  const bySite = useCallback(<T extends {siteId?:string}>(items:T[]):T[] => {
    if(!mSite) return items;
    return items.filter(i=>i.siteId===mSite);
  },[mSite]);

  // Filter teams by site
  const teamsBySite = useCallback((items:Team[]):Team[] => {
    if(!mSite) return items;
    return items.filter(t=>t.siteId===mSite);
  },[mSite]);

  // Employees by team ids
  const empsByTeams = useCallback((items:Employee[],teamIds:string[]):Employee[] =>
    items.filter(e=>teamIds.includes(e.teamId)),[]);

  // ── Filtered views per role ────────────────────────────────────────────────
  const { sites, teams, employees, productions, expenses, cashMovements, equipment, advances } = useMemo(()=>{
    if(!role) return { sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV };

    switch(role) {
      // PDG: everything
      case "pdg":
        return { sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV };

      // Directeur: own site only
      case "directeur": {
        const st=mSite?aS.filter(s=>s.id===mSite):aS;
        const tm=teamsBySite(aT);
        const tids=tm.map(t=>t.id);
        const em=empsByTeams(aE,tids);
        const eids=em.map(e=>e.id);
        return {
          sites:st, teams:tm,
          employees:em,
          productions:aP.filter(p=>tids.includes(p.teamId)||p.siteId===mSite),
          expenses:aX.filter(e=>tids.includes(e.teamId)||e.siteId===mSite),
          cashMovements:mSite?aC.filter(m=>m.siteId===mSite):aC,
          equipment:mSite?aQ.filter(e=>e.siteId===mSite):aQ,
          advances:aV.filter(a=>eids.includes(a.employeeId)),
        };
      }

      // RH: employees + teams (read), no finances
      case "rh":
        return { sites:aS,teams:aT,employees:aE,productions:[],expenses:[],cashMovements:[],equipment:[],advances:aV };

      // Finance: financial data only
      case "finance":
        return { sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:[],advances:[] };

      // Chef d'équipe: own team only
      case "chef_equipe": {
        const myTeam=mTeam?aT.filter(t=>t.id===mTeam):aT;
        const tids=myTeam.map(t=>t.id);
        return {
          sites:aS, teams:myTeam,
          employees:empsByTeams(aE,tids),
          productions:aP.filter(p=>tids.includes(p.teamId)),
          expenses:[], cashMovements:[], advances:[],
          equipment:aQ, // read-only
        };
      }

      // Équipements: equipment + expenses (consult)
      case "equipements":
        return { sites:aS,teams:aT,employees:[],productions:[],expenses:aX,cashMovements:[],equipment:aQ,advances:[] };

      // Logistique: production (read) + equipment (vehicles) + expenses transport
      case "logistique":
        return {
          sites:aS, teams:aT, employees:[],
          productions:aP,
          expenses:aX.filter(e=>["Transport","Carburant"].includes(e.category)),
          cashMovements:[], equipment:aQ, advances:[],
        };

      // Auditeur: read-only everything
      case "auditeur":
        return { sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV };

      default:
        return { sites:aS,teams:aT,employees:aE,productions:aP,expenses:aX,cashMovements:aC,equipment:aQ,advances:aV };
    }
  },[role,mSite,mTeam,aS,aT,aE,aP,aX,aC,aQ,aV,teamsBySite,empsByTeams]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addSite    = useCallback((s:Omit<Site,"id">):Site=>{const n={...s,id:`S${Date.now()}`};setAS(p=>[...p,n]);return n;},[]);
  const updateSite = useCallback((id:string,s:Partial<Site>)=>setAS(p=>p.map(x=>x.id===id?{...x,...s}:x)),[]);
  const deleteSite = useCallback((id:string)=>setAS(p=>p.filter(x=>x.id!==id)),[]);
  const addTeam    = useCallback((t:Omit<Team,"id">):Team=>{const n={...t,id:`T${Date.now()}`};setAT(p=>[...p,n]);return n;},[]);
  const updateTeam = useCallback((id:string,t:Partial<Team>)=>setAT(p=>p.map(x=>x.id===id?{...x,...t}:x)),[]);
  const deleteTeam = useCallback((id:string)=>setAT(p=>p.filter(x=>x.id!==id)),[]);
  const addEmployee    = useCallback((e:Omit<Employee,"id">):Employee=>{const n={...e,id:`E${Date.now()}`,totalAdvances:0};setAE(p=>[...p,n]);return n;},[]);
  const updateEmployee = useCallback((id:string,e:Partial<Employee>)=>setAE(p=>p.map(x=>x.id===id?{...x,...e}:x)),[]);
  const deleteEmployee = useCallback((id:string)=>setAE(p=>p.filter(x=>x.id!==id)),[]);
  const addProduction = useCallback((prod:Omit<Production,"id">)=>{
    const price=prod.pricePerGram||65;const w=prod.weight||0;const val=w*price;
    const n={...prod,id:`P${Date.now()}`,pricePerGram:price,estimatedValue:val,value:val};
    setAP(p=>[n,...p]);
    if(prod.siteId){const sid=prod.siteId;const now=new Date().toISOString().split("T")[0];
      setGS(prev=>{const ex=prev.find(s=>s.siteId===sid);
        if(ex)return prev.map(s=>s.siteId===sid?{...s,totalProduced:s.totalProduced+w,currentStock:s.currentStock+w,lastUpdated:now}:s);
        return[...prev,{id:`GS${Date.now()}`,siteId:sid,totalProduced:w,currentStock:w,lastUpdated:now}];});}
  },[]);
  const updateProduction=useCallback((id:string,p:Partial<Production>)=>setAP(prev=>prev.map(x=>x.id===id?{...x,...p}:x)),[]);
  const deleteProduction=useCallback((id:string)=>setAP(p=>p.filter(x=>x.id!==id)),[]);
  const addExpense    = useCallback((e:Omit<Expense,"id">)=>{setAX(p=>[{...e,id:`EX${Date.now()}`},...p]);},[]);
  const updateExpense = useCallback((id:string,e:Partial<Expense>)=>setAX(p=>p.map(x=>x.id===id?{...x,...e}:x)),[]);
  const deleteExpense = useCallback((id:string)=>setAX(p=>p.filter(x=>x.id!==id)),[]);
  const addCashMovement    = useCallback((m:Omit<CashMovement,"id">)=>{setAC(p=>[{...m,id:`CM${Date.now()}`},...p]);},[]);
  const updateCashMovement = useCallback((id:string,m:Partial<CashMovement>)=>setAC(p=>p.map(x=>x.id===id?{...x,...m}:x)),[]);
  const deleteCashMovement = useCallback((id:string)=>setAC(p=>p.filter(x=>x.id!==id)),[]);
  const addEquipment    = useCallback((e:Omit<Equipment,"id">&{id?:string})=>{setAQ(p=>[{...e,id:e.id||`EQ${Date.now()}`},...p]);},[]);
  const updateEquipment = useCallback((id:string,e:Partial<Equipment>)=>setAQ(p=>p.map(x=>x.id===id?{...x,...e}:x)),[]);
  const deleteEquipment = useCallback((id:string)=>setAQ(p=>p.filter(x=>x.id!==id)),[]);
  const addAdvance = useCallback((a:Omit<Advance,"id">)=>{
    const n={...a,id:`AV${Date.now()}`,status:"Validé"};
    setAV(p=>[n,...p]);
    setAE(prev=>prev.map(e=>e.id===a.employeeId?{...e,totalAdvances:(e.totalAdvances||0)+a.amount}:e));
  },[]);
  const deleteAdvance=useCallback((id:string)=>setAV(p=>p.filter(x=>x.id!==id)),[]);
  const updateGoldStock=useCallback((siteId:string,delta:number,isProd:boolean)=>{
    const now=new Date().toISOString().split("T")[0];
    setGS(prev=>{const ex=prev.find(s=>s.siteId===siteId);
      if(ex)return prev.map(s=>s.siteId===siteId?{...s,totalProduced:isProd?s.totalProduced+delta:s.totalProduced,currentStock:s.currentStock+(isProd?delta:-delta),lastUpdated:now}:s);
      return[...prev,{id:`GS${Date.now()}`,siteId,totalProduced:isProd?delta:0,currentStock:isProd?delta:0,lastUpdated:now}];});
  },[]);
  const addAppUser=useCallback((u:Omit<AppUser,"id"|"createdAt">):AppUser=>{
    const n:AppUser={...u,id:`AU${Date.now()}`,createdAt:new Date().toISOString().split("T")[0]};
    setAU(p=>[...p,n]);return n;
  },[]);
  const updateAppUser=useCallback((id:string,u:Partial<AppUser>)=>setAU(p=>p.map(x=>x.id===id?{...x,...u}:x)),[]);
  const deleteAppUser=useCallback((id:string)=>setAU(p=>p.filter(x=>x.id!==id)),[]);

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

export function useData():Ctx {
  const ctx=useContext(DataContext);
  if(!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}
