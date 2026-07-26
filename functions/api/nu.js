/**
 * Proxy jadwal NU / Kemenag via MyQuran.
 * Query: locationId (atau id kota MyQuran) + date=YYYY-MM-DD
 * Fallback lama: lat + lng + date (AlAdhan LFNU) jika locationId kosong.
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const locationId = url.searchParams.get("locationId") || url.searchParams.get("id");
  const date = url.searchParams.get("date");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return Response.json(
      { ok: false, message: "Parameter date (YYYY-MM-DD) wajib" },
      { status: 400 }
    );
  }

  try {
    if (locationId) {
      const target = `https://api.myquran.com/v3/sholat/jadwal/${encodeURIComponent(locationId)}/${date}`;
      const result = await fetch(target, { headers: { Accept: "application/json" } });
      if (!result.ok) throw new Error("Sumber MyQuran gagal");
      const payload = await result.json();
      const day = payload?.data?.jadwal?.[date];
      if (!day) throw new Error("Data jadwal MyQuran tidak valid");
      return Response.json({
        ok: true,
        source: "myquran",
        calendarUrl: "https://api.myquran.com/v3/cal/today",
        data: {
          jadwal: day,
          timings: {
            Imsak: day.imsak,
            Fajr: day.subuh,
            Sunrise: day.terbit,
            Dhuha: day.dhuha,
            Dhuhr: day.dzuhur,
            Asr: day.ashar,
            Maghrib: day.maghrib,
            Isha: day.isya,
          },
        },
      });
    }

    if (!lat || !lng) {
      return Response.json(
        { ok: false, message: "Parameter locationId atau lat+lng wajib" },
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
    const result = await fetch(target, { headers: { Accept: "application/json" } });
    if (!result.ok) throw new Error("Sumber AlAdhan gagal");
    const payload = await result.json();
    const timings = payload?.data?.timings;
    if (!timings) throw new Error("Data NU tidak valid");
    return Response.json({ ok: true, source: "aladhan", data: { timings } });
  } catch (error) {
    return Response.json(
      { ok: false, message: error.message || "Gagal mengambil jadwal NU" },
      { status: 502 }
    );
  }
}
