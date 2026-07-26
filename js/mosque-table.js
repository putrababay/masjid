/**
 * Tabel daftar masjid untuk superadmin (DataTables).
 * Usage: MosqueTable.render("#wrap", { editUrl: "admin.html", pageLabel: "Setting" })
 */
(function (global) {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])
    );
  }

  async function ensureAssets() {
    if (!document.querySelector('link[href*="dataTables.bootstrap5"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css";
      document.head.appendChild(css);
    }
    await loadScript("https://code.jquery.com/jquery-3.7.1.min.js", () => !!window.jQuery);
    await loadScript(
      "https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js",
      () => !!window.jQuery?.fn?.dataTable
    );
    await loadScript(
      "https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js",
      () => true
    );
  }

  function loadScript(src, ready) {
    if (ready && ready()) return Promise.resolve();
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      return new Promise((resolve) => {
        if (ready && ready()) return resolve();
        existing.addEventListener("load", () => resolve());
        setTimeout(resolve, 800);
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function render(selector, options = {}) {
    await ensureAssets();
    const wrap = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!wrap) return null;

    const editUrl = options.editUrl || "admin.html";
    const pageLabel = options.pageLabel || "Kelola";
    const extraColumns = options.extraColumns || [];

    const data = await MasjidDB.listAdminMosques();
    const mosques = data.mosques || [];

    wrap.innerHTML = `
      <div class="panel-card">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h2 class="mb-0" style="font-size:1.05rem">Daftar Seluruh Masjid</h2>
            <div class="text-secondary small">Pilih masjid untuk ${escapeHtml(pageLabel)}.</div>
          </div>
          <span class="badge text-bg-success">${mosques.length} masjid</span>
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover align-middle w-100" id="mosqueDataTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Alamat</th>
                <th>Provider</th>
                ${extraColumns.map((c) => `<th>${escapeHtml(c.title)}</th>`).join("")}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${mosques
                .map((m) => {
                  const href = `${editUrl}?mosque=${encodeURIComponent(m.id)}`;
                  return `<tr>
                    <td><code>${escapeHtml(m.id)}</code></td>
                    <td>${escapeHtml(m.name || "-")}</td>
                    <td>${escapeHtml(m.address || "-")}</td>
                    <td><span class="badge text-bg-secondary">${escapeHtml(m.prayer_provider || "NU")}</span></td>
                    ${extraColumns
                      .map((c) => `<td>${escapeHtml(c.value ? c.value(m) : "")}</td>`)
                      .join("")}
                    <td class="text-nowrap">
                      <a class="btn btn-sm btn-success" href="${href}">${escapeHtml(pageLabel)}</a>
                      <a class="btn btn-sm btn-outline-secondary" target="_blank"
                        href="index.html?mosque=${encodeURIComponent(m.id)}">Preview</a>
                    </td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const $ = window.jQuery;
    if ($ && $.fn.dataTable) {
      $("#mosqueDataTable").DataTable({
        pageLength: 10,
        order: [[1, "asc"]],
        language: {
          search: "Cari:",
          lengthMenu: "Tampil _MENU_",
          info: "Menampilkan _START_–_END_ dari _TOTAL_ masjid",
          infoEmpty: "Tidak ada data",
          zeroRecords: "Masjid tidak ditemukan",
          paginate: { previous: "Sebelum", next: "Berikut" },
        },
      });
    }
    return mosques;
  }

  global.MosqueTable = { render };
})(window);
