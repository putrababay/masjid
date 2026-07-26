var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-2kEhas/functionsWorker-0.8952514375831948.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
async function onRequestGet(context) {
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
  const timestamp = Math.floor((/* @__PURE__ */ new Date(`${date}T12:00:00Z`)).getTime() / 1e3);
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
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
var encoder = new TextEncoder();
function response(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}
__name(response, "response");
__name2(response, "response");
function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return bytesToBase64Url(value);
}
__name(randomToken, "randomToken");
__name2(randomToken, "randomToken");
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(bytesToBase64Url, "bytesToBase64Url");
__name2(bytesToBase64Url, "bytesToBase64Url");
async function sha256(value) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value))
  );
}
__name(sha256, "sha256");
__name2(sha256, "sha256");
async function hashPassword(password) {
  const iterations = 21e4;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      256
    )
  );
  return `${iterations}.${bytesToBase64Url(salt)}.${bytesToBase64Url(hash)}`;
}
__name(hashPassword, "hashPassword");
__name2(hashPassword, "hashPassword");
function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
__name(base64UrlToBytes, "base64UrlToBytes");
__name2(base64UrlToBytes, "base64UrlToBytes");
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
  return result === 0;
}
__name(constantTimeEqual, "constantTimeEqual");
__name2(constantTimeEqual, "constantTimeEqual");
async function verifyPassword(password, encoded) {
  const [iterationsText, saltText, expectedText] = String(encoded).split(".");
  const iterations = Number(iterationsText);
  if (!iterations || !saltText || !expectedText) return false;
  const salt = base64UrlToBytes(saltText);
  const expected = base64UrlToBytes(expectedText);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const actual = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      expected.length * 8
    )
  );
  return constantTimeEqual(actual, expected);
}
__name(verifyPassword, "verifyPassword");
__name2(verifyPassword, "verifyPassword");
async function hashToken(token) {
  return bytesToBase64Url(await sha256(token));
}
__name(hashToken, "hashToken");
__name2(hashToken, "hashToken");
function readCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}
__name(readCookie, "readCookie");
__name2(readCookie, "readCookie");
function sessionCookie(token, request, maxAge = 60 * 60 * 24 * 7) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `masjid_session=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
__name(sessionCookie, "sessionCookie");
__name2(sessionCookie, "sessionCookie");
function clearSessionCookie(request) {
  return sessionCookie("", request, 0);
}
__name(clearSessionCookie, "clearSessionCookie");
__name2(clearSessionCookie, "clearSessionCookie");
function assertSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return;
  if (new URL(origin).host !== new URL(request.url).host) {
    throw new ApiError(403, "Origin tidak diizinkan");
  }
}
__name(assertSameOrigin, "assertSameOrigin");
__name2(assertSameOrigin, "assertSameOrigin");
var ApiError = class extends Error {
  static {
    __name(this, "ApiError");
  }
  static {
    __name2(this, "ApiError");
  }
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
async function getSessionUser(db, request) {
  const token = readCookie(request, "masjid_session");
  if (!token) return null;
  const tokenHash = await hashToken(token);
  return db.prepare(
    `SELECT u.id, u.mosque_id AS mosqueId, u.username, u.email, u.name,
              u.role, u.status
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
  ).bind(tokenHash).first();
}
__name(getSessionUser, "getSessionUser");
__name2(getSessionUser, "getSessionUser");
function requireUser(user, roles = []) {
  if (!user) throw new ApiError(401, "Silakan login");
  if (user.status !== "active") throw new ApiError(403, "Akun belum aktif");
  if (roles.length && !roles.includes(user.role)) {
    throw new ApiError(403, "Hak akses tidak mencukupi");
  }
  return user;
}
__name(requireUser, "requireUser");
__name2(requireUser, "requireUser");
function canManageMosque(user, mosqueId) {
  return user?.role === "superadmin" || user?.role === "admin_masjid" && user?.mosqueId === mosqueId;
}
__name(canManageMosque, "canManageMosque");
__name2(canManageMosque, "canManageMosque");
function cleanTime(value) {
  const match2 = String(value || "").match(/\d{2}:\d{2}/);
  return match2 ? match2[0] : "";
}
__name(cleanTime, "cleanTime");
__name2(cleanTime, "cleanTime");
var SESSION_SECONDS = 60 * 60 * 24 * 7;
function text(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
__name(text, "text");
__name2(text, "text");
function booleanInt(value) {
  return value === false || value === 0 || value === "0" ? 0 : 1;
}
__name(booleanInt, "booleanInt");
__name2(booleanInt, "booleanInt");
function normalizeProvider(value) {
  return String(value || "").toUpperCase() === "KHGT" ? "KHGT" : "NU";
}
__name(normalizeProvider, "normalizeProvider");
__name2(normalizeProvider, "normalizeProvider");
function makeMosqueId(name) {
  const slug = text(name, 40).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
  return `${slug || "MASJID"}-${randomToken(4).toUpperCase()}`;
}
__name(makeMosqueId, "makeMosqueId");
__name2(makeMosqueId, "makeMosqueId");
function publicUser(row) {
  return {
    id: row.id,
    mosqueId: row.mosqueId ?? row.mosque_id ?? null,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    isActive: row.status === "active"
  };
}
__name(publicUser, "publicUser");
__name2(publicUser, "publicUser");
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
      isya: row.iqomah_isya
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
      isActive: Boolean(slide.is_active)
    }))
  };
}
__name(rowToSettings, "rowToSettings");
__name2(rowToSettings, "rowToSettings");
async function getSliders(db, mosqueId, includeInactive = false) {
  const query = includeInactive ? `SELECT * FROM sliders WHERE mosque_id = ? ORDER BY sort_order, created_at` : `SELECT * FROM sliders
        WHERE mosque_id = ? AND is_active = 1
        ORDER BY sort_order, created_at`;
  const result = await db.prepare(query).bind(mosqueId).all();
  return result.results || [];
}
__name(getSliders, "getSliders");
__name2(getSliders, "getSliders");
async function getMosqueSettings(db, mosqueId, includeInactive = false) {
  let row;
  if (mosqueId) {
    row = await db.prepare(
      `SELECT * FROM mosques
          WHERE id = ? ${includeInactive ? "" : "AND is_active = 1"}`
    ).bind(mosqueId).first();
  } else {
    row = await db.prepare(
      `SELECT * FROM mosques
          ${includeInactive ? "" : "WHERE is_active = 1"}
          ORDER BY created_at LIMIT 1`
    ).first();
  }
  if (!row) return null;
  return rowToSettings(row, await getSliders(db, row.id, includeInactive));
}
__name(getMosqueSettings, "getMosqueSettings");
__name2(getMosqueSettings, "getMosqueSettings");
async function createSession(db, user, request) {
  const token = randomToken(32);
  const tokenHash = await hashToken(token);
  await db.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, datetime('now', '+7 days'))`
  ).bind(tokenHash, user.id).run();
  return response(
    {
      ok: true,
      user: publicUser(user),
      redirect: user.role === "superadmin" ? "user_masjid.html" : user.role === "admin_masjid" ? "admin.html" : `index.html?mosque=${encodeURIComponent(user.mosqueId || "")}`
    },
    200,
    { "Set-Cookie": sessionCookie(token, request, SESSION_SECONDS) }
  );
}
__name(createSession, "createSession");
__name2(createSession, "createSession");
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
  const exists = await db.prepare("SELECT id FROM users WHERE username = ? OR email = ?").bind(username, email).first();
  if (exists) throw new ApiError(409, "Username atau email sudah digunakan");
  const count = await db.prepare("SELECT COUNT(*) AS total FROM users").first();
  const isFirstUser = Number(count?.total || 0) === 0;
  const userId = crypto.randomUUID();
  const seededMosque = isFirstUser ? await db.prepare("SELECT id FROM mosques ORDER BY created_at LIMIT 1").first() : null;
  const mosqueId = seededMosque?.id || makeMosqueId(mosqueName);
  const passwordHash = await hashPassword(password);
  const role = isFirstUser ? "superadmin" : "admin_masjid";
  const status = isFirstUser ? "active" : "pending";
  const statements = [];
  if (seededMosque) {
    statements.push(
      db.prepare(
        `UPDATE mosques SET name=?, address=?, latitude=?, longitude=?,
             updated_at=CURRENT_TIMESTAMP WHERE id=?`
      ).bind(mosqueName, address, latitude, longitude, mosqueId)
    );
  } else {
    statements.push(
      db.prepare(
        `INSERT INTO mosques
            (id, name, address, latitude, longitude, prayer_provider)
           VALUES (?, ?, ?, ?, ?, 'NU')`
      ).bind(mosqueId, mosqueName, address, latitude, longitude)
    );
  }
  statements.push(
    db.prepare(
      `INSERT INTO users
          (id, mosque_id, username, email, password_hash, name, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
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
    message: "Registrasi berhasil. Tunggu persetujuan superadmin."
  });
}
__name(register, "register");
__name2(register, "register");
async function login(db, payload, request) {
  const identity = text(payload.identity || payload.username, 120);
  const password = String(payload.password || "");
  const user = await db.prepare(
    `SELECT id, mosque_id AS mosqueId, username, email, password_hash,
              name, role, status
         FROM users
        WHERE username = ? OR email = ?`
  ).bind(identity, identity.toLowerCase()).first();
  if (!user || !await verifyPassword(password, user.password_hash)) {
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
__name(login, "login");
__name2(login, "login");
async function logout(db, request) {
  const token = request.headers.get("Cookie")?.match(/masjid_session=([^;]+)/)?.[1];
  if (token) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await hashToken(decodeURIComponent(token))).run();
  }
  return response(
    { ok: true },
    200,
    { "Set-Cookie": clearSessionCookie(request) }
  );
}
__name(logout, "logout");
__name2(logout, "logout");
async function saveUser(db, payload, actor) {
  requireUser(actor, ["superadmin"]);
  const user = payload.user || {};
  const id = text(user.id, 50);
  const username = text(user.username, 40);
  const email = text(user.email, 120).toLowerCase();
  const name = text(user.name, 100);
  const role = ["superadmin", "admin_masjid", "viewer"].includes(user.role) ? user.role : "viewer";
  const status = ["pending", "active", "rejected", "disabled"].includes(
    user.status
  ) ? user.status : "pending";
  const mosqueId = text(user.mosqueId, 50) || null;
  const password = String(user.password || "");
  if (!username || !email || !name) {
    throw new ApiError(400, "Username, email, dan nama wajib");
  }
  const duplicate = await db.prepare(
    "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?"
  ).bind(username, email, id || "-").first();
  if (duplicate) throw new ApiError(409, "Username atau email sudah digunakan");
  if (id) {
    if (password) {
      if (password.length < 8) throw new ApiError(400, "Password minimal 8 karakter");
      await db.prepare(
        `UPDATE users SET username=?, email=?, name=?, role=?, status=?,
             mosque_id=?, password_hash=?, updated_at=CURRENT_TIMESTAMP
           WHERE id=?`
      ).bind(
        username,
        email,
        name,
        role,
        status,
        mosqueId,
        await hashPassword(password),
        id
      ).run();
    } else {
      await db.prepare(
        `UPDATE users SET username=?, email=?, name=?, role=?, status=?,
             mosque_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
      ).bind(username, email, name, role, status, mosqueId, id).run();
    }
  } else {
    if (password.length < 8) throw new ApiError(400, "Password minimal 8 karakter");
    await db.prepare(
      `INSERT INTO users
          (id, mosque_id, username, email, password_hash, name, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      mosqueId,
      username,
      email,
      await hashPassword(password),
      name,
      role,
      status
    ).run();
  }
  return response({ ok: true });
}
__name(saveUser, "saveUser");
__name2(saveUser, "saveUser");
async function saveMosque(db, payload, actor) {
  const mosque = payload.mosque || payload.settings || {};
  const id = text(mosque.id || mosque.mosqueId, 50);
  if (!id || !canManageMosque(actor, id)) {
    throw new ApiError(403, "Tidak berhak mengubah masjid ini");
  }
  const iq = mosque.iqomahDurations || {};
  await db.prepare(
    `UPDATE mosques SET
        name=?, address=?, location_id=?, latitude=?, longitude=?,
        capacity=?, chairman=?, secretary=?, treasurer=?,
        qris_title=?, qris_image_url=?, qris_caption=?, gdrive_folder_url=?,
        prayer_provider=?, iqomah_subuh=?, iqomah_dzuhur=?, iqomah_ashar=?,
        iqomah_maghrib=?, iqomah_isya=?, balance_start=?, income=?, expense=?,
        balance_end=?, balance_updated_at=?, running_texts=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=?`
  ).bind(
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
    text(mosque.qrisImageUrl, 1e3),
    text(mosque.qrisCaption, 200),
    text(mosque.gdriveFolderUrl, 1e3),
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
  ).run();
  return response({ ok: true });
}
__name(saveMosque, "saveMosque");
__name2(saveMosque, "saveMosque");
async function saveSlider(db, payload, actor) {
  const slider = payload.slider || {};
  const mosqueId = text(slider.mosqueId || payload.mosqueId, 50);
  if (!canManageMosque(actor, mosqueId)) {
    throw new ApiError(403, "Tidak berhak mengubah slider ini");
  }
  const type = ["image", "youtube", "gdrive"].includes(slider.type) ? slider.type : "image";
  if (!text(slider.value, 1e3)) throw new ApiError(400, "Nilai slider wajib");
  const id = text(slider.id, 50) || crypto.randomUUID();
  await db.prepare(
    `INSERT INTO sliders
        (id, mosque_id, type, value, title, duration, is_live, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        type=excluded.type, value=excluded.value, title=excluded.title,
        duration=excluded.duration, is_live=excluded.is_live,
        sort_order=excluded.sort_order, is_active=excluded.is_active,
        updated_at=CURRENT_TIMESTAMP`
  ).bind(
    id,
    mosqueId,
    type,
    text(slider.value, 1e3),
    text(slider.title, 150),
    Math.max(5, Number(slider.duration) || 15),
    booleanInt(slider.isLive),
    Number(slider.sortOrder) || 0,
    booleanInt(slider.isActive)
  ).run();
  return response({ ok: true, id });
}
__name(saveSlider, "saveSlider");
__name2(saveSlider, "saveSlider");
async function deleteSlider(db, payload, actor) {
  const id = text(payload.id, 50);
  const row = await db.prepare("SELECT mosque_id FROM sliders WHERE id=?").bind(id).first();
  if (!row || !canManageMosque(actor, row.mosque_id)) {
    throw new ApiError(403, "Tidak berhak menghapus slider ini");
  }
  await db.prepare("DELETE FROM sliders WHERE id=?").bind(id).run();
  return response({ ok: true });
}
__name(deleteSlider, "deleteSlider");
__name2(deleteSlider, "deleteSlider");
async function fetchNuMonth(latitude, longitude, year, month) {
  const url = new URL(`https://api.aladhan.com/v1/calendar/${year}/${month}`);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("method", "99");
  url.searchParams.set("methodSettings", "20,null,18");
  url.searchParams.set("school", "0");
  const result = await fetch(url, { headers: { Accept: "application/json" } });
  if (!result.ok) throw new ApiError(502, "Sumber jadwal NU gagal");
  const json2 = await result.json();
  if (!Array.isArray(json2.data)) throw new ApiError(502, "Data NU tidak valid");
  return json2.data.map((day) => ({
    date: day.date.gregorian.date.split("-").reverse().join("-"),
    imsak: cleanTime(day.timings.Imsak),
    subuh: cleanTime(day.timings.Fajr),
    terbit: cleanTime(day.timings.Sunrise),
    dhuha: cleanTime(day.timings.Sunrise),
    dzuhur: cleanTime(day.timings.Dhuhr),
    ashar: cleanTime(day.timings.Asr),
    maghrib: cleanTime(day.timings.Maghrib),
    isya: cleanTime(day.timings.Isha)
  }));
}
__name(fetchNuMonth, "fetchNuMonth");
__name2(fetchNuMonth, "fetchNuMonth");
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
  __name(worker, "worker");
  __name2(worker, "worker");
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker())
  );
  return results;
}
__name(mapWithConcurrency, "mapWithConcurrency");
__name2(mapWithConcurrency, "mapWithConcurrency");
async function fetchKhgtMonth(latitude, longitude, year, month) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates = Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${String(month).padStart(2, "0")}-${day}`;
  });
  return mapWithConcurrency(dates, 5, async (date) => {
    const url = new URL("https://khgt.muhammadiyah.or.id/prayer");
    url.searchParams.set("lat", latitude);
    url.searchParams.set("long", longitude);
    url.searchParams.set("date", date);
    const result = await fetch(url, { headers: { Accept: "application/json" } });
    if (!result.ok) throw new ApiError(502, `KHGT gagal pada ${date}`);
    const json2 = await result.json();
    const times = json2.times || {};
    const subuh = cleanTime(times.subuh);
    const terbit = cleanTime(times.terbit);
    const subuhDate = /* @__PURE__ */ new Date(`${date}T${subuh}:00Z`);
    const imsak = new Date(subuhDate.getTime() - 10 * 6e4).toISOString().slice(11, 16);
    return {
      date,
      imsak,
      subuh,
      terbit,
      dhuha: terbit,
      dzuhur: cleanTime(times.zuhur || times.dzuhur),
      ashar: cleanTime(times.ashar),
      maghrib: cleanTime(times.maghrib),
      isya: cleanTime(times.isya)
    };
  });
}
__name(fetchKhgtMonth, "fetchKhgtMonth");
__name2(fetchKhgtMonth, "fetchKhgtMonth");
async function importPrayerMonth(db, payload, actor) {
  const mosqueId = text(payload.mosqueId, 50);
  if (!canManageMosque(actor, mosqueId)) {
    throw new ApiError(403, "Tidak berhak mengimpor jadwal masjid ini");
  }
  const provider = normalizeProvider(payload.provider);
  const year = Number(payload.year);
  const month = Number(payload.month);
  if (year < 2020 || year > 2100 || month < 1 || month > 12) {
    throw new ApiError(400, "Tahun/bulan tidak valid");
  }
  const mosque = await db.prepare("SELECT latitude, longitude FROM mosques WHERE id=?").bind(mosqueId).first();
  if (!mosque) throw new ApiError(404, "Masjid tidak ditemukan");
  const items = provider === "KHGT" ? await fetchKhgtMonth(mosque.latitude, mosque.longitude, year, month) : await fetchNuMonth(mosque.latitude, mosque.longitude, year, month);
  const source = provider === "KHGT" ? "khgt.muhammadiyah.or.id" : "AlAdhan custom LFNU (-20/-18)";
  const statements = items.map(
    (item) => db.prepare(
      `INSERT INTO prayer_schedules
          (mosque_id, provider, prayer_date, imsak, subuh, terbit, dhuha,
           dzuhur, ashar, maghrib, isya, source, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(mosque_id, provider, prayer_date) DO UPDATE SET
          imsak=excluded.imsak, subuh=excluded.subuh, terbit=excluded.terbit,
          dhuha=excluded.dhuha, dzuhur=excluded.dzuhur, ashar=excluded.ashar,
          maghrib=excluded.maghrib, isya=excluded.isya, source=excluded.source,
          fetched_at=CURRENT_TIMESTAMP`
    ).bind(
      mosqueId,
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
  return response({ ok: true, imported: items.length, provider, year, month });
}
__name(importPrayerMonth, "importPrayerMonth");
__name2(importPrayerMonth, "importPrayerMonth");
async function handleGet(db, url, actor) {
  const action = url.searchParams.get("action") || "ping";
  const mosqueId = text(url.searchParams.get("mosqueId") || url.searchParams.get("mosque"), 50);
  if (action === "ping") return response({ ok: true, engine: "d1-relational" });
  if (action === "me") {
    return response({ ok: true, authenticated: Boolean(actor), user: actor });
  }
  if (action === "mosques") {
    const result = await db.prepare(
      `SELECT id AS mosqueId, name AS masjidName, address AS masjidAddress
           FROM mosques WHERE is_active=1 ORDER BY name`
    ).all();
    return response({
      ok: true,
      mosques: (result.results || []).map((row) => ({
        ...row,
        previewUrl: `index.html?mosque=${encodeURIComponent(row.mosqueId)}`
      }))
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
    const row = await db.prepare(
      `SELECT * FROM prayer_schedules
          WHERE mosque_id=? AND provider=? AND prayer_date=?`
    ).bind(mosqueId, provider, date).first();
    return response({ ok: true, schedule: row || null });
  }
  requireUser(actor);
  if (action === "users") {
    requireUser(actor, ["superadmin"]);
    const result = await db.prepare(
      `SELECT id, mosque_id AS mosqueId, username, email, name, role, status,
                created_at AS createdAt
           FROM users ORDER BY created_at DESC`
    ).all();
    return response({ ok: true, users: (result.results || []).map(publicUser) });
  }
  if (action === "admin_mosques") {
    const query = actor.role === "superadmin" ? "SELECT id, name, address, prayer_provider FROM mosques ORDER BY name" : "SELECT id, name, address, prayer_provider FROM mosques WHERE id=?";
    const stmt = actor.role === "superadmin" ? db.prepare(query) : db.prepare(query).bind(actor.mosqueId);
    const result = await stmt.all();
    return response({ ok: true, mosques: result.results || [] });
  }
  if (action === "admin_settings") {
    const target = mosqueId || actor.mosqueId;
    if (actor.role !== "superadmin" && actor.mosqueId !== target) {
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
    const target = mosqueId || actor.mosqueId;
    if (actor.role !== "superadmin" && actor.mosqueId !== target) {
      throw new ApiError(403, "Akses ditolak");
    }
    const provider = normalizeProvider(url.searchParams.get("provider"));
    const from = text(url.searchParams.get("from"), 10) || "0000-01-01";
    const to = text(url.searchParams.get("to"), 10) || "9999-12-31";
    const result = await db.prepare(
      `SELECT * FROM prayer_schedules
          WHERE mosque_id=? AND provider=? AND prayer_date BETWEEN ? AND ?
          ORDER BY prayer_date LIMIT 400`
    ).bind(target, provider, from, to).all();
    return response({ ok: true, schedules: result.results || [] });
  }
  throw new ApiError(400, "Action tidak dikenali");
}
__name(handleGet, "handleGet");
__name2(handleGet, "handleGet");
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
    const item = payload.schedule || {};
    const mosqueId = text(item.mosqueId, 50);
    if (!canManageMosque(actor, mosqueId)) throw new ApiError(403, "Akses ditolak");
    const provider = normalizeProvider(item.provider);
    if (item.id) {
      await db.prepare(
        `UPDATE prayer_schedules SET provider=?, prayer_date=?, imsak=?,
             subuh=?, terbit=?, dhuha=?, dzuhur=?, ashar=?, maghrib=?, isya=?,
             source='manual', fetched_at=CURRENT_TIMESTAMP
           WHERE id=? AND mosque_id=?`
      ).bind(
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
        Number(item.id),
        mosqueId
      ).run();
      return response({ ok: true });
    }
    await db.prepare(
      `INSERT INTO prayer_schedules
          (mosque_id, provider, prayer_date, imsak, subuh, terbit, dhuha,
           dzuhur, ashar, maghrib, isya, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
         ON CONFLICT(mosque_id, provider, prayer_date) DO UPDATE SET
          imsak=excluded.imsak, subuh=excluded.subuh, terbit=excluded.terbit,
          dhuha=excluded.dhuha, dzuhur=excluded.dzuhur, ashar=excluded.ashar,
          maghrib=excluded.maghrib, isya=excluded.isya, source='manual',
          fetched_at=CURRENT_TIMESTAMP`
    ).bind(
      mosqueId,
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
    ).run();
    return response({ ok: true });
  }
  if (action === "delete_prayer") {
    const mosqueId = text(payload.mosqueId, 50);
    if (!canManageMosque(actor, mosqueId)) throw new ApiError(403, "Akses ditolak");
    await db.prepare("DELETE FROM prayer_schedules WHERE id=? AND mosque_id=?").bind(Number(payload.id), mosqueId).run();
    return response({ ok: true });
  }
  throw new ApiError(400, "Action tidak dikenali");
}
__name(handlePost, "handlePost");
__name2(handlePost, "handlePost");
async function onRequest(context) {
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
        message: error.message
      })
    );
    return response(
      { ok: false, message: error.message || "Terjadi kesalahan server" },
      error.status || 500
    );
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
  });
}
__name(json, "json");
__name2(json, "json");
async function onRequest2(context) {
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
        "User-Agent": "MasjidTV/1.0"
      }
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
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var routes = [
  {
    routePath: "/api/nu",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/db",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/khgt",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response2 = await handler(context);
        if (!(response2 instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response2);
      } else if ("ASSETS") {
        const response2 = await env["ASSETS"].fetch(request);
        return cloneResponse(response2);
      } else {
        const response2 = await fetch(request);
        return cloneResponse(response2);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response2 = await env["ASSETS"].fetch(request);
        return cloneResponse(response2);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response2) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response2.status) ? null : response2.body,
    response2
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../bin/nodejs/node-v22/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../bin/nodejs/node-v22/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-OUo1al/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../bin/nodejs/node-v22/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-OUo1al/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.8952514375831948.js.map
