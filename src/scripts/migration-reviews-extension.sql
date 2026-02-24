-- ============================================================================
-- Reviews Extension — Support for Merch & Digital Product Reviews
-- ============================================================================
-- Run in Supabase SQL Editor
-- ============================================================================

-- Add review_type column to distinguish video/merch/digital reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'video'
  CHECK (review_type IN ('video', 'merch', 'digital'));

-- Add foreign key to merch orders
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS merch_order_id UUID REFERENCES merch_orders(id);

-- Add foreign key to digital orders
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS digital_order_id UUID REFERENCES digital_orders(id);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_merch_order ON reviews(merch_order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_digital_order ON reviews(digital_order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(review_type);
