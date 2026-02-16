-- ============================================
-- Viveo Database Schema
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'fan' CHECK (role IN ('fan', 'star', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  slug            TEXT NOT NULL UNIQUE,
  icon            TEXT NOT NULL DEFAULT '',
  celebrity_count INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Celebrities
CREATE TABLE celebrities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  image               TEXT DEFAULT '',
  category_id         UUID NOT NULL REFERENCES categories(id),
  price               INT NOT NULL DEFAULT 3000 CHECK (price >= 500),
  rating              NUMERIC(2,1) NOT NULL DEFAULT 0.0,
  review_count        INT NOT NULL DEFAULT 0,
  verified            BOOLEAN NOT NULL DEFAULT false,
  bio                 TEXT NOT NULL DEFAULT '',
  extended_bio        TEXT DEFAULT '',
  response_time       INT NOT NULL DEFAULT 24 CHECK (response_time > 0),
  tags                TEXT[] DEFAULT '{}',
  accepting_requests  BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_celebrities_slug ON celebrities(slug);
CREATE INDEX idx_celebrities_category ON celebrities(category_id);
CREATE INDEX idx_celebrities_rating ON celebrities(rating DESC);
CREATE INDEX idx_celebrities_price ON celebrities(price);

-- Video Types
CREATE TABLE video_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id  UUID NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  occasion      TEXT NOT NULL,
  emoji         TEXT DEFAULT '',
  accent_from   TEXT DEFAULT '',
  accent_to     TEXT DEFAULT '',
  message       TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_types_celebrity ON video_types(celebrity_id);

-- Orders
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES profiles(id),
  celebrity_id    UUID NOT NULL REFERENCES celebrities(id),
  video_type_id   UUID NOT NULL REFERENCES video_types(id),
  buyer_name      TEXT NOT NULL,
  buyer_email     TEXT NOT NULL,
  recipient_name  TEXT NOT NULL,
  instructions    TEXT NOT NULL,
  price           INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  video_url       TEXT DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline        TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_celebrity ON orders(celebrity_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Reviews
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL UNIQUE REFERENCES orders(id),
  author_id     UUID NOT NULL REFERENCES profiles(id),
  celebrity_id  UUID NOT NULL REFERENCES celebrities(id),
  rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_celebrity ON reviews(celebrity_id);
CREATE INDEX idx_reviews_author ON reviews(author_id);

-- Availability Slots
CREATE TABLE availability_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id  UUID NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  available     BOOLEAN NOT NULL DEFAULT true,
  max_requests  INT NOT NULL DEFAULT 5 CHECK (max_requests >= 0 AND max_requests <= 20),
  UNIQUE(celebrity_id, day_of_week)
);

CREATE INDEX idx_availability_celebrity ON availability_slots(celebrity_id);

-- Applications
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  category      TEXT NOT NULL,
  social_media  TEXT NOT NULL,
  followers     TEXT NOT NULL,
  bio           TEXT NOT NULL,
  motivation    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by  UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_celebrities_updated BEFORE UPDATE ON celebrities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-update celebrity rating and review_count
CREATE OR REPLACE FUNCTION update_celebrity_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.celebrity_id, OLD.celebrity_id);
  UPDATE celebrities SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE celebrity_id = target_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE celebrity_id = target_id)
  WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_celebrity_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_celebrity_rating();

-- Auto-update category celebrity_count
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id) THEN
    UPDATE categories SET celebrity_count = (
      SELECT COUNT(*) FROM celebrities WHERE category_id = OLD.category_id
    ) WHERE id = OLD.category_id;
  END IF;

  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id) THEN
    UPDATE categories SET celebrity_count = (
      SELECT COUNT(*) FROM celebrities WHERE category_id = NEW.category_id
    ) WHERE id = NEW.category_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_category_count
AFTER INSERT OR UPDATE OR DELETE ON celebrities
FOR EACH ROW EXECUTE FUNCTION update_category_count();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Categories
CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT USING (true);

-- Celebrities
CREATE POLICY "Celebrities are publicly readable" ON celebrities FOR SELECT USING (true);
CREATE POLICY "Stars can update own celebrity" ON celebrities FOR UPDATE USING (auth.uid() = profile_id);

-- Video Types
CREATE POLICY "Video types are publicly readable" ON video_types FOR SELECT USING (true);
CREATE POLICY "Stars can manage own video types" ON video_types FOR ALL USING (
  celebrity_id IN (SELECT id FROM celebrities WHERE profile_id = auth.uid())
);

-- Orders
CREATE POLICY "Buyers can see own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Stars can see their orders" ON orders FOR SELECT USING (
  celebrity_id IN (SELECT id FROM celebrities WHERE profile_id = auth.uid())
);
CREATE POLICY "Authenticated users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Stars can update their order statuses" ON orders FOR UPDATE USING (
  celebrity_id IN (SELECT id FROM celebrities WHERE profile_id = auth.uid())
);

-- Reviews
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Availability Slots
CREATE POLICY "Availability is publicly readable" ON availability_slots FOR SELECT USING (true);
CREATE POLICY "Stars can manage own availability" ON availability_slots FOR ALL USING (
  celebrity_id IN (SELECT id FROM celebrities WHERE profile_id = auth.uid())
);

-- Applications
CREATE POLICY "Users can see own applications" ON applications FOR SELECT USING (auth.uid() = submitted_by);
CREATE POLICY "Anyone can submit applications" ON applications FOR INSERT WITH CHECK (true);
