import { supabaseAdmin } from '../config/supabase.js';

const SEED_USERS = [
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
];

async function fixPasswords() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  for (const email of SEED_USERS) {
    const user = users.find((u) => u.email === email);
    if (user) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: 'test123456',
      });
      if (updateError) {
        console.error(`Failed to update ${email}:`, updateError.message);
      } else {
        console.log(`Updated password for ${email}`);
      }
    } else {
      console.log(`User not found: ${email}`);
    }
  }

  console.log('Done!');
}

fixPasswords();
