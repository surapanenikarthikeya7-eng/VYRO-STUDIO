/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { buildRfc2822Email } from './gmail';
import { BookingRecord } from '../context/StudioContext';

export type EmailEventType = 'BOOKED' | 'CANCELLED' | 'COMPLETED' | 'MANUAL';
export type EmailDeliveryStatus = 'SENT' | 'FAILED' | 'PENDING';

export interface EmailNotificationRecord {
  id: string;
  bookingId?: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  htmlBody: string;
  eventType: EmailEventType;
  status: EmailDeliveryStatus;
  sentAt: string;
  idempotencyKey: string;
  senderEmail: string;
  channel: 'GMAIL_API' | 'SERVER_SMTP' | 'QUEUE';
  errorMessage?: string;
}

export interface EmailNotificationSettings {
  autoEmailsEnabled: boolean;
  autoBookingEnabled: boolean;
  autoCancellationEnabled: boolean;
  autoCompletionEnabled: boolean;
  senderDisplayName: string;
  senderEmail: string;
  updatedAt?: string;
}

export const DEFAULT_EMAIL_SETTINGS: EmailNotificationSettings = {
  autoEmailsEnabled: true,
  autoBookingEnabled: true,
  autoCancellationEnabled: true,
  autoCompletionEnabled: true,
  senderDisplayName: 'VYRO STUDIO',
  senderEmail: 'vyrostudo@gmail.com'
};

// In-memory cache of processed idempotency keys to guarantee zero duplicates in session
const processedIdempotencyKeys = new Set<string>();

/**
 * Generate formatted HTML & plain text for booking events
 */
