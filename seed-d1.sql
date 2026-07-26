-- Data awal dari data/masjid-db.json. Aman dijalankan berulang.
INSERT OR IGNORE INTO mosques (
  id, name, address, location_id, latitude, longitude, capacity,
  chairman, secretary, treasurer, qris_title, qris_image_url, qris_caption,
  gdrive_folder_url, prayer_provider, iqomah_subuh, iqomah_dzuhur,
  iqomah_ashar, iqomah_maghrib, iqomah_isya, balance_start, income,
  expense, balance_end, balance_updated_at, running_texts
) VALUES (
  'MNR-SDA01',
  'MASJID AN-NUR SIDOARJO UMSIDA',
  'Jl. Mojopahit No.666, Celep, Kabupaten Sidoarjo Jawa Timur',
  'cfa0860e83a4c3a763a7e62d825349f7',
  -7.4467, 112.7181, '800 Jamaah',
  'H. Ahmad Fulan', 'Budi Santoso, ST', 'H. M. Mansur',
  'Infaq & Sedekah',
  'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=DonasiMasjidAnNurSidoarjo',
  'Scan QRIS a.n Masjid An-Nur',
  'https://drive.google.com/drive/folders/1oX7T4ZEZpJXi6FSOXKw8fkLB99PjMhgC?usp=sharing',
  'NU', 25, 25, 5, 20, 25,
  'Rp 15.000.000', 'Rp 5.500.000', 'Rp 2.150.000',
  'Rp 18.350.000', '10 Maret 2026',
  '["<b>Laporan Keuangan:</b> Saldo Kas Rp 18.350.000","<b>Agenda:</b> Kajian Ahad Pagi","Mohon menonaktifkan suara handphone saat memasuki area shalat"]'
);

INSERT OR IGNORE INTO sliders (
  id, mosque_id, type, value, title, duration, is_live, sort_order, is_active
) VALUES
  ('seed-youtube-1', 'MNR-SDA01', 'youtube', 'F8121v_ER9M', 'Video Reguler', 30, 0, 0, 1),
  ('seed-youtube-2', 'MNR-SDA01', 'youtube', '_XgE09RZsB8', 'Live Stream', 180, 1, 1, 1);
