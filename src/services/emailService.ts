import { resend, FROM_EMAIL } from '../config/email.js';
import logger from '../config/logger.js';
import {
  newRequestTemplate,
  requestApprovedTemplate,
  videoReadyTemplate,
  requestRejectedTemplate,
  newMerchOrderTemplate,
  merchOrderConfirmedTemplate,
  merchOrderShippedTemplate,
  newDigitalOrderTemplate,
  digitalOrderConfirmedTemplate,
  digitalOrderCompletedTemplate,
  welcomeEmailTemplate,
  newReviewNotificationTemplate,
  type NewRequestData,
  type RequestApprovedData,
  type VideoReadyData,
  type RequestRejectedData,
  type NewMerchOrderData,
  type MerchOrderConfirmedData,
  type MerchOrderShippedData,
  type NewDigitalOrderData,
  type DigitalOrderConfirmedData,
  type DigitalOrderCompletedData,
  type WelcomeEmailData,
  type NewReviewNotificationData,
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

/** Notify star about a new merch order */
export function sendNewMerchOrderNotification(starEmail: string, data: NewMerchOrderData): void {
  const { subject, html } = newMerchOrderTemplate(data);
  sendEmail(starEmail, subject, html);
}

/** Notify buyer that their merch order was confirmed */
export function sendMerchOrderConfirmed(buyerEmail: string, data: MerchOrderConfirmedData): void {
  const { subject, html } = merchOrderConfirmedTemplate(data);
  sendEmail(buyerEmail, subject, html);
}

/** Notify buyer that their merch order was shipped */
export function sendMerchOrderShipped(buyerEmail: string, data: MerchOrderShippedData): void {
  const { subject, html } = merchOrderShippedTemplate(data);
  sendEmail(buyerEmail, subject, html);
}

/** Notify star about a new digital order */
export function sendNewDigitalOrderNotification(starEmail: string, data: NewDigitalOrderData): void {
  const { subject, html } = newDigitalOrderTemplate(data);
  sendEmail(starEmail, subject, html);
}

/** Notify buyer that their digital order was confirmed */
export function sendDigitalOrderConfirmed(buyerEmail: string, data: DigitalOrderConfirmedData): void {
  const { subject, html } = digitalOrderConfirmedTemplate(data);
  sendEmail(buyerEmail, subject, html);
}

/** Notify buyer that their digital product is ready for download */
export function sendDigitalOrderCompleted(buyerEmail: string, data: DigitalOrderCompletedData): void {
  const { subject, html } = digitalOrderCompletedTemplate(data);
  sendEmail(buyerEmail, subject, html);
}

/** Send welcome email to newly registered user */
export function sendWelcomeEmail(email: string, data: WelcomeEmailData): void {
  const { subject, html } = welcomeEmailTemplate(data);
  sendEmail(email, subject, html);
}

/** Notify star about a new review on their content */
export function sendNewReviewNotification(starEmail: string, data: NewReviewNotificationData): void {
  const { subject, html } = newReviewNotificationTemplate(data);
  sendEmail(starEmail, subject, html);
}
