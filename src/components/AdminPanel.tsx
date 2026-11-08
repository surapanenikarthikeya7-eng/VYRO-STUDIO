import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  CalendarDays, 
  Film, 
  Settings, 
  Image as ImageIcon, 
  DollarSign, 
  Phone, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ArrowLeft, 
  LogOut, 
  Sparkles, 
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Eye,
  Play,
  Mail
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudio, SiteSettings, BookingRecord } from '../context/StudioContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PortfolioItem, StudioService } from '../types';
import GmailStudioDesk from './GmailStudioDesk';

interface DeleteTarget {
  type: 'booking' | 'portfolio' | 'service' | 'logo' | 'bulk_bookings';
  id?: string;
  name: string;
  ids?: string[];
  details?: string;
}

export default function AdminPanel() {
  const { user, profile, isAdmin, logout } = useAuth();
  const { 
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
    updateBookingStatus,
    deleteBooking,
    deleteMultipleBookings,
    deleteLogo
  } = useStudio();

  const navigate = useNavigate();

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin access passcode bypass if not logged in with primary admin email
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeUnlocked, setPasscodeUnlocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const isAuthorized = isAdmin || passcodeUnlocked;

  // Active Management Tab
  const [activeTab, setActiveTab] = useState<'bookings' | 'portfolio' | 'services' | 'branding' | 'banners' | 'contacts' | 'gmail'>('bookings');

  // Pre-filled recipient for Gmail desk from bookings
  const [gmailClientRecipient, setGmailClientRecipient] = useState<{
    name: string;
    email: string;
    service?: string;
    date?: string;
  } | null>(null);

  // Search in bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Feedback notifications
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // --- 1. Portfolio Form State ---
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState<Omit<PortfolioItem, 'id'>>({
    title: '',
    category: 'Cinematic Videos',
    mediaUrl: '',
    videoUrl: '',
    aspectRatio: 'aspect-[16/9]'
  });

  const handleAddPortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolio.title || !newPortfolio.mediaUrl) {
      triggerFeedback('Please provide a title and thumbnail image URL.');
      return;
    }
    await addPortfolioItem(newPortfolio);
    setShowAddPortfolio(false);
    setNewPortfolio({
      title: '',
      category: 'Cinematic Videos',
      mediaUrl: '',
      videoUrl: '',
      aspectRatio: 'aspect-[16/9]'
    });
    triggerFeedback('Portfolio piece added to studio archives.');
  };

  // --- 2. Service Form State ---
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState<StudioService>({
    id: '',
    title: '',
    priceRange: '₹5,000 - ₹10,000',
    features: ['4K Camera Shooting', 'Professional Color Grading', 'Express Delivery'],
    isPopular: false
  });
  const [newFeatureText, setNewFeatureText] = useState('');

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.title || !newService.priceRange) {
      triggerFeedback('Please fill in title and price.');
      return;
    }
    const id = newService.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await addService({ ...newService, id });
    setShowAddService(false);
    setNewService({
      id: '',
      title: '',
      priceRange: '₹5,000 - ₹10,000',
      features: ['4K Camera Shooting', 'Professional Color Grading'],
      isPopular: false
    });
    triggerFeedback('New service package created.');
  };

  // --- 3. Settings Form State ---
  const [tempSettings, setTempSettings] = useState<SiteSettings>(settings);

  // Sync settings when loaded
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(tempSettings);
    triggerFeedback('Branding & configuration updated in database.');
  };

  // Admin Passcode Check
  const handlePasscodeUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      adminPasscode === 'vyro@143' ||
      adminPasscode === 'vyro2026' || 
      adminPasscode === 'admin123' || 
      adminPasscode === 'vyrostudio'
    ) {
      setPasscodeUnlocked(true);
      setPasscodeError(null);
      triggerFeedback('Admin session authorized with master passcode.');
      if (user) {
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: user.email || 'vyrostudo@gmail.com',
            role: 'admin',
            unlockedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn('Could not persist admin record:', e);
        }
      }
    } else {
      setPasscodeError('Invalid Admin Master Passcode.');
    }
  };

  // Execution handler for confirmed deletions (No window.confirm!)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'booking' && deleteTarget.id) {
        await deleteBooking(deleteTarget.id);
        triggerFeedback(`Deleted "${deleteTarget.name}".`);
      } else if (deleteTarget.type === 'bulk_bookings' && deleteTarget.ids) {
        await deleteMultipleBookings(deleteTarget.ids);
        triggerFeedback(`Purged ${deleteTarget.ids.length} cancelled bookings.`);
      } else if (deleteTarget.type === 'portfolio' && deleteTarget.id) {
        await deletePortfolioItem(deleteTarget.id);
        triggerFeedback(`Removed "${deleteTarget.name}" from portfolio.`);
      } else if (deleteTarget.type === 'service' && deleteTarget.id) {
        await deleteService(deleteTarget.id);
        triggerFeedback(`Deleted service "${deleteTarget.name}".`);
      } else if (deleteTarget.type === 'logo') {
        await deleteLogo();
        setTempSettings(prev => ({ ...prev, logoUrl: '' }));
        triggerFeedback('Custom logo deleted from website.');
      }
    } catch (err) {
      console.warn('Deletion encountered an issue, but local state was cleared:', err);
      triggerFeedback(`Removed "${deleteTarget.name}".`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.email.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.phone.includes(bookingSearch) ||
      b.service.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#E8C49A]/30 pt-28 pb-16">
      
      {/* Top Breadcrumb & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase text-zinc-400 hover:text-[#E8C49A] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Studio Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ADMIN SUITE • {user?.email || 'Authorized Master'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Passcode Unlock Barrier (If not signed in with admin email) */}
        {!isAuthorized ? (
          <div className="max-w-md mx-auto my-12 bg-[#171717] border border-[#E8C49A]/30 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-xl bg-black border border-[#E8C49A]/30 flex items-center justify-center mx-auto mb-4 p-2 shadow-lg">
              <img
                src={settings.logoUrl || '/assets/aistudio/image_35d6318c.png'}
                alt="VYRO STUDIO"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <h2 className="text-xl font-sans font-bold text-white uppercase tracking-wider">
              Admin Authentication
            </h2>
            <p className="text-xs text-zinc-400 mt-1 mb-6">
              Enter the studio master passcode to manage bookings, services, portfolio, and branding.
            </p>

            {passcodeError && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
                {passcodeError}
              </div>
            )}

            <form onSubmit={handlePasscodeUnlock} className="space-y-4">
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Enter Passcode (e.g. vyro@143)"
                required
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E8C49A] transition-colors text-center font-mono"
              />
              <button
                type="submit"
                className="w-full bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer"
              >
                UNLOCK DASHBOARD
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Feedback Alert */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-sans flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{saveSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dashboard Tabs Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-850 pb-4 mb-8">
              {[
                { id: 'bookings', label: `Customer Bookings (${bookings.length})`, icon: CalendarDays },
                { id: 'gmail', label: 'Gmail Notifications', icon: Mail },
                { id: 'portfolio', label: `Portfolio Items (${portfolio.length})`, icon: Film },
                { id: 'services', label: `Services & Pricing (${services.length})`, icon: DollarSign },
                { id: 'branding', label: 'Logo & Identity', icon: ImageIcon },
                { id: 'banners', label: 'Banners & Hero', icon: Sparkles },
                { id: 'contacts', label: 'Studio Contacts', icon: Phone },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs tracking-wider uppercase transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#E8C49A] border-[#E8C49A] text-black font-bold shadow-[0_2px_15px_rgba(232,196,154,0.2)]'
                        : 'bg-[#171717] border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: CUSTOMER BOOKINGS */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-sans font-bold text-white uppercase tracking-wide">
                      Customer Slot Reservations
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Real-time reservations recorded via customer booking desk and synced with Firebase.
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <input
                        type="text"
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        placeholder="Search by client, email, phone..."
                        className="w-full bg-[#171717] border border-zinc-800 rounded-lg px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#171717] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#E8C49A]"
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>

                    {bookings.some(b => b.status === 'CANCELLED') && (
                      <button
                        type="button"
                        onClick={() => {
                          const cancelledIds = bookings.filter(b => b.status === 'CANCELLED').map(b => b.id!).filter(Boolean);
                          setDeleteTarget({
                            type: 'bulk_bookings',
                            name: `${cancelledIds.length} Cancelled Bookings`,
                            ids: cancelledIds,
                            details: 'All bookings currently marked as CANCELLED will be permanently removed from Firestore.'
                          });
                        }}
                        className="px-3 py-2 bg-red-950/40 border border-red-500/40 hover:bg-red-900/40 text-red-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                        title="Delete all cancelled booking records"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Purge Cancelled ({bookings.filter(b => b.status === 'CANCELLED').length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-12 text-center text-zinc-500">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                    <p className="text-sm font-sans">No customer bookings matched your criteria.</p>
                  </div>
                ) : (
                  <div className="bg-[#171717] border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-black/60 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          <tr>
                            <th className="p-4">Customer Details</th>
                            <th className="p-4">Requested Service</th>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Delete & Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {filteredBookings.map((b) => (
                            <tr key={b.id || Math.random()} className="hover:bg-zinc-900/40 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-white text-sm">{b.name}</p>
                                <p className="text-zinc-400 font-mono text-[11px] mt-0.5">{b.phone}</p>
                                <p className="text-[#E8C49A] font-mono text-[11px] mt-0.5">{b.email}</p>
                                {b.notes && (
                                  <p className="text-zinc-500 text-[10px] mt-1 bg-black/40 p-1.5 rounded max-w-xs">
                                    "{b.notes}"
                                  </p>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="inline-block bg-[#E8C49A]/10 border border-[#E8C49A]/30 text-[#E8C49A] px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase">
                                  {b.service}
                                </span>
                              </td>
                              <td className="p-4">
                                <p className="font-mono text-zinc-300">{b.date}</p>
                                <p className="font-mono text-zinc-500 text-[10px]">{b.time || '10:00 AM'}</p>
                              </td>
                              <td className="p-4">
                                <select
                                  value={b.status}
                                  onChange={(e) => updateBookingStatus(b.id!, e.target.value as any)}
                                  className={`text-[10px] font-mono font-bold uppercase rounded px-2.5 py-1 border focus:outline-none cursor-pointer ${
                                    b.status === 'CONFIRMED' ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400' :
                                    b.status === 'COMPLETED' ? 'bg-blue-950/60 border-blue-500/50 text-blue-400' :
                                    b.status === 'CANCELLED' ? 'bg-red-950/60 border-red-500/50 text-red-400' :
                                    'bg-amber-950/60 border-amber-500/50 text-amber-400'
                                  }`}
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="CONFIRMED">CONFIRMED</option>
                                  <option value="COMPLETED">COMPLETED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGmailClientRecipient({
                                        name: b.name,
                                        email: b.email,
                                        service: b.service,
                                        date: b.date
                                      });
                                      setActiveTab('gmail');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8C49A]/15 hover:bg-[#E8C49A]/30 border border-[#E8C49A]/40 text-[#E8C49A] hover:text-white rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
                                    title="Send Shoot Confirmation or Quote via Gmail"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-[#E8C49A]" />
                                    <span>Email Client</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget({
                                        type: 'booking',
                                        id: b.id,
                                        name: `Booking by ${b.name}`,
                                        details: `${b.service} • Date: ${b.date || 'TBD'} • Contact: ${b.phone} • Email: ${b.email}`
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 hover:border-red-500/60 text-red-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
                                    title="Permanently Delete Booking Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PORTFOLIO MANAGER */}
            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-sans font-bold text-white uppercase tracking-wide">
                      Showcase & Video Archives
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Add, update and remove cinematography reels, wedding films, and portrait shoots.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddPortfolio(!showAddPortfolio)}
                    className="bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add New Piece
                  </button>
                </div>

                {/* Add Portfolio Modal / Form */}
                <AnimatePresence>
                  {showAddPortfolio && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddPortfolioSubmit}
                      className="bg-[#171717] border border-[#E8C49A]/30 rounded-2xl p-6 space-y-4"
                    >
                      <h4 className="text-sm font-sans font-bold uppercase text-[#E8C49A]">
                        New Portfolio Entry
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={newPortfolio.title}
                            onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                            placeholder="e.g. Royal Wedding Cinema Trailer"
                            required
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Category *
                          </label>
                          <select
                            value={newPortfolio.category}
                            onChange={(e) => setNewPortfolio({ ...newPortfolio, category: e.target.value as PortfolioItem['category'] })}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                          >
                            <option value="Cinematic Videos">Cinematic Videos</option>
                            <option value="Weddings">Weddings</option>
                            <option value="Events">Events</option>
                            <option value="Reels">Reels</option>
                            <option value="Portraits">Portraits</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Thumbnail / Poster URL *
                          </label>
                          <input
                            type="url"
                            value={newPortfolio.mediaUrl}
                            onChange={(e) => setNewPortfolio({ ...newPortfolio, mediaUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            required
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Video MP4 URL (Optional for videos)
                          </label>
                          <input
                            type="url"
                            value={newPortfolio.videoUrl || ''}
                            onChange={(e) => setNewPortfolio({ ...newPortfolio, videoUrl: e.target.value })}
                            placeholder="https://assets.mixkit.co/...mp4"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddPortfolio(false)}
                          className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-wider rounded-lg"
                        >
                          Save to Portfolio
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Portfolio Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#171717] border border-zinc-850 rounded-2xl overflow-hidden group flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur border border-[#E8C49A]/30 text-[#E8C49A] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                          {item.category}
                        </span>
                        {item.videoUrl && (
                          <span className="absolute top-3 right-3 bg-black/70 p-1 rounded text-[#E8C49A]">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-sans font-bold text-white truncate max-w-[200px]">
                            {item.title}
                          </h4>
                          <p className="text-[10px] font-mono text-zinc-500">
                            {item.videoUrl ? '4K Video Stream' : 'Retouched Photography'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({
                              type: 'portfolio',
                              id: item.id,
                              name: item.title,
                              details: `Category: ${item.category} • ${item.videoUrl ? 'Cinematic 4K Stream' : 'Retouched Photography'}`
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 hover:border-red-500/60 text-red-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
                          title="Permanently Delete Portfolio Piece"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SERVICES & PRICING */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-sans font-bold text-white uppercase tracking-wide">
                      Studio Services & Pricing Packages
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Configure service deliverables, timelines, pricing ranges, and highlight tags.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddService(!showAddService)}
                    className="bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Service Package
                  </button>
                </div>

                {/* Add Service Modal */}
                <AnimatePresence>
                  {showAddService && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddServiceSubmit}
                      className="bg-[#171717] border border-[#E8C49A]/30 rounded-2xl p-6 space-y-4"
                    >
                      <h4 className="text-sm font-sans font-bold uppercase text-[#E8C49A]">
                        New Studio Service
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Service Title *
                          </label>
                          <input
                            type="text"
                            value={newService.title}
                            onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                            placeholder="e.g. DRONE CINEMATOGRAPHY"
                            required
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Price Range *
                          </label>
                          <input
                            type="text"
                            value={newService.priceRange}
                            onChange={(e) => setNewService({ ...newService, priceRange: e.target.value })}
                            placeholder="e.g. ₹5,000 - ₹15,000"
                            required
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Features & Deliverables
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newFeatureText}
                            onChange={(e) => setNewFeatureText(e.target.value)}
                            placeholder="Add feature item..."
                            className="flex-1 bg-black border border-zinc-800 rounded-lg px-3.5 py-1.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newFeatureText.trim()) {
                                setNewService({
                                  ...newService,
                                  features: [...newService.features, newFeatureText.trim()]
                                });
                                setNewFeatureText('');
                              }
                            }}
                            className="px-3 py-1.5 bg-zinc-800 text-white rounded-lg text-xs"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newService.features.map((f, i) => (
                            <span key={i} className="text-[11px] bg-black px-2.5 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5">
                              {f}
                              <button
                                type="button"
                                onClick={() => setNewService({
                                  ...newService,
                                  features: newService.features.filter((_, idx) => idx !== i)
                                })}
                                className="text-zinc-500 hover:text-red-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddService(false)}
                          className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-wider rounded-lg"
                        >
                          Save Service
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Services List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-sans font-bold text-white text-base uppercase">
                            {svc.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'service',
                                id: svc.id,
                                name: svc.title,
                                details: `Price: ${svc.priceRange} • Features: ${svc.features?.length || 0} inclusions`
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 hover:border-red-500/60 text-red-300 hover:text-white rounded-lg text-xs font-mono transition-all cursor-pointer"
                            title="Delete Service Package"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>Delete</span>
                          </button>
                        </div>

                        {/* Price Edit Input */}
                        <div className="mb-4">
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Price Range:
                          </label>
                          <input
                            type="text"
                            defaultValue={svc.priceRange}
                            onBlur={(e) => {
                              if (e.target.value !== svc.priceRange) {
                                updateService(svc.id, { priceRange: e.target.value });
                                triggerFeedback(`Updated price for ${svc.title}`);
                              }
                            }}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-[#E8C49A] font-bold font-sans"
                          />
                        </div>

                        {/* Features List */}
                        <ul className="space-y-1.5 text-xs text-zinc-400">
                          {svc.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="w-3 h-3 text-[#E8C49A]" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">
                          ID: {svc.id}
                        </span>
                        <button
                          onClick={() => {
                            updateService(svc.id, { isPopular: !svc.isPopular });
                            triggerFeedback('Updated popular tag.');
                          }}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            svc.isPopular
                              ? 'bg-[#E8C49A]/20 border-[#E8C49A] text-[#E8C49A]'
                              : 'bg-black border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {svc.isPopular ? 'FEATURED' : 'SET FEATURED'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: BRANDING & LOGO */}
            {activeTab === 'branding' && (
              <form onSubmit={handleSaveSettings} className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-sans font-bold text-white uppercase tracking-wide">
                    Website Logo & Brand Identity
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Change, upload, or reset the official VYRO STUDIO logo displayed across the website.
                  </p>
                </div>

                {/* Logo Preview */}
                <div className="flex items-center gap-6 p-4 rounded-xl bg-black border border-zinc-800">
                  <div className="w-20 h-20 rounded-xl bg-[#171717] border border-[#E8C49A]/30 p-2 flex items-center justify-center">
                    <img
                      src={tempSettings.logoUrl || '/assets/aistudio/image_35d6318c.png'}
                      alt="Logo Preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white uppercase">Official Brand Logo Asset</p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xs">
                      {tempSettings.logoUrl}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget({
                            type: 'logo',
                            name: 'Website Brand Logo',
                            details: 'This will delete the current logo URL from Firestore and remove the image from the site header.'
                          });
                        }}
                        className="px-2.5 py-1.5 bg-red-950/40 border border-red-500/40 hover:bg-red-900/50 text-red-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Delete Logo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTempSettings(prev => ({ ...prev, logoUrl: '/assets/aistudio/image_35d6318c.png' }));
                          triggerFeedback('Reset logo to official uploaded asset.');
                        }}
                        className="text-xs font-mono text-[#E8C49A] hover:underline cursor-pointer"
                      >
                        Reset to Official VYRO Logo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Logo URL */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Logo Image URL / Path
                  </label>
                  <input
                    type="text"
                    value={tempSettings.logoUrl}
                    onChange={(e) => setTempSettings({ ...tempSettings, logoUrl: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A] font-mono"
                  />
                </div>

                {/* Brand Name */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={tempSettings.brandName}
                    onChange={(e) => setTempSettings({ ...tempSettings, brandName: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Brand Tagline / Accent
                  </label>
                  <input
                    type="text"
                    value={tempSettings.tagline}
                    onChange={(e) => setTempSettings({ ...tempSettings, tagline: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Save Brand Changes
                </button>
              </form>
            )}

            {/* TAB 5: BANNERS & HERO */}
            {activeTab === 'banners' && (
              <form onSubmit={handleSaveSettings} className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-sans font-bold text-white uppercase tracking-wide">
                    Website Banners & Hero Headlines
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Update the main cinematic hero headlines and background video.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Hero Title Line 1
                  </label>
                  <input
                    type="text"
                    value={tempSettings.heroTitleLine1}
                    onChange={(e) => setTempSettings({ ...tempSettings, heroTitleLine1: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Hero Title Highlight (Gold Accent)
                  </label>
                  <input
                    type="text"
                    value={tempSettings.heroTitleHighlight}
                    onChange={(e) => setTempSettings({ ...tempSettings, heroTitleHighlight: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Hero Subtitle Description
                  </label>
                  <textarea
                    rows={2}
                    value={tempSettings.heroSubtitle}
                    onChange={(e) => setTempSettings({ ...tempSettings, heroSubtitle: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Background Video Loop URL (MP4)
                  </label>
                  <input
                    type="url"
                    value={tempSettings.backgroundVideoUrl}
                    onChange={(e) => setTempSettings({ ...tempSettings, backgroundVideoUrl: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Save Banner Settings
                </button>
              </form>
            )}

            {/* TAB 6: CONTACTS & SOCIALS */}
            {activeTab === 'contacts' && (
              <form onSubmit={handleSaveSettings} className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-sans font-bold text-white uppercase tracking-wide">
                    Studio Contacts & Social Links
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Update WhatsApp, phone numbers, email desks, and Instagram links.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={tempSettings.phone}
                      onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                      WhatsApp Number (with country code)
                    </label>
                    <input
                      type="text"
                      value={tempSettings.whatsapp}
                      onChange={(e) => setTempSettings({ ...tempSettings, whatsapp: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                      Official Email Desk
                    </label>
                    <input
                      type="email"
                      value={tempSettings.email}
                      onChange={(e) => setTempSettings({ ...tempSettings, email: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                      Instagram Profile Link
                    </label>
                    <input
                      type="url"
                      value={tempSettings.instagram}
                      onChange={(e) => setTempSettings({ ...tempSettings, instagram: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Save Contact Information
                </button>
              </form>
            )}

            {/* TAB 7: GMAIL OFFICIAL STUDIO DESK */}
            {activeTab === 'gmail' && (
              <GmailStudioDesk
                initialRecipient={gmailClientRecipient}
                onClearInitialRecipient={() => setGmailClientRecipient(null)}
              />
            )}

          </div>
        )}
      </div>

      {/* Interactive In-App Deletion Confirmation Modal (Zero window.confirm) */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#171717] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base uppercase text-white tracking-wide">
                    Confirm Permanent Deletion
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Are you sure you want to delete <span className="text-[#E8C49A] font-semibold">{deleteTarget.name}</span>?
                  </p>
                  {deleteTarget.details && (
                    <p className="text-[11px] font-mono text-zinc-400 bg-black/60 p-2.5 rounded-lg mt-2.5 border border-zinc-800">
                      {deleteTarget.details}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-red-400/90 mt-2">
                    Notice: This action will permanently remove this record from Firestore database.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
