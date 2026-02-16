/**
 * Seed script — kreira test korisnike, zvezde, porudžbine, recenzije
 * Pokreni sa: npx tsx src/scripts/seed.ts
 */

import { supabaseAdmin } from '../config/supabase.js';

const PASSWORD = 'test123456';

interface StarData {
  email: string;
  fullName: string;
  slug: string;
  categorySlug: string;
  price: number;
  verified: boolean;
  bio: string;
  extendedBio: string;
  responseTime: number;
  tags: string[];
  videoTypes: { title: string; occasion: string; emoji: string; accentFrom: string; accentTo: string; message: string }[];
}

const STARS: StarData[] = [
  {
    email: 'marko.nikolic@viveo.rs', fullName: 'Marko Nikolić', slug: 'marko-nikolic',
    categorySlug: 'glumci', price: 3500, verified: true, responseTime: 24,
    bio: 'Poznati srpski glumac sa više od 20 godina iskustva u pozorištu i na filmu.',
    extendedBio: 'Marko Nikolić je jedan od najcenjenijih srpskih glumaca svoje generacije. Sa preko 20 godina iskustva na pozorišnim daskama i filmskom platnu, osvojio je brojne nagrade.',
    tags: ['Glumac', 'Pozorište', 'Film', 'Nagrađivani', 'Mentor'],
    videoTypes: [
      { title: 'Rođendanska čestitka', occasion: 'Rođendan', emoji: '🎂', accentFrom: 'from-pink-500', accentTo: 'to-rose-600', message: 'Srećan rođendan! Neka ti se svi snovi ostvare...' },
      { title: 'Motivaciona poruka', occasion: 'Motivacija', emoji: '💪', accentFrom: 'from-blue-500', accentTo: 'to-cyan-600', message: 'Veruj u sebe, sve je moguće ako radiš na tome...' },
      { title: 'Čestitka za praznik', occasion: 'Praznici', emoji: '🎄', accentFrom: 'from-emerald-500', accentTo: 'to-teal-600', message: 'Srećni praznici! Neka vam dom bude pun radosti...' },
    ],
  },
  {
    email: 'jelena.petrovic@viveo.rs', fullName: 'Jelena Petrović', slug: 'jelena-petrovic',
    categorySlug: 'muzicari', price: 5000, verified: true, responseTime: 48,
    bio: 'Pop zvezda sa brojem 1 hitovima i milionskim pregledima na YouTube-u.',
    extendedBio: 'Jelena Petrović je jedna od najpopularnijih pop pevačica u Srbiji. Njen debi album je dostigao platinasti tiraž.',
    tags: ['Pevačica', 'Pop muzika', 'YouTube', 'Humanitarni rad', 'Koncerti'],
    videoTypes: [
      { title: 'Muzička čestitka', occasion: 'Čestitka', emoji: '🎶', accentFrom: 'from-violet-500', accentTo: 'to-purple-600', message: 'Posebna pesma samo za tebe, od srca...' },
      { title: 'Rođendanska poruka', occasion: 'Rođendan', emoji: '🎂', accentFrom: 'from-pink-500', accentTo: 'to-rose-600', message: 'Srećan rođendan! Uživaj u svom danu...' },
      { title: 'Poruka za godišnjicu', occasion: 'Godišnjica', emoji: '💕', accentFrom: 'from-red-500', accentTo: 'to-pink-600', message: 'Čestitam vam godišnjicu! Ljubav je najlepša...' },
    ],
  },
  {
    email: 'stefan.jovanovic@viveo.rs', fullName: 'Stefan Jovanović', slug: 'stefan-jovanovic',
    categorySlug: 'sportisti', price: 4000, verified: true, responseTime: 72,
    bio: 'Reprezentativac Srbije u fudbalu, igrač jednog od najjačih evropskih klubova.',
    extendedBio: 'Stefan Jovanović je ponos srpskog fudbala. Kao kapiten reprezentacije, predvodio je tim do istorijskog uspeha.',
    tags: ['Fudbaler', 'Reprezentativac', 'Kapiten', 'Fondacija', 'Sportski duh'],
    videoTypes: [
      { title: 'Motivacija za sportiste', occasion: 'Motivacija', emoji: '⚽', accentFrom: 'from-green-500', accentTo: 'to-emerald-600', message: 'Treniraj jako, igraj pametno, nikad ne odustaj...' },
      { title: 'Rođendanska čestitka', occasion: 'Rođendan', emoji: '🎉', accentFrom: 'from-amber-500', accentTo: 'to-orange-600', message: 'Srećan rođendan, šampione!' },
      { title: 'Poruka ohrabrenja', occasion: 'Ohrabrenje', emoji: '🏆', accentFrom: 'from-sky-500', accentTo: 'to-blue-600', message: 'Svaki pad je prilika da ustaneš jači...' },
    ],
  },
  {
    email: 'ana.djordjevic@viveo.rs', fullName: 'Ana Đorđević', slug: 'ana-djordjevic',
    categorySlug: 'influenseri', price: 2000, verified: true, responseTime: 12,
    bio: 'Najpraćenija srpska influenserka sa preko milion pratilaca na Instagramu.',
    extendedBio: 'Ana Đorđević je digitalna kreatorka sadržaja koja je osvojila srca publike autentičnošću i kreativnošću.',
    tags: ['Influenserka', 'Instagram', 'Moda', 'Lifestyle', 'Podcast'],
    videoTypes: [
      { title: 'Personalizovani pozdrav', occasion: 'Pozdrav', emoji: '👋', accentFrom: 'from-fuchsia-500', accentTo: 'to-pink-600', message: 'Hej! Evo jednog posebnog pozdrava za tebe...' },
      { title: 'Saveti za stil', occasion: 'Savet', emoji: '✨', accentFrom: 'from-violet-500', accentTo: 'to-indigo-600', message: 'Imam specijalne savete za tvoj stil...' },
      { title: 'Rođendanska poruka', occasion: 'Rođendan', emoji: '🎂', accentFrom: 'from-rose-500', accentTo: 'to-pink-600', message: 'Srećan rođendan, prelepa! Uživaj maksimalno...' },
    ],
  },
  {
    email: 'nikola.stankovic@viveo.rs', fullName: 'Nikola Stanković', slug: 'nikola-stankovic',
    categorySlug: 'komicari', price: 2500, verified: true, responseTime: 24,
    bio: 'Stand-up komičar poznat po hit emisiji i rasprodatim nastupima širom Srbije.',
    extendedBio: 'Nikola Stanković je kralj srpskog stand-up humora. Njegov specijal na YouTube-u ima preko 10 miliona pregleda.',
    tags: ['Komičar', 'Stand-up', 'TV', 'Podcast', 'Scenarista'],
    videoTypes: [
      { title: 'Šaljiva čestitka', occasion: 'Humor', emoji: '😂', accentFrom: 'from-yellow-500', accentTo: 'to-amber-600', message: 'Spremi se za smeh! Imam nešto posebno za tebe...' },
      { title: 'Roast poruka', occasion: 'Roast', emoji: '🔥', accentFrom: 'from-orange-500', accentTo: 'to-red-600', message: 'Drži se, ovo će te nasmejati do suza...' },
      { title: 'Poruka za ekipu', occasion: 'Ekipa', emoji: '🍻', accentFrom: 'from-lime-500', accentTo: 'to-green-600', message: 'Za tvoju ekipu imam jednu dobru priču...' },
    ],
  },
  {
    email: 'milica.todorovic@viveo.rs', fullName: 'Milica Todorović', slug: 'milica-todorovic',
    categorySlug: 'tv-voditelji', price: 3000, verified: true, responseTime: 48,
    bio: 'Voditeljka najgledanije jutarnje emisije u Srbiji sa 15 godina na TV-u.',
    extendedBio: 'Milica Todorović je lice jutarnjeg programa koji svakodnevno prate milioni gledalaca.',
    tags: ['Voditeljka', 'TV', 'Jutarnji program', 'Nagrađivana', 'Zdravi život'],
    videoTypes: [
      { title: 'Jutarnji pozdrav', occasion: 'Pozdrav', emoji: '☀️', accentFrom: 'from-amber-500', accentTo: 'to-yellow-600', message: 'Dobro jutro! Imam jednu posebnu poruku za tebe...' },
      { title: 'Čestitka za penziju', occasion: 'Penzija', emoji: '🥂', accentFrom: 'from-teal-500', accentTo: 'to-cyan-600', message: 'Čestitam na zasluženom odmoru! Uživaj...' },
      { title: 'Rođendanska poruka', occasion: 'Rođendan', emoji: '🎂', accentFrom: 'from-pink-500', accentTo: 'to-rose-600', message: 'Srećan rođendan! Neka ti dan bude prelep...' },
    ],
  },
  {
    email: 'djordje.milosevic@viveo.rs', fullName: 'Đorđe Milošević', slug: 'djordje-milosevic',
    categorySlug: 'muzicari', price: 4500, verified: true, responseTime: 36,
    bio: 'Reper nove generacije sa platinum albumima i hitovima koji ruše rekorde.',
    extendedBio: 'Đorđe Milošević je lider nove generacije srpskog hip-hop-a.',
    tags: ['Reper', 'Hip-hop', 'TikTok', 'Platinum', 'Turneja'],
    videoTypes: [
      { title: 'Freestyle pozdrav', occasion: 'Pozdrav', emoji: '🎤', accentFrom: 'from-purple-500', accentTo: 'to-violet-600', message: 'Imam jednu rimu samo za tebe, slušaj...' },
      { title: 'Rođendanski rep', occasion: 'Rođendan', emoji: '🎂', accentFrom: 'from-indigo-500', accentTo: 'to-blue-600', message: 'Srećan rođendan, brate! Evo jedna za tebe...' },
      { title: 'Motivaciona poruka', occasion: 'Motivacija', emoji: '💯', accentFrom: 'from-slate-600', accentTo: 'to-zinc-700', message: 'Uvek napred, nikad nazad. Ti to možeš...' },
    ],
  },
  {
    email: 'ivana.ilic@viveo.rs', fullName: 'Ivana Ilić', slug: 'ivana-ilic',
    categorySlug: 'glumci', price: 3000, verified: false, responseTime: 24,
    bio: 'Mlada glumica poznata po ulozi u najgledanijoj domaćoj seriji sezone.',
    extendedBio: 'Ivana Ilić je jedna od najtalentovanijih mladih glumica u Srbiji.',
    tags: ['Glumica', 'Serije', 'FDU', 'Pozorište', 'Mlada nada'],
    videoTypes: [
      { title: 'Dramatična čestitka', occasion: 'Čestitka', emoji: '🎭', accentFrom: 'from-rose-500', accentTo: 'to-red-600', message: 'Imam jednu posebnu poruku za tebe, slušaj pažljivo...' },
      { title: 'Rođendanska poruka', occasion: 'Rođendan', emoji: '🎂', accentFrom: 'from-pink-500', accentTo: 'to-fuchsia-600', message: 'Srećan rođendan! Neka ti nova godina bude...' },
      { title: 'Fan poruka', occasion: 'Fan poruka', emoji: '💜', accentFrom: 'from-violet-500', accentTo: 'to-purple-600', message: 'Hvala što me pratiš! Evo nešto samo za tebe...' },
    ],
  },
];

