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
