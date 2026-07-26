/**
 * Cloudflare Pages Function — proxy KHGT (hindari CORS di browser).
 */
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "GET") {
    return json({ ok: false, message: "Method tidak didukung" }, 405);
  }

  const url = new URL(request.url);
  const lat = url.searchParams.get("lat") || "";
  const lng = url.searchParams.get("lng") || "";
  const date = url.searchParams.get("date") || "";

  if (!lat || !lng || !date) {
    return json({ ok: false, message: "Parameter lat/lng/date wajib" }, 400);
  }

  const target = `https://khgt.muhammadiyah.or.id/prayer?lat=${encodeURIComponent(
    lat
  )}&long=${encodeURIComponent(lng)}&date=${encodeURIComponent(date)}`;

  try {
    const res = await fetch(target, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MasjidTV/1.0",
      },
    });
    if (!res.ok) {
      return json({ ok: false, message: "Gagal menghubungi server KHGT" }, 502);
    }
    const data = await res.json();
    if (!data?.times) {
      return json({ ok: false, message: "Response KHGT tidak valid" }, 502);
    }
    return json({ ok: true, data });
  } catch (err) {
    return json(
      { ok: false, message: err.message || "Proxy KHGT gagal" },
      502
    );
  }
}
