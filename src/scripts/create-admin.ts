/**
 * Kreira admin korisnika ili promoviše postojećeg u admina
 *
 * Upotreba:
 *   npx tsx src/scripts/create-admin.ts                          # interaktivno — kreira novog
 *   npx tsx src/scripts/create-admin.ts email@example.com        # promoviše postojećeg korisnika
 *   npx tsx src/scripts/create-admin.ts email@example.com lozinka # kreira novog admina
 */

import { supabaseAdmin } from '../config/supabase.js';

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email) {
    console.log('\n=== Viveo Admin Creator ===\n');
    console.log('Upotreba:');
    console.log('  npx tsx src/scripts/create-admin.ts <email>              # promoviše postojećeg usera');
    console.log('  npx tsx src/scripts/create-admin.ts <email> <password>   # kreira novog admin usera');
    console.log('\nPrimer:');
    console.log('  npx tsx src/scripts/create-admin.ts admin@viveo.rs admin123456\n');
    process.exit(1);
  }

  console.log(`\n=== Viveo Admin Creator ===\n`);

  // Proveri da li korisnik vec postoji
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users.find((u) => u.email === email);

  if (existingUser) {
    // Korisnik postoji — promoviši u admina
    console.log(`Korisnik ${email} već postoji (ID: ${existingUser.id})`);

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', existingUser.id);

    if (error) {
      console.error('Greška pri promociji:', error.message);
      process.exit(1);
    }

    console.log(`✅ Korisnik ${email} je sada ADMIN!`);
  } else if (password) {
    // Kreiraj novog korisnika
    console.log(`Kreiranje novog admin korisnika: ${email}`);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('Greška pri kreiranju auth korisnika:', error.message);
      process.exit(1);
    }

    // Kreiraj profil sa admin ulogom
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: data.user.id,
      full_name: 'Admin',
      role: 'admin',
    });

    if (profileError) {
      console.error('Greška pri kreiranju profila:', profileError.message);
      process.exit(1);
    }

    console.log(`✅ Admin korisnik kreiran!`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${data.user.id}`);
  } else {
    console.error(`Korisnik ${email} ne postoji. Dodaj lozinku da kreiraš novog:`);
    console.error(`  npx tsx src/scripts/create-admin.ts ${email} <password>`);
    process.exit(1);
  }

  console.log(`\nPrijavi se na admin panel: http://localhost:3002/prijava\n`);
}

createAdmin().catch(console.error);
