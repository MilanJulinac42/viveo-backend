/**
 * Cleanup malformed auth users created by SQL migration 003
 * Uses direct Supabase SQL execution via REST API
 *
 * Pokreni sa: npx tsx src/scripts/cleanup-auth.ts
 */

import { config } from 'dotenv';
config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SEED_EMAILS = [
  'marko.nikolic@viveo.rs',
  'jelena.petrovic@viveo.rs',
  'stefan.jovanovic@viveo.rs',
  'ana.djordjevic@viveo.rs',
  'nikola.stankovic@viveo.rs',
  'milica.todorovic@viveo.rs',
  'djordje.milosevic@viveo.rs',
  'ivana.ilic@viveo.rs',
  'petar.markovic@test.rs',
  'maja.pavlovic@test.rs',
  'nemanja.ristic@test.rs',
  'tamara.djukic@test.rs',
  'test@viveo.rs',
];

async function cleanupAuth() {
  console.log('\n=== Cleaning up malformed auth users ===\n');

  const emailList = SEED_EMAILS.map(e => `'${e}'`).join(',');

  // Execute SQL via Supabase's pg_net or direct REST
  // We need to use the /rest/v1/rpc endpoint with a custom function
  // But since we don't have one, let's try another approach:
  // Use supabaseAdmin to call a raw SQL query

  // Actually, let's use the Supabase SQL endpoint (available with service role)
  const sql = `
    DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN (${emailList}));
    DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email IN (${emailList}));
    DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE email IN (${emailList}));
    DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email IN (${emailList})));
    DELETE FROM auth.users WHERE email IN (${emailList});
  `;

  // Try using pg endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    console.log('RPC exec_sql not available (expected).');
    console.log('\nPlease run the following SQL in the Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    console.log('\nAfter running the SQL, execute: npx tsx src/scripts/seed.ts');
  } else {
    console.log('Auth users cleaned up successfully!');
    console.log('\nNow run: npx tsx src/scripts/seed.ts');
  }
}

cleanupAuth().catch(console.error);
