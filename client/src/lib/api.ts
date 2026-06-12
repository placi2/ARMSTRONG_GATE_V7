const BASE="/api";
const tok=()=>localStorage.getItem("ag_token")||"";
const hd=()=>({"Content-Type":"application/json","Authorization":`Bearer ${tok()}`});
async function r<T>(method:string,path:string,body?:any):Promise<T>{
  const res=await fetch(`${BASE}${path}`,{method,headers:hd(),body:body?JSON.stringify(body):undefined});
  if(!res.ok){const e=await res.json().catch(()=>({error:res.statusText}));throw new Error(e.error||"Erreur");}
  return res.json();
}
export const api={
  login:(email:string,pw:string)=>r<{token:string;user:any}>("POST","/auth/login",{email,password:pw}),
  getSites:()=>r<any[]>("GET","/sites"),createSite:(s:any)=>r<any>("POST","/sites",s),updateSite:(id:string,s:any)=>r<any>("PUT",`/sites/${id}`,s),deleteSite:(id:string)=>r<any>("DELETE",`/sites/${id}`),
  getTeams:()=>r<any[]>("GET","/teams"),createTeam:(t:any)=>r<any>("POST","/teams",t),updateTeam:(id:string,t:any)=>r<any>("PUT",`/teams/${id}`,t),deleteTeam:(id:string)=>r<any>("DELETE",`/teams/${id}`),
  getEmployees:()=>r<any[]>("GET","/employees"),createEmployee:(e:any)=>r<any>("POST","/employees",e),updateEmployee:(id:string,e:any)=>r<any>("PUT",`/employees/${id}`,e),deleteEmployee:(id:string)=>r<any>("DELETE",`/employees/${id}`),
  getProductions:()=>r<any[]>("GET","/productions"),createProduction:(p:any)=>r<any>("POST","/productions",p),deleteProduction:(id:string)=>r<any>("DELETE",`/productions/${id}`),
  getExpenses:()=>r<any[]>("GET","/expenses"),createExpense:(e:any)=>r<any>("POST","/expenses",e),deleteExpense:(id:string)=>r<any>("DELETE",`/expenses/${id}`),
  getCash:()=>r<any[]>("GET","/cash"),createCash:(m:any)=>r<any>("POST","/cash",m),deleteCash:(id:string)=>r<any>("DELETE",`/cash/${id}`),
  getEquipment:()=>r<any[]>("GET","/equipment"),createEquipment:(e:any)=>r<any>("POST","/equipment",e),updateEquipment:(id:string,e:any)=>r<any>("PUT",`/equipment/${id}`,e),deleteEquipment:(id:string)=>r<any>("DELETE",`/equipment/${id}`),
  getAdvances:()=>r<any[]>("GET","/advances"),createAdvance:(a:any)=>r<any>("POST","/advances",a),deleteAdvance:(id:string)=>r<any>("DELETE",`/advances/${id}`),
  getRequests:()=>r<any[]>("GET","/requests"),createRequest:(d:any)=>r<any>("POST","/requests",d),updateRequestStatus:(id:string,status:string)=>r<any>("PUT",`/requests/${id}`,{status}),
  getUsers:()=>r<any[]>("GET","/users"),createUser:(u:any)=>r<any>("POST","/users",u),deleteUser:(id:string)=>r<any>("DELETE",`/users/${id}`),
  getSettings:()=>r<any>("GET","/settings"),updateSettings:(s:any)=>r<any>("PUT","/settings",s),
};
