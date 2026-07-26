import {
  ApiError,
  assertSameOrigin,
  canManageMosque,
  cleanTime,
  clearSessionCookie,
  getSessionUser,
  hashPassword,
  hashToken,
  randomToken,
  requireUser,
  response,
  sessionCookie,
  verifyPassword,
} from "./_lib.js";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

function text(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function booleanInt(value) {
  return value === false || value === 0 || value === "0" ? 0 : 1;
}

function normalizeProvider(value) {
  return String(value || "").toUpperCase() === "KHGT" ? "KHGT" : "NU";
}

function makeMosqueId(name) {
  const slug = text(name, 40)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  return `${slug || "MASJID"}-${randomToken(4).toUpperCase()}`;
}

function publicUser(row) {
  return {
    id: row.id,
    mosqueId: row.mosqueId ?? row.mosque_id ?? null,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    isActive: row.status === "active",
  };
}

function rowToSettings(row, sliders = []) {
  if (!row) return null;
  let runningTexts = [];
  try {
    runningTexts = JSON.parse(row.running_texts || "[]");
  } catch {
    runningTexts = [];
  }
  return {
    mosqueId: row.id,
    masjidName: row.name,
    masjidAddress: row.address,
    locationId: row.location_id,
    khgt: { lat: row.latitude, lng: row.longitude },
    capacity: row.capacity,
    chairman: row.chairman,
    secretary: row.secretary,
    treasurer: row.treasurer,
    qrisTitle: row.qris_title,
    qrisImageUrl: row.qris_image_url,
    qrisCaption: row.qris_caption,
    gdriveFolderUrl: row.gdrive_folder_url,
    prayerProvider: row.prayer_provider,
    iqomahDurations: {
      subuh: row.iqomah_subuh,
      dzuhur: row.iqomah_dzuhur,
      ashar: row.iqomah_ashar,
      maghrib: row.iqomah_maghrib,
      isya: row.iqomah_isya,
    },
    balanceStart: row.balance_start,
    income: row.income,
    expense: row.expense,
    balanceEnd: row.balance_end,
    balanceUpdatedAt: row.balance_updated_at,
    runningTexts,
    slides: sliders.map((slide) => ({
      id: slide.id,
      type: slide.type,
      value: slide.value,
      title: slide.title,
      duration: slide.duration,
      isLive: Boolean(slide.is_live),
      sortOrder: slide.sort_order,
      isActive: Boolean(slide.is_active),
    })),
  };
}

async function getSliders(db, mosqueId, includeInactive = false) {
  const query = includeInactive
    ? `SELECT * FROM sliders WHERE mosque_id = ? ORDER BY sort_order, created_at`
    : `SELECT * FROM sliders
        WHERE mosque_id = ? AND is_active = 1
        ORDER BY sort_order, created_at`;
  const result = await db.prepare(query).bind(mosqueId).all();
  return result.results || [];
}

async function getMosqueSettings(db, mosqueId, includeInactive = false) {
  let row;
  if (mosqueId) {
    row = await db
      .prepare(
        `SELECT * FROM mosques
          WHERE id = ? ${includeInactive ? "" : "AND is_active = 1"}`
      )
      .bind(mosqueId)
      .first();
  } else {
    row = await db
      .prepare(
        `SELECT * FROM mosques
          ${includeInactive ? "" : "WHERE is_active = 1"}
          ORDER BY created_at LIMIT 1`
      )
      .first();
  }
  if (!row) return null;
  return rowToSettings(row, await getSliders(db, row.id, includeInactive));
}

async function createSession(db, user, request) {
  const token = randomToken(32);
  const tokenHash = await hashToken(token);
  await db
    .prepare(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, datetime('now', '+7 days'))`
    )
    .bind(tokenHash, user.id)
    .run();
  return response(
    {
      ok: true,
      user: publicUser(user),
      redirect:
        user.role === "superadmin" || user.role === "admin_masjid"
          ? "dashboard.html"
          : `index.html?mosque=${encodeURIComponent(user.mosqueId || "")}`,
    },
    200,
    { "Set-Cookie": sessionCookie(token, request, SESSION_SECONDS) }
  );
}

async function register(db, payload, request) {
  const username = text(payload.username, 40);
  const email = text(payload.email, 120).toLowerCase();
  const password = String(payload.password || "");
  const name = text(payload.name, 100);
  const mosqueName = text(payload.mosqueName, 150);
  const address = text(payload.address, 500);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!/^[a-zA-Z0-9._-]{4,40}$/.test(username)) {
    throw new ApiError(400, "Username minimal 4 karakter dan tanpa spasi");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Email tidak valid");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password minimal 8 karakter");
  }
  if (!name || !mosqueName || !address) {
    throw new ApiError(400, "Nama, masjid, dan alamat wajib diisi");
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError(400, "Koordinat masjid tidak valid");
  }

  const exists = await db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .bind(username, email)
    .first();
  if (exists) throw new ApiError(409, "Username atau email sudah digunakan");

  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM users")
    .first();
  const isFirstUser = Number(count?.total || 0) === 0;
  const userId = crypto.randomUUID();
  const seededMosque = isFirstUser
    ? await db.prepare("SELECT id FROM mosques ORDER BY created_at LIMIT 1").first()
    : null;
  const mosqueId = seededMosque?.id || makeMosqueId(mosqueName);
  const passwordHash = await hashPassword(password);
  const role = isFirstUser ? "superadmin" : "admin_masjid";
  const status = isFirstUser ? "active" : "pending";

  const statements = [];
  if (seededMosque) {
    statements.push(
      db
        .prepare(
          `UPDATE mosques SET name=?, address=?, latitude=?, longitude=?,
             updated_at=CURRENT_TIMESTAMP WHERE id=?`
        )
        .bind(mosqueName, address, latitude, longitude, mosqueId)
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO mosques
            (id, name, address, latitude, longitude, prayer_provider)
           VALUES (?, ?, ?, ?, ?, 'NU')`
        )
        .bind(mosqueId, mosqueName, address, latitude, longitude)
    );
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO users
          (id, mosque_id, username, email, password_hash, name, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        userId,
        mosqueId,
        username,
        email,
        passwordHash,
        name,
        role,
        status
      )
  );
  await db.batch(statements);

  if (isFirstUser) {
    return createSession(
      db,
      { id: userId, mosqueId, username, email, name, role, status },
      request
    );
  }
  return response({
    ok: true,
    pending: true,
    message: "Registrasi berhasil. Tunggu persetujuan superadmin.",
  });
}

