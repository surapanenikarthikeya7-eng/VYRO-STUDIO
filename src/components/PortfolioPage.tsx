/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Film } from 'lucide-react';
import Portfolio from './Portfolio';

export default function PortfolioPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E8C49A]/30 pt-28 pb-16">
      
      {/* Top Breadcrumb & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase text-zinc-400 hover:text-[#E8C49A] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Studio Home</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <Film className="w-3.5 h-3.5 text-[#E8C49A]" />
            <span>4K CINEMATIC ARCHIVES & RETOUCHED GALLERIES</span>
          </div>
        </div>
      </div>

      {/* Main Curated Showcase & Filters */}
      <Portfolio />
    </div>
  );
}
