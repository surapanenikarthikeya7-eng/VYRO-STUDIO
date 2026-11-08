/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
}

/**
 * Encodes string to RFC 4648 Base64URL without padding
 */
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Constructs an RFC 2822 compliant email string and encodes in base64url
 */
export function buildRfc2822Email(to: string, subject: string, body: string, senderName: string = 'VYRO STUDIO'): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const lines = [
    `From: "${senderName}" <me>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body
  ];
  return base64UrlEncode(lines.join('\r\n'));
}

/**
 * List recent messages from Gmail
 */
export async function listGmailMessages(
  token: string,
  query: string = '',
  maxResults: number = 10
): Promise<GmailMessageSummary[]> {
  try {
    const params = new URLSearchParams({
      maxResults: String(maxResults),
      ...(query ? { q: query } : {})
    });

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gmail API error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.messages || data.messages.length === 0) {
      return [];
    }

    // Fetch details for each message in parallel
    const messagePromises = data.messages.slice(0, 8).map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        
        const headers = detail.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
        const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value || '';
        const toHeader = headers.find((h: any) => h.name?.toLowerCase() === 'to')?.value || '';

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet || '',
          from: fromHeader,
          to: toHeader,
          subject: subjectHeader,
          date: dateHeader
        } as GmailMessageSummary;
      } catch (e) {
        return null;
      }
    });

    const results = await Promise.all(messagePromises);
    return results.filter((m): m is GmailMessageSummary => m !== null);
  } catch (error) {
    console.error('listGmailMessages error:', error);
    throw error;
  }
}

/**
 * Send an email via Gmail API
 */
export async function sendGmailEmail(
  token: string,
  to: string,
  subject: string,
  bodyHtml: string,
  senderName: string = 'VYRO STUDIO'
): Promise<{ id: string; threadId: string }> {
  try {
    const raw = buildRfc2822Email(to, subject, bodyHtml, senderName);
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to send email via Gmail API: status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('sendGmailEmail error:', error);
    throw error;
  }
}

/**
 * Pre-built Studio Email Templates
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  generateBody: (data: {
    clientName: string;
    serviceName?: string;
    date?: string;
    amount?: number | string;
    studioPhone?: string;
  }) => string;
}

export const STUDIO_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'CONFIRM_SHOOT',
    name: 'Official Shoot Confirmation',
    subject: 'Shoot Booking Confirmed — VYRO STUDIO',
    generateBody: ({ clientName, serviceName = 'Cinematography & Photography', date = 'Scheduled Date', studioPhone = '8639063089' }) => `
<div style="background-color: #000000; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
  <div style="border-bottom: 2px solid #E8C49A; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 22px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">VYRO <span style="color: #E8C49A;">STUDIO</span></h1>
    <p style="color: #a1a1aa; font-size: 11px; margin-top: 4px; letter-spacing: 1px;">PRESTIGE CINEMATOGRAPHY & VISUAL ARTS</p>
  </div>

  <h2 style="color: #E8C49A; font-size: 18px; margin-bottom: 12px;">Hello ${clientName},</h2>
  <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
    We are thrilled to confirm your production slot reservation with <strong>VYRO STUDIO</strong>. Our creative director and camera crew are dedicated to bringing your vision to life.
  </p>

  <div style="background-color: #171717; border-left: 4px solid #E8C49A; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
    <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Package:</strong> <span style="color: #ffffff;">${serviceName}</span></p>
    <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Session Date:</strong> <span style="color: #ffffff;">${date}</span></p>
    <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Location:</strong> <span style="color: #ffffff;">Studio / Client Designated Venue</span></p>
    <p style="margin: 4px 0; font-size: 13px; color: #a1a1aa;"><strong>Equipment:</strong> <span style="color: #ffffff;">4K Cinema Cameras, Prime Glass, Pro Lighting & Audio</span></p>
  </div>

  <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6;">
    If you have any moodboards, reference reels, or special timeline requests, please reply directly to this email or reach our production desk on WhatsApp at <strong>+91 ${studioPhone}</strong>.
  </p>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 11px;">
    <p style="margin: 0;">VYRO STUDIO • Hyderabad & Pan-India</p>
    <p style="margin: 4px 0 0 0;">Capture Moments. Create Stories.</p>
  </div>
</div>`
  },
  {
    id: 'DELIVERY_ASSETS',
    name: 'Production Delivery & Gallery',
    subject: 'Your 4K Master Video & Retouched Photos Are Ready — VYRO STUDIO',
    generateBody: ({ clientName, serviceName = 'Master Production', studioPhone = '8639063089' }) => `
<div style="background-color: #000000; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
  <div style="border-bottom: 2px solid #E8C49A; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 22px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">VYRO <span style="color: #E8C49A;">STUDIO</span></h1>
    <p style="color: #a1a1aa; font-size: 11px; margin-top: 4px; letter-spacing: 1px;">POST-PRODUCTION & COLOR GRADING LAB</p>
  </div>

  <h2 style="color: #E8C49A; font-size: 18px; margin-bottom: 12px;">Dear ${clientName},</h2>
  <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
    Post-production on your <strong>${serviceName}</strong> has completed. All clips have been color-graded, sound-designed, and exported in full 4K UHD.
  </p>

  <div style="background-color: #171717; border: 1px solid #E8C49A; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
    <p style="color: #ffffff; font-size: 14px; margin-bottom: 12px; font-weight: bold;">Your Private High-Resolution Cloud Gallery</p>
    <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 16px;">Access all RAW exports, 4K reel cuts, and retouched portraits.</p>
    <a href="https://drive.google.com" style="display: inline-block; background-color: #E8C49A; color: #000000; padding: 12px 28px; font-size: 12px; font-weight: bold; text-decoration: none; border-radius: 8px; letter-spacing: 1px; text-transform: uppercase;">Open Cloud Gallery</a>
  </div>

  <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5;">
    Please download and archive your files within 30 days. Don't forget to tag <strong>@vyro_studo</strong> when sharing on Instagram!
  </p>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 11px;">
    <p style="margin: 0;">VYRO STUDIO • Contact: +91 ${studioPhone}</p>
  </div>
</div>`
  },
  {
    id: 'CUSTOM_INVOICE',
    name: 'Shoot Quotation & Payment Receipt',
    subject: 'Production Invoice & Advance Receipt — VYRO STUDIO',
    generateBody: ({ clientName, serviceName = 'Cinematography Package', amount = '5000', studioPhone = '8639063089' }) => `
<div style="background-color: #000000; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
  <div style="border-bottom: 2px solid #E8C49A; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 22px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">VYRO <span style="color: #E8C49A;">STUDIO</span></h1>
    <p style="color: #a1a1aa; font-size: 11px; margin-top: 4px;">OFFICIAL STUDIO INVOICE</p>
  </div>

  <h2 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">Billed To: <span style="color: #E8C49A;">${clientName}</span></h2>
  <p style="color: #a1a1aa; font-size: 13px; margin-bottom: 20px;">Thank you for partnering with VYRO STUDIO. Here is your official billing statement.</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
    <thead>
      <tr style="border-bottom: 1px solid #27272a; text-align: left; color: #a1a1aa;">
        <th style="padding: 8px 0;">Item Description</th>
        <th style="padding: 8px 0; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #171717;">
        <td style="padding: 12px 0; color: #ffffff;">${serviceName} (Full Coverage & Color Grade)</td>
        <td style="padding: 12px 0; text-align: right; color: #E8C49A; font-weight: bold;">₹${amount}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; color: #ffffff; font-weight: bold;">Total Amount</td>
        <td style="padding: 12px 0; text-align: right; color: #E8C49A; font-weight: bold; font-size: 16px;">₹${amount}</td>
      </tr>
    </tbody>
  </table>

  <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5;">
    Payment processed securely via UPI / Razorpay / NetBanking. Questions? Reach support at +91 ${studioPhone}.
  </p>
</div>`
  }
];
