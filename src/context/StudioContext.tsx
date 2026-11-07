import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { portfolioData as initialPortfolioData, servicesData as initialServicesData } from '../data';
import { PortfolioItem, StudioService } from '../types';

export interface SiteSettings {
  logoUrl: string;
  brandName: string;
  tagline: string;
  heroTitleLine1: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  backgroundVideoUrl: string;
}

export interface BookingRecord {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt?: any;
}

interface StudioContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  portfolio: PortfolioItem[];
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  services: StudioService[];
  addService: (service: StudioService) => Promise<void>;
  updateService: (id: string, updates: Partial<StudioService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  bookings: BookingRecord[];
  createBooking: (booking: Omit<BookingRecord, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  updateBookingStatus: (id: string, status: BookingRecord['status']) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  deleteMultipleBookings: (ids: string[]) => Promise<void>;
  deleteLogo: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  logoUrl: '/assets/aistudio/image_35d6318c.png',
  brandName: 'VYRO STUDIO',
  tagline: 'PRESTIGE KINETICS & LUXURY VISUAL ARTS',
  heroTitleLine1: 'Capture Moments.',
  heroTitleHighlight: 'Create Stories.',
  heroSubtitle: 'Professional Photography & Cinematic Videography Services',
  phone: '8639063089',
  email: 'info@vyrostudio.com',
  whatsapp: '+91 8639063089',
  instagram: 'https://instagram.com',
  backgroundVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cinematographer-shooting-at-a-studio-setting-42353-large.mp4'
};

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialPortfolioData);
  const [services, setServices] = useState<StudioService[]>(initialServicesData);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Sync Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...(docSnap.data() as Partial<SiteSettings>) });
      } else {
        // Initialize if not present
        setDoc(doc(db, 'settings', 'global'), DEFAULT_SETTINGS).catch(() => {});
      }
    }, (error) => {
      console.warn('Settings snapshot fallback:', error);
    });

    return () => unsub();
  }, []);

  // 2. Sync Portfolio
  useEffect(() => {
    const q = collection(db, 'portfolio');
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem));
        setPortfolio(items);
      } else {
        setPortfolio(initialPortfolioData);
      }
    }, (error) => {
      console.warn('Portfolio snapshot fallback:', error);
      setPortfolio(initialPortfolioData);
    });

    return () => unsub();
  }, []);

  // 3. Sync Services
  useEffect(() => {
    const q = collection(db, 'services');
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudioService));
        setServices(items);
      } else {
        setServices(initialServicesData);
      }
    }, (error) => {
      console.warn('Services snapshot fallback:', error);
      setServices(initialServicesData);
    });

    return () => unsub();
  }, []);

  // 4. Sync Bookings
  useEffect(() => {
    const q = collection(db, 'bookings');
    const unsub = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BookingRecord));
      // Sort newest first
      records.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setBookings(records);
      setLoading(false);
    }, (error) => {
      console.warn('Bookings snapshot fallback:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Settings Actions
  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      await setDoc(doc(db, 'settings', 'global'), merged, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      await setDoc(doc(db, 'settings', 'global'), DEFAULT_SETTINGS);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  // Portfolio Actions
  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'portfolio'), {
        ...item,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      });
      setPortfolio(prev => [{ id: docRef.id, ...item }, ...prev]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'portfolio');
    }
  };

  const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      await updateDoc(doc(db, 'portfolio', id), updates);
      setPortfolio(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portfolio/${id}`);
    }
  };

  const deletePortfolioItem = async (id: string) => {
    setPortfolio(prev => prev.filter(p => p.id !== id));
    try {
      await deleteDoc(doc(db, 'portfolio', id));
    } catch (err) {
      console.warn(`Portfolio item ${id} delete Firestore warning:`, err);
      handleFirestoreError(err, OperationType.DELETE, `portfolio/${id}`);
    }
  };

  // Services Actions
  const addService = async (service: StudioService) => {
    try {
      await setDoc(doc(db, 'services', service.id), service);
      setServices(prev => [...prev, service]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `services/${service.id}`);
    }
  };

  const updateService = async (id: string, updates: Partial<StudioService>) => {
    try {
      await updateDoc(doc(db, 'services', id), updates);
      setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `services/${id}`);
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      console.warn(`Service ${id} delete Firestore warning:`, err);
      handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
    }
  };

  // Bookings Actions
  const createBooking = async (booking: Omit<BookingRecord, 'id' | 'status' | 'createdAt'>) => {
    const payload: BookingRecord = {
      ...booking,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...payload,
        serverTimestamp: serverTimestamp()
      });
      setBookings(prev => [{ id: docRef.id, ...payload }, ...prev]);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
      return '';
    }
  };

  const updateBookingStatus = async (id: string, status: BookingRecord['status']) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const deleteBooking = async (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (err) {
      console.warn(`Booking ${id} delete Firestore warning:`, err);
      handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
    }
  };

  const deleteMultipleBookings = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setBookings(prev => prev.filter(b => !ids.includes(b.id || '')));
    for (const id of ids) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
      } catch (err) {
        console.warn(`Booking ${id} bulk delete Firestore warning:`, err);
      }
    }
  };

  const deleteLogo = async () => {
    const updated = { ...settings, logoUrl: '' };
    setSettings(updated);
    try {
      await setDoc(doc(db, 'settings', 'global'), updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  return (
    <StudioContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      portfolio,
      addPortfolioItem,
      updatePortfolioItem,
      deletePortfolioItem,
      services,
      addService,
      updateService,
      deleteService,
      bookings,
      createBooking,
      updateBookingStatus,
      deleteBooking,
      deleteMultipleBookings,
      deleteLogo,
      loading
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
