-- ============================================================================
-- Seed Data: Merch Products + Digital Products
-- ============================================================================
-- Run AFTER: 003_seed_test_data.sql, migration-merch.sql, migration-digital.sql
-- Requires: celebrities, product_categories, digital_product_categories already exist
-- ============================================================================

DO $$
DECLARE
  -- Celebrity IDs (fetched from existing data)
  cel1_id UUID; -- Marko Nikolić (Glumac)
  cel2_id UUID; -- Jelena Petrović (Muzičarka)
  cel3_id UUID; -- Stefan Jovanović (Sportista)
  cel4_id UUID; -- Ana Đorđević (Influenserka)
  cel5_id UUID; -- Nikola Stanković (Komičar)
  cel6_id UUID; -- Milica Todorović (TV Voditeljka)
  cel7_id UUID; -- Đorđe Milošević (Reper)
  cel8_id UUID; -- Ivana Ilić (Glumica)

  -- Product Category IDs (merch)
  cat_majice UUID;
  cat_solje UUID;
  cat_kape UUID;
  cat_posteri UUID;
  cat_duksevi UUID;
  cat_torbe UUID;

  -- Digital Product Category IDs
  dcat_preseti UUID;
  dcat_sabloni UUID;
  dcat_muzika UUID;
  dcat_pdf UUID;
  dcat_edukacija UUID;
  dcat_grafika UUID;

  -- Product IDs (we'll need them for variants)
  prod1_id UUID; prod2_id UUID; prod3_id UUID; prod4_id UUID;
  prod5_id UUID; prod6_id UUID; prod7_id UUID; prod8_id UUID;
  prod9_id UUID; prod10_id UUID; prod11_id UUID; prod12_id UUID;
  prod13_id UUID; prod14_id UUID; prod15_id UUID; prod16_id UUID;

  -- Fan IDs (for sample orders)
  fan1_id UUID;
  fan2_id UUID;
  fan3_id UUID;
  fan4_id UUID;

BEGIN
  -- ========================================
  -- Fetch existing IDs
  -- ========================================
  SELECT id INTO cel1_id FROM celebrities WHERE slug = 'marko-nikolic';
  SELECT id INTO cel2_id FROM celebrities WHERE slug = 'jelena-petrovic';
  SELECT id INTO cel3_id FROM celebrities WHERE slug = 'stefan-jovanovic';
  SELECT id INTO cel4_id FROM celebrities WHERE slug = 'ana-djordjevic';
  SELECT id INTO cel5_id FROM celebrities WHERE slug = 'nikola-stankovic';
  SELECT id INTO cel6_id FROM celebrities WHERE slug = 'milica-todorovic';
  SELECT id INTO cel7_id FROM celebrities WHERE slug = 'djordje-milosevic';
  SELECT id INTO cel8_id FROM celebrities WHERE slug = 'ivana-ilic';

  SELECT id INTO cat_majice FROM product_categories WHERE slug = 'majice';
  SELECT id INTO cat_solje FROM product_categories WHERE slug = 'solje';
  SELECT id INTO cat_kape FROM product_categories WHERE slug = 'kape';
  SELECT id INTO cat_posteri FROM product_categories WHERE slug = 'posteri';
  SELECT id INTO cat_duksevi FROM product_categories WHERE slug = 'duksevi';
  SELECT id INTO cat_torbe FROM product_categories WHERE slug = 'torbe';

  SELECT id INTO dcat_preseti FROM digital_product_categories WHERE slug = 'preseti';
  SELECT id INTO dcat_sabloni FROM digital_product_categories WHERE slug = 'sabloni';
  SELECT id INTO dcat_muzika FROM digital_product_categories WHERE slug = 'muzika';
  SELECT id INTO dcat_pdf FROM digital_product_categories WHERE slug = 'pdf-materijali';
  SELECT id INTO dcat_edukacija FROM digital_product_categories WHERE slug = 'edukacija';
  SELECT id INTO dcat_grafika FROM digital_product_categories WHERE slug = 'grafika';

  -- Fan profiles
  SELECT p.id INTO fan1_id FROM profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = 'petar.markovic@test.rs';
  SELECT p.id INTO fan2_id FROM profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = 'maja.pavlovic@test.rs';
  SELECT p.id INTO fan3_id FROM profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = 'nemanja.ristic@test.rs';
  SELECT p.id INTO fan4_id FROM profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = 'tamara.djukic@test.rs';

  -- ========================================
  -- MERCH PRODUCTS (16 products)
  -- ========================================

  -- Marko Nikolić — 2 products
  prod1_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod1_id, cel1_id, cat_majice, 'Marko Nikolić — Potpis Majica', 'marko-potpis-majica',
     'Crna pamučna majica sa originalanim potpisom Marka Nikolića. 100% pamuk, unisex kroj. Limitirana edicija.',
     2500, true, true);

  prod2_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod2_id, cel1_id, cat_posteri, 'Marko Nikolić — Filmski Poster', 'marko-filmski-poster',
     'A2 poster sa ekskluzivnom fotografijom iz najnovijeg filma. Mat papir visoke gramature.',
     1500, true, false);

  -- Jelena Petrović — 2 products
  prod3_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod3_id, cel2_id, cat_majice, 'Jelena Petrović — Tour 2025 Majica', 'jelena-tour-2025-majica',
     'Oficijalna majica sa turneje "Zvuk Slobode 2025". Bela, premium pamuk. Dizajn sa prednje i zadnje strane.',
     3000, true, true);

  prod4_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod4_id, cel2_id, cat_solje, 'Jelena Petrović — Šolja "Muzika je život"', 'jelena-solja-muzika',
     'Keramička šolja 330ml sa citatom "Muzika je život" i potpisom. Idealan poklon za fanove.',
     1200, true, false);

  -- Stefan Jovanović — 2 products
  prod5_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod5_id, cel3_id, cat_majice, 'Stefan Jovanović — Dres Replika', 'stefan-dres-replika',
     'Replika dresa sa brojem 10 i potpisom Stefana Jovanovića. Dri-fit materijal, savršen za trening.',
     4500, true, true);

  prod6_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod6_id, cel3_id, cat_kape, 'Stefan Jovanović — Sportska Kapa', 'stefan-sportska-kapa',
     'Kapa sa vezenim logom i potpisom. Podesiv steznik, 100% pamuk. Crna/bela varijanta.',
     1800, true, false);

  -- Ana Đorđević — 2 products
  prod7_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod7_id, cel4_id, cat_torbe, 'Ana Đorđević — Tote Bag "Be Kind"', 'ana-tote-bag-be-kind',
     'Canvas tote bag sa printom "Be Kind" iz kolekcije Ane Đorđević. Ekološki prihvatljiv materijal.',
     1600, true, true);

  prod8_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod8_id, cel4_id, cat_majice, 'Ana Đorđević — Lifestyle Majica', 'ana-lifestyle-majica',
     'Oversize majica pastelne boje sa minimalističkim logom. Unisex, premium pamuk.',
     2200, true, false);

  -- Nikola Stanković — 2 products
  prod9_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod9_id, cel5_id, cat_solje, 'Nikola Stanković — Šolja "Smej se"', 'nikola-solja-smej-se',
     'Šolja sa najboljim citatima iz stand-up nastupa. Menja boju kada se zagreje — iznenađenje iznutra!',
     1400, true, false);

  prod10_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod10_id, cel5_id, cat_duksevi, 'Nikola Stanković — "Comedy King" Duks', 'nikola-comedy-king-duks',
     'Crni duks sa zlatnim printom "Comedy King". Flis unutrašnjost, kapuljača. Idealan za hladne dane.',
     3500, true, true);

  -- Milica Todorović — 2 products
  prod11_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod11_id, cel6_id, cat_solje, 'Milica Todorović — "Dobro jutro" Šolja', 'milica-dobro-jutro-solja',
     'Šolja sa poznatim pozdravom "Dobro jutro, Srbijo!" iz jutarnje emisije. Savršen start dana.',
     1100, true, false);

  prod12_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod12_id, cel6_id, cat_majice, 'Milica Todorović — Sunrise Majica', 'milica-sunrise-majica',
     'Žuta majica sa sunce motivom i potpisom. Lagan materijal, savršena za leto.',
     2000, true, false);

  -- Đorđe Milošević — 2 products
  prod13_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod13_id, cel7_id, cat_duksevi, 'Đorđe Milošević — Street Duks', 'djordje-street-duks',
     'Oversized crni duks sa ekskluzivnim dizajnom iz novog albuma. Streetwear estetika, premium kvalitet.',
     4000, true, true);

  prod14_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod14_id, cel7_id, cat_kape, 'Đorđe Milošević — Snapback', 'djordje-snapback',
     'Crna snapback kapa sa logom u zlatnoj boji. Limitirana serija, flat brim stil.',
     2200, true, false);

  -- Ivana Ilić — 2 products
  prod15_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod15_id, cel8_id, cat_posteri, 'Ivana Ilić — Serija Poster', 'ivana-serija-poster',
     'A2 poster sa ekskluzivnom fotografijom iz hit serije. Potpisan rukom. Limitirano na 100 komada.',
     1800, true, false);

  prod16_id := gen_random_uuid();
  INSERT INTO products (id, celebrity_id, product_category_id, name, slug, description, price, is_active, featured) VALUES
    (prod16_id, cel8_id, cat_majice, 'Ivana Ilić — Drama Queen Majica', 'ivana-drama-queen-majica',
     'Bela majica sa šarmantnim "Drama Queen" printom i potpisom. Regular fit, 100% pamuk.',
     2000, true, false);

  -- ========================================
  -- PRODUCT VARIANTS
  -- ========================================

  -- Majice — S, M, L, XL varijante
  INSERT INTO product_variants (product_id, name, stock, sort_order) VALUES
    (prod1_id, 'S', 15, 1), (prod1_id, 'M', 25, 2), (prod1_id, 'L', 20, 3), (prod1_id, 'XL', 10, 4),
    (prod3_id, 'S', 20, 1), (prod3_id, 'M', 30, 2), (prod3_id, 'L', 25, 3), (prod3_id, 'XL', 15, 4),
    (prod5_id, 'S', 10, 1), (prod5_id, 'M', 20, 2), (prod5_id, 'L', 25, 3), (prod5_id, 'XL', 15, 4),
    (prod8_id, 'S', 12, 1), (prod8_id, 'M', 18, 2), (prod8_id, 'L', 15, 3), (prod8_id, 'XL', 8, 4),
    (prod12_id, 'S', 10, 1), (prod12_id, 'M', 15, 2), (prod12_id, 'L', 12, 3), (prod12_id, 'XL', 8, 4),
    (prod16_id, 'S', 8, 1), (prod16_id, 'M', 12, 2), (prod16_id, 'L', 10, 3), (prod16_id, 'XL', 5, 4);

  -- Duksevi — M, L, XL varijante
  INSERT INTO product_variants (product_id, name, stock, sort_order) VALUES
    (prod10_id, 'M', 15, 1), (prod10_id, 'L', 20, 2), (prod10_id, 'XL', 10, 3),
    (prod13_id, 'M', 18, 1), (prod13_id, 'L', 22, 2), (prod13_id, 'XL', 12, 3);

  -- Kape — One Size
  INSERT INTO product_variants (product_id, name, stock, sort_order) VALUES
    (prod6_id, 'Crna', 30, 1), (prod6_id, 'Bela', 25, 2),
    (prod14_id, 'One Size', 40, 1);

  -- Šolje — One Size
  INSERT INTO product_variants (product_id, name, stock, sort_order) VALUES
    (prod4_id, 'Standard 330ml', 50, 1),
    (prod9_id, 'Standard 330ml', 40, 1),
    (prod11_id, 'Standard 330ml', 45, 1);

  -- Posteri — A2 size
  INSERT INTO product_variants (product_id, name, stock, sort_order) VALUES
    (prod2_id, 'A2', 60, 1),
    (prod15_id, 'A2 (potpisani)', 100, 1);

  -- Torba — One Size
  INSERT INTO product_variants (product_id, name, stock, sort_order) VALUES
    (prod7_id, 'Standard', 35, 1);

  -- ========================================
  -- SAMPLE MERCH ORDERS (8 orders)
  -- ========================================
  INSERT INTO merch_orders (buyer_id, celebrity_id, product_id, product_variant_id, quantity, unit_price, total_price, status, buyer_name, buyer_email, buyer_phone, shipping_name, shipping_address, shipping_city, shipping_postal, shipping_note, created_at) VALUES
    (fan1_id, cel1_id, prod1_id,
     (SELECT id FROM product_variants WHERE product_id = prod1_id AND name = 'L' LIMIT 1),
     1, 2500, 2500, 'delivered', 'Petar Marković', 'petar.markovic@test.rs', '0641234567',
     'Petar Marković', 'Bulevar Kralja Aleksandra 73', 'Beograd', '11000', 'Pozovite pre isporuke',
     now() - interval '15 days'),

    (fan2_id, cel2_id, prod3_id,
     (SELECT id FROM product_variants WHERE product_id = prod3_id AND name = 'M' LIMIT 1),
     1, 3000, 3000, 'delivered', 'Maja Pavlović', 'maja.pavlovic@test.rs', '0659876543',
     'Maja Pavlović', 'Knez Mihailova 22', 'Beograd', '11000', '',
     now() - interval '12 days'),

    (fan3_id, cel3_id, prod5_id,
     (SELECT id FROM product_variants WHERE product_id = prod5_id AND name = 'XL' LIMIT 1),
     1, 4500, 4500, 'shipped', 'Nemanja Ristić', 'nemanja.ristic@test.rs', '0631112233',
     'Nemanja Ristić', 'Bulevar Oslobođenja 45', 'Novi Sad', '21000', 'Pozvonite na interfon 12',
     now() - interval '5 days'),

    (fan4_id, cel7_id, prod13_id,
     (SELECT id FROM product_variants WHERE product_id = prod13_id AND name = 'L' LIMIT 1),
     1, 4000, 4000, 'confirmed', 'Tamara Đukić', 'tamara.djukic@test.rs', '0644445566',
     'Tamara Đukić', 'Cara Dušana 18', 'Niš', '18000', '',
     now() - interval '3 days'),

    (fan1_id, cel4_id, prod7_id,
     (SELECT id FROM product_variants WHERE product_id = prod7_id AND name = 'Standard' LIMIT 1),
     2, 1600, 3200, 'confirmed', 'Petar Marković', 'petar.markovic@test.rs', '0641234567',
     'Petar Marković', 'Bulevar Kralja Aleksandra 73', 'Beograd', '11000', 'Za mene i devojku',
     now() - interval '2 days'),

    (fan2_id, cel5_id, prod10_id,
     (SELECT id FROM product_variants WHERE product_id = prod10_id AND name = 'M' LIMIT 1),
     1, 3500, 3500, 'pending', 'Maja Pavlović', 'maja.pavlovic@test.rs', '0659876543',
     'Maja Pavlović', 'Knez Mihailova 22', 'Beograd', '11000', '',
     now() - interval '1 day'),

    (fan3_id, cel2_id, prod4_id,
     (SELECT id FROM product_variants WHERE product_id = prod4_id AND name = 'Standard 330ml' LIMIT 1),
     3, 1200, 3600, 'pending', 'Nemanja Ristić', 'nemanja.ristic@test.rs', '0631112233',
     'Nemanja Ristić', 'Bulevar Oslobođenja 45', 'Novi Sad', '21000', 'Poklon za kolege',
     now()),

    (fan4_id, cel8_id, prod15_id,
     (SELECT id FROM product_variants WHERE product_id = prod15_id AND name = 'A2 (potpisani)' LIMIT 1),
     1, 1800, 1800, 'pending', 'Tamara Đukić', 'tamara.djukic@test.rs', '0644445566',
     'Tamara Đukić', 'Cara Dušana 18', 'Niš', '18000', '',
     now());

  -- ========================================
  -- DIGITAL PRODUCTS (16 products)
  -- ========================================

  -- Ana Đorđević (Influenserka) — 3 digital products
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel4_id, dcat_preseti, 'Instagram Preseti — Warm Vibes', 'instagram-preseti-warm-vibes',
     'Kolekcija od 10 Lightroom preseta za toplu, letnju estetiku. Savršeni za Instagram feed, travel i lifestyle fotografije. Kompatibilni sa Lightroom mobilnim i desktop aplikacijom.',
     1500, 'digital-products/ana/warm-vibes.zip', 'warm-vibes-preseti.zip', 52428800, 'ZIP', true, true, 234),

    (cel4_id, dcat_preseti, 'TikTok Preset Pack — Neon Glow', 'tiktok-preset-pack-neon-glow',
     '8 preseta za dramatičan neon efekat. Idealni za večernje fotografije i portrete. Uključuje video tutorial za instalaciju.',
     1200, 'digital-products/ana/neon-glow.zip', 'neon-glow-preseti.zip', 38797312, 'ZIP', true, false, 156),

    (cel4_id, dcat_edukacija, 'Kako napraviti savršen Instagram profil', 'kako-napraviti-savrsen-instagram',
     'PDF vodič od 45 strana sa mojim kompletnim pristupom kreiranju Instagram sadržaja. Saznajte kako biram teme, pravim stories, koristim reels i rastem organsku publiku.',
     2500, 'digital-products/ana/instagram-guide.pdf', 'instagram-vodic.pdf', 15728640, 'PDF', true, true, 89);

  -- Jelena Petrović (Muzičarka) — 2 digital products
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel2_id, dcat_muzika, 'Akustični EP — "Tihi Momenti"', 'akusticni-ep-tihi-momenti',
     'Ekskluzivni akustični EP sa 5 pesama koje nikada nisu bile objavljene. Intimni, stripped-down aranžmani hitova. Visoka kvaliteta WAV fajlovi.',
     2000, 'digital-products/jelena/tihi-momenti.zip', 'tihi-momenti-ep.zip', 157286400, 'ZIP', true, true, 312),

    (cel2_id, dcat_grafika, 'Digitalni Artwork — Album Cover Collection', 'jelena-album-cover-collection',
     'Kolekcija od 6 digitalnih artworkova sa naslovnica mojih albuma u visokoj rezoluciji. Savršeni za pozadine, printove ili fan art.',
     800, 'digital-products/jelena/album-covers.zip', 'album-covers-hd.zip', 78643200, 'ZIP', true, false, 178);

  -- Stefan Jovanović (Sportista) — 2 digital products
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel3_id, dcat_pdf, 'Plan treninga — 12 nedelja do forme', 'plan-treninga-12-nedelja',
     'Moj lični program treninga koji koristim van sezone. 12 nedelja, 4 treninga nedeljno, detaljna uputstva za svaku vežbu. Pogodno za srednji i napredni nivo.',
     3000, 'digital-products/stefan/trening-plan.pdf', 'trening-plan-12-nedelja.pdf', 8388608, 'PDF', true, true, 445),

    (cel3_id, dcat_edukacija, 'Masterclass: Mentalni trening za sportiste', 'masterclass-mentalni-trening',
     'Video kurs od 3 sata o mentalnoj pripremi za takmičenja. Tehnike vizualizacije, upravljanje pritiskom, fokus pred utakmicu. 8 lekcija + bonus materijal.',
     5000, 'digital-products/stefan/mentalni-trening.zip', 'mentalni-trening-kurs.zip', 2147483648, 'ZIP', true, true, 67);

  -- Nikola Stanković (Komičar) — 2 digital products
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel5_id, dcat_edukacija, 'Workshop: Kako napisati stand-up rutinu', 'workshop-standup-rutina',
     'Video workshop od 2 sata gde objašnjavam ceo proces pisanja stand-up rutine — od ideje do nastupa. Uključuje PDF sa vežbama i šablonima.',
     3500, 'digital-products/nikola/standup-workshop.zip', 'standup-workshop.zip', 1073741824, 'ZIP', true, false, 123),

    (cel5_id, dcat_muzika, 'Podcast specijal — Neobjavljene priče', 'podcast-neobjavljene-price',
     'Ekskluzivna epizoda podcasta sa pričama koje nisu bile u redovnom programu. 90 minuta čistog humora. MP3 format.',
     500, 'digital-products/nikola/podcast-specijal.mp3', 'podcast-specijal.mp3', 94371840, 'MP3', true, false, 567);

  -- Milica Todorović (TV Voditeljka) — 2 digital products
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel6_id, dcat_pdf, 'Recepti za zdrav život — Knjiga', 'recepti-zdrav-zivot-knjiga',
     'Digitalna knjiga sa 50 mojih omiljenih recepata za zdrav doručak, ručak i večeru. Svaki recept ima fotografiju, nutritivne vrednosti i savete. PDF format.',
     1800, 'digital-products/milica/recepti.pdf', 'recepti-zdrav-zivot.pdf', 31457280, 'PDF', true, true, 289),

    (cel6_id, dcat_edukacija, 'Jutarnja rutina — 30 dana izazov', 'jutarnja-rutina-30-dana',
     'Vodič za transformaciju jutarnje rutine. 30 dana, korak po korak. Uključuje planer za printanje, afirmacije i vežbe disanja. PDF + audio fajlovi.',
     1200, 'digital-products/milica/jutarnja-rutina.zip', 'jutarnja-rutina-30-dana.zip', 62914560, 'ZIP', true, false, 198);

  -- Đorđe Milošević (Reper) — 2 digital products
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel7_id, dcat_muzika, 'Beat Pack — "Balkanski Trap" Vol. 1', 'beat-pack-balkanski-trap',
     'Kolekcija od 10 ekskluzivnih trap bitova sa balkanskim elementima. WAV + stems. Licenca za nekomercijalnu upotrebu uključena.',
     4000, 'digital-products/djordje/beat-pack.zip', 'balkanski-trap-vol1.zip', 524288000, 'ZIP', true, true, 89),

    (cel7_id, dcat_sabloni, 'Cover Art šabloni za muziku', 'cover-art-sabloni-muzika',
     'PSD/Figma šabloni za naslovnice singlova i albuma. 12 dizajna, potpuno editabilni. Uključuje fontove i grafičke elemente.',
     1500, 'digital-products/djordje/cover-art.zip', 'cover-art-sabloni.zip', 209715200, 'ZIP', true, false, 145);

  -- Ivana Ilić (Glumica) — 1 digital product
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel8_id, dcat_edukacija, 'Audicija masterclass — Video kurs', 'audicija-masterclass-kurs',
     'Video kurs o pripremi za audicije. 5 lekcija: izbor monologa, rad pred kamerom, glas i dikcija, interpretacija i vežbe. Ukupno 4 sata sadržaja.',
     4500, 'digital-products/ivana/audicija-masterclass.zip', 'audicija-masterclass.zip', 1610612736, 'ZIP', true, false, 34);

  -- Marko Nikolić (Glumac) — 2 digital products
  INSERT INTO digital_products (celebrity_id, digital_product_category_id, name, slug, description, price, file_path, file_name, file_size, file_type, is_active, featured, download_count) VALUES
    (cel1_id, dcat_edukacija, 'Gluma za početnike — Video kurs', 'gluma-za-pocetnike-kurs',
     'Osnove glume u 10 lekcija. Rad na tekstu, improvizacija, fizički teatar, glas i emocija. 6 sati video materijala + PDF skripta.',
     6000, 'digital-products/marko/gluma-kurs.zip', 'gluma-za-pocetnike.zip', 3221225472, 'ZIP', true, true, 56),

    (cel1_id, dcat_pdf, 'Dnevnik jednog glumca — eBook', 'dnevnik-jednog-glumca',
     'Digitalna knjiga o mom putu kroz karijeru. Anegdote iz pozorišta, filmski setovi, saveti za mlade glumce. 180 strana.',
     1000, 'digital-products/marko/dnevnik.pdf', 'dnevnik-jednog-glumca.pdf', 5242880, 'PDF', true, false, 123);

  -- ========================================
  -- SAMPLE DIGITAL ORDERS (6 orders)
  -- ========================================
  INSERT INTO digital_orders (buyer_id, celebrity_id, digital_product_id, price, status, buyer_name, buyer_email, buyer_phone, download_token, download_token_expires_at, download_count, confirmed_at, completed_at, created_at) VALUES
    (fan1_id, cel4_id,
     (SELECT id FROM digital_products WHERE slug = 'instagram-preseti-warm-vibes' LIMIT 1),
     1500, 'completed', 'Petar Marković', 'petar.markovic@test.rs', '0641234567',
     gen_random_uuid()::text, now() + interval '7 days', 2,
     now() - interval '8 days', now() - interval '7 days', now() - interval '10 days'),

    (fan2_id, cel3_id,
     (SELECT id FROM digital_products WHERE slug = 'plan-treninga-12-nedelja' LIMIT 1),
     3000, 'completed', 'Maja Pavlović', 'maja.pavlovic@test.rs', '0659876543',
     gen_random_uuid()::text, now() + interval '7 days', 1,
     now() - interval '5 days', now() - interval '4 days', now() - interval '6 days'),

    (fan3_id, cel7_id,
     (SELECT id FROM digital_products WHERE slug = 'beat-pack-balkanski-trap' LIMIT 1),
     4000, 'confirmed', 'Nemanja Ristić', 'nemanja.ristic@test.rs', '0631112233',
     NULL, NULL, 0,
     now() - interval '1 day', NULL, now() - interval '2 days'),

    (fan4_id, cel6_id,
     (SELECT id FROM digital_products WHERE slug = 'recepti-zdrav-zivot-knjiga' LIMIT 1),
     1800, 'confirmed', 'Tamara Đukić', 'tamara.djukic@test.rs', '0644445566',
     NULL, NULL, 0,
     now() - interval '12 hours', NULL, now() - interval '1 day'),

    (fan1_id, cel1_id,
     (SELECT id FROM digital_products WHERE slug = 'gluma-za-pocetnike-kurs' LIMIT 1),
     6000, 'pending', 'Petar Marković', 'petar.markovic@test.rs', '0641234567',
     NULL, NULL, 0,
     NULL, NULL, now()),

    (fan2_id, cel5_id,
     (SELECT id FROM digital_products WHERE slug = 'podcast-neobjavljene-price' LIMIT 1),
     500, 'pending', 'Maja Pavlović', 'maja.pavlovic@test.rs', '0659876543',
     NULL, NULL, 0,
     NULL, NULL, now());

  RAISE NOTICE 'Seed complete: 16 merch products, 16 digital products, 8 merch orders, 6 digital orders';
END $$;
