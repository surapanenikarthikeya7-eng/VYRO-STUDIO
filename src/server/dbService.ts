import mongoose, { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';

// Interfaces
export interface Booking {
  _id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  budget: string;
  eventDate: string;
  message: string;
  createdAt: Date;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: Date;
}

export interface Payment {
  _id: string;
  user: string; // customer name or booking ref
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionId: string;
  createdAt: Date;
}

// 1. Mongoose Schemas (Used when MONGODB_URI is provided)
const BookingSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  service: { type: String, required: true },
  budget: { type: String, required: true },
  eventDate: { type: String, required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ContactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new Schema({
  user: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
  transactionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Avoid re-compilation of mongoose models during HMR or dev restarts
let MongooseBooking: any;
let MongooseContact: any;
let MongoosePayment: any;

try {
  MongooseBooking = mongoose.model('Booking');
} catch {
  MongooseBooking = mongoose.model('Booking', BookingSchema);
}

try {
  MongooseContact = mongoose.model('Contact');
} catch {
  MongooseContact = mongoose.model('Contact', ContactSchema);
}

try {
  MongoosePayment = mongoose.model('Payment');
} catch {
  MongoosePayment = mongoose.model('Payment', PaymentSchema);
}

// 2. Local Fallback Database (Single File JSON storage)
const DB_FILE_PATH = path.resolve(process.cwd(), 'pixel-studio-db.json');

// Interface for local JSON database structure
interface DirectDB {
  bookings: Booking[];
  contacts: Contact[];
  payments: Payment[];
}

function loadLocalDB(): DirectDB {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      };
    }
  } catch (error) {
    console.error('Error loading fallback JSON database, resetting files:', error);
  }
  
  // Seed initial dummy data if file does not exist
  const initialData: DirectDB = {
    bookings: [
      {
        _id: 'bk_1',
        name: 'Siddharth Roy',
        phone: '9845012345',
        email: 'siddharth@example.com',
        service: 'VIDEOGRAPHY',
        budget: '₹6,000',
        eventDate: '2026-07-15',
        message: 'Pre-wedding shoot at outdoor lakeside resort.',
        createdAt: new Date('2026-06-18T10:00:00Z'),
      },
      {
        _id: 'bk_2',
        name: 'Aishwarya Sen',
        phone: '8223012345',
        email: 'aishwarya@example.com',
        service: 'PHOTOGRAPHY',
        budget: '₹5,000',
        eventDate: '2026-08-20',
        message: 'Studio fashion portrait series.',
        createdAt: new Date('2026-06-19T09:30:00Z'),
      }
    ],
    contacts: [
      {
        _id: 'ct_1',
        name: 'Rahul Nair',
        email: 'rahul.n@gmail.com',
        phone: '7778889990',
        message: 'Looking for a regular reels editor for our boutique clothing page.',
        createdAt: new Date('2026-06-18T11:00:00Z'),
      }
    ],
    payments: [
      {
        _id: 'pm_1',
        user: 'Siddharth Roy',
        amount: 6000,
        status: 'SUCCESS',
        transactionId: 'TXN-863906-8921-9872',
        createdAt: new Date('2026-06-18T10:15:00Z'),
      }
    ]
  };
  saveLocalDB(initialData);
  return initialData;
}

function saveLocalDB(data: DirectDB) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error persisting content to fallback JSON database:', error);
  }
}

// 3. Main Data Access Methods (Adapts between MongoDB Atlas & Local JSON Fallback)
export class DbService {
  private static isConnected: boolean = false;
  private static useLocalFallback: boolean = false;

  public static async connectDatabase(): Promise<boolean> {
    const uri = process.env.MONGODB_URI;
    
    if (!uri || uri === 'mongodb+srv://...' || uri.trim() === '') {
      console.log('⚠️  MONGODB_URI environment variable is missing or placeholder.');
      console.log('🔑  Pixel Studio is falling back to a self-contained persistent JSON file database for zero-config demonstration.');
      this.useLocalFallback = true;
      return false;
    }

    try {
      // Connect to MongoDB Atlas
      console.log('🔗 Connecting to MongoDB Atlas...');
      await mongoose.connect(uri);
      this.isConnected = true;
      this.useLocalFallback = false;
      console.log('✅ Connected to MongoDB Atlas successfully.');
      return true;
    } catch (err) {
      console.error('❌ Failed to connect to MongoDB Atlas:', err);
      console.log('🔌 Switching to Local persistent JSON file database fallback to guarantee app preview continuity.');
      this.useLocalFallback = true;
      return false;
    }
  }

