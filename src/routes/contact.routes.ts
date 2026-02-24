import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { resend, FROM_EMAIL } from '../config/email.js';
import logger from '../config/logger.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
  email: z.string().email('Neispravna email adresa'),
  subject: z.string().min(1, 'Izaberite temu'),
  message: z.string().min(10, 'Poruka mora imati najmanje 10 karaktera'),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = contactSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          message: parsed.error.errors[0].message,
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    const { name, email, subject, message } = parsed.data;

    const subjectMap: Record<string, string> = {
      general: 'Opšte pitanje',
      order: 'Pitanje o narudžbini',
      talent: 'Prijava za zvezdu',
      business: 'Poslovna saradnja',
      other: 'Ostalo',
    };

    const subjectLabel = subjectMap[subject] || subject;

    // Send email notification to admin
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: 'milanjulinac996@gmail.com',
          subject: `[Viveo Kontakt] ${subjectLabel} — ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Nova kontakt poruka</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #475569;">Ime:</td>
                  <td style="padding: 8px 12px;">${name}</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px 12px; font-weight: bold; color: #475569;">Email:</td>
                  <td style="padding: 8px 12px;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #475569;">Tema:</td>
                  <td style="padding: 8px 12px;">${subjectLabel}</td>
                </tr>
              </table>
              <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #7c3aed;">
                <p style="margin: 0; color: #334155; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
                Odgovorite direktno na ovaj email da kontaktirate korisnika.
              </p>
            </div>
          `,
          replyTo: email,
        });
        logger.info('Contact form email sent', { name, email, subject: subjectLabel });
      } catch (emailErr) {
        logger.error('Contact form email failed', {
          error: emailErr instanceof Error ? emailErr.message : 'Unknown error',
        });
      }
    } else {
      logger.info('Contact form submitted (email not configured)', { name, email, subject: subjectLabel, message });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Poruka je uspešno poslata!' },
    });
  } catch (err) {
    logger.error('Contact form error', { error: err instanceof Error ? err.message : 'Unknown' });
    res.status(500).json({
      success: false,
      error: { message: 'Greška pri slanju poruke. Pokušajte ponovo.', code: 'SERVER_ERROR' },
    });
  }
});

export default router;
