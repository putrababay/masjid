/**
 * Client API D1. Autentikasi menggunakan cookie HttpOnly dari Pages Function.
 * Tidak menyimpan password atau sesi di localStorage.
 */
(function (global) {
  const API_URL = "/api/db";
  let currentUser = null;
  let readyPromise = null;

  async function request(action, options = {}) {
    const method = options.method || "GET";
    let url = API_URL;
    const init = {
      method,
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    };
    if (method === "GET") {
      const query = new URLSearchParams({ action, ...(options.params || {}) });
      url += `?${query.toString()}`;
    } else {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify({ action, ...(options.data || {}) });
    }
    const response = await fetch(url, init);
    const data = await response.json().catch(() => ({
      ok: false,
      message: "Respons API tidak valid",
    }));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || "Permintaan gagal");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function loadSession() {
    try {
      const result = await request("me");
      currentUser = result.user || null;
    } catch {
      currentUser = null;
    }
    return currentUser;
  }

  function requireLogin(roles = []) {
    if (!currentUser) {
      window.location.href = "login.html";
      return null;
    }
    if (roles.length && !roles.includes(currentUser.role)) {
      window.location.href = "login.html";
      return null;
    }
    return currentUser;
  }

  const MasjidDB = {
    ready() {
      if (!readyPromise) readyPromise = loadSession();
      return readyPromise;
    },
    getSession() {
      return currentUser;
    },
    requireLogin,
    async login(identity, password) {
      const result = await request("login", {
        method: "POST",
        data: { identity, password },
      });
      currentUser = result.user;
      return result;
    },
    async register(data) {
      const result = await request("register", { method: "POST", data });
      if (result.user) currentUser = result.user;
      return result;
    },
    async logout() {
      await request("logout", { method: "POST" }).catch(() => {});
      currentUser = null;
    },
    async listMosques() {
      return request("mosques");
    },
    async listAdminMosques() {
      return request("admin_mosques");
    },
    async getSettings(mosqueId, admin = false) {
      return request(admin ? "admin_settings" : "settings", {
        params: mosqueId ? { mosqueId } : {},
      });
    },
    async saveSettings(mosqueId, settings) {
      return request("save_settings", {
        method: "POST",
        data: { mosque: { ...settings, mosqueId } },
      });
    },
    async listUsers() {
      return request("users");
    },
    async saveUser(user) {
      await request("save_user", { method: "POST", data: { user } });
      return this.listUsers();
    },
    async deleteUser(id) {
      await request("delete_user", { method: "POST", data: { id } });
      return this.listUsers();
    },
    async listSliders(mosqueId) {
      return request("sliders", { params: { mosqueId } });
    },
    async saveSlider(slider) {
      return request("save_slider", { method: "POST", data: { slider } });
    },
    async deleteSlider(id) {
      return request("delete_slider", { method: "POST", data: { id } });
    },
    async listPrayers(provider, from, to) {
      return request("prayers", {
        params: { provider, from, to },
      });
    },
    async savePrayer(schedule) {
      return request("save_prayer", {
        method: "POST",
        data: { schedule },
      });
    },
    async deletePrayer(id) {
      return request("delete_prayer", {
        method: "POST",
        data: { id },
      });
    },
    async importPrayerMonth(provider, year, month, options = {}) {
      return request("import_prayer_month", {
        method: "POST",
        data: {
          provider,
          year,
          month,
          locationId: options.locationId || "",
          latitude: options.latitude,
          longitude: options.longitude,
        },
      });
    },
    async getTodaySchedule(provider, date, mosqueId) {
      return request("today_schedule", {
        params: {
          provider,
          date,
          ...(mosqueId ? { mosqueId } : {}),
        },
      });
    },
    async calendarToday() {
      return request("calendar_today");
    },
    async dashboardStats(mosqueId, year, month) {
      return request("dashboard_stats", {
        params: {
          mosqueId: mosqueId || "",
          year: year || "",
          month: month || "",
        },
      });
    },
    extractDriveId(value) {
      const text = String(value || "").trim();
      if (!text) return "";
      let match = text.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
      match = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
      return /^[a-zA-Z0-9_-]{20,}$/.test(text) && !text.includes(".")
        ? text
        : "";
    },
    toDriveImageUrl(value) {
      const id = this.extractDriveId(value);
      return id
        ? `https://drive.google.com/uc?export=view&id=${id}`
        : String(value || "").trim();
    },
    toDriveEmbedUrl(value) {
      const id = this.extractDriveId(value);
      return id
        ? `https://drive.google.com/file/d/${id}/preview`
        : String(value || "").trim();
    },
    async fetchKhgt({ lat, lng, date }) {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        date: String(date),
      });
      const response = await fetch(`/api/khgt?${params.toString()}`);
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Gagal mengambil KHGT");
      }
      return result.data;
    },
    async fetchNu({ lat, lng, date, locationId }) {
      const params = new URLSearchParams({ date: String(date) });
      if (locationId) params.set("locationId", String(locationId));
      if (lat != null) params.set("lat", String(lat));
      if (lng != null) params.set("lng", String(lng));
      const response = await fetch(`/api/nu?${params.toString()}`);
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Gagal mengambil jadwal NU");
      }
      return result.data;
    },
  };

  global.MasjidDB = MasjidDB;
})(window);
