import React,{createContext,useContext,useState,useCallback,useEffect}from"react";
import{useAuth}from"@/hooks/useAuth";
import{api}from"@/lib/api";
export interface Site{id:string;name:string;location:string;description?:string;status?:string;manager?:string;}
export interface Team{id:string;name:string;siteId:string;manager?:string;}
export interface Employee{id:string;name:string;function?:string;teamId:string;monthlySalary?:number;salary?:number;joinDate?:string;role?:string;status?:string;totalAdvances?:number;}
export interface Advance{id:string;employeeId:string;date:string;amount:number;motif?:string;status?:string;}
export interface Production{id:string;siteId?:string;teamId:string;date:string;weight?:number;pricePerGram?:number;estimatedValue?:number;value?:number;}
export interface Expense{id:string;siteId?:string;teamId:string;category:string;amount:number;date:string;description?:string;comment?:string;equipmentId?:string;}
export interface CashMovement{id:string;siteId:string;siteName?:string;type:string;amount:number;date:string;category?:string;paymentMethod?:string;comment?:string;}
export interface Equipment{id:string;siteId:string;teamId?:string;name:string;type:string;status:string;value:number;serialNumber?:string;purchaseDate?:string;}
export interface GoldStock{id:string;siteId:string;totalProduced:number;currentStock:number;lastUpdated:string;}
export interface AppUser{id:string;name:string;email:string;password?:string;role:string;siteId?:string;teamId?:string;createdAt:string;}
interface Ctx{
  sites:Site[];teams:Team[];employees:Employee[];productions:Production[];expenses:Expense[];cashMovements:CashMovement[];equipment:Equipment[];advances:Advance[];goldStocks:GoldStock[];appUsers:AppUser[];
  allSites:Site[];allTeams:Team[];allEmployees:Employee[];allProductions:Production[];allExpenses:Expense[];allCashMovements:CashMovement[];allEquipment:Equipment[];allAdvances:Advance[];
  loading:boolean;load:()=>Promise<void>;
  addSite:(s:Omit<Site,"id">)=>Promise<Site>;updateSite:(id:string,s:Partial<Site>)=>Promise<void>;deleteSite:(id:string)=>Promise<void>;
  addTeam:(t:Omit<Team,"id">)=>Promise<Team>;updateTeam:(id:string,t:Partial<Team>)=>Promise<void>;deleteTeam:(id:string)=>Promise<void>;
  addEmployee:(e:Omit<Employee,"id">)=>Promise<Employee>;updateEmployee:(id:string,e:Partial<Employee>)=>Promise<void>;deleteEmployee:(id:string)=>Promise<void>;
  addProduction:(p:Omit<Production,"id">)=>Promise<void>;updateProduction:(id:string,p:Partial<Production>)=>Promise<void>;deleteProduction:(id:string)=>Promise<void>;
  addExpense:(e:Omit<Expense,"id">)=>Promise<void>;updateExpense:(id:string,e:Partial<Expense>)=>Promise<void>;deleteExpense:(id:string)=>Promise<void>;
  addCashMovement:(m:Omit<CashMovement,"id">)=>Promise<void>;updateCashMovement:(id:string,m:Partial<CashMovement>)=>Promise<void>;deleteCashMovement:(id:string)=>Promise<void>;
  addEquipment:(e:any)=>Promise<void>;updateEquipment:(id:string,e:Partial<Equipment>)=>Promise<void>;deleteEquipment:(id:string)=>Promise<void>;
  addAdvance:(a:Omit<Advance,"id">)=>Promise<void>;deleteAdvance:(id:string)=>Promise<void>;
  requests:any[];equipmentStock:any[];siteStock:any[];equipmentTransfers:any[];equipmentMovements:any[];attendance:any[];salaryDeductions:any[];paySalaryDeduction:(id:string,amount:number)=>Promise<void>;saveAttendance:(records:any[])=>Promise<void>;createSortie:(d:any)=>Promise<any>;createRetour:(id:string,d:any)=>Promise<void>;transferToSite:(d:any)=>Promise<void>;addRequest:(r:any)=>Promise<void>;updateRequestStatus:(id:string,status:string)=>Promise<void>;updateRequest:(id:string,data:any)=>Promise<void>;
  updateGoldStock:(siteId:string,delta:number,isProd:boolean)=>void;
  addAppUser:(u:any)=>Promise<AppUser>;updateAppUser:(id:string,u:Partial<AppUser>)=>Promise<void>;deleteAppUser:(id:string)=>Promise<void>;
}
const DataContext=createContext<Ctx|undefined>(undefined);
const uid=()=>`${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
export function DataProvider({children}:{children:React.ReactNode}){
  const{isAuthenticated}=useAuth();
  const[sites,setSites]=useState<Site[]>([]);
  const[teams,setTeams]=useState<Team[]>([]);
  const[employees,setEmployees]=useState<Employee[]>([]);
  const[productions,setProductions]=useState<Production[]>([]);
  const[expenses,setExpenses]=useState<Expense[]>([]);
  const[cash,setCash]=useState<CashMovement[]>([]);
  const[equipment,setEquipment]=useState<Equipment[]>([]);const[equipmentStock,setEquipmentStock]=useState<any[]>([]);const[siteStock,setSiteStock]=useState<any[]>([]);const[equipmentTransfers,setEquipmentTransfers]=useState<any[]>([]);const[equipmentMovements,setEquipmentMovements]=useState<any[]>([]);const[attendance,setAttendance]=useState<any[]>([]);const[salaryDeductions,setSalaryDeductions]=useState<any[]>([]);
  const[advances,setAdvances]=useState<Advance[]>([]);
  const[appUsers,setAppUsers]=useState<AppUser[]>([]);
  const[requests,setRequests]=useState<any[]>([]);
  const[loading,setLoading]=useState(false);
  const load=useCallback(async()=>{
    if(!isAuthenticated)return;
    setLoading(true);
    try{
      const[s,t,e,p,x,c,q,sq,ss,et,em,at,sd,v,u,rq]=await Promise.all([
        api.getSites(),api.getTeams(),api.getEmployees(),
        api.getProductions(),api.getExpenses(),api.getCash(),
        api.getEquipment(),api.getEquipmentStock().catch(()=>[]),api.getSiteStock().catch(()=>[]),api.getEquipmentTransfers().catch(()=>[]),api.getEquipmentMovements().catch(()=>[]),api.getAttendance().catch(()=>[]),api.getSalaryDeductions().catch(()=>[]),api.getAdvances(),
        api.getUsers().catch(()=>[]),
        api.getRequests().catch(()=>[]),
      ]);
      setSites(s);setTeams(t);setEmployees(e);
      setProductions(p);setExpenses(x);setCash(c);
      setEquipment(q);setEquipmentStock(sq);setSiteStock(ss);setEquipmentTransfers(et);setEquipmentMovements(em);setAttendance(at);setSalaryDeductions(sd);setAdvances(v);setAppUsers(u);setRequests(rq);
    }catch(err){console.error("Load error:",err);}
    finally{setLoading(false);}
  },[isAuthenticated]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{
    if(!isAuthenticated)return;
    const id=setInterval(load,60000);
    return()=>clearInterval(id);
  },[isAuthenticated,load]);
  const addSite=useCallback(async(s:Omit<Site,"id">):Promise<Site>=>{const n={...s,id:`S${uid()}`};await api.createSite(n);await load();return n;},[load]);
  const updateSite=useCallback(async(id:string,s:Partial<Site>)=>{await api.updateSite(id,s);await load();},[load]);
  const deleteSite=useCallback(async(id:string)=>{await api.deleteSite(id);await load();},[load]);
  const addTeam=useCallback(async(t:Omit<Team,"id">):Promise<Team>=>{const n={...t,id:`T${uid()}`};await api.createTeam(n);await load();return n;},[load]);
  const updateTeam=useCallback(async(id:string,t:Partial<Team>)=>{await api.updateTeam(id,t);await load();},[load]);
  const deleteTeam=useCallback(async(id:string)=>{await api.deleteTeam(id);await load();},[load]);
  const addEmployee=useCallback(async(e:Omit<Employee,"id">):Promise<Employee>=>{const n={...e,id:`E${uid()}`,totalAdvances:0};await api.createEmployee(n);await load();return n;},[load]);
  const updateEmployee=useCallback(async(id:string,e:Partial<Employee>)=>{await api.updateEmployee(id,e);await load();},[load]);
  const deleteEmployee=useCallback(async(id:string)=>{await api.deleteEmployee(id);await load();},[load]);
  const addProduction=useCallback(async(p:Omit<Production,"id">)=>{const price=p.pricePerGram||65;const w=p.weight||0;await api.createProduction({...p,id:`P${uid()}`,pricePerGram:price,estimatedValue:w*price,value:w*price});await load();},[load]);
  const updateProduction=useCallback(async(_id:string,_p:Partial<Production>)=>{await load();},[load]);
  const deleteProduction=useCallback(async(id:string)=>{await api.deleteProduction(id);await load();},[load]);
  const addExpense=useCallback(async(e:Omit<Expense,"id">)=>{await api.createExpense({...e,id:`EX${uid()}`});await load();},[load]);
  const updateExpense=useCallback(async(_id:string,_e:Partial<Expense>)=>{await load();},[load]);
  const deleteExpense=useCallback(async(id:string)=>{await api.deleteExpense(id);await load();},[load]);
  const addCashMovement=useCallback(async(m:Omit<CashMovement,"id">)=>{await api.createCash({...m,id:`CM${uid()}`});await load();},[load]);
  const updateCashMovement=useCallback(async(_id:string,_m:Partial<CashMovement>)=>{await load();},[load]);
  const deleteCashMovement=useCallback(async(id:string)=>{await api.deleteCash(id);await load();},[load]);
  const addEquipment=useCallback(async(e:any)=>{await api.createEquipment({...e,id:e.id||`EQ${uid()}`});await load();},[load]);
  const updateEquipment=useCallback(async(id:string,e:Partial<Equipment>)=>{await api.updateEquipment(id,e);await load();},[load]);
  const deleteEquipment=useCallback(async(id:string)=>{await api.deleteEquipment(id);await load();},[load]);
  const addAdvance=useCallback(async(a:Omit<Advance,"id">)=>{await api.createAdvance({...a,id:`AV${uid()}`,status:"Validé"});await load();},[load]);
  const deleteAdvance=useCallback(async(id:string)=>{await api.deleteAdvance(id);await load();},[load]);
  const addRequest=useCallback(async(req:any)=>{await api.createRequest({...req,id:`REQ${uid()}`});await load();},[load]);
  const updateRequestStatus=useCallback(async(id:string,status:string)=>{await api.updateRequestStatus(id,status);await load();},[load]);const updateRequest=useCallback(async(id:string,data:any)=>{await api.updateRequest(id,data);await load();},[load]);const transferToSite=useCallback(async(d:any)=>{await api.transferToSite(d);await load();},[load]);const createSortie=useCallback(async(d:any)=>{const r=await api.createSortie(d);await load();return r;},[load]);const createRetour=useCallback(async(id:string,d:any)=>{await api.createRetour(id,d);await load();},[load]);const saveAttendance=useCallback(async(records:any[])=>{await api.saveAttendance(records);await load();},[load]);const paySalaryDeduction=useCallback(async(id:string,amount:number)=>{await api.paySalaryDeduction(id,amount);await load();},[load]);
  const updateGoldStock=useCallback(()=>{},[]);
  const addAppUser=useCallback(async(u:any):Promise<AppUser>=>{const n={...u,id:`AU${uid()}`,createdAt:new Date().toISOString().split("T")[0]};await api.createUser(n);await load();return n;},[load]);
  const updateAppUser=useCallback(async(_id:string,_u:Partial<AppUser>)=>{await load();},[load]);
  const deleteAppUser=useCallback(async(id:string)=>{await api.deleteUser(id);await load();},[load]);
  return<DataContext.Provider value={{
    sites,teams,employees,productions,expenses,cashMovements:cash,equipment,advances,goldStocks:[],appUsers,
    allSites:sites,allTeams:teams,allEmployees:employees,allProductions:productions,
    allExpenses:expenses,allCashMovements:cash,allEquipment:equipment,allAdvances:advances,
    loading,load,addSite,updateSite,deleteSite,addTeam,updateTeam,deleteTeam,
    addEmployee,updateEmployee,deleteEmployee,addProduction,updateProduction,deleteProduction,
    addExpense,updateExpense,deleteExpense,addCashMovement,updateCashMovement,deleteCashMovement,
    addEquipment,updateEquipment,deleteEquipment,addAdvance,deleteAdvance,updateGoldStock,equipmentStock,siteStock,equipmentTransfers,equipmentMovements,attendance,salaryDeductions,paySalaryDeduction,saveAttendance,createSortie,createRetour,transferToSite,requests,addRequest,updateRequestStatus,updateRequest,
    addAppUser,updateAppUser,deleteAppUser,
  }}>{children}</DataContext.Provider>;
}
export function useData():Ctx{
  const ctx=useContext(DataContext);
  if(!ctx)throw new Error("useData must be inside DataProvider");
  return ctx;
}
