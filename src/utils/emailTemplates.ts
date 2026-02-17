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
