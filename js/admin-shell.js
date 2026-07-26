/**
 * Shell navigasi bersama untuk halaman admin.
 * Panggil: await AdminShell.mount({ page: "dashboard", title: "..." })
 * Konten halaman di luar <script> akan dipindah ke area utama.
 */
(function (global) {
  const MENUS = [
    { group: "Master" },
    { id: "dashboard", href: "dashboard.html", label: "Dashboard" },
    { id: "users", href: "user_masjid.html", label: "User Masjid", roles: ["superadmin"] },
    { group: "Konten" },
    { id: "settings", href: "admin.html", label: "Setting Masjid" },
    { id: "slider", href: "slider.html", label: "Slider" },
    { id: "jadwal", href: "jadwal.html", label: "Jadwal Sholat" },
  ];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])
    );
  }

  function ensureAssets() {
    if (!document.querySelector('link[href="css/admin.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "css/admin.css";
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[href*="Plus+Jakarta+Sans"]')) {
      const font = document.createElement("link");
      font.rel = "stylesheet";
      font.href =
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap";
      document.head.appendChild(font);
    }
  }

  async function mount(options = {}) {
    ensureAssets();
    document.body.classList.add("admin-body");

    await MasjidDB.ready();
    const user = MasjidDB.requireLogin(["superadmin", "admin_masjid"]);
    if (!user) return null;

    const page = options.page || "";
    const title = options.title || document.title;

    const contentRoot = document.getElementById("adminPageRoot");
    let originalHtml = "";
    if (contentRoot) {
      originalHtml = contentRoot.innerHTML;
    } else {
      const clone = document.createElement("div");
      [...document.body.childNodes].forEach((node) => {
        if (node.nodeName === "SCRIPT") return;
        clone.appendChild(node.cloneNode(true));
      });
      originalHtml = clone.innerHTML;
    }

    const navHtml = MENUS.map((item) => {
      if (item.group) {
        return `<div class="nav-group">${escapeHtml(item.group)}</div>`;
      }
      if (item.roles && !item.roles.includes(user.role)) return "";
      const active = item.id === page ? "active" : "";
      return `<a class="${active}" href="${item.href}">${escapeHtml(item.label)}</a>`;
    }).join("");

    document.body.innerHTML = `
      <div class="admin-layout">
        <aside class="admin-sidebar" id="adminSidebar">
          <div class="admin-brand">Masjid TV Admin</div>
          <div class="admin-brand-sub">${escapeHtml(user.name || user.username)} · ${escapeHtml(user.role)}</div>
          <nav class="admin-nav">${navHtml}
            <div class="nav-group">Aksi</div>
            <a href="index.html${user.mosqueId ? `?mosque=${encodeURIComponent(user.mosqueId)}` : ""}" target="_blank">Preview TV</a>
            <a href="#" id="adminLogoutLink">Logout</a>
          </nav>
        </aside>
        <div class="admin-main">
          <div class="admin-topbar">
            <div>
              <button type="button" class="mobile-toggle" id="adminMenuBtn">Menu</button>
              <h1>${escapeHtml(title)}</h1>
              <div class="muted" id="adminTopMeta">Masjid: ${escapeHtml(user.mosqueId || "-")}</div>
            </div>
            <div class="d-flex gap-2 flex-wrap" id="adminTopActions"></div>
          </div>
          <div id="adminContent">${originalHtml}</div>
        </div>
      </div>
    `;

    document.getElementById("adminMenuBtn")?.addEventListener("click", () => {
      document.getElementById("adminSidebar")?.classList.toggle("open");
    });
    document.getElementById("adminLogoutLink")?.addEventListener("click", async (event) => {
      event.preventDefault();
      await MasjidDB.logout();
      location.href = "login.html";
    });

    return user;
  }

  global.AdminShell = { mount };
})(window);