  // BOOKINGS
  public static async createBooking(data: Omit<Booking, '_id' | 'createdAt'>): Promise<Booking> {
    if (!this.useLocalFallback && this.isConnected) {
      try {
        const item = new MongooseBooking(data);
        const saved = await item.save();
        return saved.toObject();
      } catch (err) {
        console.error('MongoDB write error, failing over to local DB for memory fallback:', err);
      }
    }

    // Local JSON
    const db = loadLocalDB();
    const newBooking: Booking = {
      _id: 'bk_' + Date.now().toString(36),
      ...data,
      createdAt: new Date()
    };
    db.bookings.unshift(newBooking);
    saveLocalDB(db);
    return newBooking;
  }

  public static async getBookings(): Promise<Booking[]> {
    if (!this.useLocalFallback && this.isConnected) {
      try {
        return await MongooseBooking.find().sort({ createdAt: -1 });
      } catch (err) {
        console.error('MongoDB read error, failing over to local DB:', err);
      }
    }

    const db = loadLocalDB();
    return db.bookings;
  }

  public static async deleteBooking(id: string): Promise<boolean> {
    if (!this.useLocalFallback && this.isConnected) {
      try {
        const result = await MongooseBooking.findByIdAndDelete(id);
        if (result) return true;
        // Sometimes string IDs or standard IDs are used
        const result2 = await MongooseBooking.deleteOne({ _id: id });
        return (result2.deletedCount && result2.deletedCount > 0) || false;
      } catch (err) {
        console.error('MongoDB delete error, failing over to local DB:', err);
      }
    }

    const db = loadLocalDB();
    const index = db.bookings.findIndex(b => b._id === id);
    if (index !== -1) {
      db.bookings.splice(index, 1);
      saveLocalDB(db);
      return true;
    }
    return false;
  }

  // CONTACTS
  public static async createContact(data: Omit<Contact, '_id' | 'createdAt'>): Promise<Contact> {
    if (!this.useLocalFallback && this.isConnected) {
      try {
        const item = new MongooseContact(data);
        const saved = await item.save();
        return saved.toObject();
      } catch (err) {
        console.error('MongoDB contact write error, failing over to local DB:', err);
      }
    }

    const db = loadLocalDB();
    const newContact: Contact = {
      _id: 'ct_' + Date.now().toString(36),
      ...data,
      createdAt: new Date()
    };
    db.contacts.unshift(newContact);
    saveLocalDB(db);
    return newContact;
  }

  public static async getContacts(): Promise<Contact[]> {
    if (!this.useLocalFallback && this.isConnected) {
      try {
        return await MongooseContact.find().sort({ createdAt: -1 });
      } catch (err) {
        console.error('MongoDB contact read error, failing over to local DB:', err);
      }
    }

    const db = loadLocalDB();
    return db.contacts;
  }

  // PAYMENTS
  public static async createPayment(data: Omit<Payment, '_id' | 'createdAt'>): Promise<Payment> {
    if (!this.useLocalFallback && this.isConnected) {
      try {
        const item = new MongoosePayment(data);
        const saved = await item.save();
        return saved.toObject();
      } catch (err) {
        console.error('MongoDB payment write error, failing over to local DB:', err);
      }
    }

    const db = loadLocalDB();
    const newPayment: Payment = {
      _id: 'pm_' + Date.now().toString(16),
      ...data,
      createdAt: new Date()
    };
    db.payments.unshift(newPayment);
    saveLocalDB(db);
    return newPayment;
  }

  public static async getPayments(): Promise<Payment[]> {
    if (!this.useLocalFallback && this.isConnected) {
      try {
        return await MongoosePayment.find().sort({ createdAt: -1 });
      } catch (err) {
        console.error('MongoDB payment read error, failing over to local DB:', err);
      }
    }

    const db = loadLocalDB();
    return db.payments;
  }
}
