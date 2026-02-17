import { resend, FROM_EMAIL } from '../config/email.js';
import logger from '../config/logger.js';
import {
  newRequestTemplate,
  requestApprovedTemplate,
  videoReadyTemplate,
  requestRejectedTemplate,
  type NewRequestData,
  type RequestApprovedData,
  type VideoReadyData,
  type RequestRejectedData,
} from '../utils/emailTemplates.js';

// ---------------------------------------------------------------------------
// Helper — fire-and-forget email send
// ---------------------------------------------------------------------------
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    logger.debug('Email skip (Resend not configured)', { to, subject });
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error('Email send failed', { to, subject, error: error.message });
    } else {
      logger.info('Email sent successfully', { to, subject });
    }
  } catch (err) {
    logger.error('Email send exception', {
      to,
      subject,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// ---------------------------------------------------------------------------
// Public API — one function per email type
// ---------------------------------------------------------------------------

/** Notify star about a new order request */
export function sendNewRequestNotification(starEmail: string, data: NewRequestData): void {
  const { subject, html } = newRequestTemplate(data);
  sendEmail(starEmail, subject, html);
}

/** Notify buyer that their request was approved */
export function sendRequestApproved(buyerEmail: string, data: RequestApprovedData): void {
  const { subject, html } = requestApprovedTemplate(data);
  sendEmail(buyerEmail, subject, html);
}

/** Notify buyer that their video is ready */
export function sendVideoReady(buyerEmail: string, data: VideoReadyData): void {
  const { subject, html } = videoReadyTemplate(data);
  sendEmail(buyerEmail, subject, html);
}

/** Notify buyer that their request was rejected */
export function sendRequestRejected(buyerEmail: string, data: RequestRejectedData): void {
  const { subject, html } = requestRejectedTemplate(data);
  sendEmail(buyerEmail, subject, html);
}
