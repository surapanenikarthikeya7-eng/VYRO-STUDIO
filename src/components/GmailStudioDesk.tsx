/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Inbox, 
  Clock, 
  Search, 
  RotateCcw, 
  Filter, 
  Sliders, 
  Users, 
  Calendar, 
  CheckCheck, 
  XCircle, 
  ChevronRight,
  Eye,
  Settings2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudio, BookingRecord } from '../context/StudioContext';
import { 
  listGmailMessages, 
  sendGmailEmail, 
  STUDIO_EMAIL_TEMPLATES, 
  GmailMessageSummary,
  EmailTemplate 
} from '../lib/gmail';
import { 
  EmailNotificationRecord, 
  EmailNotificationSettings, 
  DEFAULT_EMAIL_SETTINGS, 
  getNotificationSettings, 
  saveNotificationSettings, 
  dispatchEmailNotification,
  buildNotificationEmailContent 
} from '../lib/notificationService';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GmailStudioDeskProps {
  initialRecipient?: {
    name: string;
    email: string;
    service?: string;
    date?: string;
  } | null;
  onClearInitialRecipient?: () => void;
}

export default function GmailStudioDesk({
  initialRecipient,
  onClearInitialRecipient
}: GmailStudioDeskProps) {
  const { user, gmailToken, connectGmail } = useAuth();
  const { settings, bookings } = useStudio();

  // Active sub-view: 'compose' | 'history' | 'automation' | 'inbox'
  const [subView, setSubView] = useState<'compose' | 'history' | 'automation' | 'inbox'>('compose');

  // Compose Form State
  const [toEmail, setToEmail] = useState(initialRecipient?.email || '');
  const [clientName, setClientName] = useState(initialRecipient?.name || '');
  const [subject, setSubject] = useState(
    initialRecipient ? `Shoot Booking Confirmation — ${settings.brandName || 'VYRO STUDIO'}` : ''
  );
  const [bodyContent, setBodyContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('CONFIRM_SHOOT');
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');

  // Email Notifications History State
  const [history, setHistory] = useState<EmailNotificationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyEventFilter, setHistoryEventFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');

  // Automation Settings State
  const [autoSettings, setAutoSettings] = useState<EmailNotificationSettings>(DEFAULT_EMAIL_SETTINGS);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Operations and Async State
  const [isSending, setIsSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Mandatory Confirmation Dialog State (Per Google Workspace guidelines)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Previewing specific history email
  const [inspectEmail, setInspectEmail] = useState<EmailNotificationRecord | null>(null);

  // Inbox State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // 1. Load Real-time Email Notifications History from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'email_notifications'), orderBy('sentAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records: EmailNotificationRecord[] = [];
        snapshot.forEach((d) => {
          records.push({ id: d.id, ...d.data() } as EmailNotificationRecord);
        });
        setHistory(records);
        setLoadingHistory(false);
      }, (err) => {
        console.warn('Firestore email_notifications listener note:', err);
        // Fallback to fetch from backend API
        fetchBackendHistory();
      });
      return () => unsubscribe();
    } catch {
      fetchBackendHistory();
    }
  }, []);

  const fetchBackendHistory = async () => {
    try {
      const res = await fetch('/api/notifications/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.notifications || []);
      }
    } catch (e) {
      console.warn('Could not fetch backend history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 2. Load Automation Settings
  useEffect(() => {
    getNotificationSettings().then(setAutoSettings);
  }, []);

  // 3. Populate from initial recipient if passed from bookings desk
  useEffect(() => {
    if (initialRecipient) {
      setToEmail(initialRecipient.email);
      setClientName(initialRecipient.name);
      setSubView('compose');
      applyTemplate('CONFIRM_SHOOT', initialRecipient.name, initialRecipient.service, initialRecipient.date);
    } else if (!bodyContent) {
      applyTemplate('CONFIRM_SHOOT', clientName || 'Valued Client');
    }
  }, [initialRecipient]);

  // 4. Fetch Inbox if subView is 'inbox' and token available
  useEffect(() => {
    if (gmailToken && subView === 'inbox') {
      fetchInbox();
    }
  }, [gmailToken, subView]);

  const applyTemplate = (
    templateId: string, 
    cName: string = clientName || 'Valued Client',
    service: string = initialRecipient?.service || 'Cinematography & Photography',
    date: string = initialRecipient?.date || 'Scheduled Date'
  ) => {
    setSelectedTemplateId(templateId);
    const tmpl = STUDIO_EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setSubject(tmpl.subject.replace('VYRO STUDIO', settings.brandName || 'VYRO STUDIO'));
      const generated = tmpl.generateBody({
        clientName: cName,
        serviceName: service,
        date: date,
        amount: '5000',
        studioPhone: settings.phone || '8639063089'
      });
      setBodyContent(generated);
    }
  };

  const fetchInbox = async () => {
    if (!gmailToken) return;
    setLoadingMessages(true);
    setMessageError(null);
    try {
      const list = await listGmailMessages(gmailToken, '', 10);
      setMessages(list);
    } catch (err: any) {
      setMessageError(err.message || 'Could not fetch Gmail inbox messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      await connectGmail();
    } catch (err: any) {
      console.error('Connect failed:', err);
      setSendError(err.message || 'Failed to authorize Gmail.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await saveNotificationSettings(autoSettings);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      setSendError(err.message || 'Failed to save notification settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Pre-validate before opening Mandatory Confirmation Dialog
  const handleInitiateManualSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    if (!toEmail || !toEmail.includes('@')) {
      setSendError('Please provide a valid client Gmail address.');
      return;
    }
    if (!subject.trim()) {
      setSendError('Please provide an email subject line.');
      return;
    }
    if (!bodyContent.trim()) {
      setSendError('Email message content cannot be empty.');
      return;
    }

    // Open explicit confirmation dialog (MANDATORY per Workspace Integration rules)
    setShowConfirmModal(true);
  };

  // Confirmed Dispatch
  const handleConfirmedSend = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      const result = await dispatchEmailNotification({
        bookingId: selectedBookingId || undefined,
        recipientName: clientName || toEmail.split('@')[0],
        recipientEmail: toEmail.trim(),
        subject: subject.trim(),
        message: bodyContent,
        htmlBody: bodyContent,
        eventType: 'MANUAL',
        idempotencyKey: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderEmail: user?.email || settings.email || 'vyrostudo@gmail.com',
        gmailToken: gmailToken
      });

      if (result.status === 'SENT') {
        setSendSuccess(`Email successfully dispatched via Gmail to ${toEmail}`);
        if (onClearInitialRecipient) onClearInitialRecipient();
        setToEmail('');
        setClientName('');
        setSelectedBookingId('');
      } else {
        setSendError(result.errorMessage || 'Failed to dispatch email. Recorded in delivery history for retry.');
      }

      setShowConfirmModal(false);
      setTimeout(() => setSendSuccess(null), 5000);
    } catch (err: any) {
      setSendError(err.message || 'Error occurred while sending email.');
      setShowConfirmModal(false);
    } finally {
      setIsSending(false);
    }
  };

  // Retry Failed Email
  const handleRetryFailedEmail = async (item: EmailNotificationRecord) => {
    setRetryingId(item.id);
    setSendError(null);
    try {
      const result = await dispatchEmailNotification({
        bookingId: item.bookingId,
        recipientName: item.recipientName,
        recipientEmail: item.recipientEmail,
        subject: item.subject,
        message: item.message,
        htmlBody: item.htmlBody || item.message,
        eventType: item.eventType,
        idempotencyKey: `retry_${item.id}_${Date.now()}`,
        senderEmail: user?.email || settings.email || 'vyrostudo@gmail.com',
        gmailToken: gmailToken
      });

      if (result.status === 'SENT') {
        // Update original document status in Firestore
        try {
          await updateDoc(doc(db, 'email_notifications', item.id), {
            status: 'SENT',
            errorMessage: null,
            retriedAt: new Date().toISOString()
          });
        } catch {}
        setSendSuccess(`Retry succeeded! Email delivered to ${item.recipientEmail}`);
        setTimeout(() => setSendSuccess(null), 4000);
      } else {
        setSendError(result.errorMessage || 'Retry failed. Please verify Gmail account connection.');
      }
    } catch (e: any) {
      setSendError(e.message || 'Retry encountered an issue.');
    } finally {
      setRetryingId(null);
    }
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch = 
        !historySearch ||
        item.recipientName.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.recipientEmail.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.subject.toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.bookingId && item.bookingId.toLowerCase().includes(historySearch.toLowerCase()));

      const matchesEvent = 
        historyEventFilter === 'ALL' || item.eventType === historyEventFilter;

      const matchesStatus = 
        historyStatusFilter === 'ALL' || item.status === historyStatusFilter;

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [history, historySearch, historyEventFilter, historyStatusFilter]);

  // Unique Customer Gmail list from bookings for quick select
  const customerList = useMemo(() => {
    const map = new Map<string, { name: string; email: string; lastBookingId?: string; service?: string }>();
    bookings.forEach((b) => {
      if (b.email) {
        const clean = b.email.trim().toLowerCase();
        if (!map.has(clean)) {
          map.set(clean, {
            name: b.name || clean.split('@')[0],
            email: clean,
            lastBookingId: b.id,
            service: b.service
          });
        }
      }
    });
    return Array.from(map.values());
  }, [bookings]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header Banner & Google Workspace Connection */}
      <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-[#E8C49A]/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-lg">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-sans font-bold text-white uppercase tracking-wider">
                Gmail Notifications & Studio Sender
              </h2>
              {gmailToken ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-500/50 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Gmail Authorized
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-amber-950/60 border border-amber-500/50 text-amber-400">
                  Account Connection Required
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Official dispatch system for automatic booking confirmations, cancellations, completed shoots, and custom client messages via Google Workspace Gmail API.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="z-10 shrink-0">
          {!gmailToken ? (
            <button
              type="button"
              disabled={isConnecting}
              onClick={handleConnectGmail}
              className="bg-[#E8C49A] hover:bg-[#d8b488] active:scale-95 text-black font-sans font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-2.5 shadow-[0_4px_20px_rgba(232,196,154,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>{isConnecting ? 'Connecting Account...' : 'Connect Gmail Account'}</span>
            </button>
          ) : (
            <div className="bg-black/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E8C49A] text-black font-bold text-xs flex items-center justify-center uppercase">
                {(user?.email || 'A').charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Connected Sender</p>
                <p className="text-xs font-mono font-bold text-white truncate max-w-[180px]">{user?.email || 'vyrostudo@gmail.com'}</p>
              </div>
              <button
                onClick={handleConnectGmail}
                title="Switch or reconnect account"
                className="p-1.5 text-zinc-400 hover:text-[#E8C49A] hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-850 pb-3">
        {[
          { id: 'compose', label: 'Manual Email Sender', icon: Send },
          { id: 'history', label: `Delivery History (${history.length})`, icon: Clock },
          { id: 'automation', label: 'Automatic Notifications', icon: Settings2 },
          { id: 'inbox', label: 'Client Inquiries', icon: Inbox },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#E8C49A] border-[#E8C49A] text-black font-bold shadow-[0_2px_15px_rgba(232,196,154,0.2)]'
                  : 'bg-[#171717] border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Alerts */}
      <AnimatePresence>
        {sendSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 font-sans"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sendSuccess}</span>
          </motion.div>
        )}

        {sendError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 font-sans"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{sendError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* TAB 1: COMPOSE / MANUAL EMAIL SENDER */}
      {/* ============================================================== */}
      {subView === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form */}
          <div className="lg:col-span-2 bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
              <div>
                <h3 className="text-base font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E8C49A]" />
                  Custom Gmail Dispatch
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Send personalized production updates, invoices, or contracts directly to clients.
                </p>
              </div>

              {/* Quick Customer Picker */}
              {customerList.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const cust = customerList.find(c => c.email === val);
                      if (cust) {
                        setToEmail(cust.email);
                        setClientName(cust.name);
                        setSelectedBookingId(cust.lastBookingId || '');
                        applyTemplate(selectedTemplateId, cust.name, cust.service);
                      }
                    }}
                    className="bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E8C49A]"
                  >
                    <option value="">Quick Select Customer...</option>
                    {customerList.map((c) => (
                      <option key={c.email} value={c.email}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={handleInitiateManualSend} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      applyTemplate(selectedTemplateId, e.target.value);
                    }}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                    Recipient Gmail Address *
                  </label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="customer@gmail.com"
                    required
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A] transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1.5">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject of email"
                  required
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-300">
                    Message Content (HTML / Plain Text) *
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Rendered in Luxury Studio Styling
                  </span>
                </div>
                <textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  rows={9}
                  required
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#E8C49A] transition-colors"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-zinc-850">
                <p className="text-[11px] font-mono text-zinc-500">
                  Sends directly from your authorized Google Workspace Gmail address.
                </p>

                <button
                  type="submit"
                  disabled={!gmailToken}
                  className="w-full sm:w-auto bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_2px_20px_rgba(232,196,154,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Review & Send Email</span>
                </button>
              </div>
            </form>
          </div>

          {/* Templates & Preview */}
          <div className="space-y-6">
            <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8C49A] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Studio Email Templates
              </h4>
              <p className="text-[11px] text-zinc-400">
                Pick a template to instantly generate official branded copy.
              </p>

              <div className="space-y-2">
                {STUDIO_EMAIL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => applyTemplate(tmpl.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-sans transition-all cursor-pointer flex items-center justify-between ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-[#E8C49A]/15 border-[#E8C49A] text-white font-bold'
                        : 'bg-black border-zinc-850 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{tmpl.name}</p>
                      <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[200px] mt-0.5">
                        {tmpl.subject}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#E8C49A]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-zinc-400">Live Client Preview</span>
                <span className="text-[10px] font-mono text-[#E8C49A]">Studio Dark Style</span>
              </div>
              <div 
                className="bg-black border border-zinc-800 rounded-xl p-4 max-h-[280px] overflow-y-auto text-xs text-white"
                dangerouslySetInnerHTML={{ __html: bodyContent }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EMAIL DELIVERY HISTORY & AUDIT TRAIL */}
      {/* ============================================================== */}
      {subView === 'history' && (
        <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
            <div>
              <h3 className="text-base font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E8C49A]" />
                Email Delivery History & Audit Trail
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time tracking of sent, failed, and pending emails recorded in Cloud Firestore.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-56">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search customer, ID, subject..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Event Filter */}
              <select
                value={historyEventFilter}
                onChange={(e) => setHistoryEventFilter(e.target.value)}
                className="bg-black border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#E8C49A]"
              >
                <option value="ALL">All Events</option>
                <option value="BOOKED">Booked Slots</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
                <option value="MANUAL">Manual Emails</option>
              </select>

              {/* Status Filter */}
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="bg-black border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#E8C49A]"
              >
                <option value="ALL">All Status</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loadingHistory ? (
            <div className="py-12 text-center text-zinc-400 space-y-3">
              <div className="w-6 h-6 border-2 border-[#E8C49A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono">Loading notification history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-sm font-sans">No email notifications match your current filter.</p>
              <p className="text-xs font-mono text-zinc-600">Whenever bookings are created or updated, records will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Recipient</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Event</th>
                    <th className="py-3 px-3">Sent Time</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 font-sans">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                      {/* Status */}
                      <td className="py-3 px-3">
                        {item.status === 'SENT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                            <CheckCheck className="w-3 h-3" />
                            SENT
                          </span>
                        ) : item.status === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-950/60 border border-red-500/40 text-red-400" title={item.errorMessage}>
                            <XCircle className="w-3 h-3" />
                            FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/60 border border-amber-500/40 text-amber-400">
                            <Clock className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-white text-xs">{item.recipientName}</p>
                        <p className="font-mono text-[10px] text-zinc-400">{item.recipientEmail}</p>
                        {item.bookingId && (
                          <span className="font-mono text-[9px] text-[#E8C49A] block mt-0.5">
                            ID: {item.bookingId}
                          </span>
                        )}
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-medium text-white truncate text-xs">{item.subject}</p>
                        {item.errorMessage && (
                          <p className="text-[10px] text-red-400 truncate mt-0.5" title={item.errorMessage}>
                            Err: {item.errorMessage}
                          </p>
                        )}
                      </td>

                      {/* Event */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] bg-black border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded uppercase">
                          {item.eventType}
                        </span>
                      </td>

                      {/* Sent Time */}
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {item.sentAt ? new Date(item.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectEmail(item)}
                            className="p-1.5 bg-black border border-zinc-800 hover:border-[#E8C49A] text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Inspect Email"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {item.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryFailedEmail(item)}
                              disabled={retryingId === item.id}
                              className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white rounded-lg text-[10px] font-mono uppercase flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              title="Retry Dispatch"
                            >
                              <RotateCcw className={`w-3 h-3 ${retryingId === item.id ? 'animate-spin' : ''}`} />
                              <span>{retryingId === item.id ? 'Retrying...' : 'Retry'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: AUTOMATION CONTROLS & SETTINGS */}
      {/* ============================================================== */}
      {subView === 'automation' && (
        <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
            <div>
              <h3 className="text-base font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#E8C49A]" />
                Automatic Email Notification Controls
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure automatic trigger rules for customer bookings, cancellations, and completed shoots.
              </p>
            </div>

            {settingsSuccess && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Settings Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-black border border-zinc-800 rounded-xl">
              <div>
                <p className="font-bold text-white text-xs uppercase tracking-wide">
                  Master Automatic Emails Switch
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  When active, VYRO STUDIO will automatically dispatch transactional emails to customers.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSettings.autoEmailsEnabled}
                  onChange={(e) => setAutoSettings(prev => ({ ...prev, autoEmailsEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8C49A]"></div>
              </label>
            </div>

            {/* Individual Triggers */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#E8C49A]">
                Event Triggers
              </h4>

              {/* 1. Slot Booking Confirmed */}
              <div className="flex items-center justify-between p-3.5 bg-black/60 border border-zinc-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">1. Slot Booking Confirmed</p>
                  <p className="text-[10px] text-zinc-400">
                    Sends confirmation email with Booking ID, Date, Time, and Service upon reservation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSettings.autoBookingEnabled}
                  disabled={!autoSettings.autoEmailsEnabled}
                  onChange={(e) => setAutoSettings(prev => ({ ...prev, autoBookingEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#E8C49A] focus:ring-[#E8C49A] cursor-pointer"
                />
              </div>

              {/* 2. Booking Cancelled */}
              <div className="flex items-center justify-between p-3.5 bg-black/60 border border-zinc-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">2. Booking Cancelled</p>
                  <p className="text-[10px] text-zinc-400">
                    Sends cancellation notice whenever customer or admin cancels a booking.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSettings.autoCancellationEnabled}
                  disabled={!autoSettings.autoEmailsEnabled}
                  onChange={(e) => setAutoSettings(prev => ({ ...prev, autoCancellationEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#E8C49A] focus:ring-[#E8C49A] cursor-pointer"
                />
              </div>

              {/* 3. Booking Completed */}
              <div className="flex items-center justify-between p-3.5 bg-black/60 border border-zinc-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">3. Slot Expired / Booking Completed</p>
                  <p className="text-[10px] text-zinc-400">
                    Sends completion email when shoot is finished or status is marked COMPLETED.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSettings.autoCompletionEnabled}
                  disabled={!autoSettings.autoEmailsEnabled}
                  onChange={(e) => setAutoSettings(prev => ({ ...prev, autoCompletionEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#E8C49A] focus:ring-[#E8C49A] cursor-pointer"
                />
              </div>
            </div>

            {/* Sender Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={autoSettings.senderDisplayName}
                  onChange={(e) => setAutoSettings(prev => ({ ...prev, senderDisplayName: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-300 mb-1">
                  Studio Reply-To Address
                </label>
                <input
                  type="email"
                  value={autoSettings.senderEmail}
                  onChange={(e) => setAutoSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A] font-mono"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {settingsSaving ? 'Saving Settings...' : 'Save Notification Controls'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CLIENT INQUIRIES INBOX */}
      {/* ============================================================== */}
      {subView === 'inbox' && (
        <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
            <div>
              <h3 className="text-base font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#E8C49A]" />
                Client Inquiries & Gmail Messages
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time stream from your authorized Google Workspace Gmail account.
              </p>
            </div>

            <button
              onClick={fetchInbox}
              disabled={loadingMessages || !gmailToken}
              className="p-2 bg-black border border-zinc-800 hover:border-[#E8C49A] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              title="Refresh Inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin text-[#E8C49A]' : ''}`} />
            </button>
          </div>

          {messageError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{messageError}</span>
            </div>
          )}

          {!gmailToken ? (
            <div className="py-12 text-center text-zinc-500 space-y-3">
              <Mail className="w-10 h-10 mx-auto text-zinc-600" />
              <p className="text-sm font-sans">Connect your Gmail account above to view and reply to client inquiries.</p>
              <button
                onClick={handleConnectGmail}
                className="bg-[#E8C49A] hover:bg-[#d8b488] text-black text-xs font-mono font-bold uppercase px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Connect Gmail Account
              </button>
            </div>
          ) : loadingMessages ? (
            <div className="py-12 text-center text-zinc-400 space-y-3">
              <div className="w-6 h-6 border-2 border-[#E8C49A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono">Syncing messages with Gmail API...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-sm font-sans">No recent inquiries in your Gmail inbox.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-850">
              {messages.map((m) => (
                <div key={m.id} className="py-3.5 hover:bg-black/40 px-3 rounded-xl transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{m.from}</span>
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {m.date ? new Date(m.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#E8C49A] truncate">{m.subject}</p>
                    <p className="text-[11px] text-zinc-400 font-sans line-clamp-1">{m.snippet}</p>
                  </div>

                  <button
                    onClick={() => {
                      const match = m.from?.match(/<([^>]+)>/) || [null, m.from];
                      const senderEmail = match[1] || m.from || '';
                      setToEmail(senderEmail);
                      setClientName(m.from?.split('<')[0].trim() || 'Client');
                      setSubject(`Re: ${m.subject || 'Studio Inquiry'}`);
                      setSubView('compose');
                    }}
                    className="shrink-0 px-3.5 py-1.5 bg-black border border-zinc-800 hover:border-[#E8C49A] text-zinc-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-[#E8C49A]" />
                    <span>Reply via Gmail</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MANDATORY CONFIRMATION DIALOG (Per Google Workspace Integration) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#171717] border border-[#E8C49A]/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#E8C49A]/20 border border-[#E8C49A]/40 flex items-center justify-center text-[#E8C49A] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base uppercase text-white tracking-wide">
                    Confirm Dispatching Email via Gmail
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    You are authorizing VYRO STUDIO to dispatch this email through your connected Google Workspace account.
                  </p>
                </div>
              </div>

              <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-zinc-400">Recipient:</span>
                  <span className="font-bold text-white font-mono">{toEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-zinc-400">Sender Account:</span>
                  <span className="font-bold text-[#E8C49A] font-mono">{user?.email || 'Authorized Studio Account'}</span>
                </div>
                <div className="border-t border-zinc-850 pt-2">
                  <span className="font-mono text-zinc-400 block mb-1">Subject:</span>
                  <span className="text-white font-medium">{subject}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleConfirmedSend}
                  className="px-5 py-2 bg-[#E8C49A] hover:bg-[#d8b488] text-black rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* INSPECT EMAIL MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {inspectEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#171717] border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
                <div>
                  <span className="font-mono text-[10px] text-[#E8C49A] uppercase tracking-wider block">
                    {inspectEmail.eventType} NOTIFICATION RECORD
                  </span>
                  <h3 className="font-sans font-bold text-sm text-white truncate max-w-sm mt-0.5">
                    {inspectEmail.subject}
                  </h3>
                </div>

                <button
                  onClick={() => setInspectEmail(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-850">
                  <span className="text-zinc-500 font-mono">Recipient:</span>
                  <span className="font-bold text-white">{inspectEmail.recipientName} ({inspectEmail.recipientEmail})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-850">
                  <span className="text-zinc-500 font-mono">Status:</span>
                  <span className={`font-mono font-bold ${inspectEmail.status === 'SENT' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {inspectEmail.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-850">
                  <span className="text-zinc-500 font-mono">Sent At:</span>
                  <span className="font-mono text-zinc-300">{new Date(inspectEmail.sentAt).toLocaleString()}</span>
                </div>
                {inspectEmail.bookingId && (
                  <div className="flex justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-500 font-mono">Booking ID:</span>
                    <span className="font-mono text-[#E8C49A]">{inspectEmail.bookingId}</span>
                  </div>
                )}
                {inspectEmail.errorMessage && (
                  <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-lg text-red-300 text-xs font-mono">
                    {inspectEmail.errorMessage}
                  </div>
                )}
              </div>

              {/* Rendered HTML */}
              <div className="flex-1 overflow-y-auto bg-black border border-zinc-800 rounded-xl p-4 text-xs">
                <div dangerouslySetInnerHTML={{ __html: inspectEmail.htmlBody || inspectEmail.message }} />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectEmail(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-mono uppercase"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
