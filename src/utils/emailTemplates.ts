import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------
function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#6d28d9;">Viveo</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Personalizovane video poruke od zvezda</p>
    </div>

    <!-- Content card -->
    <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;font-size:12px;color:#94a3b8;">
      <p style="margin:0;">Viveo tim</p>
      <p style="margin:4px 0 0;">&copy; ${new Date().getFullYear()} Viveo. Sva prava zadržana.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Template: New request notification → star
// ---------------------------------------------------------------------------
export interface NewRequestData {
  starName: string;
  buyerName: string;
  videoType: string;
  recipientName: string;
  instructions: string;
  price: number;
  deadline: string;
}

export function newRequestTemplate(data: NewRequestData) {
  return {
    subject: 'Nova narudžbina na Viveo! 🎬',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.starName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Imate novu narudžbinu za personalizovani video!
      </p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
          <tr>
            <td style="padding:6px 0;font-weight:600;">Naručilac:</td>
            <td style="padding:6px 0;">${data.buyerName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Primalac:</td>
            <td style="padding:6px 0;">${data.recipientName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Tip videa:</td>
            <td style="padding:6px 0;">${data.videoType}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Cena:</td>
            <td style="padding:6px 0;">${data.price.toLocaleString('sr-RS')} RSD</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Rok:</td>
            <td style="padding:6px 0;">${data.deadline}</td>
          </tr>
        </table>
      </div>

      <div style="background:#faf5ff;border-left:4px solid #7c3aed;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6d28d9;">INSTRUKCIJE:</p>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">${data.instructions}</p>
      </div>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/zvezda-panel" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Pogledaj u panelu
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Request approved → buyer
// ---------------------------------------------------------------------------
export interface RequestApprovedData {
  buyerName: string;
  starName: string;
  videoType: string;
  recipientName: string;
}

export function requestApprovedTemplate(data: RequestApprovedData) {
  return {
    subject: `${data.starName} je prihvatio/la vaš zahtev! ✅`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.buyerName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Sjajne vesti! <strong>${data.starName}</strong> je prihvatio/la vaš zahtev za personalizovani video.
      </p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:32px;">🎉</p>
        <p style="margin:8px 0 0;font-size:14px;color:#166534;font-weight:600;">Zahtev prihvaćen!</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">
          ${data.videoType} za ${data.recipientName}
        </p>
      </div>

      <p style="margin:0 0 24px;color:#475569;line-height:1.6;font-size:14px;">
        Video se priprema i bićete obavešteni čim bude spreman. Hvala na strpljenju!
      </p>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/moje-porudzbine" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Moje porudžbine
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Video ready → buyer
// ---------------------------------------------------------------------------
export interface VideoReadyData {
  buyerName: string;
  starName: string;
  videoType: string;
  recipientName: string;
}

export function videoReadyTemplate(data: VideoReadyData) {
  return {
    subject: `Vaš video od ${data.starName} je spreman! 🎬`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.buyerName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Vaš personalizovani video od <strong>${data.starName}</strong> je spreman za gledanje!
      </p>

      <div style="background:#faf5ff;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:48px;">🎥</p>
        <p style="margin:12px 0 4px;font-size:16px;color:#6d28d9;font-weight:700;">Video je spreman!</p>
        <p style="margin:0;font-size:13px;color:#475569;">
          ${data.videoType} za ${data.recipientName}
        </p>
      </div>

      <p style="margin:0 0 24px;color:#475569;line-height:1.6;font-size:14px;">
        Pogledajte video, preuzmite ga i podelite sa ${data.recipientName}. Nadamo se da će vam se dopasti!
      </p>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/moje-porudzbine" style="display:inline-block;padding:14px 36px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
          Pogledaj video
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Request rejected → buyer
// ---------------------------------------------------------------------------
export interface RequestRejectedData {
  buyerName: string;
  starName: string;
  videoType: string;
  recipientName: string;
}

export function requestRejectedTemplate(data: RequestRejectedData) {
  return {
    subject: 'Obaveštenje o vašem zahtevu na Viveo',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.buyerName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Nažalost, <strong>${data.starName}</strong> trenutno nije u mogućnosti da ispuni vaš zahtev za personalizovani video.
      </p>

      <div style="background:#fef2f2;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600;">Zahtev odbijen</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">
          ${data.videoType} za ${data.recipientName}
        </p>
      </div>

      <p style="margin:0 0 24px;color:#475569;line-height:1.6;font-size:14px;">
        Ne brinite — na platformi ima mnogo drugih zvezda koje bi rado snimile video za vas!
      </p>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/zvezde" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Pregledaj zvezde
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: New merch order notification → star
// ---------------------------------------------------------------------------
export interface NewMerchOrderData {
  starName: string;
  buyerName: string;
  productName: string;
  variantName: string;
  quantity: number;
  totalPrice: number;
  shippingCity: string;
}

export function newMerchOrderTemplate(data: NewMerchOrderData) {
  return {
    subject: 'Nova merch narudžbina na Viveo! 🛍️',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.starName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Imate novu narudžbinu za merch proizvod!
      </p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
          <tr>
            <td style="padding:6px 0;font-weight:600;">Kupac:</td>
            <td style="padding:6px 0;">${data.buyerName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Proizvod:</td>
            <td style="padding:6px 0;">${data.productName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Varijanta:</td>
            <td style="padding:6px 0;">${data.variantName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Količina:</td>
            <td style="padding:6px 0;">${data.quantity}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Ukupna cena:</td>
            <td style="padding:6px 0;">${data.totalPrice.toLocaleString('sr-RS')} RSD</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Grad dostave:</td>
            <td style="padding:6px 0;">${data.shippingCity}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/zvezda-panel" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Pogledaj u panelu
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Merch order confirmed → buyer
// ---------------------------------------------------------------------------
export interface MerchOrderConfirmedData {
  buyerName: string;
  starName: string;
  productName: string;
  totalPrice: number;
}

export function merchOrderConfirmedTemplate(data: MerchOrderConfirmedData) {
  return {
    subject: `${data.starName} je potvrdio/la vašu narudžbinu! ✅`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.buyerName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        <strong>${data.starName}</strong> je potvrdio/la vašu merch narudžbinu!
      </p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:32px;">🛍️</p>
        <p style="margin:8px 0 0;font-size:14px;color:#166534;font-weight:600;">Narudžbina potvrđena!</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">
          ${data.productName}
        </p>
      </div>

      <p style="margin:0 0 24px;color:#475569;line-height:1.6;font-size:14px;">
        Vaša narudžbina se priprema za slanje. Bićete obavešteni kada bude poslata.
      </p>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/moje-porudzbine" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Moje narudžbine
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Merch order shipped → buyer
// ---------------------------------------------------------------------------
export interface MerchOrderShippedData {
  buyerName: string;
  starName: string;
  productName: string;
  trackingNumber: string | null;
}

export function merchOrderShippedTemplate(data: MerchOrderShippedData) {
  const trackingInfo = data.trackingNumber
    ? `<p style="margin:4px 0 0;font-size:13px;color:#475569;">Broj za praćenje: <strong>${data.trackingNumber}</strong></p>`
    : '';

  return {
    subject: `Vaša narudžbina od ${data.starName} je poslata! 📦`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.buyerName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Vaša merch narudžbina od <strong>${data.starName}</strong> je poslata!
      </p>

      <div style="background:#faf5ff;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:48px;">📦</p>
        <p style="margin:12px 0 4px;font-size:16px;color:#6d28d9;font-weight:700;">Narudžbina poslata!</p>
        <p style="margin:0;font-size:13px;color:#475569;">${data.productName}</p>
        ${trackingInfo}
      </div>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/moje-porudzbine" style="display:inline-block;padding:14px 36px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
          Moje narudžbine
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: New digital order notification → star
// ---------------------------------------------------------------------------
export interface NewDigitalOrderData {
  starName: string;
  buyerName: string;
  productName: string;
  price: number;
}

export function newDigitalOrderTemplate(data: NewDigitalOrderData) {
  return {
    subject: 'Nova digitalna narudžbina na Viveo! 💾',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.starName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Imate novu narudžbinu za digitalni proizvod!
      </p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
          <tr>
            <td style="padding:6px 0;font-weight:600;">Kupac:</td>
            <td style="padding:6px 0;">${data.buyerName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Proizvod:</td>
            <td style="padding:6px 0;">${data.productName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Cena:</td>
            <td style="padding:6px 0;">${data.price.toLocaleString('sr-RS')} RSD</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/zvezda-panel" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Pogledaj u panelu
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Digital order confirmed → buyer
// ---------------------------------------------------------------------------
export interface DigitalOrderConfirmedData {
  buyerName: string;
  starName: string;
  productName: string;
}

export function digitalOrderConfirmedTemplate(data: DigitalOrderConfirmedData) {
  return {
    subject: `${data.starName} je potvrdio/la vašu narudžbinu! ✅`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.buyerName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        <strong>${data.starName}</strong> je potvrdio/la vašu narudžbinu za digitalni proizvod!
      </p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:32px;">💾</p>
        <p style="margin:8px 0 0;font-size:14px;color:#166534;font-weight:600;">Narudžbina potvrđena!</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">
          ${data.productName}
        </p>
      </div>

      <p style="margin:0 0 24px;color:#475569;line-height:1.6;font-size:14px;">
        Vaša narudžbina je potvrđena. Uskoro ćete dobiti link za preuzimanje.
      </p>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/moje-porudzbine" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Moje narudžbine
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Digital order completed → buyer (with download link)
// ---------------------------------------------------------------------------
export interface DigitalOrderCompletedData {
  buyerName: string;
  starName: string;
  productName: string;
  downloadUrl: string;
  expiresAt: string;
}

export function digitalOrderCompletedTemplate(data: DigitalOrderCompletedData) {
  const expiryDate = new Date(data.expiresAt).toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    subject: `Vaš digitalni proizvod je spreman za preuzimanje! 📥`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.buyerName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Vaš digitalni proizvod od <strong>${data.starName}</strong> je spreman za preuzimanje!
      </p>

      <div style="background:#faf5ff;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:48px;">📥</p>
        <p style="margin:12px 0 4px;font-size:16px;color:#6d28d9;font-weight:700;">Spreman za preuzimanje!</p>
        <p style="margin:0;font-size:13px;color:#475569;">${data.productName}</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${data.downloadUrl}" style="display:inline-block;padding:14px 36px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
          Preuzmi proizvod
        </a>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e;">
        <strong>Napomena:</strong> Link za preuzimanje važi do ${expiryDate}. Preuzmite proizvod pre isteka roka.
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Welcome email → new user
// ---------------------------------------------------------------------------
export interface WelcomeEmailData {
  userName: string;
}

export function welcomeEmailTemplate(data: WelcomeEmailData) {
  return {
    subject: 'Dobrodošli na Viveo! 🎉',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.userName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Dobrodošli na <strong>Viveo</strong> — platformu koja vas povezuje sa vašim omiljenim zvezdama!
      </p>

      <div style="background:#faf5ff;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:48px;">🌟</p>
        <p style="margin:12px 0 4px;font-size:16px;color:#6d28d9;font-weight:700;">Vaš nalog je spreman!</p>
        <p style="margin:0;font-size:13px;color:#475569;">Istražite personalizovane video poruke, merch i digitalni sadržaj.</p>
      </div>

      <p style="margin:0 0 24px;color:#475569;line-height:1.6;font-size:14px;">
        Evo šta možete da radite na Viveo platformi:
      </p>

      <ul style="margin:0 0 24px;padding:0 0 0 20px;color:#475569;font-size:14px;line-height:2;">
        <li>🎬 Naručite personalizovane video poruke od zvezda</li>
        <li>🛍️ Kupujte ekskluzivni merch od vaših omiljenih kreatora</li>
        <li>📥 Preuzmite digitalni sadržaj (preseti, muzika, PDF-ovi)</li>
        <li>⭐ Sačuvajte omiljene zvezde i proizvode</li>
      </ul>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/zvezde" style="display:inline-block;padding:14px 36px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
          Istražite zvezde
        </a>
      </div>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: New review notification → star
// ---------------------------------------------------------------------------
export interface NewReviewNotificationData {
  starName: string;
  rating: number;
  reviewText: string;
  reviewType: string;
}

export function newReviewNotificationTemplate(data: NewReviewNotificationData) {
  const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);

  return {
    subject: `Nova recenzija na Viveo! ${stars}`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Zdravo ${data.starName},</h2>
      <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
        Dobili ste novu recenziju za <strong>${data.reviewType}</strong>!
      </p>

      <div style="background:#faf5ff;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:28px;color:#eab308;letter-spacing:4px;">${stars}</p>
        <p style="margin:12px 0 4px;font-size:16px;color:#6d28d9;font-weight:700;">${data.rating}/5</p>
      </div>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#334155;font-style:italic;line-height:1.6;">
          &ldquo;${data.reviewText}&rdquo;
        </p>
      </div>

      <div style="text-align:center;">
        <a href="${env.FRONTEND_URL}/zvezda-panel" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
          Pogledaj u panelu
        </a>
      </div>
    `),
  };
}
