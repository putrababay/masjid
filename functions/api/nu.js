/**
 * Jadwal LFNU berdasarkan koordinat:
 * Subuh -20°, Isya -18°, tanpa ihtiyath otomatis.
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const date = url.searchParams.get("date");
  if (!lat || !lng || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return Response.json(
      { ok: false, message: "Parameter lat, lng, dan date wajib" },
      { status: 400 }
    );
  }

  const timestamp = Math.floor(new Date(`${date}T12:00:00Z`).getTime() / 1000);
  const target = new URL(`https://api.aladhan.com/v1/timings/${timestamp}`);
  target.searchParams.set("latitude", lat);
  target.searchParams.set("longitude", lng);
  target.searchParams.set("method", "99");
  target.searchParams.set("methodSettings", "20,null,18");
  target.searchParams.set("school", "0");

  try {
    const result = await fetch(target, { headers: { Accept: "application/json" } });
    if (!result.ok) throw new Error("Sumber NU gagal");
    const payload = await result.json();
    const timings = payload?.data?.timings;
    if (!timings) throw new Error("Data NU tidak valid");
    return Response.json({ ok: true, data: { timings } });
  } catch (error) {
    return Response.json(
      { ok: false, message: error.message || "Gagal mengambil jadwal NU" },
      { status: 502 }
    );
  }
}