async function login(db, payload, request) {
  const identity = text(payload.identity || payload.username, 120);
  const password = String(payload.password || "");
  const user = await db
    .prepare(
      `SELECT id, mosque_id AS mosqueId, username, email, password_hash,
              name, role, status
         FROM users
        WHERE username = ? OR email = ?`
    )
    .bind(identity, identity.toLowerCase())
    .first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new ApiError(401, "Username/email atau password salah");
  }
  if (user.status === "pending") {
    throw new ApiError(403, "Akun menunggu persetujuan superadmin");
  }
  if (user.status !== "active") {
    throw new ApiError(403, "Akun tidak aktif");
  }
  return createSession(db, user, request);
}

async function logout(db, request) {
  const token = request.headers.get("Cookie")?.match(/masjid_session=([^;]+)/)?.[1];
  if (token) {
    await db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await hashToken(decodeURIComponent(token)))
      .run();
  }
  return response(
    { ok: true },
    200,
    { "Set-Cookie": clearSessionCookie(request) }
  );
}

async function saveUser(db, payload, actor) {
  requireUser(actor, ["superadmin"]);
  const user = payload.user || {};
  const id = text(user.id, 50);
  const username = text(user.username, 40);
  const email = text(user.email, 120).toLowerCase();
  const name = text(user.name, 100);
  const role = ["superadmin", "admin_masjid", "viewer"].includes(user.role)
    ? user.role
    : "viewer";
  const status = ["pending", "active", "rejected", "disabled"].includes(
    user.status
  )
    ? user.status
    : "pending";
  const mosqueId = text(user.mosqueId, 50) || null;
  const password = String(user.password || "");

  if (!username || !email || !name) {
    throw new ApiError(400, "Username, email, dan nama wajib");
  }

  const duplicate = await db
    .prepare(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?"
    )
    .bind(username, email, id || "-")
    .first();
  if (duplicate) throw new ApiError(409, "Username atau email sudah digunakan");

  if (id) {
    if (password) {
      if (password.length < 8) throw new ApiError(400, "Password minimal 8 karakter");
      await db
        .prepare(
          `UPDATE users SET username=?, email=?, name=?, role=?, status=?,
             mosque_id=?, password_hash=?, updated_at=CURRENT_TIMESTAMP
           WHERE id=?`
        )
        .bind(
          username,
          email,
          name,
          role,
          status,
          mosqueId,
          await hashPassword(password),
          id
        )
        .run();
    } else {
      await db
        .prepare(
          `UPDATE users SET username=?, email=?, name=?, role=?, status=?,
             mosque_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
        )
        .bind(username, email, name, role, status, mosqueId, id)
        .run();
    }
  } else {
    if (password.length < 8) throw new ApiError(400, "Password minimal 8 karakter");
    await db
      .prepare(
        `INSERT INTO users
          (id, mosque_id, username, email, password_hash, name, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        mosqueId,
        username,
        email,
        await hashPassword(password),
        name,
        role,
        status
      )
      .run();
  }
  return response({ ok: true });
}

async function saveMosque(db, payload, actor) {
  const mosque = payload.mosque || payload.settings || {};
  const id = text(mosque.id || mosque.mosqueId, 50);
  if (!id || !canManageMosque(actor, id)) {
    throw new ApiError(403, "Tidak berhak mengubah masjid ini");
  }
  const iq = mosque.iqomahDurations || {};
  await db
    .prepare(
      `UPDATE mosques SET
        name=?, address=?, location_id=?, latitude=?, longitude=?,
        capacity=?, chairman=?, secretary=?, treasurer=?,
        qris_title=?, qris_image_url=?, qris_caption=?, gdrive_folder_url=?,
        prayer_provider=?, iqomah_subuh=?, iqomah_dzuhur=?, iqomah_ashar=?,
        iqomah_maghrib=?, iqomah_isya=?, balance_start=?, income=?, expense=?,
        balance_end=?, balance_updated_at=?, running_texts=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=?`
    )
    .bind(
      text(mosque.masjidName || mosque.name, 150),
      text(mosque.masjidAddress || mosque.address, 500),
      text(mosque.locationId, 100),
      Number(mosque.khgt?.lat ?? mosque.latitude),
      Number(mosque.khgt?.lng ?? mosque.longitude),
      text(mosque.capacity, 100),
      text(mosque.chairman, 100),
      text(mosque.secretary, 100),
      text(mosque.treasurer, 100),
      text(mosque.qrisTitle, 100),
      text(mosque.qrisImageUrl, 1000),
      text(mosque.qrisCaption, 200),
      text(mosque.gdriveFolderUrl, 1000),
      normalizeProvider(mosque.prayerProvider),
      Number(iq.subuh || 10),
      Number(iq.dzuhur || 10),
      Number(iq.ashar || 10),
      Number(iq.maghrib || 10),
      Number(iq.isya || 10),
      text(mosque.balanceStart, 50),
      text(mosque.income, 50),
      text(mosque.expense, 50),
      text(mosque.balanceEnd, 50),
      text(mosque.balanceUpdatedAt, 100),
      JSON.stringify(Array.isArray(mosque.runningTexts) ? mosque.runningTexts : []),
      id
    )
    .run();
  return response({ ok: true });
}

async function saveSlider(db, payload, actor) {
  const slider = payload.slider || {};
  const mosqueId = text(slider.mosqueId || payload.mosqueId, 50);
  if (!canManageMosque(actor, mosqueId)) {
    throw new ApiError(403, "Tidak berhak mengubah slider ini");
  }
  const type = ["image", "youtube", "gdrive"].includes(slider.type)
    ? slider.type
    : "image";
  if (!text(slider.value, 1000)) throw new ApiError(400, "Nilai slider wajib");
  const id = text(slider.id, 50) || crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO sliders
        (id, mosque_id, type, value, title, duration, is_live, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        type=excluded.type, value=excluded.value, title=excluded.title,
        duration=excluded.duration, is_live=excluded.is_live,
        sort_order=excluded.sort_order, is_active=excluded.is_active,
        updated_at=CURRENT_TIMESTAMP`
    )
    .bind(
      id,
      mosqueId,
      type,
      text(slider.value, 1000),
      text(slider.title, 150),
      Math.max(5, Number(slider.duration) || 15),
      booleanInt(slider.isLive),
      Number(slider.sortOrder) || 0,
      booleanInt(slider.isActive)
    )
    .run();
  return response({ ok: true, id });
}

async function deleteSlider(db, payload, actor) {
  const id = text(payload.id, 50);
  const row = await db
    .prepare("SELECT mosque_id FROM sliders WHERE id=?")
    .bind(id)
    .first();
  if (!row || !canManageMosque(actor, row.mosque_id)) {
    throw new ApiError(403, "Tidak berhak menghapus slider ini");
  }
  await db.prepare("DELETE FROM sliders WHERE id=?").bind(id).run();
  return response({ ok: true });
}

async function fetchMyQuranMonth(locationId, year, month) {
  const id = text(locationId, 100);
  if (!id) throw new ApiError(400, "locationId MyQuran wajib untuk impor NU");
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  const url = `https://api.myquran.com/v3/sholat/jadwal/${encodeURIComponent(id)}/${ym}`;
  const result = await fetch(url, { headers: { Accept: "application/json" } });
  if (!result.ok) throw new ApiError(502, `MyQuran gagal (${result.status}) untuk ${ym}`);
  const json = await result.json();
  const jadwal = json?.data?.jadwal;
  if (!jadwal || typeof jadwal !== "object") {
    throw new ApiError(502, "Data jadwal MyQuran tidak valid");
  }
  return Object.entries(jadwal).map(([date, day]) => ({
    date,
    imsak: cleanTime(day.imsak),
    subuh: cleanTime(day.subuh),
    terbit: cleanTime(day.terbit),
    dhuha: cleanTime(day.dhuha),
    dzuhur: cleanTime(day.dzuhur),
    ashar: cleanTime(day.ashar),
    maghrib: cleanTime(day.maghrib),
    isya: cleanTime(day.isya),
  }));
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let index = 0;
  async function worker() {
    while (index < values.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(values[current]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker())
  );
  return results;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchKhgtDay(latitude, longitude, date, retries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const url = new URL("https://khgt.muhammadiyah.or.id/prayer");
      url.searchParams.set("lat", String(latitude));
      url.searchParams.set("long", String(longitude));
      url.searchParams.set("date", date);
      const result = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "MasjidTV/1.0",
        },
      });
      if (!result.ok) {
        lastError = new Error(`HTTP ${result.status}`);
        await sleep(400 * attempt);
        continue;
      }
      const json = await result.json();
      const times = json.times || {};
      const subuh = cleanTime(times.subuh);
      const terbit = cleanTime(times.terbit);
      const dzuhur = cleanTime(times.zuhur || times.dzuhur);
      const ashar = cleanTime(times.ashar);
      const maghrib = cleanTime(times.maghrib);
      const isya = cleanTime(times.isya);
      if (!subuh || !dzuhur || !ashar || !maghrib || !isya) {
        lastError = new Error("Data waktu tidak lengkap");
        await sleep(300 * attempt);
        continue;
      }
      const [sh, sm] = subuh.split(":").map(Number);
      const imsakMinutes = sh * 60 + sm - 10;
      const imsakH = String(Math.floor(((imsakMinutes % 1440) + 1440) % 1440 / 60)).padStart(2, "0");
      const imsakM = String(((imsakMinutes % 1440) + 1440) % 1440 % 60).padStart(2, "0");
      return {
        date,
        imsak: `${imsakH}:${imsakM}`,
        subuh,
        terbit,
        dhuha: terbit,
        dzuhur,
        ashar,
        maghrib,
        isya,
      };
    } catch (error) {
      lastError = error;
      await sleep(500 * attempt);
    }
  }
  return {
    date,
    error: lastError?.message || "Gagal mengambil KHGT",
  };
}