const FANS = [
  { email: 'petar.markovic@test.rs', fullName: 'Petar Marković' },
  { email: 'maja.pavlovic@test.rs', fullName: 'Maja Pavlović' },
  { email: 'nemanja.ristic@test.rs', fullName: 'Nemanja Ristić' },
  { email: 'tamara.djukic@test.rs', fullName: 'Tamara Đukić' },
];

async function createUser(email: string, fullName: string, role: 'fan' | 'star') {
  // Check if user already exists
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('full_name', fullName)
    .eq('role', role)
    .single();

  if (existingProfile) {
    console.log(`  Already exists: ${email}`);
    return existingProfile.id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });

  if (error) {
    // User might exist in auth but not profiles
    if (error.message.includes('already been registered')) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users.find((u) => u.email === email);
      if (existing) {
        // Ensure profile exists
        await supabaseAdmin.from('profiles').upsert({ id: existing.id, full_name: fullName, role });
        console.log(`  Reused auth user: ${email}`);
        return existing.id;
      }
    }
    console.error(`  Failed to create ${email}:`, error.message);
    return null;
  }

  // Create profile
  await supabaseAdmin.from('profiles').upsert({ id: data.user.id, full_name: fullName, role });
  console.log(`  Created: ${email}`);
  return data.user.id;
}

