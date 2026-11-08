/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ContactSection from './ContactSection';

export default function ContactPage({
  onOpenBooking
}: {
  onOpenBooking?: (service?: string) => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E8C49A]/30 pt-28 pb-16">
      
      {/* Top Breadcrumb & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase text-zinc-400 hover:text-[#E8C49A] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Studio Home</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>INQUIRY DESK ACTIVE • 24/7 PROPOSAL REVIEW</span>
          </div>
        </div>
      </div>

      {/* Main Connect With Us / Direct Inquiry Desk Section */}
      <ContactSection />
    </div>
  );
}
