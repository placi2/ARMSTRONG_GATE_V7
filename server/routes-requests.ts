import type { Express } from "express";
import type { Pool } from "pg";

export function setupRequestsRoutes(app: Express, pool: Pool, auth: any, c: (row: any) => any) {
  app.get("/api/requests", auth, async (req: any, res) => {
    const r = await pool.query("SELECT * FROM requests ORDER BY created_at DESC");
    res.json(r.rows.map(c));
  });

  app.post("/api/requests", auth, async (req: any, res) => {
    const { id, type, title, description, requestedBy, requestedByName, siteId } = req.body;
    await pool.query(
      "INSERT INTO requests(id,type,title,description,requested_by,requested_by_name,site_id,status)VALUES($1,$2,$3,$4,$5,$6,$7,'en_attente')",
      [id, type, title, description, requestedBy, requestedByName, siteId || null]
    );
    res.json({ ok: true });
  });

  app.put("/api/requests/:id", auth, async (req: any, res) => {
    const { status } = req.body;
    await pool.query("UPDATE requests SET status=$1,updated_at=NOW() WHERE id=$2", [status, req.params.id]);
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
      status TEXT DEFAULT 'en_attente',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}