export function buildNotificationEmailContent(
  booking: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    service: string;
    date: string;
    time: string;
    status?: string;
  },
  eventType: EmailEventType,
  brandName: string = 'VYRO STUDIO'
): { subject: string; message: string; htmlBody: string } {
  const bookingId = booking.id || 'VS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const customerName = booking.name || 'Valued Client';
  const bookingDate = booking.date || 'TBD';
  const bookingTime = booking.time || '10:00 AM';
  const serviceName = booking.service || 'Photography & Cinematography';

  if (eventType === 'BOOKED') {
    const subject = `${brandName} – Slot Booking Confirmed`;
    const message = `Hello ${customerName},

Your slot has been successfully booked!

Booking ID: ${bookingId}
Date: ${bookingDate}
Time: ${bookingTime}
Service: ${serviceName}

Thank you for choosing ${brandName}!`;

    const htmlBody = `
<div style="background-color: #000000; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
  <div style="border-bottom: 2px solid #E8C49A; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 22px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">${brandName}</h1>
    <p style="color: #E8C49A; font-size: 11px; margin-top: 4px; letter-spacing: 2px;">SLOT BOOKING CONFIRMED</p>
  </div>

  <h2 style="color: #E8C49A; font-size: 18px; margin-bottom: 12px;">Hello ${customerName},</h2>
  <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
    Your slot has been successfully booked! Our team is preparing for your production session.
  </p>

  <div style="background-color: #171717; border-left: 4px solid #E8C49A; padding: 18px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #E8C49A;">Booking ID:</strong> <span style="color: #ffffff; font-family: monospace;">${bookingId}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #E8C49A;">Date:</strong> <span style="color: #ffffff;">${bookingDate}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #E8C49A;">Time:</strong> <span style="color: #ffffff;">${bookingTime}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #E8C49A;">Service:</strong> <span style="color: #ffffff;">${serviceName}</span></p>
  </div>

  <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
    Thank you for choosing <strong>${brandName}</strong>!
  </p>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 11px;">
    <p style="margin: 0;">${brandName} • High-Fidelity Cinematography & Photography</p>
  </div>
</div>`;

    return { subject, message, htmlBody };
  }

  if (eventType === 'CANCELLED') {
    const subject = `${brandName} – Booking Cancelled`;
    const message = `Hello ${customerName},

Your booking has been cancelled.

Booking ID: ${bookingId}
Cancelled Date: ${bookingDate}
Time: ${bookingTime}
Service: ${serviceName}
Cancellation Status: CANCELLED

If you have questions or want to reschedule, please contact ${brandName}.`;

    const htmlBody = `
<div style="background-color: #000000; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
  <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 22px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">${brandName}</h1>
    <p style="color: #ef4444; font-size: 11px; margin-top: 4px; letter-spacing: 2px;">BOOKING CANCELLED</p>
  </div>

  <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 12px;">Hello ${customerName},</h2>
  <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
    Your booking has been cancelled as requested or rescheduled.
  </p>

  <div style="background-color: #171717; border-left: 4px solid #ef4444; padding: 18px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ef4444;">Booking ID:</strong> <span style="color: #ffffff; font-family: monospace;">${bookingId}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ef4444;">Cancelled Date:</strong> <span style="color: #ffffff;">${bookingDate}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ef4444;">Time:</strong> <span style="color: #ffffff;">${bookingTime}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ef4444;">Cancellation Status:</strong> <span style="color: #ef4444; font-weight: bold;">CANCELLED</span></p>
  </div>

  <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
    If you did not request this cancellation or would like to book a different slot, please reply to this email.
  </p>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 11px;">
    <p style="margin: 0;">${brandName} • Support Desk</p>
  </div>
</div>`;

    return { subject, message, htmlBody };
  }

  // COMPLETED
  const subject = `${brandName} – Booking Completed`;
  const message = `Hello ${customerName},

Your production session has been completed!

Booking ID: ${bookingId}
Service: ${serviceName}
Booking Date: ${bookingDate}
Completion Status: COMPLETED

Thank you for choosing ${brandName}!`;

  const htmlBody = `
<div style="background-color: #000000; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
  <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 22px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">${brandName}</h1>
    <p style="color: #10b981; font-size: 11px; margin-top: 4px; letter-spacing: 2px;">PRODUCTION COMPLETED</p>
  </div>

  <h2 style="color: #E8C49A; font-size: 18px; margin-bottom: 12px;">Hello ${customerName},</h2>
  <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
    Your production session has been successfully completed! Post-processing and color grading have commenced.
  </p>

  <div style="background-color: #171717; border-left: 4px solid #10b981; padding: 18px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #10b981;">Booking ID:</strong> <span style="color: #ffffff; font-family: monospace;">${bookingId}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #10b981;">Service:</strong> <span style="color: #ffffff;">${serviceName}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #10b981;">Booking Date:</strong> <span style="color: #ffffff;">${bookingDate}</span></p>
    <p style="margin: 6px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #10b981;">Completion Status:</strong> <span style="color: #10b981; font-weight: bold;">COMPLETED</span></p>
  </div>

  <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
    Thank you for choosing <strong>${brandName}</strong>! Our master gallery link will be delivered once final renders are ready.
  </p>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 11px;">
    <p style="margin: 0;">${brandName} • Post-Production Lab</p>
  </div>
</div>`;

  return { subject, message, htmlBody };
}

/**
 * Dispatch an email notification and log to Firestore
 * Uses the admin's Gmail OAuth access token if available, or backend server
 */
