/**
 * MasjidDB — penyimpanan murni JS (siap Cloudflare Pages + D1).
 * Prioritas: /api/db (Pages Function + D1) → localStorage → seed JSON.
 */
(function (global) {
  const STORAGE_KEY = "masjid_db_v1";
  const SESSION_KEY = "masjid_session_v1";
  const SEED_URL = "data/masjid-db.json";
  const API_URL = "/api/db";

  const defaultSettings = {
    locationId: "cfa0860e83a4c3a763a7e62d825349f7",
    masjidName: "MASJID AN-NUR SIDOARJO",
    masjidAddress: "Jl. Mojopahit No.666, Celep, Kabupaten Sidoarjo Jawa Timur",
    qrisTitle: "Infaq & Sedekah",
    qrisImageUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=DonasiMasjidAnNurSidoarjo",
    qrisCaption: "Scan QRIS a.n Masjid An-Nur",
    mosqueId: "MNR-SDA01",
    capacity: "800 Jamaah",
    chairman: "H. Ahmad Fulan",
    secretary: "Budi Santoso, ST",
    treasurer: "H. M. Mansur",
    balanceStart: "Rp 15.000.000",
    income: "Rp 5.500.000",
    expense: "Rp 2.150.000",
    balanceEnd: "Rp 18.350.000",
    balanceUpdatedAt: "10 Maret 2026",
    runningTexts: [
      "<b>Laporan Keuangan:</b> Saldo Kas Rp 18.350.000 (Per 20 Feb)",
      "<b>Agenda:</b> Kajian Ahad Pagi bersama Ust. Dr. Malik Aris di Ruang Utama",
      "Mohon menonaktifkan suara handphone saat memasuki area Shalat",
      "Jagalah kebersihan Masjid adalah sebagian dari Iman",
    ],
    regularVideoId: "F8121v_ER9M",
    liveVideoId: "_XgE09RZsB8",
    slides: [
      { type: "youtube", value: "F8121v_ER9M", isLive: false },
      { type: "youtube", value: "_XgE09RZsB8", isLive: true },
      { type: "image", value: "1.jpg" },
      { type: "image", value: "11.jpg" },
      { type: "image", value: "2.jpg" },
      { type: "image", value: "3.jpg" },
      { type: "image", value: "4.jpg" },
    ],
    iqomahDurations: {
      subuh: 25,
      dzuhur: 25,
      ashar: 5,
      maghrib: 20,
      isya: 25,
    },
    prayerProvider: "pemerintah",
    khgt: { lat: -7.4467, lng: 112.7181 },
    gdriveFolderUrl:
      "https://drive.google.com/drive/folders/1oX7T4ZEZpJXi6FSOXKw8fkLB99PjMhgC?usp=sharing",
  };

  const defaultData = {
    users: [
      {
        id: "usr_super",
        username: "superadmin",
        password: "admin123",
        name: "Super Admin",
        role: "superadmin",
        mosqueId: null,
        isActive: true,
      },
      {
        id: "usr_annur",
        username: "annur",
        password: "annur123",
        name: "Takmir An-Nur",
        role: "user_masjid",
        mosqueId: "MNR-SDA01",
        isActive: true,
      },
    ],
    mosques: {
      "MNR-SDA01": { settings: { ...defaultSettings } },
    },
    settings: { ...defaultSettings },
  };

  let memoryDb = null;
  let apiAvailable = null;
  let readyPromise = null;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function publicUser(user) {
    return {
      id: user.id || "",
      username: user.username || "",
      name: user.name || "",
      role: user.role || "user_masjid",
      mosqueId: user.mosqueId ?? null,
      isActive: user.isActive !== false,
    };
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    memoryDb = data;
  }

  async function checkApi() {
    if (apiAvailable !== null) return apiAvailable;
    try {
      const res = await fetch(`${API_URL}?action=ping`, { method: "GET" });
      apiAvailable = res.ok;
    } catch {
      apiAvailable = false;
    }
    return apiAvailable;
  }

  async function apiGet(action, params = {}) {
    const qs = new URLSearchParams({ action, ...params });
    const res = await fetch(`${API_URL}?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.message || "API error");
    }
    return data;
  }

  async function apiPost(payload) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.message || "API error");
    }
    return data;
  }

  async function loadSeed() {
    try {
      const res = await fetch(SEED_URL, { cache: "no-store" });
      if (!res.ok) return clone(defaultData);
      const data = await res.json();
      return {
        users: data.users?.length ? data.users : clone(defaultData.users),
        mosques: data.mosques || clone(defaultData.mosques),
        settings: data.settings || clone(defaultData.settings),
      };
    } catch {
      return clone(defaultData);
    }
  }

  async function ensureDb() {
    if (memoryDb) return memoryDb;

    if (await checkApi()) {
      try {
        const remote = await apiGet("all");
        memoryDb = remote.data || clone(defaultData);
        writeLocal(memoryDb);
        return memoryDb;
      } catch {
        apiAvailable = false;
      }
    }

    const local = readLocal();
    if (local) {
      memoryDb = local;
      return memoryDb;
    }

    memoryDb = await loadSeed();
    writeLocal(memoryDb);
    return memoryDb;
  }

  async function persist(data) {
    memoryDb = data;
    writeLocal(data);

    if (await checkApi()) {
      try {
        await apiPost({ action: "replace_all", data });
      } catch (err) {
        console.warn("Gagal sync ke API/D1, data tetap di localStorage:", err);
      }
    }
    return data;
  }

  function getMosqueSettings(data, mosqueId) {
    if (mosqueId && data.mosques?.[mosqueId]?.settings) {
      return clone(data.mosques[mosqueId].settings);
    }
    return clone(data.settings || defaultSettings);
  }

  function listPublicMosques(data) {
    return (data.users || [])
      .filter((u) => u.role === "user_masjid" && u.isActive !== false && u.mosqueId)
      .map((u) => {
        const settings = getMosqueSettings(data, u.mosqueId);
        return {
          mosqueId: u.mosqueId,
          username: u.username || "",
          name: u.name || "",
          masjidName: settings.masjidName || u.mosqueId,
          masjidAddress: settings.masjidAddress || "",
          previewUrl: `index.html?mosque=${encodeURIComponent(u.mosqueId)}`,
        };
      });
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    if (!user) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(publicUser(user)));
  }

  function requireLogin(roles) {
    const user = getSession();
    if (!user) {
      window.location.href = "login.html";
      return null;
    }
    if (roles && roles.length && !roles.includes(user.role)) {
      alert("Akses ditolak.");
      window.location.href = "login.html";
      return null;
    }
    return user;
  }

  const MasjidDB = {
    ready() {
      if (!readyPromise) readyPromise = ensureDb();
      return readyPromise;
    },

    getSession,
    requireLogin,
    logout() {
      setSession(null);
    },

    async login(username, password) {
      const data = await ensureDb();
      const user = (data.users || []).find(
        (u) =>
          String(u.username).toLowerCase() === String(username).toLowerCase() &&
          String(u.password) === String(password)
      );
      if (!user) throw new Error("Username atau password salah");
      if (user.isActive === false) throw new Error("Akun nonaktif");
      setSession(user);
      return {
        ok: true,
        user: publicUser(user),
        redirect: user.role === "superadmin" ? "user_masjid.html" : "admin.html",
      };
    },

    async getSettings(mosqueId) {
      const data = await ensureDb();
      const settings = getMosqueSettings(data, mosqueId);
      return { ok: true, settings, mosqueId: mosqueId || settings.mosqueId || null };
    },

    async listMosques() {
      const data = await ensureDb();
      return { ok: true, mosques: listPublicMosques(data) };
    },

    async listUsers() {
      const data = await ensureDb();
      return { ok: true, users: (data.users || []).map(publicUser) };
    },

    async saveSettings(mosqueId, settings) {
      const data = await ensureDb();
      const session = getSession();
      if (!session) throw new Error("Silakan login dulu");

      let targetId = mosqueId || settings.mosqueId || session.mosqueId;
      if (session.role === "user_masjid") {
        targetId = session.mosqueId;
      }
      if (!targetId) throw new Error("mosqueId wajib diisi");

      const next = clone(data);
      const cleaned = { ...settings, mosqueId: targetId };
      next.mosques = next.mosques || {};
      next.mosques[targetId] = { settings: cleaned };
      if (targetId === "MNR-SDA01" || Object.keys(next.mosques).length === 1) {
        next.settings = cleaned;
      }
      await persist(next);
      return { ok: true, message: "Data berhasil disimpan", mosqueId: targetId };
    },

    async saveUser(userPayload) {
      const session = getSession();
      if (!session || session.role !== "superadmin") {
        throw new Error("Unauthorized");
      }

      const data = await ensureDb();
      const next = clone(data);
      const username = String(userPayload.username || "").trim();
      const name = String(userPayload.name || "").trim();
      const role =
        userPayload.role === "superadmin" ? "superadmin" : "user_masjid";
      const mosqueId = String(userPayload.mosqueId || "").trim();
      const password = String(userPayload.password || "");
      const isActive = userPayload.isActive !== false;
      const id = String(userPayload.id || "").trim();

      if (!username || !name) throw new Error("Username dan nama wajib diisi");
      if (role === "user_masjid" && !mosqueId) {
        throw new Error("ID Masjid wajib untuk user_masjid");
      }

      const dup = next.users.find(
        (u) =>
          String(u.username).toLowerCase() === username.toLowerCase() &&
          u.id !== id
      );
      if (dup) throw new Error("Username sudah dipakai");

      const idx = id ? next.users.findIndex((u) => u.id === id) : -1;
      if (idx >= 0) {
        next.users[idx] = {
          ...next.users[idx],
          username,
          name,
          role,
          mosqueId: role === "superadmin" ? null : mosqueId,
          isActive,
          password: password || next.users[idx].password,
        };
      } else {
        if (!password) throw new Error("Password wajib untuk user baru");
        next.users.push({
          id: id || `usr_${Date.now().toString(36)}`,
          username,
          password,
          name,
          role,
          mosqueId: role === "superadmin" ? null : mosqueId,
          isActive,
        });
      }

      if (role === "user_masjid" && mosqueId && !next.mosques[mosqueId]) {
        const seed = clone(defaultSettings);
        seed.mosqueId = mosqueId;
        seed.masjidName = name.toUpperCase();
        next.mosques[mosqueId] = { settings: seed };
      }

      await persist(next);
      return { ok: true, users: next.users.map(publicUser) };
    },

    async deleteUser(id) {
      const session = getSession();
      if (!session || session.role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      if (!id) throw new Error("ID user wajib");
      if (id === session.id) throw new Error("Tidak bisa menghapus akun sendiri");

      const data = await ensureDb();
      const next = clone(data);
      const before = next.users.length;
      next.users = next.users.filter((u) => u.id !== id);
      if (next.users.length === before) throw new Error("User tidak ditemukan");
      await persist(next);
      return { ok: true, users: next.users.map(publicUser) };
    },

    /** Helper media Google Drive */
    extractDriveId(value) {
      const text = String(value || "").trim();
      if (!text) return "";
      let m = text.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m) return m[1];
      m = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m) return m[1];
      if (/^[a-zA-Z0-9_-]{20,}$/.test(text) && !text.includes(".")) return text;
      return "";
    },

    toDriveImageUrl(value) {
      const id = this.extractDriveId(value);
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
      return String(value || "").trim();
    },

    toDriveEmbedUrl(value) {
      const id = this.extractDriveId(value);
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
      return String(value || "").trim();
    },

    /** KHGT tanpa PHP — pakai Pages Function, fallback fetch langsung */
    async fetchKhgt({ lat, lng, date }) {
      try {
        const qs = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          date: String(date),
        });
        const res = await fetch(`/api/khgt?${qs.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) return json.data;
        }
      } catch {
        /* fallback below */
      }

      const url = `https://khgt.muhammadiyah.or.id/prayer?lat=${encodeURIComponent(
        lat
      )}&long=${encodeURIComponent(lng)}&date=${encodeURIComponent(date)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal menghubungi server KHGT");
      const data = await res.json();
      if (!data?.times) throw new Error("Response KHGT tidak valid");
      return data;
    },

    defaultSettings: clone(defaultSettings),
  };

  global.MasjidDB = MasjidDB;
})(typeof window !== "undefined" ? window : globalThis);
