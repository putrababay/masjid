-- Migrasi: jadwal sholat dari per-masjid menjadi global (provider + tanggal).
-- Jalankan sekali di D1 remote/local:
--   npx wrangler d1 execute masjid-db --remote --file=migrate-prayer-global.sql
--   npx wrangler d1 execute masjid-db --local --file=migrate-prayer-global.sql

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS prayer_schedules_global (
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

INSERT OR IGNORE INTO prayer_schedules_global
  (provider, prayer_date, imsak, subuh, terbit, dhuha, dzuhur, ashar, maghrib, isya, source, fetched_at)
SELECT provider, prayer_date, imsak, subuh, terbit, dhuha, dzuhur, ashar, maghrib, isya, source, fetched_at
FROM prayer_schedules
WHERE EXISTS (
  SELECT 1 FROM sqlite_master WHERE type='table' AND name='prayer_schedules'
);

DROP TABLE IF EXISTS prayer_schedules;
ALTER TABLE prayer_schedules_global RENAME TO prayer_schedules;

CREATE INDEX IF NOT EXISTS idx_prayer_provider_date
  ON prayer_schedules(provider, prayer_date);

PRAGMA foreign_keys = ON;
