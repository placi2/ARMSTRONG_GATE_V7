import type { Express } from "express";
import type { Pool } from "pg";

export function setupRequestsRoutes(app: Express, pool: Pool, auth: any, c: (row: any) => any) {

  // GET — liste selon le rôle
  app.get("/api/requests", auth, async (req: any, res) => {
    const u = req.user;
    let r;
    if (u.role === "chef_equipe") {
      r = await pool.query("SELECT * FROM requests WHERE requested_by=$1 ORDER BY created_at DESC", [u.id]);
    } else {
      r = await pool.query("SELECT * FROM requests ORDER BY created_at DESC");
    }
    res.json(r.rows.map(c));
  });

  // POST — soumettre une demande
  app.post("/api/requests", auth, async (req: any, res) => {
    const { id, type, title, description, requestedBy, requestedByName, siteId, teamId, amount, employeeId, employeeName } = req.body;
    await pool.query(
      `INSERT INTO requests(id,type,title,description,requested_by,requested_by_name,site_id,team_id,amount,employee_id,employee_name,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'en_attente')`,
      [id, type, title, description, requestedBy, requestedByName, siteId || null, teamId || null, amount || null, employeeId || null, employeeName || null]
    );
    res.json({ ok: true });
  });

  // PUT — mise à jour statut + montant modifié + mode décaissement
  app.put("/api/requests/:id", auth, async (req: any, res) => {
    const { status, approvedAmount, transferMode, transferNote } = req.body;
    await pool.query(
      `UPDATE requests SET status=$1,approved_amount=$2,transfer_mode=$3,transfer_note=$4,updated_at=NOW() WHERE id=$5`,
      [status, approvedAmount || null, transferMode || null, transferNote || null, req.params.id]
    );

    // Si décaissé → créer automatiquement une dépense ou avance
    if (status === "decaisse") {
      const rq = await pool.query("SELECT * FROM requests WHERE id=$1", [req.params.id]);
      const req2 = rq.rows[0];
      if (req2) {
        const finalAmount = req2.approved_amount || req2.amount;
        if (req2.type === "avance_salaire" && req2.employee_id) {
          // Créer une avance automatiquement
          const advId = `AV${Date.now()}`;
          await pool.query(
            "INSERT INTO advances(id,employee_id,date,amount,motif,status)VALUES($1,$2,NOW()::date::text,$3,$4,'Validé') ON CONFLICT DO NOTHING",
            [advId, req2.employee_id, finalAmount, `Avance via demande ${req2.id}`]
          );
          await pool.query("UPDATE employees SET total_advances=total_advances+$1 WHERE id=$2", [finalAmount, req2.employee_id]);
        } else {
          // Créer une dépense automatiquement
          const expId = `EX${Date.now()}`;
          const category = req2.type === "carburant" ? "Carburant" : req2.type === "equipement" ? "Équipement" : req2.type === "engin" ? "Logistique" : "Autre";
          await pool.query(
            "INSERT INTO expenses(id,team_id,site_id,category,amount,date,comment)VALUES($1,$2,$3,$4,$5,NOW()::date::text,$6) ON CONFLICT DO NOTHING",
            [expId, req2.team_id, req2.site_id, category, finalAmount, `Demande ${req2.type} — ${req2.title}`]
          );
        }
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
      transfer_mode TEXT,
      transfer_note TEXT,
      status TEXT DEFAULT 'en_attente',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  // Ajouter les colonnes manquantes si la table existe déjà
  const cols = ["team_id TEXT","amount NUMERIC","approved_amount NUMERIC","employee_id TEXT","employee_name TEXT","transfer_mode TEXT","transfer_note TEXT"];
  for (const col of cols) {
    const name = col.split(" ")[0];
    await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS ${col}`).catch(()=>{});
  }
}