export async function dispatchEmailNotification(payload: {
  bookingId?: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  htmlBody: string;
  eventType: EmailEventType;
  idempotencyKey?: string;
  senderEmail?: string;
  gmailToken?: string | null;
}): Promise<EmailNotificationRecord> {
  const cleanEmail = payload.recipientEmail.trim().toLowerCase();
  const idempotencyKey = payload.idempotencyKey || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const recordId = idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Guard against duplicate execution for the same booking event
  if (processedIdempotencyKeys.has(idempotencyKey)) {
    console.warn(`Idempotency guard: ${idempotencyKey} already dispatched in current session.`);
    const existingDoc = await getDoc(doc(db, 'email_notifications', recordId)).catch(() => null);
    if (existingDoc && existingDoc.exists()) {
      return existingDoc.data() as EmailNotificationRecord;
    }
  }

  let deliveryStatus: EmailDeliveryStatus = 'PENDING';
  let deliveryChannel: 'GMAIL_API' | 'SERVER_SMTP' | 'QUEUE' = 'GMAIL_API';
  let errorMsg: string | undefined = undefined;

  // 2. Attempt Google Gmail API send if access token is available
  if (payload.gmailToken) {
    try {
      const raw = buildRfc2822Email(cleanEmail, payload.subject, payload.htmlBody, 'VYRO STUDIO');
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${payload.gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });

      if (res.ok) {
        deliveryStatus = 'SENT';
        deliveryChannel = 'GMAIL_API';
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Gmail API responded with status ${res.status}`);
      }
    } catch (apiErr: any) {
      console.warn('Direct Gmail API send attempt issue, trying server proxy route:', apiErr?.message);
      errorMsg = apiErr?.message || 'Direct Gmail API send failed';
    }
  }

  // 3. If direct send didn't succeed, trigger backend server /api/notifications/send
  if (deliveryStatus !== 'SENT') {
    try {
      const serverRes = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(payload.gmailToken ? { Authorization: `Bearer ${payload.gmailToken}` } : {})
        },
        body: JSON.stringify({
          recipientEmail: cleanEmail,
          recipientName: payload.recipientName,
          subject: payload.subject,
          message: payload.message,
          htmlBody: payload.htmlBody,
          eventType: payload.eventType,
          bookingId: payload.bookingId,
          idempotencyKey: idempotencyKey,
          accessToken: payload.gmailToken
        })
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.status === 'SENT') {
          deliveryStatus = 'SENT';
          deliveryChannel = data.channel || 'SERVER_SMTP';
          errorMsg = undefined;
        } else {
          deliveryStatus = 'FAILED';
          errorMsg = data.error || 'Backend dispatch failed';
        }
      } else {
        deliveryStatus = 'FAILED';
        errorMsg = errorMsg || `Server responded with status ${serverRes.status}`;
      }
    } catch (serverErr: any) {
      console.warn('Backend server dispatch unreachable:', serverErr);
      if (!errorMsg) errorMsg = serverErr?.message || 'Server connection error';
      deliveryStatus = 'FAILED';
    }
  }

  // If token is missing and server was not configured with SMTP, mark as failed with helpful note
  if (deliveryStatus !== 'SENT' && !payload.gmailToken) {
    deliveryStatus = 'FAILED';
    errorMsg = 'Admin Gmail not connected. Tap "Authorize Gmail" in Admin Dashboard to dispatch.';
  }

  const record: EmailNotificationRecord = {
    id: recordId,
    bookingId: payload.bookingId,
    recipientName: payload.recipientName,
    recipientEmail: cleanEmail,
    subject: payload.subject,
    message: payload.message,
    htmlBody: payload.htmlBody,
    eventType: payload.eventType,
    status: deliveryStatus,
    sentAt: new Date().toISOString(),
    idempotencyKey: idempotencyKey,
    senderEmail: payload.senderEmail || 'vyrostudo@gmail.com',
    channel: deliveryChannel,
    errorMessage: errorMsg
  };

  // 4. Save audit log to Firestore collection
  try {
    await setDoc(doc(db, 'email_notifications', recordId), {
      ...record,
      serverTimestamp: serverTimestamp()
    }, { merge: true });
    processedIdempotencyKeys.add(idempotencyKey);
  } catch (firestoreErr) {
    console.warn('Could not record email to Firestore:', firestoreErr);
  }

  return record;
}

/**
 * Fetch notification settings from Firestore
 */
export async function getNotificationSettings(): Promise<EmailNotificationSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'notifications'));
    if (snap.exists()) {
      return { ...DEFAULT_EMAIL_SETTINGS, ...snap.data() } as EmailNotificationSettings;
    }
  } catch (e) {
    console.warn('Could not fetch notification settings:', e);
  }
  return DEFAULT_EMAIL_SETTINGS;
}

/**
 * Save notification settings to Firestore
 */
export async function saveNotificationSettings(settings: Partial<EmailNotificationSettings>): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'notifications'), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/notifications');
  }
}
