import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { DbService } from './src/server/dbService.js'; // tsx/esbuild resolves compilation path
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser and CORS
app.use(express.json());
app.use(cors());

// Load auth configuration from environment (with professional fallbacks)
const JWT_SECRET = process.env.JWT_SECRET || 'pixel_studio_secret_key_123!';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'pixelstudio2026';

// Initialize Database connection without crashing the app on startup
DbService.connectDatabase();

// 🔒 JWT Authentication Middleware to protect Admin endpoints
function authenticateJWT(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Malformed authentication header' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token' });
    }
    req.admin = decoded;
    next();
  });
}

// ------------------- REST APIs -------------------

// 1. PUBLIC ADMIN LOGIN
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({
      success: true,
      token,
      message: 'Admin authentication successful'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid credentials. Please verify username and password.'
  });
});

// 2. BOOKINGS ENDPOINTS
// Public POST /api/bookings - Creation
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, phone, email, service, budget, eventDate, message } = req.body;
    
    if (!name || !phone || !email || !service || !budget || !eventDate) {
      return res.status(400).json({ error: 'Required fields: Name, Phone, Email, Service, Budget, Event Date.' });
    }

    const booking = await DbService.createBooking({
      name,
      phone,
      email,
      service,
      budget,
      eventDate,
      message: message || ''
    });

    res.status(201).json({ success: true, booking, message: 'Booking request registered successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error registering booking request.' });
  }
});

// Protected GET /api/bookings
app.get('/api/bookings', authenticateJWT, async (req, res) => {
  try {
    const bookings = await DbService.getBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving bookings list.' });
  }
});

// Protected DELETE /api/bookings/:id
app.delete('/api/bookings/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await DbService.deleteBooking(id);
    if (success) {
      return res.json({ success: true, message: 'Booking entry successfully deleted.' });
    }
    return res.status(404).json({ error: 'Booking not found.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting booking entry.' });
  }
});

// 3. CONTACT ENDPOINTS
// Public POST /api/contact - Submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'Name, email, phone number, and message are required fields.' });
    }

    const contact = await DbService.createContact({ name, email, phone, message });
    res.status(201).json({ success: true, contact, message: 'Thank you! Message submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error registering contact message.' });
  }
});

// Protected GET /api/contact
app.get('/api/contact', authenticateJWT, async (req, res) => {
  try {
    const contacts = await DbService.getContacts();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving contact logs.' });
  }
});

// 4. PAYMENT ENDPOINTS
// Public POST /api/payment - Creation
app.post('/api/payment', async (req, res) => {
  try {
    const { user, amount, status, transactionId } = req.body;

    if (!user || !amount || !transactionId) {
      return res.status(400).json({ error: 'User name, payment amount, and transaction ID are required.' });
    }

    const payment = await DbService.createPayment({
      user,
      amount: Number(amount),
      status: status || 'SUCCESS',
      transactionId
    });

    res.status(201).json({ success: true, payment, message: 'Payment registered successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error registering payment entry.' });
  }
});

// Protected GET /api/payment
app.get('/api/payment', authenticateJWT, async (req, res) => {
  try {
    const payments = await DbService.getPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving payment transactions.' });
  }
});

// ------------------- GMAIL NOTIFICATIONS ENDPOINTS -------------------

interface NotificationItem {
  id: string;
  bookingId?: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  htmlBody: string;
  eventType: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sentAt: string;
  idempotencyKey: string;
  senderEmail: string;
  channel: string;
  errorMessage?: string;
}

const serverNotifications: NotificationItem[] = [];

