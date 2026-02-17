/**
 * @fileoverview Quick test for Resend email integration.
 *
 * Usage:
 *   npx tsx scripts/test-email.ts <your-email@example.com>
 *
 * Make sure .env has RESEND_API_KEY and RESEND_FROM_EMAIL set.
 */

import dotenv from 'dotenv';
dotenv.config();

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const toEmail = process.argv[2];

if (!apiKey) {
  console.error('❌ RESEND_API_KEY is not set in .env');
  process.exit(1);
}

if (!toEmail) {
  console.error('❌ Usage: npx tsx scripts/test-email.ts <your-email@example.com>');
  process.exit(1);
}

console.log('📧 Testing Resend email...');
console.log(`   From: ${fromEmail}`);
console.log(`   To:   ${toEmail}`);
console.log('');

const resend = new Resend(apiKey);

async function main() {
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Viveo Test — Email radi! 🎉',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
          <h1 style="color:#7c3aed;margin:0 0 16px;">Viveo</h1>
          <p style="color:#334155;font-size:16px;line-height:1.6;">
            Ako vidiš ovaj email, Resend integracija radi ispravno! ✅
          </p>
          <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:12px;text-align:center;">
            <p style="margin:0;font-size:32px;">🎬</p>
            <p style="margin:8px 0 0;color:#166534;font-weight:600;">Email sistem je aktivan!</p>
          </div>
          <p style="margin-top:24px;font-size:13px;color:#94a3b8;">
            Ovo je test email poslat iz Viveo backend-a.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      process.exit(1);
    }

    console.log('✅ Email uspešno poslat!');
    console.log('   ID:', data?.id);
    console.log('');
    console.log('📬 Proveri inbox (i spam folder) za:', toEmail);
  } catch (err) {
    console.error('❌ Exception:', err);
    process.exit(1);
  }
}

main();
