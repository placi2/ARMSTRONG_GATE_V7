/**
 * JSONBin.io sync layer
 * Shares all app data between users in real-time
 */

const BIN_ID  = import.meta.env.VITE_JSONBIN_BIN_ID  as string;
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY as string;
const URL     = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export const isConfigured = () => !!(BIN_ID && API_KEY && BIN_ID !== "votre_bin_id");

/** Keys we sync to JSONBin */
export const SYNC_KEYS = [
  "ag_sites","ag_teams","ag_employees","ag_productions",
  "ag_expenses","ag_cashMovements","ag_equipment",
  "ag_advances","ag_goldStocks","ag_appUsers","ag_settings",
];

/** Read all data from JSONBin */
export async function readFromCloud(): Promise<Record<string,any> | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${URL}/latest`, {
      headers: {
        "X-Master-Key": API_KEY,
        "X-Bin-Meta": "false",
      },
    });
    if (!res.ok) {
      console.warn("[JSONBin] Read failed:", res.status);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn("[JSONBin] Read error:", e);
    return null;
  }
}

/** Write all data to JSONBin */
export async function writeToCloud(data: Record<string,any>): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY,
        "X-Bin-Versioning": "false",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) console.warn("[JSONBin] Write failed:", res.status);
    return res.ok;
  } catch (e) {
    console.warn("[JSONBin] Write error:", e);
    return false;
  }
}

/** Collect current localStorage data into one object for JSONBin */
export function collectLocalData(): Record<string,any> {
  const out: Record<string,any> = {};
  for (const key of SYNC_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      out[key] = raw ? JSON.parse(raw) : [];
    } catch {
      out[key] = [];
    }
  }
  return out;
}

/** Apply cloud data into localStorage */
export function applyCloudData(cloud: Record<string,any>) {
  for (const key of SYNC_KEYS) {
    if (cloud[key] !== undefined) {
      try {
        localStorage.setItem(key, JSON.stringify(cloud[key]));
      } catch {}
    }
  }
}
