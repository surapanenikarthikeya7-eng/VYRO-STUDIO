import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, ArrowUp, CalendarDays } from 'lucide-react';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudioProvider, useStudio } from './context/StudioContext';
import { testConnection } from './lib/firebase';

// Components
import Loader from './components/Loader';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import PortfolioPage from './components/PortfolioPage';
import BookingModal from './components/BookingModal';
import PaymentModal from './components/PaymentModal';
import ContactPage from './components/ContactPage';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';

function HomeLanding({
  onOpenBooking: handleOpenBooking,
}: {
  onOpenBooking: (service?: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-black text-white relative">
      {/* Hero Section */}
      <Hero
        onOpenBooking={() => handleOpenBooking()}
        onScrollView={(id) => {
          if (id === 'portfolio') {
            navigate('/portfolio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Services and Pricing section */}
      <Services onOpenBookingWithService={handleOpenBooking} />
    </div>
  );
}

function MainAppContent() {
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: studioLoading } = useStudio();

  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [initialLoading, setInitialLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('VIDEOGRAPHY');
  const [bookingDetails, setBookingDetails] = useState<any>({
    name: 'Member',
    amount: 5000
  });

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    testConnection();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenBooking = (serviceValue: string = 'VIDEOGRAPHY') => {
    setSelectedService(serviceValue);
    setBookingOpen(true);
  };

  const handleBookingSuccess = (bookingData: any) => {
    let amount = 5000;
    if (bookingData.service?.includes('REELS')) {
      amount = 750;
    } else if (bookingData.service?.includes('VIDEO') || bookingData.service?.includes('CINEMA')) {
      amount = 6000;
    } else if (bookingData.service?.includes('PHOTO')) {
      amount = 5000;
    }

    setBookingDetails({
      name: bookingData.name,
      amount: amount
    });

    setTimeout(() => {
      setPaymentOpen(true);
    }, 700);
  };

  // 1. Initial Shutter Preloader
  if (initialLoading) {
    return <Loader onComplete={() => setInitialLoading(false)} />;
  }

  // 2. Unauthenticated Visitor Gateway: First page is ALWAYS Login or Register
  if (!user && !authLoading) {
    return (
      <AnimatePresence mode="wait">
        {authView === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoginScreen onNavigateToRegister={() => setAuthView('register')} />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RegisterScreen onNavigateToLogin={() => setAuthView('login')} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // 3. Authenticated Studio Experience
  return (
    <BrowserRouter>
      <div className="relative text-white min-h-screen font-sans bg-black antialiased selection:bg-[#E8C49A]/30">
        
        {/* Global Navigation with User Profile & Logout */}
        <Navbar />

        {/* Routes */}
        <Routes>
          {/* Main Homepage */}
          <Route
            path="/"
            element={<HomeLanding onOpenBooking={handleOpenBooking} />}
          />

          {/* Dedicated Portfolio Showcase Page */}
          <Route
            path="/portfolio"
            element={<PortfolioPage />}
          />

          {/* Dedicated Contact & Inquiries Page */}
          <Route
            path="/contact"
            element={<ContactPage onOpenBooking={handleOpenBooking} />}
          />

          {/* Secure Admin Dashboard */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Footer */}
        <Footer />

        {/* --- FLOATING CONTROLS --- */}

        {/* Floating WhatsApp Contact Button */}
        <a
          href={`https://wa.me/${(settings.whatsapp || '918639063089').replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Direct WhatsApp with Vyro Studio"
          className="fixed bottom-6 left-6 z-30 p-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 group"
        >
          <MessageCircle className="w-6 h-6 fill-white text-emerald-500" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out text-[11px] font-mono font-bold tracking-wider uppercase pl-0 group-hover:pl-2">
            WhatsApp Desk
          </span>
        </a>

        {/* Floating "BOOK SLOTS" Action Button */}
        <button
          onClick={() => handleOpenBooking()}
          className="fixed bottom-6 right-20 sm:right-24 z-30 bg-[#E8C49A] hover:bg-[#d8b488] text-black px-4 py-3 rounded-full sm:rounded-xl sm:px-5 sm:py-3 flex items-center gap-2 shadow-[0_4px_25px_rgba(232,196,154,0.35)] hover:scale-105 active:scale-95 transition-all text-xs font-mono font-bold tracking-widest uppercase cursor-pointer"
        >
          <CalendarDays className="w-4 h-4 text-black" />
          <span>BOOK SLOTS</span>
        </button>

        {/* Scroll Back to Top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 z-30 p-3 bg-[#171717] hover:bg-black border border-zinc-800 hover:border-[#E8C49A]/40 text-[#E8C49A] rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* --- DYNAMIC MODALS --- */}

        {/* Booking Entry Modal */}
        <BookingModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          preselectedService={selectedService}
          onBookingSuccess={handleBookingSuccess}
        />

        {/* Payment Simulated Modal */}
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          bookingAmount={bookingDetails.amount}
          customerName={bookingDetails.name}
        />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudioProvider>
        <MainAppContent />
      </StudioProvider>
    </AuthProvider>
  );
}
