const encoder = new TextEncoder();

export function response(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return bytesToBase64Url(value);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value))
  );
}

export async function hashPassword(password) {
  const iterations = 210000;
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

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
  return result === 0;
}

export async function verifyPassword(password, encoded) {
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

export async function hashToken(token) {
  return bytesToBase64Url(await sha256(token));
}

export function readCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

export function sessionCookie(token, request, maxAge = 60 * 60 * 24 * 7) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `masjid_session=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie(request) {
  return sessionCookie("", request, 0);
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return;
  if (new URL(origin).host !== new URL(request.url).host) {
    throw new ApiError(403, "Origin tidak diizinkan");
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function getSessionUser(db, request) {
  const token = readCookie(request, "masjid_session");
  if (!token) return null;
  const tokenHash = await hashToken(token);
  return db
    .prepare(
      `SELECT u.id, u.mosque_id AS mosqueId, u.username, u.email, u.name,
              u.role, u.status
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
    )
    .bind(tokenHash)
    .first();
}

export function requireUser(user, roles = []) {
  if (!user) throw new ApiError(401, "Silakan login");
  if (user.status !== "active") throw new ApiError(403, "Akun belum aktif");
  if (roles.length && !roles.includes(user.role)) {
    throw new ApiError(403, "Hak akses tidak mencukupi");
  }
  return user;
}

export function canManageMosque(user, mosqueId) {
  return (
    user?.role === "superadmin" ||
    (user?.role === "admin_masjid" && user?.mosqueId === mosqueId)
  );
}

export function cleanTime(value) {
  const match = String(value || "").match(/\d{2}:\d{2}/);
  return match ? match[0] : "";
}

