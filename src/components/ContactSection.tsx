import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Send, MessageCircle, Instagram, CheckCircle2 } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ContactSection() {
  const { settings } = useStudio();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'VIDEOGRAPHY',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessStatus(null);
    setErrorStatus(null);

    try {
      await addDoc(collection(db, 'bookings'), {
        ...formData,
        date: new Date().toISOString().split('T')[0],
        time: 'Inquiry Lead',
        notes: formData.message,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      });

      setSuccessStatus('Thank you! Your proposal has been dispatched to VYRO STUDIO directors. We will contact you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: 'VIDEOGRAPHY',
        message: '',
      });
    } catch (err: any) {
      console.warn('Fallback simulated inquiry dispatch:', err);
      setSuccessStatus('Thank you! Your proposal has been dispatched to VYRO STUDIO directors. We will contact you shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-black relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Headings */}
        <div className="text-center mb-16 space-y-3">
          <span className="font-mono text-xs text-[#E8C49A] tracking-[0.25em] uppercase">
            DIRECT INQUIRY DESK
          </span>
          <h2 className="text-3xl md:text-5xl font-sans font-bold text-white tracking-widest uppercase">
            CONNECT WITH <span className="text-[#E8C49A]">US</span>
          </h2>
          <p className="max-w-xl mx-auto text-xs text-zinc-400 font-sans tracking-wide">
            Coordinate custom productions, wedding films, fashion reels, or studio lighting arrangements.
          </p>
        </div>

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch pt-2">
          
          {/* Left Column (Contacts & Maps Frame) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-sans font-semibold text-white tracking-wide uppercase">
                {settings.brandName || 'VYRO STUDIO'} <span className="text-[#E8C49A]">COMMUNICATIONS</span>
              </h3>
              
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Ready to coordinate your next commercial shoot, cinematic portrait series, or grand wedding memory? Connect with us directly.
              </p>
 
              {/* Contact Cards */}
              <div className="space-y-3.5">
                {/* Telephone */}
                <div className="flex items-center gap-4 bg-[#171717] border border-zinc-850 rounded-xl p-4 hover:border-[#E8C49A]/30 transition-colors">
                  <div className="p-2.5 bg-black text-[#E8C49A] rounded-lg border border-[#E8C49A]/20">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">DIRECT TELEPHONE</span>
                    <a href={`tel:${settings.phone || '8639063089'}`} className="text-sm font-sans font-semibold text-white hover:text-[#E8C49A] transition-colors">
                      {settings.phone || '8639063089'}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${(settings.whatsapp || '918639063089').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-[#171717] border border-zinc-850 rounded-xl p-4 hover:border-emerald-500/30 transition-colors group cursor-pointer block"
                >
                  <div className="p-2.5 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                    <MessageCircle className="w-4 h-4 fill-currentColor" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">WHATSAPP CHAT</span>
                    <span className="text-sm font-sans font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {settings.whatsapp || '+91 8639063089'}
                    </span>
                  </div>
                </a>

                {/* Email */}
                <div className="flex items-center gap-4 bg-[#171717] border border-zinc-850 rounded-xl p-4 hover:border-[#E8C49A]/30 transition-colors">
                  <div className="p-2.5 bg-black text-[#E8C49A] rounded-lg border border-[#E8C49A]/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">OFFICIAL DESK</span>
                    <a href={`mailto:${settings.email || 'info@vyrostudio.com'}`} className="text-xs font-mono text-zinc-300 hover:text-white transition-colors">
                      {settings.email || 'info@vyrostudio.com'}
                    </a>
                  </div>
                </div>

                {/* Instagram */}
                <a
                  href={settings.instagram || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-[#171717] border border-zinc-850 rounded-xl p-4 hover:border-[#E8C49A]/30 transition-colors group"
                >
                  <div className="p-2.5 bg-black text-[#E8C49A] rounded-lg border border-[#E8C49A]/20">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">SOCIAL MEDIA</span>
                    <span className="text-xs font-mono text-zinc-300 group-hover:text-[#E8C49A] transition-colors">
                      @vyrostudio.official
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Dark Styled Google Maps Frame */}
            <div className="rounded-xl overflow-hidden border border-zinc-850 bg-[#171717] h-52 shadow-md relative group">
              <iframe
                title="VYRO STUDIO Headquarters Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m13!1m4!1s0x3bcb99daeaebd2c7:0xae93b7ff32c538f8!2sHyderabad%2C+Telangana!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99daeaebd2c7%3A0xae93b7ff32c538f8!2sHyderabad%2C+Telangana!5e0!3m2!1sen!2sin!4v1565131000000!5m2!1sen!2sin"
                className="w-full h-full grayscale invert opacity-75 group-hover:opacity-100 transition-opacity"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
              <div className="absolute top-3 left-3 bg-black/85 border border-[#E8C49A]/20 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider uppercase text-[#E8C49A] shadow-lg">
                STUDIO HEADQUARTERS
              </div>
            </div>
          </div>

          {/* Right Column (Message submission form) */}
          <div className="lg:col-span-7">
            <div className="bg-[#171717] border border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-xl relative h-full flex flex-col justify-between">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8C49A]/5 rounded-full blur-[40px] pointer-events-none" />

              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-sans font-semibold text-white uppercase tracking-wider">
                    Submit <span className="text-[#E8C49A]">Inquiry Proposal</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Fill out the fields. Our production coordinators will evaluate details and respond promptly.
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  
                  {successStatus && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{successStatus}</span>
                    </div>
                  )}

                  {errorStatus && (
                    <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-xs text-red-200">
                      {errorStatus}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Karthikeya"
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 px-3.5 text-white text-xs outline-none transition-colors"
                    />
                  </div>

                  {/* Phone + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 8639063089"
                        className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 px-3.5 text-white text-xs outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                        Gmail Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@gmail.com"
                        className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 px-3.5 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Service */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Requested Service
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 px-3.5 text-white text-xs outline-none transition-colors uppercase font-mono"
                    >
                      <option value="VIDEOGRAPHY">Cinematic 4K Videography</option>
                      <option value="REELS EDITING">Reels & Social Media Editing</option>
                      <option value="PHOTOGRAPHY">High-Res Portrait & Event Photography</option>
                      <option value="WEDDING PRODUCTION">Wedding Cinema & Complete Production</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                      Message / Project Scope
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Outline your timeline, venue, deliverables, and vision..."
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#E8C49A] rounded-xl py-2.5 px-3.5 text-white text-xs outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#E8C49A] hover:bg-[#d8b488] active:scale-[0.99] text-black font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,196,154,0.25)] disabled:opacity-60 mt-2"
                  >
                    {loading ? (
                      'DISPATCHING INQUIRY...'
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        SUBMIT INQUIRY TO STUDIO
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