async function seed() {
  console.log('\n=== Seeding Viveo Database ===\n');

  // 1. Create star users & celebrities
  console.log('Creating stars...');
  const starIds: Map<string, string> = new Map();
  const celebIds: Map<string, string> = new Map();

  for (const star of STARS) {
    const userId = await createUser(star.email, star.fullName, 'star');
    if (!userId) continue;
    starIds.set(star.slug, userId);

    // Get category
    const { data: cat } = await supabaseAdmin.from('categories').select('id').eq('slug', star.categorySlug).single();
    if (!cat) { console.error(`  Category not found: ${star.categorySlug}`); continue; }

    // Check if celebrity exists
    const { data: existingCeleb } = await supabaseAdmin.from('celebrities').select('id').eq('slug', star.slug).single();
    if (existingCeleb) {
      celebIds.set(star.slug, existingCeleb.id);
      console.log(`  Celebrity exists: ${star.slug}`);
      continue;
    }

    // Create celebrity
    const { data: celeb, error: celebError } = await supabaseAdmin.from('celebrities').insert({
      profile_id: userId, name: star.fullName, slug: star.slug, category_id: cat.id,
      price: star.price, verified: star.verified, bio: star.bio, extended_bio: star.extendedBio,
      response_time: star.responseTime, tags: star.tags,
    }).select('id').single();

    if (celebError) { console.error(`  Celebrity error for ${star.slug}:`, celebError.message); continue; }
    celebIds.set(star.slug, celeb.id);

    // Create video types
    for (const vt of star.videoTypes) {
      await supabaseAdmin.from('video_types').insert({
        celebrity_id: celeb.id, title: vt.title, occasion: vt.occasion, emoji: vt.emoji,
        accent_from: vt.accentFrom, accent_to: vt.accentTo, message: vt.message,
      });
    }

    // Create availability (Mon-Fri available, Sat-Sun not)
    for (let day = 0; day <= 6; day++) {
      await supabaseAdmin.from('availability_slots').upsert({
        celebrity_id: celeb.id, day_of_week: day,
        available: day >= 1 && day <= 5, max_requests: day >= 1 && day <= 5 ? 5 : 0,
      }, { onConflict: 'celebrity_id,day_of_week' });
    }
  }

  // 2. Create fan users
  console.log('\nCreating fans...');
  const fanIds: Map<string, string> = new Map();
  for (const fan of FANS) {
    const userId = await createUser(fan.email, fan.fullName, 'fan');
    if (userId) fanIds.set(fan.email, userId);
  }

  // 3. Create sample orders & reviews
  console.log('\nCreating orders and reviews...');
  const markoId = celebIds.get('marko-nikolic');
  const stefanId = celebIds.get('stefan-jovanovic');
  const nikolaId = celebIds.get('nikola-stankovic');
  const anaId = celebIds.get('ana-djordjevic');

  if (markoId && stefanId && nikolaId && anaId) {
    const orderData = [
      { fanEmail: 'petar.markovic@test.rs', celebId: markoId, fanName: 'Petar Marković', recipient: 'Mama Gordana', instructions: 'Čestitaj mami 60. rođendan!', review: 'Naručio sam video poruku za maminu 60. rođendan. Plakala je od sreće!', rating: 5 },
      { fanEmail: 'maja.pavlovic@test.rs', celebId: stefanId, fanName: 'Maja Pavlović', recipient: 'Dečko Nikola', instructions: 'Čestitaj nam godišnjicu, 3 godine smo zajedno!', review: 'Iznenadila sam dečka za godišnjicu. Bio je u šoku!', rating: 5 },
      { fanEmail: 'nemanja.ristic@test.rs', celebId: nikolaId, fanName: 'Nemanja Ristić', recipient: 'Kolega Dragan', instructions: 'Kolega odlazi u penziju, napravi mu smešnu čestitku!', review: 'Svi u kancelariji su se smejali do suza!', rating: 4 },
      { fanEmail: 'tamara.djukic@test.rs', celebId: anaId, fanName: 'Tamara Đukić', recipient: 'Ćerka Sara', instructions: 'Moja ćerka obožava te! Čestitaj joj rođendan.', review: 'Ćerka nije mogla da veruje! Definitivno ću ponovo koristiti Viveo.', rating: 5 },
    ];

    for (const od of orderData) {
      const fanId = fanIds.get(od.fanEmail);
      if (!fanId) continue;

      // Get a video type for this celebrity
      const { data: vt } = await supabaseAdmin.from('video_types').select('id').eq('celebrity_id', od.celebId).limit(1).single();
      if (!vt) continue;

      // Check if order already exists
      const { data: existingOrder } = await supabaseAdmin.from('orders')
        .select('id').eq('buyer_id', fanId).eq('celebrity_id', od.celebId).eq('status', 'completed').single();

      if (existingOrder) {
        console.log(`  Order exists for ${od.fanName} → skipping`);
        continue;
      }

      const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert({
        buyer_id: fanId, celebrity_id: od.celebId, video_type_id: vt.id,
        buyer_name: od.fanName, buyer_email: od.fanEmail, recipient_name: od.recipient,
        instructions: od.instructions, price: 3000, status: 'completed',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).select('id').single();

      if (orderError) { console.error(`  Order error:`, orderError.message); continue; }

      // Create review
      await supabaseAdmin.from('reviews').insert({
        order_id: order.id, author_id: fanId, celebrity_id: od.celebId,
        rating: od.rating, text: od.review,
      });

      console.log(`  Order + review: ${od.fanName} → ${od.recipient}`);
    }
  }

  console.log('\n=== Seed complete! ===');
  console.log('\nTest accounts (password: test123456):');
  console.log('Stars: marko.nikolic@viveo.rs, jelena.petrovic@viveo.rs, etc.');
  console.log('Fans:  petar.markovic@test.rs, maja.pavlovic@test.rs, etc.\n');
}

seed().catch(console.error);
