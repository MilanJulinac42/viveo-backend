/**
 * Cleanup script — briše pokvarene auth korisnike iz SQL migracije 003
 * i sve povezane podatke (orders, reviews, video_types, availability_slots, celebrities, profiles)
 *
 * Pokreni sa: npx tsx src/scripts/cleanup.ts
 */

import { supabaseAdmin } from '../config/supabase.js';

const SEED_STAR_EMAILS = [
  'marko.nikolic@viveo.rs',
  'jelena.petrovic@viveo.rs',
  'stefan.jovanovic@viveo.rs',
  'ana.djordjevic@viveo.rs',
  'nikola.stankovic@viveo.rs',
  'milica.todorovic@viveo.rs',
  'djordje.milosevic@viveo.rs',
  'ivana.ilic@viveo.rs',
];

const SEED_FAN_EMAILS = [
  'petar.markovic@test.rs',
  'maja.pavlovic@test.rs',
  'nemanja.ristic@test.rs',
  'tamara.djukic@test.rs',
];

const ALL_EMAILS = [...SEED_STAR_EMAILS, ...SEED_FAN_EMAILS];

async function cleanup() {
  console.log('\n=== Cleaning up seed data ===\n');

  // 1. Delete reviews (depends on orders)
  console.log('Deleting reviews...');
  const { error: revErr } = await supabaseAdmin.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (revErr) console.error('  Reviews error:', revErr.message);
  else console.log('  Deleted all reviews');

  // 2. Delete orders (depends on celebrities, profiles)
  console.log('Deleting orders...');
  const { error: ordErr } = await supabaseAdmin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (ordErr) console.error('  Orders error:', ordErr.message);
  else console.log('  Deleted all orders');

  // 3. Delete video_types (depends on celebrities)
  console.log('Deleting video types...');
  const { error: vtErr } = await supabaseAdmin.from('video_types').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (vtErr) console.error('  Video types error:', vtErr.message);
  else console.log('  Deleted all video types');

  // 4. Delete availability_slots (depends on celebrities)
  console.log('Deleting availability slots...');
  const { error: asErr } = await supabaseAdmin.from('availability_slots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (asErr) console.error('  Availability error:', asErr.message);
  else console.log('  Deleted all availability slots');

  // 5. Delete celebrities (depends on profiles)
  console.log('Deleting celebrities...');
  const { error: celErr } = await supabaseAdmin.from('celebrities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (celErr) console.error('  Celebrities error:', celErr.message);
  else console.log('  Deleted all celebrities');

  // 6. Delete applications
  console.log('Deleting applications...');
  const { error: appErr } = await supabaseAdmin.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (appErr) console.error('  Applications error:', appErr.message);
  else console.log('  Deleted all applications');

  // 7. Delete profiles
  console.log('Deleting profiles...');
  const { error: profErr } = await supabaseAdmin.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (profErr) console.error('  Profiles error:', profErr.message);
  else console.log('  Deleted all profiles');

  // 8. Delete auth users one by one
  console.log('\nDeleting auth users...');
  for (const email of ALL_EMAILS) {
    try {
      // Try to find user by email using admin API
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (error) {
        console.error(`  listUsers error: ${error.message}`);
        console.log('  Will try direct RPC cleanup...');
        break;
      }

      const user = data.users.find(u => u.email === email);
      if (user) {
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (delErr) console.error(`  Failed to delete ${email}: ${delErr.message}`);
        else console.log(`  Deleted auth user: ${email}`);
      } else {
        console.log(`  Not found in auth: ${email}`);
      }
    } catch (e: any) {
      console.error(`  Exception for ${email}: ${e.message}`);
      // If listUsers fails, we need SQL cleanup
      console.log('\n  Auth users are malformed. Running SQL cleanup via RPC...');
      await sqlCleanupAuth();
      break;
    }
  }

  // Also delete the test user we created via API earlier
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (data) {
      const testUser = data.users.find(u => u.email === 'test@viveo.rs');
      if (testUser) {
        await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        console.log('  Deleted test@viveo.rs');
      }
    }
  } catch { /* ignore */ }

  console.log('\n=== Cleanup complete! ===\n');
  console.log('Now run: npx tsx src/scripts/seed.ts\n');
}

async function sqlCleanupAuth() {
  // If listUsers fails, we use raw SQL via supabase rpc
  // This requires a function in the database
  console.log('  Attempting direct SQL cleanup of auth tables...');

  for (const email of ALL_EMAILS) {
    const { error } = await supabaseAdmin.rpc('cleanup_auth_user', { user_email: email });
    if (error) {
      console.error(`  RPC cleanup failed for ${email}: ${error.message}`);
      console.log('\n  Please run this SQL in Supabase SQL Editor:');
      console.log('  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN (' + ALL_EMAILS.map(e => `'${e}'`).join(',') + '));');
      console.log('  DELETE FROM auth.users WHERE email IN (' + ALL_EMAILS.map(e => `'${e}'`).join(',') + ');');
      return;
    }
    console.log(`  SQL cleanup: ${email}`);
  }
}

cleanup().catch(console.error);
