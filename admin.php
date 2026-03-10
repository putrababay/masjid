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
                        <div class="mb-3">
                            <label class="form-label">Nama Masjid</label>
                            <input type="text" name="nama_masjid" class="form-control" value="MASJID AN-NUR SIDOARJO">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Alamat</label>
                            <textarea name="alamat" class="form-control" rows="2">Jl. Mojopahit No.666, Celep, Kabupaten Sidoarjo</textarea>
                        </div>

                        <h5 class="section-title">Media & YouTube</h5>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Video ID (Reguler)</label>
                                <input type="text" name="video_reguler" class="form-control" placeholder="F8121v_ER9M">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Video ID (Live Stream)</label>
                                <input type="text" name="video_live" class="form-control" placeholder="OFLYbSRpMdg">
                            </div>
                        </div>

                        <h5 class="section-title">Laporan Keuangan</h5>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Saldo Kas</label>
                                <input type="text" name="saldo_kas" class="form-control" value="18.350.000">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Pemasukan</label>
                                <input type="text" name="pemasukan" class="form-control" value="5.500.000">
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Pengeluaran</label>
                                <input type="text" name="pengeluaran" class="form-control" value="2.150.000">
                            </div>
                        </div>

                        <h5 class="section-title">Pesan Berjalan (Marquee)</h5>
                        <div class="mb-3">
                            <label class="form-label">Gunakan tanda (●) sebagai pemisah pesan</label>
                            <textarea name="running_text" class="form-control" rows="3">Laporan Keuangan: Saldo Kas Rp 18.350.000 ● Agenda: Kajian Ahad Pagi ● Mohon menonaktifkan suara HP</textarea>
                        </div>

                        <button type="submit" class="btn btn-success w-100 py-2 fw-bold">SIMPAN PERUBAHAN</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Contoh logika simpan sederhana ke localStorage (Bisa diganti Fetch API ke PHP/Database)
        document.getElementById('adminForm').onsubmit = function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            localStorage.setItem('masjid_config', JSON.stringify(data));
            alert('Data berhasil disimpan! (Tersimpan di Browser)');
        };
    </script>
</body>

</html>