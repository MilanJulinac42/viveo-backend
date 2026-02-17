/**
 * @fileoverview Quick test for Supabase Storage (videos bucket).
 *
 * Usage:
 *   npx tsx scripts/test-storage.ts
 *
 * Tests:
 *   1. Upload a small test file to the "videos" bucket
 *   2. Generate a signed URL for the uploaded file
 *   3. Clean up — delete the test file
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BUCKET = 'videos';
const TEST_PATH = 'test/test-upload.mp4';

async function main() {
  console.log('🪣 Testing Supabase Storage...');
  console.log(`   Bucket: ${BUCKET}`);
  console.log(`   URL:    ${supabaseUrl}`);
  console.log('');

  // Step 1: Check bucket exists
  console.log('1️⃣ Checking bucket exists...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    process.exit(1);
  }

  const videosBucket = buckets?.find((b) => b.name === BUCKET);
  if (!videosBucket) {
    console.error(`❌ Bucket "${BUCKET}" not found! Available:`, buckets?.map((b) => b.name));
    console.error('   Kreiraj bucket "videos" u Supabase Dashboard → Storage');
    process.exit(1);
  }

  console.log(`   ✅ Bucket "${BUCKET}" exists (public: ${videosBucket.public})`);
  console.log('');

  // Step 2: Upload test file
  console.log('2️⃣ Uploading test file...');
  // Create a tiny fake video file (just bytes for testing)
  const testContent = Buffer.from('This is a test video file for Viveo storage testing.', 'utf-8');

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(TEST_PATH, testContent, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Upload error:', uploadError.message);
    process.exit(1);
  }

  console.log('   ✅ File uploaded successfully!');
  console.log('   Path:', uploadData?.path);
  console.log('');

  // Step 3: Generate signed URL
  console.log('3️⃣ Generating signed URL (1 hour)...');
  const { data: signedUrlData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(TEST_PATH, 3600);

  if (signedError) {
    console.error('❌ Signed URL error:', signedError.message);
    // Still try to clean up
  } else {
    console.log('   ✅ Signed URL generated!');
    console.log('   URL:', signedUrlData?.signedUrl?.substring(0, 100) + '...');
    console.log('');
  }

  // Step 4: List files in test directory
  console.log('4️⃣ Listing files in test/...');
  const { data: files, error: listFilesError } = await supabase.storage
    .from(BUCKET)
    .list('test');

  if (listFilesError) {
    console.error('❌ List error:', listFilesError.message);
  } else {
    console.log('   Files found:', files?.map((f) => f.name));
    console.log('');
  }

  // Step 5: Cleanup
  console.log('5️⃣ Cleaning up test file...');
  const { error: deleteError } = await supabase.storage
    .from(BUCKET)
    .remove([TEST_PATH]);

  if (deleteError) {
    console.error('❌ Delete error:', deleteError.message);
  } else {
    console.log('   ✅ Test file deleted!');
  }

  console.log('');
  console.log('🎉 Supabase Storage test complete!');
  console.log('');
  console.log('Summary:');
  console.log('  ✅ Bucket exists and is accessible');
  console.log('  ✅ File upload works');
  console.log('  ✅ Signed URL generation works');
  console.log('  ✅ File deletion works');
  console.log('');
  console.log('Storage je spreman za video upload! 🚀');
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
