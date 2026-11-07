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