function buildRawEmail(to: string, subject: string, html: string, senderName: string = 'VYRO STUDIO'): string {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const lines = [
    `From: "${senderName}" <me>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html
  ];
  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// POST /api/notifications/send
app.post('/api/notifications/send', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      message,
      htmlBody,
      eventType = 'BOOKED',
      bookingId,
      idempotencyKey,
      accessToken
    } = req.body;

    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({ error: 'recipientEmail, subject, and message are required.' });
    }

    const cleanEmail = recipientEmail.trim().toLowerCase();
    const token = accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    // 1. Idempotency Check to guarantee emails are sent only once per event
    if (idempotencyKey) {
      const existing = serverNotifications.find(n => n.idempotencyKey === idempotencyKey && n.status === 'SENT');
      if (existing) {
        return res.json({
          success: true,
          status: 'SENT',
          channel: existing.channel,
          notification: existing,
          message: 'Notification already sent for this event.'
        });
      }
    }

    let status: 'SENT' | 'FAILED' = 'FAILED';
    let channel = 'NONE';
    let errorDetail = '';

    // 2. Google Workspace Gmail REST API dispatch if OAuth access token provided
    if (token) {
      try {
        const raw = buildRawEmail(cleanEmail, subject, htmlBody || message);
        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw })
        });

        if (gmailRes.ok) {
          status = 'SENT';
          channel = 'GMAIL_API';
        } else {
          const errData = await gmailRes.json().catch(() => ({}));
          errorDetail = errData.error?.message || `Gmail API HTTP status ${gmailRes.status}`;
        }
      } catch (err: any) {
        errorDetail = err.message || 'Gmail API request error';
      }
    }

    // 3. Fallback to Gmail SMTP if configured in environment
    const GMAIL_USER = process.env.GMAIL_USER || 'vyrostudo@gmail.com';
    const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

    if (status !== 'SENT' && GMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: GMAIL_USER,
            pass: GMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: `"VYRO STUDIO" <${GMAIL_USER}>`,
          to: cleanEmail,
          subject,
          text: message,
          html: htmlBody || message
        });

        status = 'SENT';
        channel = 'SERVER_SMTP';
        errorDetail = '';
      } catch (smtpErr: any) {
        errorDetail = smtpErr.message || 'SMTP delivery error';
      }
    }

    if (status !== 'SENT' && !token && !GMAIL_PASS) {
      errorDetail = 'Admin Gmail not connected. Please tap "Authorize Gmail" in Admin Dashboard to send.';
    }

    const item: NotificationItem = {
      id: idempotencyKey || 'notif_' + Date.now(),
      bookingId,
      recipientName: recipientName || cleanEmail.split('@')[0],
      recipientEmail: cleanEmail,
      subject,
      message,
      htmlBody: htmlBody || message,
      eventType,
      status,
      sentAt: new Date().toISOString(),
      idempotencyKey: idempotencyKey || 'manual_' + Date.now(),
      senderEmail: GMAIL_USER,
      channel,
      errorMessage: errorDetail || undefined
    };

    serverNotifications.unshift(item);
    if (serverNotifications.length > 500) serverNotifications.pop();

    if (status === 'SENT') {
      return res.json({ success: true, status: 'SENT', channel, notification: item });
    } else {
      return res.status(200).json({ success: false, status: 'FAILED', channel, error: errorDetail, notification: item });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error processing notification.' });
  }
});

// GET /api/notifications/history
app.get('/api/notifications/history', (req, res) => {
  res.json({
    total: serverNotifications.length,
    notifications: serverNotifications
  });
});

// POST /api/notifications/retry/:id
app.post('/api/notifications/retry/:id', async (req, res) => {
  const { id } = req.params;
  const target = serverNotifications.find(n => n.id === id || n.idempotencyKey === id);
  if (!target) {
    return res.status(404).json({ error: 'Notification record not found' });
  }

  // Attempt re-dispatch
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : req.body.accessToken;
  const GMAIL_USER = process.env.GMAIL_USER || 'vyrostudo@gmail.com';
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

  let status: 'SENT' | 'FAILED' = 'FAILED';
  let channel = 'NONE';
  let errorDetail = '';

  if (token) {
    try {
      const raw = buildRawEmail(target.recipientEmail, target.subject, target.htmlBody || target.message);
      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      if (gmailRes.ok) {
        status = 'SENT';
        channel = 'GMAIL_API';
      } else {
        const errJson = await gmailRes.json().catch(() => ({}));
        errorDetail = errJson.error?.message || `Gmail API HTTP ${gmailRes.status}`;
      }
    } catch (e: any) {
      errorDetail = e.message || 'Gmail API retry error';
    }
  }

  if (status !== 'SENT' && GMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_PASS }
      });
      await transporter.sendMail({
        from: `"VYRO STUDIO" <${GMAIL_USER}>`,
        to: target.recipientEmail,
        subject: target.subject,
        text: target.message,
        html: target.htmlBody || target.message
      });
      status = 'SENT';
      channel = 'SERVER_SMTP';
      errorDetail = '';
    } catch (e: any) {
      errorDetail = e.message || 'SMTP retry error';
    }
  }

  target.status = status;
  target.channel = channel;
  target.sentAt = new Date().toISOString();
  target.errorMessage = errorDetail || undefined;

  res.json({ success: status === 'SENT', status, notification: target, error: errorDetail });
});

// ------------------- Vite Server Integration -------------------

async function configureServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pixel Studio Full Stack Server active at http://localhost:${PORT}`);
  });
}

configureServer();