async function fetchKhgtMonth(latitude, longitude, year, month) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates = Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${String(month).padStart(2, "0")}-${day}`;
  });
  // Concurrency rendah supaya server KHGT tidak sering 500.
  const rows = await mapWithConcurrency(dates, 2, (date) =>
    fetchKhgtDay(latitude, longitude, date, 3)
  );
  const items = rows.filter((row) => row && !row.error && row.subuh);
  const failed = rows.filter((row) => row && row.error).map((row) => row.date);
  return { items, failed };
}

async function importPrayerMonth(db, payload, actor) {
  requireUser(actor, ["superadmin", "admin_masjid"]);
  const provider = normalizeProvider(payload.provider);
  const year = Number(payload.year);
  const month = Number(payload.month);
  if (year < 2020 || year > 2100 || month < 1 || month > 12) {
    throw new ApiError(400, "Tahun/bulan tidak valid");
  }

  const defaultLocation = "cfa0860e83a4c3a763a7e62d825349f7";
  const locationId = text(payload.locationId, 100) || defaultLocation;
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const lat = Number.isFinite(latitude) ? latitude : -7.4467;
  const lng = Number.isFinite(longitude) ? longitude : 112.7181;

  let items = [];
  let failed = [];
  if (provider === "KHGT") {
    const result = await fetchKhgtMonth(lat, lng, year, month);
    items = result.items || [];
    failed = result.failed || [];
  } else {
    items = await fetchMyQuranMonth(locationId, year, month);
  }

  if (!items.length) {
    return response({
      ok: true,
      imported: 0,
      failed: failed.length,
      failedDates: failed.slice(0, 31),
      provider,
      year,
      month,
      message:
        provider === "KHGT"
          ? "Tidak ada jadwal KHGT tersimpan. Server KHGT sering gagal untuk tanggal tertentu (mis. setelah 2026-07-31)."
          : "Tidak ada jadwal NU yang bisa diimpor.",
    });
  }

  const source =
    provider === "KHGT"
      ? "khgt.muhammadiyah.or.id"
      : `api.myquran.com/v3 (${locationId})`;

  const statements = items.map((item) =>
    db
      .prepare(
        `INSERT INTO prayer_schedules
          (provider, prayer_date, imsak, subuh, terbit, dhuha,
           dzuhur, ashar, maghrib, isya, source, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(provider, prayer_date) DO UPDATE SET
          imsak=excluded.imsak, subuh=excluded.subuh, terbit=excluded.terbit,
          dhuha=excluded.dhuha, dzuhur=excluded.dzuhur, ashar=excluded.ashar,
          maghrib=excluded.maghrib, isya=excluded.isya, source=excluded.source,
          fetched_at=CURRENT_TIMESTAMP`
      )
      .bind(
        provider,
        item.date,
        item.imsak,
        item.subuh,
        item.terbit,
        item.dhuha,
        item.dzuhur,
        item.ashar,
        item.maghrib,
        item.isya,
        source
      )
  );
  await db.batch(statements);
  return response({
    ok: true,
    imported: items.length,
    failed: failed.length,
    failedDates: failed.slice(0, 31),
    provider,
    year,
    month,
    locationId: provider === "NU" ? locationId : undefined,
    latitude: provider === "KHGT" ? lat : undefined,
    longitude: provider === "KHGT" ? lng : undefined,
    message:
      failed.length > 0
        ? `Tersimpan ${items.length} hari, ${failed.length} hari dilewati (server sumber gagal).`
        : `Tersimpan ${items.length} hari.`,
  });
}

async function handleGet(db, url, actor) {
  const action = url.searchParams.get("action") || "ping";
  const mosqueId = text(url.searchParams.get("mosqueId") || url.searchParams.get("mosque"), 50);

  if (action === "ping") return response({ ok: true, engine: "d1-relational" });
  if (action === "me") {
    return response({ ok: true, authenticated: Boolean(actor), user: actor });
  }
  if (action === "mosques") {
    const result = await db
      .prepare(
        `SELECT id AS mosqueId, name AS masjidName, address AS masjidAddress
           FROM mosques WHERE is_active=1 ORDER BY name`
      )
      .all();
    return response({
      ok: true,
      mosques: (result.results || []).map((row) => ({
        ...row,
        previewUrl: `index.html?mosque=${encodeURIComponent(row.mosqueId)}`,
      })),
    });
  }
  if (action === "settings") {
    const settings = await getMosqueSettings(db, mosqueId);
    if (!settings) throw new ApiError(404, "Masjid tidak ditemukan");
    return response({ ok: true, settings, mosqueId: settings.mosqueId });
  }
  if (action === "today_schedule") {
    const provider = normalizeProvider(url.searchParams.get("provider"));
    const date = text(url.searchParams.get("date"), 10);
    const row = await db
      .prepare(
        `SELECT * FROM prayer_schedules
          WHERE provider=? AND prayer_date=?`
      )
      .bind(provider, date)
      .first();
    return response({ ok: true, schedule: row || null, provider, date });
  }
  if (action === "calendar_today") {
    try {
      const result = await fetch("https://api.myquran.com/v3/cal/today", {
        headers: { Accept: "application/json" },
      });
      if (!result.ok) throw new Error(`MyQuran cal status ${result.status}`);
      const json = await result.json();
      return response({ ok: true, calendar: json.data || null, raw: json });
    } catch (error) {
      throw new ApiError(502, error.message || "Gagal mengambil kalender MyQuran");
    }
  }

  requireUser(actor);
  if (action === "users") {
    requireUser(actor, ["superadmin"]);
    const result = await db
      .prepare(
        `SELECT id, mosque_id AS mosqueId, username, email, name, role, status,
                created_at AS createdAt
           FROM users ORDER BY created_at DESC`
      )
      .all();
    return response({ ok: true, users: (result.results || []).map(publicUser) });
  }
  if (action === "admin_mosques") {
    const query =
      actor.role === "superadmin"
        ? "SELECT id, name, address, prayer_provider FROM mosques ORDER BY name"
        : "SELECT id, name, address, prayer_provider FROM mosques WHERE id=?";
    const stmt =
      actor.role === "superadmin"
        ? db.prepare(query)
        : db.prepare(query).bind(actor.mosqueId);
    const result = await stmt.all();
    return response({ ok: true, mosques: result.results || [] });
  }
  if (action === "admin_settings") {
    const target = mosqueId || actor.mosqueId;
    if (
      actor.role !== "superadmin" &&
      actor.mosqueId !== target
    ) {
      throw new ApiError(403, "Akses ditolak");
    }
    const settings = await getMosqueSettings(db, target, true);
    if (!settings) throw new ApiError(404, "Masjid tidak ditemukan");
    return response({ ok: true, settings });
  }
  if (action === "sliders") {
    const target = mosqueId || actor.mosqueId;
    if (actor.role !== "superadmin" && actor.mosqueId !== target) {
      throw new ApiError(403, "Akses ditolak");
    }
    return response({ ok: true, sliders: await getSliders(db, target, true) });
  }
  if (action === "prayers") {
    const provider = normalizeProvider(url.searchParams.get("provider"));
    const from = text(url.searchParams.get("from"), 10) || "0000-01-01";
    const to = text(url.searchParams.get("to"), 10) || "9999-12-31";
    const result = await db
      .prepare(
        `SELECT * FROM prayer_schedules
          WHERE provider=? AND prayer_date BETWEEN ? AND ?
          ORDER BY prayer_date LIMIT 400`
      )
      .bind(provider, from, to)
      .all();
    return response({ ok: true, schedules: result.results || [], provider });
  }
  if (action === "dashboard_stats") {
    const target = mosqueId || actor.mosqueId;
    if (actor.role !== "superadmin" && actor.mosqueId !== target) {
      throw new ApiError(403, "Akses ditolak");
    }
    const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
    const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1;
    const monthPad = String(month).padStart(2, "0");
    const from = `${year}-${monthPad}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${monthPad}-${String(lastDay).padStart(2, "0")}`;

    const userCounts =
      actor.role === "superadmin"
        ? await db
            .prepare(
              `SELECT
                 COUNT(*) AS totalUsers,
                 SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS activeUsers,
                 SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pendingUsers,
                 SUM(CASE WHEN role='admin_masjid' THEN 1 ELSE 0 END) AS adminMasjidUsers
               FROM users`
            )
            .first()
        : await db
            .prepare(
              `SELECT
                 COUNT(*) AS totalUsers,
                 SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS activeUsers,
                 SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pendingUsers,
                 SUM(CASE WHEN role='admin_masjid' THEN 1 ELSE 0 END) AS adminMasjidUsers
               FROM users WHERE mosque_id=?`
            )
            .bind(target)
            .first();

    const mosqueCount =
      actor.role === "superadmin"
        ? await db.prepare("SELECT COUNT(*) AS total FROM mosques").first()
        : { total: target ? 1 : 0 };

    const sliderCount = await db
      .prepare("SELECT COUNT(*) AS total FROM sliders WHERE mosque_id=? AND is_active=1")
      .bind(target)
      .first();

    const nuDays = await db
      .prepare(
        `SELECT COUNT(*) AS total FROM prayer_schedules
          WHERE provider='NU' AND prayer_date BETWEEN ? AND ?`
      )
      .bind(from, to)
      .first();
    const khgtDays = await db
      .prepare(
        `SELECT COUNT(*) AS total FROM prayer_schedules
          WHERE provider='KHGT' AND prayer_date BETWEEN ? AND ?`
      )
      .bind(from, to)
      .first();

    const calendarRows = await db
      .prepare(
        `SELECT provider, prayer_date AS prayerDate, imsak, subuh, terbit, dhuha,
                dzuhur, ashar, maghrib, isya, source
           FROM prayer_schedules
          WHERE prayer_date BETWEEN ? AND ?
          ORDER BY prayer_date, provider`
      )
      .bind(from, to)
      .all();

    const byDate = {};
    for (const row of calendarRows.results || []) {
      if (!byDate[row.prayerDate]) byDate[row.prayerDate] = { NU: null, KHGT: null };
      byDate[row.prayerDate][row.provider] = row;
    }

    return response({
      ok: true,
      mosqueId: target,
      year,
      month,
      stats: {
        totalUsers: Number(userCounts?.totalUsers || 0),
        activeUsers: Number(userCounts?.activeUsers || 0),
        pendingUsers: Number(userCounts?.pendingUsers || 0),
        adminMasjidUsers: Number(userCounts?.adminMasjidUsers || 0),
        totalMosques: Number(mosqueCount?.total || 0),
        activeSliders: Number(sliderCount?.total || 0),
        nuDaysInMonth: Number(nuDays?.total || 0),
        khgtDaysInMonth: Number(khgtDays?.total || 0),
      },
      calendar: byDate,
    });
  }
  throw new ApiError(400, "Action tidak dikenali");
}

async function handlePost(db, request, payload, actor) {
  const action = payload.action;
  if (action === "register") return register(db, payload, request);
  if (action === "login") return login(db, payload, request);
  if (action === "logout") return logout(db, request);

  assertSameOrigin(request);
  requireUser(actor);

  if (action === "save_user") return saveUser(db, payload, actor);
  if (action === "delete_user") {
    requireUser(actor, ["superadmin"]);
    if (payload.id === actor.id) throw new ApiError(400, "Tidak dapat menghapus akun sendiri");
    await db.prepare("DELETE FROM users WHERE id=?").bind(text(payload.id, 50)).run();
    return response({ ok: true });
  }
  if (action === "save_mosque" || action === "save_settings") {
    return saveMosque(db, payload, actor);
  }
  if (action === "save_slider") return saveSlider(db, payload, actor);
  if (action === "delete_slider") return deleteSlider(db, payload, actor);
  if (action === "import_prayer_month") {
    return importPrayerMonth(db, payload, actor);
  }
  if (action === "save_prayer") {
    requireUser(actor, ["superadmin", "admin_masjid"]);
    const item = payload.schedule || {};
    const provider = normalizeProvider(item.provider);
    if (item.id) {
      await db
        .prepare(
          `UPDATE prayer_schedules SET provider=?, prayer_date=?, imsak=?,
             subuh=?, terbit=?, dhuha=?, dzuhur=?, ashar=?, maghrib=?, isya=?,
             source='manual', fetched_at=CURRENT_TIMESTAMP
           WHERE id=?`
        )
        .bind(
          provider,
          text(item.prayerDate, 10),
          cleanTime(item.imsak),
          cleanTime(item.subuh),
          cleanTime(item.terbit),
          cleanTime(item.dhuha),
          cleanTime(item.dzuhur),
          cleanTime(item.ashar),
          cleanTime(item.maghrib),
          cleanTime(item.isya),
          Number(item.id)
        )
        .run();
      return response({ ok: true });
    }
    await db
      .prepare(
        `INSERT INTO prayer_schedules
          (provider, prayer_date, imsak, subuh, terbit, dhuha,
           dzuhur, ashar, maghrib, isya, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
         ON CONFLICT(provider, prayer_date) DO UPDATE SET
          imsak=excluded.imsak, subuh=excluded.subuh, terbit=excluded.terbit,
          dhuha=excluded.dhuha, dzuhur=excluded.dzuhur, ashar=excluded.ashar,
          maghrib=excluded.maghrib, isya=excluded.isya, source='manual',
          fetched_at=CURRENT_TIMESTAMP`
      )
      .bind(
        provider,
        text(item.prayerDate, 10),
        cleanTime(item.imsak),
        cleanTime(item.subuh),
        cleanTime(item.terbit),
        cleanTime(item.dhuha),
        cleanTime(item.dzuhur),
        cleanTime(item.ashar),
        cleanTime(item.maghrib),
        cleanTime(item.isya)
      )
      .run();
    return response({ ok: true });
  }
  if (action === "delete_prayer") {
    requireUser(actor, ["superadmin", "admin_masjid"]);
    await db
      .prepare("DELETE FROM prayer_schedules WHERE id=?")
      .bind(Number(payload.id))
      .run();
    return response({ ok: true });
  }
  throw new ApiError(400, "Action tidak dikenali");
}

export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) {
    return response(
      { ok: false, message: "Binding D1 DB belum terhubung" },
      503
    );
  }
  try {
    const actor = await getSessionUser(env.DB, request);
    if (request.method === "GET") {
      return await handleGet(env.DB, new URL(request.url), actor);
    }
    if (request.method === "POST") {
      const payload = await request.json().catch(() => null);
      if (!payload) throw new ApiError(400, "Payload tidak valid");
      return await handlePost(env.DB, request, payload, actor);
    }
    return response({ ok: false, message: "Method tidak didukung" }, 405);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "api_error",
        action: new URL(request.url).searchParams.get("action"),
        message: error.message,
      })
    );
    return response(
      { ok: false, message: error.message || "Terjadi kesalahan server" },
      error.status || 500
    );
  }
}
