-- Data awal. Aman dijalankan berulang (upsert).
INSERT INTO mosques (
  id, name, address, location_id, latitude, longitude, capacity,
  chairman, secretary, treasurer, qris_title, qris_image_url, qris_caption,
  gdrive_folder_url, prayer_provider, iqomah_subuh, iqomah_dzuhur,
  iqomah_ashar, iqomah_maghrib, iqomah_isya, balance_start, income,
  expense, balance_end, balance_updated_at, running_texts, is_active
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
  '["<b>Laporan Keuangan:</b> Saldo Kas Rp 18.350.000","<b>Agenda:</b> Kajian Ahad Pagi","Mohon menonaktifkan suara handphone saat memasuki area shalat"]',
  1
)
ON CONFLICT(id) DO UPDATE SET
  name=excluded.name,
  address=excluded.address,
  location_id=excluded.location_id,
  latitude=excluded.latitude,
  longitude=excluded.longitude,
  capacity=excluded.capacity,
  chairman=excluded.chairman,
  secretary=excluded.secretary,
  treasurer=excluded.treasurer,
  qris_title=excluded.qris_title,
  qris_image_url=excluded.qris_image_url,
  qris_caption=excluded.qris_caption,
  gdrive_folder_url=excluded.gdrive_folder_url,
  prayer_provider=excluded.prayer_provider,
  iqomah_subuh=excluded.iqomah_subuh,
  iqomah_dzuhur=excluded.iqomah_dzuhur,
  iqomah_ashar=excluded.iqomah_ashar,
  iqomah_maghrib=excluded.iqomah_maghrib,
  iqomah_isya=excluded.iqomah_isya,
  balance_start=excluded.balance_start,
  income=excluded.income,
  expense=excluded.expense,
  balance_end=excluded.balance_end,
  balance_updated_at=excluded.balance_updated_at,
  running_texts=excluded.running_texts,
  is_active=1,
  updated_at=CURRENT_TIMESTAMP;

INSERT INTO sliders (
  id, mosque_id, type, value, title, duration, is_live, sort_order, is_active
) VALUES
  ('seed-youtube-1', 'MNR-SDA01', 'youtube', 'F8121v_ER9M', 'Video Reguler', 30, 0, 0, 1),
  ('seed-youtube-2', 'MNR-SDA01', 'youtube', '_XgE09RZsB8', 'Live Stream', 180, 1, 1, 1)
ON CONFLICT(id) DO UPDATE SET
  type=excluded.type,
  value=excluded.value,
  title=excluded.title,
  duration=excluded.duration,
  is_live=excluded.is_live,
  sort_order=excluded.sort_order,
  is_active=1,
  updated_at=CURRENT_TIMESTAMP;
