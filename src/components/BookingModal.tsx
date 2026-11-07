import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Phone, Mail, User, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
  onBookingSuccess: (bookingData: any) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  preselectedService = '',
  onBookingSuccess,
}: BookingModalProps) {
  const { user, profile } = useAuth();
  const { services, createBooking } = useStudio();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: preselectedService || 'VIDEOGRAPHY',
    date: '',
    time: '10:00 AM',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user || profile) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || profile?.name || user?.displayName || '',
        email: prev.email || user?.email || '',
        service: preselectedService || prev.service || 'VIDEOGRAPHY'
      }));
    }
  }, [user, profile, preselectedService, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);

    if (!formData.name || !formData.phone || !formData.email || !formData.date) {
      setErrorStatus('Please complete all required fields.');
      setLoading(false);
      return;
    }

    try {
      const bookingId = await createBooking({
        userId: user?.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        notes: formData.notes
      });

      onBookingSuccess({
        id: bookingId,
        ...formData
      });
      onClose();
    } catch (err: any) {
      console.error('Submit booking failed:', err);
      setErrorStatus(err.message || 'Unable to submit booking. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-[#171717] border border-[#E8C49A]/30 rounded-2xl p-6 md:p-8 overflow-hidden shadow-2xl z-10 text-white"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-[#E8C49A] to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#E8C49A]">
                RESERVATION DESK
              </span>
              <h2 className="text-xl md:text-2xl font-sans font-bold text-white tracking-wide uppercase mt-0.5">
                BOOK PRODUCTION <span className="text-[#E8C49A]">SLOT</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Direct booking recorded securely into VYRO STUDIO cloud database.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorStatus && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-200">
                  {errorStatus}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Karthikeya"
                    className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 8639063089"
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                    Gmail Address *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@gmail.com"
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                  Selected Service Package *
                </label>
                <div className="relative">
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 px-3.5 text-white text-xs outline-none appearance-none transition-colors uppercase font-mono"
                  >
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.title} className="bg-zinc-900 text-white">
                        {svc.title} ({svc.priceRange})
                      </option>
                    ))}
                    <option value="CUSTOM PRODUCTION" className="bg-zinc-900 text-white">
                      CUSTOM PRODUCTION (REELS + 4K CINEMATIC)
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Date & Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                    Shoot Date *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none transition-colors font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                    Preferred Time Slot
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Clock className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      placeholder="e.g. 10:00 AM"
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                  Creative Notes / Venue Location
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Tell us about the project, venue, or special requests..."
                  className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2 px-3 text-white text-xs outline-none resize-none transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8C49A] hover:bg-[#d8b488] active:scale-[0.99] text-black font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,196,154,0.25)] disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    SAVING RESERVATION TO DATABASE...
                  </>
                ) : (
                  'CONFIRM & PROCEED TO CHECKOUT'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
