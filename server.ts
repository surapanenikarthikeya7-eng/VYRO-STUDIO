import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
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
