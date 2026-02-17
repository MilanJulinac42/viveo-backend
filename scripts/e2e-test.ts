/**
 * @fileoverview End-to-End test for the full Viveo order flow.
 *
 * Usage:
 *   npx tsx scripts/e2e-test.ts
 *
 * Prerequisites:
 *   - Backend running on http://localhost:3001
 *   - At least one celebrity with video_types in the database
 *   - RESEND_API_KEY set in .env (optional — emails will be skipped if not)
 *
 * Flow tested:
 *   1. Register a test FAN account
 *   2. Register a test STAR account
 *   3. Create a celebrity profile for the star (if needed)
 *   4. Fan creates an order
 *   5. Star sees the order in dashboard
 *   6. Star approves the order
 *   7. Star uploads a video
 *   8. Fan gets signed URL for the video
 *   9. Cleanup — delete test users and data
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const API = 'http://localhost:3001/api';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Test data
const TEST_FAN = {
  fullName: 'Test Fan E2E',
  email: `testfan_${Date.now()}@test.viveo.rs`,
  password: 'TestFan123',
  accountType: 'fan' as const,
};

const TEST_STAR = {
  fullName: 'Test Star E2E',
  email: `teststar_${Date.now()}@test.viveo.rs`,
  password: 'TestStar123',
  accountType: 'star' as const,
};

// State
let fanToken = '';
let starToken = '';
let fanUserId = '';
let starUserId = '';
let celebrityId = '';
let celebritySlug = '';
let videoTypeId = '';
let orderId = '';
const createdUserIds: string[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function api(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string,
  isFormData?: boolean,
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: isFormData ? (body as unknown as BodyInit) : body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

function pass(step: string) {
  console.log(`  ✅ ${step}`);
}

function fail(step: string, detail?: string) {
  console.error(`  ❌ ${step}${detail ? `: ${detail}` : ''}`);
}

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
}

// ─── Test Steps ──────────────────────────────────────────────────────────────

async function step1_registerFan(): Promise<boolean> {
  const { status, data } = await api('POST', '/auth/register', TEST_FAN);
  const d = data as Record<string, unknown>;
  const inner = d.data as Record<string, unknown> | undefined;

  if (status === 201 && inner?.session) {
    const session = inner.session as Record<string, string>;
    const user = inner.user as Record<string, string>;
    fanToken = session.accessToken;
    fanUserId = user.id;
    createdUserIds.push(fanUserId);
    pass(`Fan registered: ${TEST_FAN.email}`);
    return true;
  }
  fail('Fan registration', JSON.stringify(d));
  return false;
}

async function step2_registerStar(): Promise<boolean> {
  const { status, data } = await api('POST', '/auth/register', TEST_STAR);
  const d = data as Record<string, unknown>;
  const inner = d.data as Record<string, unknown> | undefined;

  if (status === 201 && inner?.session) {
    const session = inner.session as Record<string, string>;
    const user = inner.user as Record<string, string>;
    starToken = session.accessToken;
    starUserId = user.id;
    createdUserIds.push(starUserId);
    pass(`Star registered: ${TEST_STAR.email}`);
    return true;
  }
  fail('Star registration', JSON.stringify(d));
  return false;
}

async function step3_createCelebrityProfile(): Promise<boolean> {
  // First check if any celebrity exists for this star
  const { data: existing } = await supabase
    .from('celebrities')
    .select('id, slug')
    .eq('profile_id', starUserId)
    .single();

  if (existing) {
    celebrityId = existing.id;
    celebritySlug = existing.slug;
    pass(`Celebrity profile already exists: ${celebritySlug}`);
  } else {
    // Get a valid category for the test celebrity
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .single();

    if (!categories) {
      fail('No categories found in DB');
      return false;
    }

    // Create celebrity profile directly in DB
    const slug = `test-star-e2e-${Date.now()}`;
    const { data: celeb, error: err } = await supabase
      .from('celebrities')
      .insert({
        profile_id: starUserId,
        name: TEST_STAR.fullName,
        slug,
        bio: 'Test celebrity za E2E testiranje',
        price: 2000,
        response_time: 48,
        accepting_requests: true,
        category_id: categories.id,
        image: '',
      })
      .select()
      .single();

    if (err || !celeb) {
      fail('Create celebrity profile', err?.message || 'no data');
      return false;
    }

    celebrityId = celeb.id;
    celebritySlug = celeb.slug;
    pass(`Celebrity profile created: ${celebritySlug}`);
  }

  // Create a video type
  const { data: vt, error: vtErr } = await supabase
    .from('video_types')
    .insert({
      celebrity_id: celebrityId,
      title: 'Rođendanska čestitka',
      occasion: 'Rođendan',
      emoji: '🎂',
      accent_from: 'from-pink-500',
      accent_to: 'to-rose-600',
      message: 'Srećan rođendan!',
    })
    .select()
    .single();

  if (vtErr || !vt) {
    fail('Create video type', vtErr?.message || 'no data');
    return false;
  }

  videoTypeId = vt.id;
  pass(`Video type created: ${vt.title} (${videoTypeId})`);
  return true;
}

async function step4_createOrder(): Promise<boolean> {
  const { status, data } = await api('POST', '/orders', {
    celebritySlug,
    videoTypeId,
    recipientName: 'Marko Petrović',
    buyerName: TEST_FAN.fullName,
    buyerEmail: TEST_FAN.email,
    instructions: 'Molim te napravi srećan rođendanski video za Marka! Voli fudbal i muziku.',
  }, fanToken);

  const d = data as Record<string, unknown>;
  const inner = d.data as Record<string, unknown> | undefined;

  if (status === 201 && inner?.id) {
    orderId = inner.id as string;
    pass(`Order created: ${orderId} (status: ${inner.status}, price: ${inner.price} RSD)`);
    return true;
  }
  fail('Create order', JSON.stringify(d));
  return false;
}

async function step5_starSeesOrder(): Promise<boolean> {
  const { status, data } = await api('GET', '/dashboard/requests', undefined, starToken);
  const d = data as Record<string, unknown>;
  const requests = d.data as Array<Record<string, unknown>> | undefined;

  if (status === 200 && requests?.length) {
    const found = requests.find((r) => r.id === orderId);
    if (found) {
      pass(`Star sees order in dashboard (status: ${found.status})`);
      return true;
    }
    fail('Star dashboard — order not found in list');
    return false;
  }
  fail('Star dashboard', JSON.stringify(d));
  return false;
}

async function step6_approveOrder(): Promise<boolean> {
  const { status, data } = await api('PATCH', `/dashboard/requests/${orderId}`, {
    status: 'approved',
  }, starToken);

  const d = data as Record<string, unknown>;
  const inner = d.data as Record<string, unknown> | undefined;

  if (status === 200 && inner?.status === 'approved') {
    pass(`Order approved: ${orderId}`);
    return true;
  }
  fail('Approve order', JSON.stringify(d));
  return false;
}

async function step7_uploadVideo(): Promise<boolean> {
  // Create a small fake MP4 file for testing
  const fakeVideoContent = Buffer.alloc(1024, 0); // 1KB fake video

  // Build multipart form data manually
  const boundary = '----E2ETestBoundary' + Date.now();
  const bodyParts: Buffer[] = [];

  bodyParts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="video"; filename="test-video.mp4"\r\n` +
    `Content-Type: video/mp4\r\n\r\n`
  ));
  bodyParts.push(fakeVideoContent);
  bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const fullBody = Buffer.concat(bodyParts);

  const res = await fetch(`${API}/dashboard/requests/${orderId}/video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${starToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: fullBody,
  });

  const json = await res.json().catch(() => ({})) as Record<string, unknown>;
  const inner = json.data as Record<string, unknown> | undefined;

  if (res.status === 200 && inner?.status === 'completed') {
    pass(`Video uploaded! Order completed. Path: ${inner.videoUrl}`);
    return true;
  }
  fail('Upload video', JSON.stringify(json));
  return false;
}

async function step8_fanGetsSignedUrl(): Promise<boolean> {
  const { status, data } = await api('GET', `/orders/${orderId}/video`, undefined, fanToken);
  const d = data as Record<string, unknown>;
  const inner = d.data as Record<string, unknown> | undefined;

  if (status === 200 && inner?.signedUrl) {
    const url = (inner.signedUrl as string).substring(0, 80);
    pass(`Signed URL generated: ${url}...`);
    return true;
  }
  fail('Get signed URL', JSON.stringify(d));
  return false;
}

async function step9_fanListsOrders(): Promise<boolean> {
  const { status, data } = await api('GET', '/orders', undefined, fanToken);
  const d = data as Record<string, unknown>;
  const orders = d.data as Array<Record<string, unknown>> | undefined;

  if (status === 200 && orders?.length) {
    const found = orders.find((o) => o.id === orderId);
    if (found && found.status === 'completed') {
      pass(`Fan sees completed order with videoUrl: ${!!found.videoUrl}`);
      return true;
    }
  }
  fail('Fan list orders', JSON.stringify(d));
  return false;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

async function cleanup() {
  section('🧹 CLEANUP');

  // Delete order
  if (orderId) {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (!error) pass('Deleted test order');
    else fail('Delete order', error.message);
  }

  // Delete video from storage
  if (orderId && celebrityId) {
    const path = `videos/${celebrityId}/${orderId}.mp4`;
    await supabase.storage.from('videos').remove([path]);
    pass('Deleted test video from storage');
  }

  // Delete video type
  if (videoTypeId) {
    const { error } = await supabase.from('video_types').delete().eq('id', videoTypeId);
    if (!error) pass('Deleted test video type');
    else fail('Delete video type', error.message);
  }

  // Delete celebrity profile
  if (celebrityId) {
    const { error } = await supabase.from('celebrities').delete().eq('id', celebrityId);
    if (!error) pass('Deleted test celebrity');
    else fail('Delete celebrity', error.message);
  }

  // Delete profiles and auth users
  for (const userId of createdUserIds) {
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
    pass(`Deleted test user: ${userId}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('🚀 VIVEO END-TO-END TEST');
  console.log(`   API: ${API}`);
  console.log(`   Time: ${new Date().toLocaleString('sr-RS')}`);

  let passed = 0;
  let failed = 0;
  const total = 9;

  try {
    // Check API is running
    const healthRes = await fetch(`${API}/health`);
    if (!healthRes.ok) {
      console.error('\n❌ Backend is not running on http://localhost:3001');
      process.exit(1);
    }
    console.log('   Backend: ✅ online\n');

    section('1️⃣  REGISTRATION');
    if (await step1_registerFan()) passed++;
    else failed++;

    if (await step2_registerStar()) passed++;
    else failed++;

    section('2️⃣  CELEBRITY SETUP');
    if (await step3_createCelebrityProfile()) passed++;
    else { failed++; throw new Error('Cannot continue without celebrity'); }

    section('3️⃣  ORDER FLOW');
    if (await step4_createOrder()) passed++;
    else { failed++; throw new Error('Cannot continue without order'); }

    section('4️⃣  STAR DASHBOARD');
    if (await step5_starSeesOrder()) passed++;
    else failed++;

    if (await step6_approveOrder()) passed++;
    else { failed++; throw new Error('Cannot continue without approval'); }

    section('5️⃣  VIDEO UPLOAD & DELIVERY');
    if (await step7_uploadVideo()) passed++;
    else failed++;

    if (await step8_fanGetsSignedUrl()) passed++;
    else failed++;

    section('6️⃣  FAN DASHBOARD');
    if (await step9_fanListsOrders()) passed++;
    else failed++;

  } catch (err) {
    console.error(`\n⚠️  Test aborted: ${(err as Error).message}`);
  } finally {
    await cleanup();
  }

  // Summary
  section('📊 RESULTS');
  console.log(`  Total:  ${total}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${failed} ❌`);
  console.log(`  Skip:   ${total - passed - failed} ⏭️`);
  console.log('');

  if (failed === 0 && passed === total) {
    console.log('  🎉 ALL TESTS PASSED! MVP is working end-to-end! 🚀');
  } else if (failed > 0) {
    console.log('  ⚠️  Some tests failed — check output above.');
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main();
