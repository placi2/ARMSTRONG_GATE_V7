import type { Express } from "express";
import type { Pool } from "pg";

export function setupRequestsRoutes(app: Express, pool: Pool, auth: any, c: (row: any) => any) {

  // GET — liste filtrée selon le rôle
  app.get("/api/requests", auth, async (req: any, res) => {
    const u = req.user;
    let r;
    if (u.role === "chef_equipe") {
      r = await pool.query("SELECT * FROM requests WHERE requested_by=$1 ORDER BY created_at DESC", [u.id]);
    } else if (u.role === "rh") {
      r = await pool.query("SELECT * FROM requests WHERE type='avance_salaire' ORDER BY created_at DESC");
    } else if (u.role === "equipements") {
      r = await pool.query("SELECT * FROM requests WHERE type='equipement' ORDER BY created_at DESC");
    } else if (u.role === "logistique") {
      r = await pool.query("SELECT * FROM requests WHERE type='engin' ORDER BY created_at DESC");
    } else {
      r = await pool.query("SELECT * FROM requests ORDER BY created_at DESC");
    }
    res.json(r.rows.map(c));
  });

  // Route migration — corriger statuts remboursables
  app.post("/api/requests/fix-statuses", auth, async (_req, res) => {
    await pool.query(`
      UPDATE requests SET status='en_attente_equipement'
      WHERE type='equipement' AND equipment_subtype='remboursable' AND status='en_attente'
    `);
    res.json({ ok: true });
  });

  // POST — soumettre une demande
  app.post("/api/requests", auth, async (req: any, res) => {
    const {
      id, type, title, description,
      requestedBy, requestedByName,
      siteId, teamId,
      amount, employeeId, employeeName,
      equipmentSubtype, items
    } = req.body;

    const initialStatus = (type === "equipement" && equipmentSubtype === "remboursable")
      ? "en_attente_equipement"
      : "en_attente";

    await pool.query(
      `INSERT INTO requests(id,type,title,description,requested_by,requested_by_name,site_id,team_id,amount,employee_id,employee_name,equipment_subtype,items,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [id, type, title, description, requestedBy, requestedByName,
       siteId || null, teamId || null, amount || null,
       employeeId || null, employeeName || null,
       equipmentSubtype || null,
       items ? JSON.stringify(items) : null,
       initialStatus]
    );
    res.json({ ok: true });
  });

  // PUT — mise à jour
  app.put("/api/requests/:id", auth, async (req: any, res) => {
    const { status, approvedAmount, transferMode, transferNote } = req.body;

    const rq = await pool.query("SELECT * FROM requests WHERE id=$1", [req.params.id]);
    const dem = rq.rows[0];
    if (!dem) return res.status(404).json({ error: "Demande introuvable" });

    const finalAmount = approvedAmount || dem.approved_amount || dem.amount;

    await pool.query(
      `UPDATE requests SET status=$1,approved_amount=$2,transfer_mode=$3,transfer_note=$4,updated_at=NOW() WHERE id=$5`,
      [status, finalAmount || null, transferMode || null, transferNote || null, req.params.id]
    );

    if (status === "decaisse") {
      if (dem.type === "avance_salaire" && dem.employee_id) {
        const advId = `AV${Date.now()}`;
        await pool.query(
          "INSERT INTO advances(id,employee_id,date,amount,motif,status)VALUES($1,$2,NOW()::date::text,$3,$4,'Validé') ON CONFLICT DO NOTHING",
          [advId, dem.employee_id, finalAmount, `Avance via demande ${dem.id} — ${dem.employee_name || ""}`]
        );
        await pool.query(
          "UPDATE employees SET total_advances=total_advances+$1 WHERE id=$2",
          [finalAmount, dem.employee_id]
        );
        const expId = `EX${Date.now()}`;
        await pool.query(
          "INSERT INTO expenses(id,team_id,site_id,category,amount,date,comment)VALUES($1,$2,$3,$4,$5,NOW()::date::text,$6) ON CONFLICT DO NOTHING",
          [expId, dem.team_id, dem.site_id, "Avance Salaire", finalAmount,
           `Avance salaire — ${dem.employee_name || dem.employee_id} — demande ${dem.id}`]
        );
      } else {
        const expId = `EX${Date.now()}`;
        const category =
          dem.type === "carburant"     ? "Carburant" :
          dem.type === "equipement"    ? "Équipement" :
          dem.type === "engin"         ? "Logistique" :
          dem.type === "paiement_etat" ? "Paiement Agent État" : "Autre";
        await pool.query(
          "INSERT INTO expenses(id,team_id,site_id,category,amount,date,comment)VALUES($1,$2,$3,$4,$5,NOW()::date::text,$6) ON CONFLICT DO NOTHING",
          [expId, dem.team_id, dem.site_id, category, finalAmount,
           `Demande ${dem.type} — ${dem.title} — demande ${dem.id}`]
        );
      }
    }

    res.json({ ok: true });
  });
}

export async function createRequestsTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests(
      id TEXT PRIMARY KEY,
      type TEXT,
      title TEXT,
      description TEXT,
      requested_by TEXT,
      requested_by_name TEXT,
      site_id TEXT,
      team_id TEXT,
      amount NUMERIC,
      approved_amount NUMERIC,
      employee_id TEXT,
      employee_name TEXT,
      equipment_subtype TEXT,
      items JSONB,
      transfer_mode TEXT,
      transfer_note TEXT,
      status TEXT DEFAULT 'en_attente',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  const cols = [
    "team_id TEXT", "amount NUMERIC", "approved_amount NUMERIC",
    "employee_id TEXT", "employee_name TEXT",
    "equipment_subtype TEXT", "items JSONB",
    "transfer_mode TEXT", "transfer_note TEXT"
  ];
  for (const col of cols) {
    const [colName, colType] = col.split(" ");
    await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS ${colName} ${colType}`)
      .then(() => console.log(`✅ Column ${colName} OK`))
      .catch((e) => console.log(`⚠️ Column ${colName}: ${e.message}`));
  }
}