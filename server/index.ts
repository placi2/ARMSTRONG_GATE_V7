import express from "express";
import{createServer}from"http";
import path from"path";
import{fileURLToPath}from"url";
import cors from"cors";
import jwt from"jsonwebtoken";
import pg from"pg";
const{Pool}=pg;
import { setupRequestsRoutes, createRequestsTable } from "./routes-requests.js";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(cors());
app.use(express.json({limit:"10mb"}));
const pool=new Pool({
  connectionString:process.env.DATABASE_URL||"postgresql://amstrong_db_user:vvhGtv8mnRMT1zBpllwV5mM4GGWNXBGd@dpg-d7duunvavr4c73ec59t0-a/amstrong_db",
  ssl:{rejectUnauthorized:false},
});
const SECRET=process.env.JWT_SECRET||"armstrong_gate_2026";
function auth(req:any,res:any,next:any){
  const h=req.headers.authorization;
  if(!h?.startsWith("Bearer "))return res.status(401).json({error:"Non autorisé"});
  try{req.user=jwt.verify(h.split(" ")[1],SECRET);next();}
  catch{res.status(401).json({error:"Token invalide"});}
}
function c(row:any){
  const m:Record<string,string>={site_id:"siteId",team_id:"teamId",employee_id:"employeeId",monthly_salary:"monthlySalary",total_advances:"totalAdvances",join_date:"joinDate",price_per_gram:"pricePerGram",estimated_value:"estimatedValue",payment_method:"paymentMethod",site_name:"siteName",serial_number:"serialNumber",purchase_date:"purchaseDate",equipment_id:"equipmentId",created_at:"createdAt",requested_by:"requestedBy",requested_by_name:"requestedByName",stock_qty:"stockQty",qty_available:"qtyAvailable",qty_on_terrain:"qtyOnTerrain",unit_value:"unitValue",equipment_id:"equipmentId",equipment_name:"equipmentName",site_name:"siteName",updated_at:"updatedAt",approved_amount:"approvedAmount",employee_name:"employeeName",transfer_mode:"transferMode",transfer_note:"transferNote"};
  const out:any={};
  for(const[k,v]of Object.entries(row))out[m[k]||k]=v;
  if(out.estimatedValue!==undefined)out.value=parseFloat(out.estimatedValue)||0;
  ["monthlySalary","totalAdvances","amount","weight","pricePerGram","estimatedValue","value"].forEach(f=>{if(out[f]!==undefined)out[f]=parseFloat(out[f])||0;});
  return out;
}
async function initDB(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,role TEXT DEFAULT 'pdg',site_id TEXT,team_id TEXT,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS sites(id TEXT PRIMARY KEY,name TEXT,location TEXT,description TEXT,manager TEXT,status TEXT,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS teams(id TEXT PRIMARY KEY,name TEXT,site_id TEXT,manager TEXT,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS employees(id TEXT PRIMARY KEY,name TEXT,function TEXT,team_id TEXT,monthly_salary NUMERIC DEFAULT 0,join_date TEXT,role TEXT,status TEXT DEFAULT 'Actif',total_advances NUMERIC DEFAULT 0,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS productions(id TEXT PRIMARY KEY,team_id TEXT,site_id TEXT,date TEXT,weight NUMERIC,price_per_gram NUMERIC,estimated_value NUMERIC,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS expenses(id TEXT PRIMARY KEY,team_id TEXT,site_id TEXT,category TEXT,amount NUMERIC,date TEXT,comment TEXT,equipment_id TEXT,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS cash_movements(id TEXT PRIMARY KEY,site_id TEXT,site_name TEXT,type TEXT,amount NUMERIC,date TEXT,category TEXT,payment_method TEXT,comment TEXT,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS equipment(id TEXT PRIMARY KEY,site_id TEXT,team_id TEXT,name TEXT,type TEXT,status TEXT,value NUMERIC DEFAULT 0,serial_number TEXT,purchase_date TEXT,created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS advances(id TEXT PRIMARY KEY,employee_id TEXT,date TEXT,amount NUMERIC,motif TEXT,status TEXT DEFAULT 'Validé',created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS app_settings(id INTEGER PRIMARY KEY DEFAULT 1,gold_price_usd NUMERIC DEFAULT 65,currency TEXT DEFAULT 'USD',exchange_rate_cdf NUMERIC DEFAULT 2800,company_name TEXT DEFAULT 'ARMSTRONG GATE',custom_logo TEXT,updated_at TIMESTAMPTZ DEFAULT NOW());
  `);
  await createRequestsTable(pool);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS equipment_site_stock(
      id TEXT PRIMARY KEY,
      equipment_id TEXT,
      equipment_name TEXT,
      site_id TEXT,
      site_name TEXT,
      category TEXT DEFAULT 'remboursable',
      qty_available NUMERIC DEFAULT 0,
      qty_on_terrain NUMERIC DEFAULT 0,
      unit_value NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch(()=>{});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS equipment_transfers(
      id TEXT PRIMARY KEY,
      equipment_id TEXT,
      equipment_name TEXT,
      site_id TEXT,
      site_name TEXT,
      qty NUMERIC,
      unit_value NUMERIC DEFAULT 0,
      category TEXT,
      transferred_by TEXT,
      transferred_by_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  
  `).catch(()=>{});
  await pool.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS stock_qty NUMERIC DEFAULT 0`).catch(()=>{});
  await pool.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'remboursable'`).catch(()=>{});
  await pool.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'stock'`).catch(()=>{});
  const{rowCount}=await pool.query("SELECT id FROM users LIMIT 1");
  if(!rowCount){
    await pool.query(`INSERT INTO users(id,name,email,password,role)VALUES('AU001','Admin PDG','admin@goldmine.com','admin123','pdg'),('AU002','Manager Site 1','manager@goldmine.com','manager123','directeur')ON CONFLICT DO NOTHING`);
    await pool.query(`INSERT INTO sites(id,name,location,manager)VALUES('S001','Site Principal','Région Nord','Jean Dupont'),('S002','Site Secondaire','Région Est','Marie Sow')ON CONFLICT DO NOTHING`);
    await pool.query(`INSERT INTO teams(id,name,site_id)VALUES('T001','Équipe Excavation A','S001'),('T002','Équipe Excavation B','S001'),('T003','Équipe Raffinage','S001'),('T004','Équipe Plateau A','S002'),('T005','Équipe Plateau B','S002')ON CONFLICT DO NOTHING`);
    await pool.query(`INSERT INTO employees(id,name,function,team_id,monthly_salary,status)VALUES('E001','Moussa Diallo','Mineur','T001',350,'Actif'),('E002','Samba Ndiaye','Mineur','T001',350,'Actif'),('E003','Ousmane Cissé','Chef','T001',500,'Actif'),('E004','Mamadou Bah','Mineur','T002',320,'Actif'),('E005','Ibrahim Touré','Technicien','T004',400,'Actif')ON CONFLICT DO NOTHING`);
    await pool.query(`INSERT INTO app_settings(id)VALUES(1)ON CONFLICT DO NOTHING`);

  }
  console.log("✅ DB ready");
}
app.post("/api/auth/login",async(req,res)=>{
  const{email,password}=req.body;
  try{
    const r=await pool.query("SELECT * FROM users WHERE LOWER(email)=$1 AND password=$2",[email?.toLowerCase()?.trim(),password?.trim()]);
    if(!r.rows[0])return res.status(401).json({error:"Email ou mot de passe incorrect"});
    const u=r.rows[0];
    const token=jwt.sign({id:u.id,email:u.email,role:u.role,siteId:u.site_id,teamId:u.team_id},SECRET,{expiresIn:"30d"});
    res.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role,siteId:u.site_id,teamId:u.team_id}});
  }catch(e:any){res.status(500).json({error:e.message});}
});

app.post("/api/setup-force",async(req,res)=>{
  try{
    await pool.query(`INSERT INTO users(id,name,email,password,role)VALUES('AU001','Admin PDG','admin@goldmine.com','admin123','pdg'),('AU002','Manager Site 1','manager@goldmine.com','manager123','directeur')ON CONFLICT(email)DO UPDATE SET password=EXCLUDED.password,role=EXCLUDED.role`);
    await pool.query(`INSERT INTO sites(id,name,location,manager)VALUES('S001','Site Principal','Région Nord','Jean Dupont'),('S002','Site Secondaire','Région Est','Marie Sow')ON CONFLICT(id)DO NOTHING`);
    await pool.query(`INSERT INTO teams(id,name,site_id)VALUES('T001','Équipe Excavation A','S001'),('T002','Équipe Excavation B','S001'),('T003','Équipe Raffinage','S001'),('T004','Équipe Plateau A','S002'),('T005','Équipe Plateau B','S002')ON CONFLICT(id)DO NOTHING`);
    await pool.query(`INSERT INTO employees(id,name,function,team_id,monthly_salary,status)VALUES('E001','Moussa Diallo','Mineur','T001',350,'Actif'),('E002','Samba Ndiaye','Mineur','T001',350,'Actif'),('E003','Ousmane Cissé','Chef','T001',500,'Actif'),('E004','Mamadou Bah','Mineur','T002',320,'Actif'),('E005','Ibrahim Touré','Technicien','T004',400,'Actif')ON CONFLICT(id)DO NOTHING`);
    await pool.query(`INSERT INTO app_settings(id)VALUES(1)ON CONFLICT(id)DO NOTHING`);
    const r=await pool.query("SELECT id,name,email,role FROM users");
    res.json({ok:true,users:r.rows});
  }catch(e:any){res.status(500).json({error:e.message});}
});

app.get("/api/sites",auth,async(req:any,res)=>{const u=req.user;const r=u.role==="directeur"&&u.siteId?await pool.query("SELECT * FROM sites WHERE id=$1",[u.siteId]):await pool.query("SELECT * FROM sites ORDER BY name");res.json(r.rows.map(c));});
app.post("/api/sites",auth,async(req:any,res)=>{const{id,name,location,manager,description}=req.body;await pool.query("INSERT INTO sites(id,name,location,manager,description)VALUES($1,$2,$3,$4,$5)ON CONFLICT(id)DO UPDATE SET name=$2,location=$3,manager=$4,description=$5",[id,name,location,manager,description]);res.json({ok:true});});
app.put("/api/sites/:id",auth,async(req:any,res)=>{const{name,location,manager,description}=req.body;await pool.query("UPDATE sites SET name=$1,location=$2,manager=$3,description=$4 WHERE id=$5",[name,location,manager,description,req.params.id]);res.json({ok:true});});
app.delete("/api/sites/:id",auth,async(req,res)=>{await pool.query("DELETE FROM sites WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/teams",auth,async(req:any,res)=>{const u=req.user;const r=u.role==="directeur"&&u.siteId?await pool.query("SELECT * FROM teams WHERE site_id=$1 ORDER BY name",[u.siteId]):u.role==="chef_equipe"&&u.teamId?await pool.query("SELECT * FROM teams WHERE id=$1",[u.teamId]):await pool.query("SELECT * FROM teams ORDER BY name");res.json(r.rows.map(c));});
app.post("/api/teams",auth,async(req:any,res)=>{const{id,name,siteId,manager}=req.body;await pool.query("INSERT INTO teams(id,name,site_id,manager)VALUES($1,$2,$3,$4)ON CONFLICT(id)DO UPDATE SET name=$2,site_id=$3,manager=$4",[id,name,siteId,manager]);res.json({ok:true});});
app.put("/api/teams/:id",auth,async(req:any,res)=>{const{name,siteId,manager}=req.body;await pool.query("UPDATE teams SET name=$1,site_id=$2,manager=$3 WHERE id=$4",[name,siteId,manager,req.params.id]);res.json({ok:true});});
app.delete("/api/teams/:id",auth,async(req,res)=>{await pool.query("DELETE FROM teams WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/employees",auth,async(req:any,res)=>{const u=req.user;const r=u.role==="directeur"&&u.siteId?await pool.query("SELECT e.* FROM employees e JOIN teams t ON e.team_id=t.id WHERE t.site_id=$1 ORDER BY e.name",[u.siteId]):u.role==="chef_equipe"&&u.teamId?await pool.query("SELECT * FROM employees WHERE team_id=$1 ORDER BY name",[u.teamId]):await pool.query("SELECT * FROM employees ORDER BY name");res.json(r.rows.map(c));});
app.post("/api/employees",auth,async(req:any,res)=>{const{id,name,function:fn,teamId,monthlySalary,joinDate,status}=req.body;await pool.query("INSERT INTO employees(id,name,function,team_id,monthly_salary,join_date,status)VALUES($1,$2,$3,$4,$5,$6,$7)ON CONFLICT(id)DO UPDATE SET name=$2,function=$3,team_id=$4,monthly_salary=$5,join_date=$6,status=$7",[id,name,fn,teamId,monthlySalary||0,joinDate||null,status||"Actif"]);res.json({ok:true});});
app.put("/api/employees/:id",auth,async(req:any,res)=>{const{name,function:fn,teamId,monthlySalary,status,totalAdvances}=req.body;await pool.query("UPDATE employees SET name=$1,function=$2,team_id=$3,monthly_salary=$4,status=$5,total_advances=$6 WHERE id=$7",[name,fn,teamId,monthlySalary||0,status,totalAdvances||0,req.params.id]);res.json({ok:true});});
app.delete("/api/employees/:id",auth,async(req,res)=>{await pool.query("DELETE FROM employees WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/productions",auth,async(req:any,res)=>{const u=req.user;const r=u.role==="directeur"&&u.siteId?await pool.query("SELECT * FROM productions WHERE site_id=$1 ORDER BY date DESC",[u.siteId]):u.role==="chef_equipe"&&u.teamId?await pool.query("SELECT * FROM productions WHERE team_id=$1 ORDER BY date DESC",[u.teamId]):await pool.query("SELECT * FROM productions ORDER BY date DESC,created_at DESC");res.json(r.rows.map(c));});
app.post("/api/productions",auth,async(req:any,res)=>{const{id,teamId,siteId,date,weight,pricePerGram,estimatedValue}=req.body;await pool.query("INSERT INTO productions(id,team_id,site_id,date,weight,price_per_gram,estimated_value)VALUES($1,$2,$3,$4,$5,$6,$7)ON CONFLICT(id)DO NOTHING",[id,teamId,siteId,date,weight,pricePerGram,estimatedValue]);res.json({ok:true});});
app.delete("/api/productions/:id",auth,async(req,res)=>{await pool.query("DELETE FROM productions WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/expenses",auth,async(req:any,res)=>{const u=req.user;const r=u.role==="directeur"&&u.siteId?await pool.query("SELECT * FROM expenses WHERE site_id=$1 ORDER BY date DESC",[u.siteId]):await pool.query("SELECT * FROM expenses ORDER BY date DESC,created_at DESC");res.json(r.rows.map(c));});
app.post("/api/expenses",auth,async(req:any,res)=>{const{id,teamId,siteId,category,amount,date,comment,equipmentId}=req.body;await pool.query("INSERT INTO expenses(id,team_id,site_id,category,amount,date,comment,equipment_id)VALUES($1,$2,$3,$4,$5,$6,$7,$8)ON CONFLICT(id)DO NOTHING",[id,teamId,siteId,category,amount,date,comment,equipmentId||null]);res.json({ok:true});});
app.delete("/api/expenses/:id",auth,async(req,res)=>{await pool.query("DELETE FROM expenses WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/cash",auth,async(req:any,res)=>{const u=req.user;const r=u.role==="directeur"&&u.siteId?await pool.query("SELECT * FROM cash_movements WHERE site_id=$1 ORDER BY date DESC",[u.siteId]):await pool.query("SELECT * FROM cash_movements ORDER BY date DESC,created_at DESC");res.json(r.rows.map(c));});
app.post("/api/cash",auth,async(req:any,res)=>{const{id,siteId,siteName,type,amount,date,category,paymentMethod,comment}=req.body;await pool.query("INSERT INTO cash_movements(id,site_id,site_name,type,amount,date,category,payment_method,comment)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)ON CONFLICT(id)DO NOTHING",[id,siteId,siteName,type,amount,date,category,paymentMethod,comment]);res.json({ok:true});});
app.delete("/api/cash/:id",auth,async(req,res)=>{await pool.query("DELETE FROM cash_movements WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/equipment/stock",auth,async(_req,res)=>{const r=await pool.query("SELECT * FROM equipment WHERE stock_qty>0 ORDER BY name");res.json(r.rows.map(c));});app.get("/api/equipment",auth,async(req:any,res)=>{const u=req.user;const r=u.role==="directeur"&&u.siteId?await pool.query("SELECT * FROM equipment WHERE site_id=$1 ORDER BY name",[u.siteId]):await pool.query("SELECT * FROM equipment ORDER BY name");res.json(r.rows.map(c));});
app.post("/api/equipment",auth,async(req:any,res)=>{const{id,siteId,teamId,name,type,status,value,serialNumber,purchaseDate,category,stockQty}=req.body;await pool.query("INSERT INTO equipment(id,site_id,team_id,name,type,status,value,serial_number,purchase_date,category,stock_qty)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)ON CONFLICT(id)DO NOTHING",[id,siteId,teamId||null,name,type,status,value||0,serialNumber||null,purchaseDate||null,category||"remboursable",stockQty||0]);res.json({ok:true});});
app.put("/api/equipment/:id",auth,async(req:any,res)=>{const{status,stockQty,category}=req.body;const sets=[];const vals=[];let i=1;if(status!==undefined){sets.push(`status=$${i++}`);vals.push(status);}if(stockQty!==undefined){sets.push(`stock_qty=$${i++}`);vals.push(stockQty);}if(category!==undefined){sets.push(`category=$${i++}`);vals.push(category);}if(sets.length===0)return res.json({ok:true});vals.push(req.params.id);await pool.query(`UPDATE equipment SET ${sets.join(",")} WHERE id=$${i}`,[...vals]);res.json({ok:true});});
app.delete("/api/equipment/:id",auth,async(req,res)=>{await pool.query("DELETE FROM equipment WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/advances",auth,async(req:any,res)=>{const r=await pool.query("SELECT * FROM advances ORDER BY date DESC,created_at DESC");res.json(r.rows.map(c));});
app.post("/api/advances",auth,async(req:any,res)=>{const{id,employeeId,date,amount,motif}=req.body;await pool.query("INSERT INTO advances(id,employee_id,date,amount,motif)VALUES($1,$2,$3,$4,$5)ON CONFLICT(id)DO NOTHING",[id,employeeId,date,amount,motif]);await pool.query("UPDATE employees SET total_advances=total_advances+$1 WHERE id=$2",[amount,employeeId]);res.json({ok:true});});
app.delete("/api/advances/:id",auth,async(req,res)=>{await pool.query("DELETE FROM advances WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/users",auth,async(req:any,res)=>{const r=await pool.query("SELECT id,name,email,role,site_id,team_id,created_at FROM users ORDER BY created_at");res.json(r.rows.map(c));});
app.post("/api/users",auth,async(req:any,res)=>{const{id,name,email,password,role,siteId,teamId}=req.body;try{await pool.query("INSERT INTO users(id,name,email,password,role,site_id,team_id)VALUES($1,$2,$3,$4,$5,$6,$7)",[id,name,email?.toLowerCase(),password,role,siteId||null,teamId||null]);res.json({ok:true});}catch(e:any){if(e.code==="23505")return res.status(400).json({error:"Email déjà utilisé"});res.status(500).json({error:e.message});}});
app.delete("/api/users/:id",auth,async(req,res)=>{await pool.query("DELETE FROM users WHERE id=$1",[req.params.id]);res.json({ok:true});});
app.get("/api/settings",async(req,res)=>{const r=await pool.query("SELECT * FROM app_settings WHERE id=1");const s=r.rows[0]||{};res.json({goldPriceUsd:parseFloat(s.gold_price_usd)||65,goldPrice:parseFloat(s.gold_price_usd)||65,currency:s.currency||"USD",exchangeRateCdf:parseFloat(s.exchange_rate_cdf)||2800,exchangeRate:parseFloat(s.exchange_rate_cdf)||2800,companyName:s.company_name||"ARMSTRONG GATE",customLogo:s.custom_logo||null});});
app.put("/api/settings",auth,async(req:any,res)=>{const{goldPriceUsd,currency,exchangeRateCdf,companyName,customLogo}=req.body;await pool.query("INSERT INTO app_settings(id,gold_price_usd,currency,exchange_rate_cdf,company_name,custom_logo)VALUES(1,$1,$2,$3,$4,$5)ON CONFLICT(id)DO UPDATE SET gold_price_usd=$1,currency=$2,exchange_rate_cdf=$3,company_name=$4,custom_logo=$5,updated_at=NOW()",[goldPriceUsd,currency,exchangeRateCdf,companyName,customLogo||null]);res.json({ok:true});});
setupRequestsRoutes(app, pool, auth, c);
// Routes stock par site
app.get("/api/equipment-site-stock",auth,async(req:any,res)=>{const u=req.user;const r=u.siteId?await pool.query("SELECT * FROM equipment_site_stock WHERE site_id=$1 ORDER BY equipment_name",[u.siteId]):await pool.query("SELECT * FROM equipment_site_stock ORDER BY site_id,equipment_name");res.json(r.rows.map(c));});
app.post("/api/equipment-site-stock/transfer",auth,async(req:any,res)=>{const{equipmentId,equipmentName,siteId,siteName,qty,unitValue,category}=req.body;const existing=await pool.query("SELECT * FROM equipment_site_stock WHERE equipment_id=$1 AND site_id=$2",[equipmentId,siteId]);if(existing.rows.length>0){await pool.query("UPDATE equipment_site_stock SET qty_available=qty_available+$1,updated_at=NOW() WHERE equipment_id=$2 AND site_id=$3",[qty,equipmentId,siteId]);}else{const id=`ESS${Date.now()}`;await pool.query("INSERT INTO equipment_site_stock(id,equipment_id,equipment_name,site_id,site_name,category,qty_available,unit_value)VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[id,equipmentId,equipmentName,siteId,siteName,category||"remboursable",qty,unitValue||0]);}await pool.query("UPDATE equipment SET stock_qty=GREATEST(0,stock_qty-$1) WHERE id=$2",[qty,equipmentId]);const trId=`TR${Date.now()}`;await pool.query("INSERT INTO equipment_transfers(id,equipment_id,equipment_name,site_id,site_name,qty,unit_value,category,transferred_by,transferred_by_name)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[trId,equipmentId,equipmentName,siteId,siteName,qty,unitValue||0,category||"remboursable",(req as any).user?.id||"",(req as any).user?.name||""]);res.json({ok:true});});
app.get("/api/equipment-transfers",auth,async(_req,res)=>{const r=await pool.query("SELECT * FROM equipment_transfers ORDER BY created_at DESC");res.json(r.rows.map(c));});
const staticPath=path.resolve(__dirname,"public");
app.use(express.static(staticPath));
app.get("*",(_,res)=>res.sendFile(path.join(staticPath,"index.html")));
const PORT=parseInt(process.env.PORT||"3000",10);
createServer(app).listen(PORT,"0.0.0.0",async()=>{await initDB();console.log(`✅ Armstrong Gate on port ${PORT}`);});
