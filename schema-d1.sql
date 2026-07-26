PRAGMA foreign_keys = ON;

-- Data identitas masjid dan pengaturan jadwal.
CREATE TABLE IF NOT EXISTS mosques (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  location_id TEXT NOT NULL DEFAULT '',
  latitude REAL NOT NULL DEFAULT -7.4467,
  longitude REAL NOT NULL DEFAULT 112.7181,
  capacity TEXT NOT NULL DEFAULT '',
  chairman TEXT NOT NULL DEFAULT '',
  secretary TEXT NOT NULL DEFAULT '',
  treasurer TEXT NOT NULL DEFAULT '',
  qris_title TEXT NOT NULL DEFAULT 'Infaq & Sedekah',
  qris_image_url TEXT NOT NULL DEFAULT '',
  qris_caption TEXT NOT NULL DEFAULT '',
  gdrive_folder_url TEXT NOT NULL DEFAULT '',
  prayer_provider TEXT NOT NULL DEFAULT 'NU'
    CHECK (prayer_provider IN ('NU', 'KHGT')),
  iqomah_subuh INTEGER NOT NULL DEFAULT 10,
  iqomah_dzuhur INTEGER NOT NULL DEFAULT 10,
  iqomah_ashar INTEGER NOT NULL DEFAULT 10,
  iqomah_maghrib INTEGER NOT NULL DEFAULT 10,
  iqomah_isya INTEGER NOT NULL DEFAULT 10,
  balance_start TEXT NOT NULL DEFAULT 'Rp 0',
  income TEXT NOT NULL DEFAULT 'Rp 0',
  expense TEXT NOT NULL DEFAULT 'Rp 0',
  balance_end TEXT NOT NULL DEFAULT 'Rp 0',
  balance_updated_at TEXT NOT NULL DEFAULT '',
  running_texts TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- role: superadmin = semua data, admin_masjid = CRUD masjid sendiri,
-- viewer = hanya melihat preview dan data masjid sendiri.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  mosque_id TEXT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('superadmin', 'admin_masjid', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sliders (
  id TEXT PRIMARY KEY,
  mosque_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'youtube', 'gdrive')),
  value TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 15 CHECK (duration >= 5),
  is_live INTEGER NOT NULL DEFAULT 0 CHECK (is_live IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE
);

-- Jadwal sholat GLOBAL (bukan per masjid).
-- Masjid hanya memilih provider NU / KHGT di pengaturan.
CREATE TABLE IF NOT EXISTS prayer_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL CHECK (provider IN ('NU', 'KHGT')),
  prayer_date TEXT NOT NULL,
  imsak TEXT,
  subuh TEXT NOT NULL,
  terbit TEXT,
  dhuha TEXT,
  dzuhur TEXT NOT NULL,
  ashar TEXT NOT NULL,
  maghrib TEXT NOT NULL,
  isya TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, prayer_date)
);

CREATE INDEX IF NOT EXISTS idx_users_mosque ON users(mosque_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sliders_mosque_order
  ON sliders(mosque_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_prayer_provider_date
  ON prayer_schedules(provider, prayer_date);
