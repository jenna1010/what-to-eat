CREATE TABLE album_visits (
  id TEXT PRIMARY KEY NOT NULL,
  request_hash TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  shop_json TEXT NOT NULL,
  dishes_json TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE album_photos (
  photo_key TEXT PRIMARY KEY NOT NULL,
  visit_id TEXT NOT NULL REFERENCES album_visits(id)
);
--> statement-breakpoint
CREATE TABLE album_edits (
  record_id TEXT PRIMARY KEY NOT NULL,
  score REAL,
  score_set INTEGER NOT NULL DEFAULT 0,
  me TEXT,
  partner TEXT
);
--> statement-breakpoint
ALTER TABLE album_edits ADD COLUMN name TEXT;
--> statement-breakpoint
ALTER TABLE album_edits ADD COLUMN categories_json TEXT;
--> statement-breakpoint
ALTER TABLE album_edits ADD COLUMN price REAL;
--> statement-breakpoint
ALTER TABLE album_edits ADD COLUMN price_set INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE album_edits ADD COLUMN visit_date TEXT;
--> statement-breakpoint
ALTER TABLE album_edits ADD COLUMN orderer TEXT;
--> statement-breakpoint
ALTER TABLE album_edits ADD COLUMN photo_key TEXT;
--> statement-breakpoint
CREATE INDEX album_edits_photo_key ON album_edits(photo_key) WHERE photo_key IS NOT NULL;
--> statement-breakpoint
CREATE TABLE album_shop_edits (
  shop_id TEXT PRIMARY KEY NOT NULL,
  name TEXT,
  english_name TEXT,
  city TEXT,
  district TEXT,
  address TEXT
);
