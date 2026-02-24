-- ============================================================================
-- Digital Products Store — Database Migration
-- ============================================================================
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. Digital Product Categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digital_product_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Digital Products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digital_products (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id                UUID NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  digital_product_category_id UUID REFERENCES digital_product_categories(id) ON DELETE SET NULL,
  name                        TEXT NOT NULL,
  slug                        TEXT NOT NULL,
  description                 TEXT DEFAULT '',
  price                       INTEGER NOT NULL,
  file_path                   TEXT NOT NULL DEFAULT '',
  file_name                   TEXT NOT NULL DEFAULT '',
  file_size                   BIGINT NOT NULL DEFAULT 0,
  file_type                   TEXT NOT NULL DEFAULT '',
  preview_image_path          TEXT,
  is_active                   BOOLEAN DEFAULT true,
  featured                    BOOLEAN DEFAULT false,
  download_count              INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(celebrity_id, slug)
);

-- 3. Digital Orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digital_orders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                  UUID NOT NULL REFERENCES profiles(id),
  celebrity_id              UUID NOT NULL REFERENCES celebrities(id),
  digital_product_id        UUID NOT NULL REFERENCES digital_products(id),
  price                     INTEGER NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  buyer_name                TEXT NOT NULL,
  buyer_email               TEXT NOT NULL,
  buyer_phone               TEXT DEFAULT '',
  download_token            TEXT,
  download_token_expires_at TIMESTAMPTZ,
  download_count            INTEGER DEFAULT 0,
  confirmed_at              TIMESTAMPTZ,
  completed_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_digital_products_celebrity_id ON digital_products(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_category_id ON digital_products(digital_product_category_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_is_active ON digital_products(is_active);

CREATE INDEX IF NOT EXISTS idx_digital_orders_buyer_id ON digital_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_digital_orders_celebrity_id ON digital_orders(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_digital_orders_product_id ON digital_orders(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_digital_orders_status ON digital_orders(status);
CREATE INDEX IF NOT EXISTS idx_digital_orders_download_token ON digital_orders(download_token);

-- ============================================================================
-- Seed digital product categories
-- ============================================================================
INSERT INTO digital_product_categories (name, slug, icon) VALUES
  ('Preseti', 'preseti', '🎨'),
  ('Šabloni', 'sabloni', '📐'),
  ('Muzika', 'muzika', '🎵'),
  ('PDF Materijali', 'pdf-materijali', '📄'),
  ('Edukacija', 'edukacija', '📚'),
  ('Grafika', 'grafika', '🖼️'),
  ('Software', 'software', '💻'),
  ('Ostalo', 'ostalo', '📦')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Storage Buckets (run via Supabase dashboard or API)
-- ============================================================================
-- 1. Create PRIVATE bucket: digital-products
--    (files accessible only via signed URLs through the download endpoint)
--
-- 2. Create PUBLIC bucket: digital-product-previews
--    (preview images accessible publicly)
--
-- Storage policies:
--   digital-products:
--     - INSERT: authenticated users (service_role for upload via backend)
--     - SELECT: service_role only (backend generates signed URLs)
--     - DELETE: service_role only
--
--   digital-product-previews:
--     - INSERT: authenticated users
--     - SELECT: public (anyone can view preview images)
--     - DELETE: authenticated users
-- ============================================================================
