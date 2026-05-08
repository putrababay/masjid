<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Informasi Masjid</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: #f4f7f6;
            padding: 20px;
        }

        .card {
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .section-title {
            border-left: 5px solid #198754;
            padding-left: 10px;
            margin-bottom: 20px;
            color: #198754;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card p-4">
                    <h2 class="text-center mb-4">Pengaturan TV Masjid</h2>
                    <form id="adminForm">
                        <h5 class="section-title">Identitas Masjid</h5>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Sumber Jadwal Sholat</label>
                                <select name="prayerProvider" class="form-select">
                                    <option value="pemerintah">Pemerintah (MyQuran)</option>
                                    <option value="muhammadiyah">Muhammadiyah (KHGT)</option>
                                </select>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label">KHGT Lat</label>
                                <input type="number" step="any" name="khgtLat" class="form-control" value="-7.4467">
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label">KHGT Lng</label>
                                <input type="number" step="any" name="khgtLng" class="form-control" value="112.7181">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">ID Lokasi MyQuran</label>
                            <input type="text" name="locationId" class="form-control"
                                value="cfa0860e83a4c3a763a7e62d825349f7">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Nama Masjid</label>
                            <input type="text" name="masjidName" class="form-control" value="MASJID AN-NUR SIDOARJO">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Alamat</label>
                            <textarea name="masjidAddress" class="form-control"
                                rows="2">Jl. Mojopahit No.666, Celep, Kabupaten Sidoarjo</textarea>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">ID Masjid</label>
                                <input type="text" name="mosqueId" class="form-control" value="MNR-SDA01">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Kapasitas</label>
                                <input type="text" name="capacity" class="form-control" value="800 Jamaah">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Ketua</label>
                                <input type="text" name="chairman" class="form-control" value="H. Ahmad Fulan">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Sekretaris</label>
                                <input type="text" name="secretary" class="form-control" value="Budi Santoso, ST">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Bendahara</label>
                                <input type="text" name="treasurer" class="form-control" value="H. M. Mansur">
                            </div>
                        </div>

                        <h5 class="section-title">Media & YouTube</h5>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Video ID (Reguler)</label>
                                <input type="text" name="regularVideoId" class="form-control" placeholder="F8121v_ER9M">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Video ID (Live Stream)</label>
                                <input type="text" name="liveVideoId" class="form-control" placeholder="OFLYbSRpMdg">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Daftar Slide Dinamis</label>
                            <small class="d-block text-muted mb-2">
                                Format per baris: <code>youtube|VIDEO_ID|live</code> atau <code>youtube|VIDEO_ID|regular</code> atau <code>image|nama-file.jpg</code>
                            </small>
                            <textarea name="slidesText" class="form-control" rows="6">youtube|F8121v_ER9M|regular
youtube|_XgE09RZsB8|live
image|1.jpg
image|11.jpg
image|2.jpg
image|3.jpg
image|4.jpg</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Judul QRIS</label>
                            <input type="text" name="qrisTitle" class="form-control" value="Infaq & Sedekah">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">URL Gambar QRIS</label>
                            <input type="text" name="qrisImageUrl" class="form-control"
                                value="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=DonasiMasjidAnNurSidoarjo">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Caption QRIS</label>
                            <input type="text" name="qrisCaption" class="form-control"
                                value="Scan QRIS a.n Masjid An-Nur">
                        </div>

                        <h5 class="section-title">Laporan Keuangan</h5>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Saldo Awal</label>
                                <input type="text" name="balanceStart" class="form-control" value="Rp 15.000.000">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Pemasukan</label>
                                <input type="text" name="income" class="form-control" value="Rp 5.500.000">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Pengeluaran</label>
                                <input type="text" name="expense" class="form-control" value="Rp 2.150.000">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Saldo Akhir</label>
                                <input type="text" name="balanceEnd" class="form-control" value="Rp 18.350.000">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Tanggal Update</label>
                                <input type="text" name="balanceUpdatedAt" class="form-control" value="10 Maret 2026">
                            </div>
                        </div>

                        <h5 class="section-title">Pesan Berjalan (Marquee)</h5>
                        <div class="mb-3">
                            <label class="form-label">1 baris = 1 pesan berjalan</label>
                            <textarea name="runningTexts" class="form-control"
                                rows="4">Laporan Keuangan: Saldo Kas Rp 18.350.000 (Per 20 Feb)
Agenda: Kajian Ahad Pagi bersama Ust. Dr. Malik Aris di Ruang Utama
Mohon menonaktifkan suara handphone saat memasuki area Shalat
Jagalah kebersihan Masjid adalah sebagian dari Iman</textarea>
                        </div>

                        <button type="submit" class="btn btn-success w-100 py-2 fw-bold">SIMPAN PERUBAHAN</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById("adminForm");

        function fillForm(settings) {
            Object.keys(settings).forEach((key) => {
                const input = form.elements[key];
                if (!input) return;

                if (key === "runningTexts" && Array.isArray(settings.runningTexts)) {
                    input.value = settings.runningTexts.join("\n");
                } else if (key === "slides" && Array.isArray(settings.slides)) {
                    const lines = settings.slides
                        .map((slide) => {
                            if (slide.type === "youtube") {
                                const mode = slide.isLive ? "live" : "regular";
                                return `youtube|${slide.value || ""}|${mode}`;
                            }
                            if (slide.type === "image") {
                                return `image|${slide.value || ""}`;
                            }
                            return "";
                        })
                        .filter(Boolean)
                        .join("\n");
                    if (form.elements.slidesText) {
                        form.elements.slidesText.value = lines;
                    }
                } else if (key === "khgt" && settings.khgt) {
                    if (form.elements.khgtLat) form.elements.khgtLat.value = settings.khgt.lat ?? "";
                    if (form.elements.khgtLng) form.elements.khgtLng.value = settings.khgt.lng ?? "";
                } else if (typeof settings[key] === "string") {
                    input.value = settings[key];
                }
            });
        }

        async function loadCurrentData() {
            try {
                const res = await fetch("db.php");
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.settings) {
                    fillForm(data.settings);
                }
            } catch (e) {
                console.error("Gagal load data", e);
            }
        }

        form.onsubmit = async function (e) {
            e.preventDefault();
            const formData = new FormData(form);
            const settings = Object.fromEntries(formData.entries());
            settings.runningTexts = (settings.runningTexts || "")
                .split("\n")
                .map((x) => x.trim())
                .filter(Boolean);
            settings.slides = (settings.slidesText || "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                    const [typeRaw, valueRaw, modeRaw] = line.split("|");
                    const type = (typeRaw || "").trim().toLowerCase();
                    const value = (valueRaw || "").trim();
                    const mode = (modeRaw || "").trim().toLowerCase();

                    if (type === "youtube" && value) {
                        return {
                            type: "youtube",
                            value,
                            isLive: mode === "live",
                        };
                    }
                    if (type === "image" && value) {
                        return {
                            type: "image",
                            value,
                        };
                    }
                    return null;
                })
                .filter(Boolean);
            const parsedLat = Number(settings.khgtLat);
            const parsedLng = Number(settings.khgtLng);
            settings.khgt = {
                lat: Number.isFinite(parsedLat) ? parsedLat : -7.4467,
                lng: Number.isFinite(parsedLng) ? parsedLng : 112.7181,
            };
            delete settings.slidesText;
            delete settings.khgtLat;
            delete settings.khgtLng;

            try {
                const res = await fetch("db.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ settings }),
                });
                const result = await res.json();
                if (!res.ok || !result.ok) {
                    throw new Error(result.message || "Gagal menyimpan");
                }
                alert("Data berhasil disimpan ke database txt.");
            } catch (err) {
                alert("Gagal menyimpan: " + err.message);
            }
        };

        loadCurrentData();
    </script>
</body>

</html>