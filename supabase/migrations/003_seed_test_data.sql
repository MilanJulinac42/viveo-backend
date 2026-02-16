-- ============================================
-- Seed Test Data for Development
-- ============================================

-- First, create auth users for celebrities (using Supabase service role)
-- We'll create them via the API, so here we create profiles + celebrities directly
-- NOTE: Run this AFTER creating auth users via the seed script or API

-- Create star auth users (8 stars + their profiles)
-- We'll use the supabaseAdmin.auth.admin.createUser() for this in a seed script
-- For now, insert profiles assuming auth users already exist

-- ============================================
-- Step 1: Create auth users via Supabase Admin API
-- This SQL creates profiles directly (auth users must be created separately)
-- ============================================

-- We'll use a DO block to create everything in one transaction
DO $$
DECLARE
  -- Star profile IDs (we generate them here)
  star1_id UUID := gen_random_uuid();
  star2_id UUID := gen_random_uuid();
  star3_id UUID := gen_random_uuid();
  star4_id UUID := gen_random_uuid();
  star5_id UUID := gen_random_uuid();
  star6_id UUID := gen_random_uuid();
  star7_id UUID := gen_random_uuid();
  star8_id UUID := gen_random_uuid();

  -- Fan profile IDs
  fan1_id UUID := gen_random_uuid();
  fan2_id UUID := gen_random_uuid();
  fan3_id UUID := gen_random_uuid();
  fan4_id UUID := gen_random_uuid();

  -- Category IDs
  cat_glumci UUID;
  cat_muzicari UUID;
  cat_sportisti UUID;
  cat_influenseri UUID;
  cat_komicari UUID;
  cat_tv_voditelji UUID;

  -- Celebrity IDs
  cel1_id UUID;
  cel2_id UUID;
  cel3_id UUID;
  cel4_id UUID;
  cel5_id UUID;
  cel6_id UUID;
  cel7_id UUID;
  cel8_id UUID;

  -- Video type IDs for orders
  vt1_id UUID;
  vt2_id UUID;
  vt3_id UUID;
  vt4_id UUID;
  vt5_id UUID;

