-- ============================================================================
-- Favorites / Wishlist — Database Migration
-- ============================================================================
-- Run in Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type  TEXT NOT NULL CHECK (item_type IN ('celebrity', 'product', 'digital_product')),
  item_id    UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item ON favorites(item_type, item_id);
