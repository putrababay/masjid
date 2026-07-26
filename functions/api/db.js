/**
 * Cloudflare Pages Function — API database (D1).
 * Binding D1: DB (lihat wrangler.toml)
 *
 * Tabel:
 *   CREATE TABLE IF NOT EXISTS kv_store (
 *     key TEXT PRIMARY KEY,
 *     value TEXT NOT NULL,
 *     updated_at TEXT DEFAULT CURRENT_TIMESTAMP
 *   );
 */
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

async function ensureTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
}

async function readAll(db) {
  await ensureTable(db);
  const row = await db
    .prepare("SELECT value FROM kv_store WHERE key = ?")
    .bind("masjid_db")
    .first();
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

async function writeAll(db, data) {
  await ensureTable(db);
  await db
    .prepare(
      `INSERT INTO kv_store (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
    )
    .bind("masjid_db", JSON.stringify(data))
    .run();
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (!env.DB) {
    return json(
      {
        ok: false,
        message:
          "D1 belum terhubung. Bind database sebagai DB di wrangler.toml / Cloudflare dashboard.",
      },
      503
    );
  }

  const url = new URL(request.url);

  if (request.method === "GET") {
    const action = url.searchParams.get("action") || "ping";
    if (action === "ping") return json({ ok: true, engine: "d1" });
    if (action === "all") {
      const data = await readAll(env.DB);
      return json({ ok: true, data });
    }
    return json({ ok: false, message: "Action tidak dikenali" }, 400);
  }

  if (request.method === "POST") {
    const payload = await request.json().catch(() => null);
    if (!payload) return json({ ok: false, message: "Payload tidak valid" }, 400);

    if (payload.action === "replace_all") {
      if (!payload.data) {
        return json({ ok: false, message: "data wajib" }, 400);
      }
      await writeAll(env.DB, payload.data);
      return json({ ok: true, message: "Tersimpan ke D1" });
    }

    return json({ ok: false, message: "Action tidak dikenali" }, 400);
  }

  return json({ ok: false, message: "Method tidak didukung" }, 405);
}