BEGIN
  -- Get category IDs
  SELECT id INTO cat_glumci FROM categories WHERE slug = 'glumci';
  SELECT id INTO cat_muzicari FROM categories WHERE slug = 'muzicari';
  SELECT id INTO cat_sportisti FROM categories WHERE slug = 'sportisti';
  SELECT id INTO cat_influenseri FROM categories WHERE slug = 'influenseri';
  SELECT id INTO cat_komicari FROM categories WHERE slug = 'komicari';
  SELECT id INTO cat_tv_voditelji FROM categories WHERE slug = 'tv-voditelji';

  -- ========================================
  -- Create auth users (Supabase internal)
  -- ========================================

  -- Stars
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (star1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marko.nikolic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (star2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jelena.petrovic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (star3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stefan.jovanovic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (star4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana.djordjevic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (star5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nikola.stankovic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (star6_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'milica.todorovic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (star7_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'djordje.milosevic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (star8_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ivana.ilic@viveo.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}');

  -- Fans
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (fan1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'petar.markovic@test.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (fan2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maja.pavlovic@test.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (fan3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nemanja.ristic@test.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}'),
    (fan4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tamara.djukic@test.rs', crypt('test123456', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{"email_verified":true}');

  -- Auth identities (required by Supabase)
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), star1_id, star1_id, jsonb_build_object('sub', star1_id, 'email', 'marko.nikolic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), star2_id, star2_id, jsonb_build_object('sub', star2_id, 'email', 'jelena.petrovic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), star3_id, star3_id, jsonb_build_object('sub', star3_id, 'email', 'stefan.jovanovic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), star4_id, star4_id, jsonb_build_object('sub', star4_id, 'email', 'ana.djordjevic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), star5_id, star5_id, jsonb_build_object('sub', star5_id, 'email', 'nikola.stankovic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), star6_id, star6_id, jsonb_build_object('sub', star6_id, 'email', 'milica.todorovic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), star7_id, star7_id, jsonb_build_object('sub', star7_id, 'email', 'djordje.milosevic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), star8_id, star8_id, jsonb_build_object('sub', star8_id, 'email', 'ivana.ilic@viveo.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), fan1_id, fan1_id, jsonb_build_object('sub', fan1_id, 'email', 'petar.markovic@test.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), fan2_id, fan2_id, jsonb_build_object('sub', fan2_id, 'email', 'maja.pavlovic@test.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), fan3_id, fan3_id, jsonb_build_object('sub', fan3_id, 'email', 'nemanja.ristic@test.rs'), 'email', now(), now(), now()),
    (gen_random_uuid(), fan4_id, fan4_id, jsonb_build_object('sub', fan4_id, 'email', 'tamara.djukic@test.rs'), 'email', now(), now(), now());

  -- ========================================
  -- Profiles
  -- ========================================
  INSERT INTO profiles (id, full_name, role) VALUES
    (star1_id, 'Marko Nikolić', 'star'),
    (star2_id, 'Jelena Petrović', 'star'),
    (star3_id, 'Stefan Jovanović', 'star'),
    (star4_id, 'Ana Đorđević', 'star'),
    (star5_id, 'Nikola Stanković', 'star'),
    (star6_id, 'Milica Todorović', 'star'),
    (star7_id, 'Đorđe Milošević', 'star'),
    (star8_id, 'Ivana Ilić', 'star'),
    (fan1_id, 'Petar Marković', 'fan'),
    (fan2_id, 'Maja Pavlović', 'fan'),
    (fan3_id, 'Nemanja Ristić', 'fan'),
    (fan4_id, 'Tamara Đukić', 'fan');

  -- ========================================
  -- Celebrities
  -- ========================================
  INSERT INTO celebrities (id, profile_id, name, slug, category_id, price, verified, bio, extended_bio, response_time, tags)
  VALUES
    (gen_random_uuid(), star1_id, 'Marko Nikolić', 'marko-nikolic', cat_glumci, 3500, true,
     'Poznati srpski glumac sa više od 20 godina iskustva u pozorištu i na filmu.',
     'Marko Nikolić je jedan od najcenjenijih srpskih glumaca svoje generacije. Sa preko 20 godina iskustva na pozorišnim daskama i filmskom platnu, osvojio je brojne nagrade uključujući Sterijinu nagradu i nagradu za najboljeg glumca na FEST-u.',
     24, ARRAY['Glumac', 'Pozorište', 'Film', 'Nagrađivani', 'Mentor']),

    (gen_random_uuid(), star2_id, 'Jelena Petrović', 'jelena-petrovic', cat_muzicari, 5000, true,
     'Pop zvezda sa brojem 1 hitovima i milionskim pregledima na YouTube-u.',
     'Jelena Petrović je jedna od najpopularnijih pop pevačica u Srbiji. Njen debi album je dostigao platinasti tiraž, a singlovi redovno zauzimaju prva mesta na top listama.',
     48, ARRAY['Pevačica', 'Pop muzika', 'YouTube', 'Humanitarni rad', 'Koncerti']),

    (gen_random_uuid(), star3_id, 'Stefan Jovanović', 'stefan-jovanovic', cat_sportisti, 4000, true,
     'Reprezentativac Srbije u fudbalu, igrač jednog od najjačih evropskih klubova.',
     'Stefan Jovanović je ponos srpskog fudbala. Kao kapiten reprezentacije, predvodio je tim do istorijskog uspeha na evropskom prvenstvu.',
     72, ARRAY['Fudbaler', 'Reprezentativac', 'Kapiten', 'Fondacija', 'Sportski duh']),

    (gen_random_uuid(), star4_id, 'Ana Đorđević', 'ana-djordjevic', cat_influenseri, 2000, true,
     'Najpraćenija srpska influenserka sa preko milion pratilaca na Instagramu.',
     'Ana Đorđević je digitalna kreatorka sadržaja koja je osvojila srca publike autentičnošću i kreativnošću. Sa preko milion pratilaca na Instagramu i pola miliona na TikToku.',
     12, ARRAY['Influenserka', 'Instagram', 'Moda', 'Lifestyle', 'Podcast']),

    (gen_random_uuid(), star5_id, 'Nikola Stanković', 'nikola-stankovic', cat_komicari, 2500, true,
     'Stand-up komičar poznat po hit emisiji i rasprodatim nastupima širom Srbije.',
     'Nikola Stanković je kralj srpskog stand-up humora. Njegov specijal na YouTube-u ima preko 10 miliona pregleda, a turneja mu je rasprodata mesecima unapred.',
     24, ARRAY['Komičar', 'Stand-up', 'TV', 'Podcast', 'Scenarista']),

    (gen_random_uuid(), star6_id, 'Milica Todorović', 'milica-todorovic', cat_tv_voditelji, 3000, true,
     'Voditeljka najgledanije jutarnje emisije u Srbiji sa 15 godina na TV-u.',
     'Milica Todorović je lice jutarnjeg programa koji svakodnevno prate milioni gledalaca. Sa 15 godina iskustva na televiziji.',
     48, ARRAY['Voditeljka', 'TV', 'Jutarnji program', 'Nagrađivana', 'Zdravi život']),

    (gen_random_uuid(), star7_id, 'Đorđe Milošević', 'djordje-milosevic', cat_muzicari, 4500, true,
     'Reper nove generacije sa platinum albumima i hitovima koji ruše rekorde.',
     'Đorđe Milošević je lider nove generacije srpskog hip-hop-a. Njegova muzika spaja trap zvuk sa autentičnim balkanskim elementima.',
     36, ARRAY['Reper', 'Hip-hop', 'TikTok', 'Platinum', 'Turneja']),

    (gen_random_uuid(), star8_id, 'Ivana Ilić', 'ivana-ilic', cat_glumci, 3000, false,
     'Mlada glumica poznata po ulozi u najgledanijoj domaćoj seriji sezone.',
     'Ivana Ilić je jedna od najtalentovanijih mladih glumica u Srbiji. Njenu glavnu ulogu u hit seriji prate milioni gledalaca svake nedelje.',
     24, ARRAY['Glumica', 'Serije', 'FDU', 'Pozorište', 'Mlada nada']);

  -- Get celebrity IDs for video types and orders
  SELECT id INTO cel1_id FROM celebrities WHERE slug = 'marko-nikolic';
  SELECT id INTO cel2_id FROM celebrities WHERE slug = 'jelena-petrovic';
  SELECT id INTO cel3_id FROM celebrities WHERE slug = 'stefan-jovanovic';
  SELECT id INTO cel4_id FROM celebrities WHERE slug = 'ana-djordjevic';
  SELECT id INTO cel5_id FROM celebrities WHERE slug = 'nikola-stankovic';
  SELECT id INTO cel6_id FROM celebrities WHERE slug = 'milica-todorovic';
  SELECT id INTO cel7_id FROM celebrities WHERE slug = 'djordje-milosevic';
  SELECT id INTO cel8_id FROM celebrities WHERE slug = 'ivana-ilic';

  -- ========================================
  -- Video Types
  -- ========================================

  -- Marko Nikolić
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel1_id, 'Rođendanska čestitka', 'Rođendan', '🎂', 'from-pink-500', 'to-rose-600', 'Srećan rođendan! Neka ti se svi snovi ostvare...'),
    (cel1_id, 'Motivaciona poruka', 'Motivacija', '💪', 'from-blue-500', 'to-cyan-600', 'Veruj u sebe, sve je moguće ako radiš na tome...'),
    (cel1_id, 'Čestitka za praznik', 'Praznici', '🎄', 'from-emerald-500', 'to-teal-600', 'Srećni praznici! Neka vam dom bude pun radosti...');

  -- Jelena Petrović
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel2_id, 'Muzička čestitka', 'Čestitka', '🎶', 'from-violet-500', 'to-purple-600', 'Posebna pesma samo za tebe, od srca...'),
    (cel2_id, 'Rođendanska poruka', 'Rođendan', '🎂', 'from-pink-500', 'to-rose-600', 'Srećan rođendan! Uživaj u svom danu...'),
    (cel2_id, 'Poruka za godišnjicu', 'Godišnjica', '💕', 'from-red-500', 'to-pink-600', 'Čestitam vam godišnjicu! Ljubav je najlepša...');

  -- Stefan Jovanović
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel3_id, 'Motivacija za sportiste', 'Motivacija', '⚽', 'from-green-500', 'to-emerald-600', 'Treniraj jako, igraj pametno, nikad ne odustaj...'),
    (cel3_id, 'Rođendanska čestitka', 'Rođendan', '🎉', 'from-amber-500', 'to-orange-600', 'Srećan rođendan, šampione! Neka ti godina bude...'),
    (cel3_id, 'Poruka ohrabrenja', 'Ohrabrenje', '🏆', 'from-sky-500', 'to-blue-600', 'Svaki pad je prilika da ustaneš jači...');

  -- Ana Đorđević
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel4_id, 'Personalizovani pozdrav', 'Pozdrav', '👋', 'from-fuchsia-500', 'to-pink-600', 'Hej! Evo jednog posebnog pozdrava za tebe...'),
    (cel4_id, 'Saveti za stil', 'Savet', '✨', 'from-violet-500', 'to-indigo-600', 'Imam specijalne savete za tvoj stil...'),
    (cel4_id, 'Rođendanska poruka', 'Rođendan', '🎂', 'from-rose-500', 'to-pink-600', 'Srećan rođendan, prelepa! Uživaj maksimalno...');

  -- Nikola Stanković
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel5_id, 'Šaljiva čestitka', 'Humor', '😂', 'from-yellow-500', 'to-amber-600', 'Spremi se za smeh! Imam nešto posebno za tebe...'),
    (cel5_id, 'Roast poruka', 'Roast', '🔥', 'from-orange-500', 'to-red-600', 'Drži se, ovo će te nasmejati do suza...'),
    (cel5_id, 'Poruka za ekipu', 'Ekipa', '🍻', 'from-lime-500', 'to-green-600', 'Za tvoju ekipu imam jednu dobru priču...');

  -- Milica Todorović
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel6_id, 'Jutarnji pozdrav', 'Pozdrav', '☀️', 'from-amber-500', 'to-yellow-600', 'Dobro jutro! Imam jednu posebnu poruku za tebe...'),
    (cel6_id, 'Čestitka za penziju', 'Penzija', '🥂', 'from-teal-500', 'to-cyan-600', 'Čestitam na zasluženom odmoru! Uživaj...'),
    (cel6_id, 'Rođendanska poruka', 'Rođendan', '🎂', 'from-pink-500', 'to-rose-600', 'Srećan rođendan! Neka ti dan bude prelep...');

  -- Đorđe Milošević
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel7_id, 'Freestyle pozdrav', 'Pozdrav', '🎤', 'from-purple-500', 'to-violet-600', 'Imam jednu rimu samo za tebe, slušaj...'),
    (cel7_id, 'Rođendanski rep', 'Rođendan', '🎂', 'from-indigo-500', 'to-blue-600', 'Srećan rođendan, brate! Evo jedna za tebe...'),
    (cel7_id, 'Motivaciona poruka', 'Motivacija', '💯', 'from-slate-600', 'to-zinc-700', 'Uvek napred, nikad nazad. Ti to možeš...');

  -- Ivana Ilić
  INSERT INTO video_types (celebrity_id, title, occasion, emoji, accent_from, accent_to, message) VALUES
    (cel8_id, 'Dramatična čestitka', 'Čestitka', '🎭', 'from-rose-500', 'to-red-600', 'Imam jednu posebnu poruku za tebe, slušaj pažljivo...'),
    (cel8_id, 'Rođendanska poruka', 'Rođendan', '🎂', 'from-pink-500', 'to-fuchsia-600', 'Srećan rođendan! Neka ti nova godina bude...'),
    (cel8_id, 'Fan poruka', 'Fan poruka', '💜', 'from-violet-500', 'to-purple-600', 'Hvala što me pratiš! Evo nešto samo za tebe...');

  -- Get some video type IDs for orders
  SELECT id INTO vt1_id FROM video_types WHERE celebrity_id = cel1_id LIMIT 1;
  SELECT id INTO vt2_id FROM video_types WHERE celebrity_id = cel3_id LIMIT 1;
  SELECT id INTO vt3_id FROM video_types WHERE celebrity_id = cel5_id LIMIT 1;
  SELECT id INTO vt4_id FROM video_types WHERE celebrity_id = cel4_id LIMIT 1;
  SELECT id INTO vt5_id FROM video_types WHERE celebrity_id = cel2_id LIMIT 1;

  -- ========================================
  -- Sample Orders
  -- ========================================
  INSERT INTO orders (buyer_id, celebrity_id, video_type_id, buyer_name, buyer_email, recipient_name, instructions, price, status, deadline, created_at) VALUES
    (fan1_id, cel1_id, vt1_id, 'Petar Marković', 'petar.markovic@test.rs', 'Mama Marković', 'Molim te čestitaj mami 60. rođendan, zove se Gordana. Veliki je fan tvog rada!', 3500, 'completed', now() + interval '24 hours', now() - interval '10 days'),
    (fan2_id, cel3_id, vt2_id, 'Maja Pavlović', 'maja.pavlovic@test.rs', 'Nikola Pavlović', 'Za dečka koji je najveći fan fudbala, čestitaj mu godišnjicu, 3 godine smo zajedno!', 4000, 'completed', now() + interval '72 hours', now() - interval '8 days'),
    (fan3_id, cel5_id, vt3_id, 'Nemanja Ristić', 'nemanja.ristic@test.rs', 'Kolega Dragan', 'Kolega odlazi u penziju posle 35 godina, napravi mu smešnu čestitku!', 2500, 'completed', now() + interval '24 hours', now() - interval '5 days'),
    (fan4_id, cel4_id, vt4_id, 'Tamara Đukić', 'tamara.djukic@test.rs', 'Ćerka Sara', 'Moja ćerka Sara ima 14 godina i obožava te! Čestitaj joj rođendan molim te.', 2000, 'completed', now() + interval '12 hours', now() - interval '3 days'),
    (fan1_id, cel2_id, vt5_id, 'Petar Marković', 'petar.markovic@test.rs', 'Devojka Jovana', 'Čestitaj Jovani rođendan sa pesmom ako možeš! Voli tvoju muziku.', 5000, 'approved', now() + interval '48 hours', now() - interval '1 day'),
    (fan2_id, cel7_id, (SELECT id FROM video_types WHERE celebrity_id = cel7_id LIMIT 1), 'Maja Pavlović', 'maja.pavlovic@test.rs', 'Brat Lazar', 'Brate, napravi freestyle za mog brata Lazara koji puni 18!', 4500, 'pending', now() + interval '36 hours', now()),
    (fan3_id, cel6_id, (SELECT id FROM video_types WHERE celebrity_id = cel6_id LIMIT 1), 'Nemanja Ristić', 'nemanja.ristic@test.rs', 'Tetka Milena', 'Tetka gleda tvoju emisiju svako jutro, iznenadi je za imendan!', 3000, 'pending', now() + interval '48 hours', now()),
    (fan4_id, cel8_id, (SELECT id FROM video_types WHERE celebrity_id = cel8_id LIMIT 1), 'Tamara Đukić', 'tamara.djukic@test.rs', 'Drugarica Ana', 'Drugarica ti je najveći fan, pošalji joj fan poruku molim te!', 3000, 'approved', now() + interval '24 hours', now() - interval '2 days');

  -- ========================================
  -- Reviews (for completed orders)
  -- ========================================
  INSERT INTO reviews (order_id, author_id, celebrity_id, rating, text)
  SELECT o.id, o.buyer_id, o.celebrity_id, 5, 'Naručio sam video poruku za maminu 60. rođendan. Plakala je od sreće! Najbolji poklon koji sam ikada dao.'
  FROM orders o WHERE o.buyer_id = fan1_id AND o.celebrity_id = cel1_id AND o.status = 'completed';

  INSERT INTO reviews (order_id, author_id, celebrity_id, rating, text)
  SELECT o.id, o.buyer_id, o.celebrity_id, 5, 'Iznenadila sam dečka za godišnjicu. Bio je u šoku! Ceo proces je bio brz i jednostavan.'
  FROM orders o WHERE o.buyer_id = fan2_id AND o.celebrity_id = cel3_id AND o.status = 'completed';

  INSERT INTO reviews (order_id, author_id, celebrity_id, rating, text)
  SELECT o.id, o.buyer_id, o.celebrity_id, 4, 'Video poruka za kolegu koji odlazi u penziju. Svi u kancelariji su se smejali do suza!'
  FROM orders o WHERE o.buyer_id = fan3_id AND o.celebrity_id = cel5_id AND o.status = 'completed';

  INSERT INTO reviews (order_id, author_id, celebrity_id, rating, text)
  SELECT o.id, o.buyer_id, o.celebrity_id, 5, 'Moja ćerka je dobila poruku od omiljene influenserke za rođendan. Nije mogla da veruje!'
  FROM orders o WHERE o.buyer_id = fan4_id AND o.celebrity_id = cel4_id AND o.status = 'completed';

  -- ========================================
  -- Availability Slots (for all celebrities)
  -- ========================================
  INSERT INTO availability_slots (celebrity_id, day_of_week, available, max_requests)
  SELECT c.id, d.day, true, 5
  FROM celebrities c
  CROSS JOIN generate_series(0, 6) AS d(day)
  WHERE d.day NOT IN (0, 6);  -- Available Mon-Fri

  INSERT INTO availability_slots (celebrity_id, day_of_week, available, max_requests)
  SELECT c.id, d.day, false, 0
  FROM celebrities c
  CROSS JOIN generate_series(0, 6) AS d(day)
  WHERE d.day IN (0, 6);  -- Not available Sat-Sun

END $$;
