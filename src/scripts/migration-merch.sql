-- ============================================================================
-- Viveo Merch Feature — Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Product Categories (Majice, Solje, Kape, Posteri, etc.)
CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id        UUID NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  product_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  description         TEXT DEFAULT '',
  price               INTEGER NOT NULL,
  is_active           BOOLEAN DEFAULT true,
  featured            BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(celebrity_id, slug)
);

-- 3. Product Variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sku             TEXT,
  price_override  INTEGER,
  stock           INTEGER NOT NULL DEFAULT 0,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Product Images (multiple per product)
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_path  TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. Merch Orders
CREATE TABLE IF NOT EXISTS merch_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id            UUID NOT NULL REFERENCES profiles(id),
  celebrity_id        UUID NOT NULL REFERENCES celebrities(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  product_variant_id  UUID REFERENCES product_variants(id),
  quantity            INTEGER NOT NULL DEFAULT 1,
  unit_price          INTEGER NOT NULL,
  total_price         INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  buyer_name          TEXT NOT NULL,
  buyer_email         TEXT NOT NULL,
  buyer_phone         TEXT DEFAULT '',
  shipping_name       TEXT NOT NULL,
  shipping_address    TEXT NOT NULL,
  shipping_city       TEXT NOT NULL,
  shipping_postal     TEXT NOT NULL,
  shipping_note       TEXT DEFAULT '',
  tracking_number     TEXT,
  confirmed_at        TIMESTAMPTZ,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_celebrity_id ON products(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(product_category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_buyer_id ON merch_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_celebrity_id ON merch_orders(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_product_id ON merch_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON merch_orders(status);

-- ============================================================================
-- Supabase Storage: Create public bucket for product images
-- Run this separately or via Supabase dashboard:
--
--   INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
--
-- Then set storage policy to allow authenticated uploads:
--
--   CREATE POLICY "Allow authenticated uploads" ON storage.objects
--     FOR INSERT TO authenticated
--     WITH CHECK (bucket_id = 'product-images');
--
--   CREATE POLICY "Allow public reads" ON storage.objects
--     FOR SELECT TO public
--     USING (bucket_id = 'product-images');
--
--   CREATE POLICY "Allow authenticated deletes" ON storage.objects
--     FOR DELETE TO authenticated
--     USING (bucket_id = 'product-images');
-- ============================================================================

-- Seed some product categories
INSERT INTO product_categories (name, slug, icon) VALUES
  ('Majice', 'majice', '👕'),
  ('Šolje', 'solje', '☕'),
  ('Kape', 'kape', '🧢'),
  ('Posteri', 'posteri', '🖼️'),
  ('Duksevi', 'duksevi', '🧥'),
  ('Torbe', 'torbe', '👜'),
  ('Nakit', 'nakit', '💍'),
  ('Ostalo', 'ostalo', '📦')
ON CONFLICT (slug) DO NOTHING;
