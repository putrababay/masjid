/**
 * Cloudflare Pages Function — helper Google Drive.
 *
 * GET /api/gdrive?folder=<url|id>          -> daftar file pada folder Drive publik
 * GET /api/gdrive?file=<url|id>&mode=image -> proxy byte gambar (anti rate limit drive.google.com)
 */
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const FOLDER_TTL = 300;
const IMAGE_TTL = 86400;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...cors,
      ...extraHeaders,
    },
  });
}

function extractId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]{10,})/,
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) return match[1];
  }
  return /^[a-zA-Z0-9_-]{10,}$/.test(raw) ? raw : "";
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

function kindOfMime(mime) {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.includes("folder")) return "folder";
  return "other";
}

function parseFolderHtml(html) {
  const files = [];
  const chunks = html.split('<div class="flip-entry"');
  for (const chunk of chunks.slice(1)) {
    const id = chunk.match(/id="entry-([a-zA-Z0-9_-]{10,})"/)?.[1];
    if (!id) continue;
    const name = decodeEntities(
      chunk.match(/class="flip-entry-title"[^>]*>([\s\S]*?)<\/div>/)?.[1] || id
    ).trim();
    const mime = decodeEntities(
      chunk.match(/drive-thirdparty\.googleusercontent\.com\/\d+\/type\/([^"?]+)/)?.[1] || ""
    ).trim();
    const thumbnail = decodeEntities(
      chunk.match(/class="flip-entry-thumb"><img src="([^"]+)"/)?.[1] || ""
    );
    let kind = kindOfMime(mime);
    if (kind === "other" && /\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(name)) {
      kind = "image";
    }
    if (kind === "other" && /\.(mp4|mkv|mov|avi|webm|m4v)$/i.test(name)) {
      kind = "video";
    }
    files.push({ id, name, mime, kind, thumbnail });
  }
  return files;
}

async function listFolder(folderId) {
  const target = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(
    folderId
  )}#list`;
  const res = await fetch(target, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 (compatible; MasjidTV/1.0)",
    },
  });
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? "Folder tidak ditemukan atau tidak dibagikan publik"
        : `Google Drive membalas status ${res.status}`
    );
  }
  const html = await res.text();
  if (/ServiceLogin|accounts\.google\.com/.test(html) && !html.includes("flip-entry")) {
    throw new Error(
      "Folder belum publik. Set akses folder ke 'Anyone with the link'."
    );
  }
  return parseFolderHtml(html);
}

function imageCandidates(fileId, width) {
  const size = Math.min(Math.max(Number(width) || 1600, 200), 4096);
  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w${size}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=view`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
  ];
}

async function proxyImage(fileId, width) {
  for (const candidate of imageCandidates(fileId, width)) {
    let res;
    try {
      res = await fetch(candidate, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MasjidTV/1.0)" },
      });
    } catch {
      continue;
    }
    const type = res.headers.get("Content-Type") || "";
    // Drive membalas halaman HTML saat kuota habis / butuh konfirmasi unduh.
    if (!res.ok || !type.startsWith("image/")) continue;
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": `public, max-age=${IMAGE_TTL}`,
        ...cors,
      },
    });
  }
  return json({ ok: false, message: "Gambar Drive tidak dapat diambil" }, 502);
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
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const fileParam = url.searchParams.get("file");
  if (fileParam) {
    const fileId = extractId(fileParam);
    if (!fileId) return json({ ok: false, message: "File ID tidak valid" }, 400);
    const res = await proxyImage(fileId, url.searchParams.get("w"));
    if (res.ok) context.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  }

  const folderId = extractId(url.searchParams.get("folder"));
  if (!folderId) {
    return json({ ok: false, message: "Parameter folder wajib diisi" }, 400);
  }

  try {
    const files = await listFolder(folderId);
    const res = json(
      { ok: true, folderId, total: files.length, files },
      200,
      { "Cache-Control": `public, max-age=${FOLDER_TTL}` }
    );
    context.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    return json({ ok: false, message: err.message || "Gagal membaca folder Drive" }, 502);
  }
}
