-- Rizzova Edge – Cloudflare D1 schema
-- Money is stored as integer minor units (cents). Timestamps are Unix epoch milliseconds.
-- D1 enforces foreign keys by default. Keep every statement idempotent (IF NOT EXISTS).

-- ───────────────────────── AliExpress auth ─────────────────────────
CREATE TABLE IF NOT EXISTS auth_tokens (
  id                  TEXT PRIMARY KEY,              -- 'aliexpress' (one store account)
  access_token        TEXT NOT NULL,
  refresh_token       TEXT NOT NULL,
  expires_at          INTEGER NOT NULL,              -- access token expiry (ms)
  refresh_expires_at  INTEGER,                       -- refresh token expiry (ms)
  ae_user_id          TEXT,
  account             TEXT,
  updated_at          INTEGER NOT NULL
);

-- ───────────────────────── Catalogue ─────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id                  INTEGER PRIMARY KEY,
  ae_category_id      INTEGER UNIQUE,
  parent_id           INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id                    INTEGER PRIMARY KEY,
  aliexpress_product_id TEXT NOT NULL UNIQUE,
  category_id           INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  description           TEXT,                        -- sanitised HTML
  slug                  TEXT NOT NULL UNIQUE,
  status                TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','archived','unavailable')),
  currency              TEXT NOT NULL,
  -- Denormalised for fast listing pages (maintained by the ingester):
  min_price_cents       INTEGER,
  max_price_cents       INTEGER,
  feature_image_id      TEXT,                        -- Cloudflare Images id
  total_stock           INTEGER NOT NULL DEFAULT 0,
  last_synced_at        INTEGER,
  sync_error            TEXT,
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_listing  ON products(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_products_sync     ON products(last_synced_at);

CREATE TABLE IF NOT EXISTS product_variants (
  id                INTEGER PRIMARY KEY,
  product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ae_sku_id         TEXT NOT NULL,                   -- AliExpress sku_id
  ae_sku_attr       TEXT NOT NULL,                   -- AliExpress sku_attr (needed to place the order)
  sku               TEXT NOT NULL UNIQUE,            -- our SKU: RZ-<ae product>-<ae sku>
  price_cents       INTEGER NOT NULL CHECK (price_cents >= 0),       -- our retail price
  compare_at_price_cents INTEGER CHECK (compare_at_price_cents >= 0),
  cost_cents        INTEGER NOT NULL CHECK (cost_cents >= 0),        -- AliExpress price we pay
  stock_qty         INTEGER NOT NULL DEFAULT 0,
  attributes_json   TEXT NOT NULL DEFAULT '{}',      -- {"Color":"Red","Size":"M"}
  is_active         INTEGER NOT NULL DEFAULT 1,
  synced_run        INTEGER NOT NULL DEFAULT 0,      -- ingest run stamp; used to retire vanished SKUs
  UNIQUE (product_id, ae_sku_id)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id, is_active);

CREATE TABLE IF NOT EXISTS product_images (
  id                  INTEGER PRIMARY KEY,
  product_id          INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id          INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  cloudflare_image_id TEXT NOT NULL,
  source_url          TEXT NOT NULL,
  position            INTEGER NOT NULL DEFAULT 0,
  is_feature          INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, cloudflare_image_id)
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id, position);

-- Full-text search over titles (D1 supports FTS5).
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(title, content='products', content_rowid='id');
CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, title) VALUES (new.id, new.title);
END;
CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, title) VALUES ('delete', old.id, old.title);
END;
CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE OF title ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, title) VALUES ('delete', old.id, old.title);
  INSERT INTO products_fts(rowid, title) VALUES (new.id, new.title);
END;

-- Products the ingester should pull (added by admin or by the feed importer).
CREATE TABLE IF NOT EXISTS import_queue (
  aliexpress_product_id TEXT PRIMARY KEY,
  requested_at          INTEGER NOT NULL,
  attempts              INTEGER NOT NULL DEFAULT 0,
  last_error            TEXT
);

-- ───────────────────────── Orders ─────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                      TEXT PRIMARY KEY,          -- uuid
  order_number            TEXT NOT NULL UNIQUE,      -- human friendly: RZ-240001
  email                   TEXT,
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','paid','fulfilling','shipped','delivered','cancelled','refunded','fulfilment_failed')),
  currency                TEXT NOT NULL,
  subtotal_cents          INTEGER NOT NULL,
  shipping_cents          INTEGER NOT NULL DEFAULT 0,
  total_cents             INTEGER NOT NULL,
  stripe_session_id       TEXT UNIQUE,
  stripe_payment_intent   TEXT,
  shipping_name           TEXT,
  shipping_phone          TEXT,
  shipping_address_json   TEXT,                      -- {line1,line2,city,state,postal_code,country}
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id                INTEGER PRIMARY KEY,
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id        INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  -- Snapshots: the order must not change if the catalogue does.
  ae_product_id     TEXT NOT NULL,
  ae_sku_attr       TEXT NOT NULL,
  title             TEXT NOT NULL,
  sku               TEXT NOT NULL,
  unit_price_cents  INTEGER NOT NULL,
  unit_cost_cents   INTEGER NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Outbound logistics: one row per AliExpress order created for a store order.
CREATE TABLE IF NOT EXISTS fulfillments (
  id               INTEGER PRIMARY KEY,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ae_order_id      TEXT UNIQUE,
  status           TEXT NOT NULL DEFAULT 'requested'
                   CHECK (status IN ('requested','placed','shipped','delivered','failed')),
  tracking_number  TEXT,
  carrier          TEXT,
  attempts         INTEGER NOT NULL DEFAULT 0,
  last_error       TEXT,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fulfillments_order  ON fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON fulfillments(status, updated_at);

-- Webhook idempotency (Stripe event ids).
CREATE TABLE IF NOT EXISTS webhook_events (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  received_at  INTEGER NOT NULL
);

-- Order number sequence (D1 has no sequences).
CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT OR IGNORE INTO counters(name, value) VALUES ('order_number', 240000);
