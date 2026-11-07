import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Film, Eye, Sparkles } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { PortfolioItem } from '../types';

export default function Portfolio() {
  const { portfolio } = useStudio();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeVideo, setActiveVideo] = useState<PortfolioItem | null>(null);
  const [activePhoto, setActivePhoto] = useState<PortfolioItem | null>(null);

  const categories = [
    { label: 'All Works', value: 'ALL' },
    { label: 'Cinematic Videography', value: 'Cinematic Videos' },
    { label: 'Wedding Films', value: 'Weddings' },
    { label: 'Event Photography', value: 'Events' },
    { label: 'Reels & Shorts', value: 'Reels' },
    { label: 'Portraits', value: 'Portraits' },
  ];

  const filteredItems = selectedCategory === 'ALL'
    ? portfolio
    : portfolio.filter((item) => item.category === selectedCategory);

  const handleItemClick = (item: PortfolioItem) => {
    if (item.videoUrl) {
      setActiveVideo(item);
    } else {
      setActivePhoto(item);
    }
  };

  return (
    <section id="portfolio" className="py-24 bg-black relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Headings */}
        <div className="text-center mb-16 space-y-3">
          <span className="font-mono text-xs text-[#E8C49A] uppercase tracking-[0.25em]">
            CURATED VISUAL ARTS SHOWROOM
          </span>
          <h2 className="text-3xl md:text-5xl font-sans font-bold text-white tracking-widest uppercase">
            STUDIO <span className="text-[#E8C49A]">PORTFOLIO</span>
          </h2>
          <p className="max-w-xl mx-auto text-xs text-zinc-400 tracking-wide font-sans">
            Showcases of cinematic shoots, royal wedding films, brand reels, and high-fashion studio portraiture.
          </p>
        </div>

        {/* Category Filters Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full font-sans font-medium text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer border ${
                  isActive
                    ? 'bg-[#E8C49A] border-[#E8C49A] text-black font-bold shadow-[0_2px_15px_rgba(232,196,154,0.25)]'
                    : 'bg-[#171717] border-zinc-850 hover:border-[#E8C49A]/30 text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_auto]">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleItemClick(item)}
                className="break-inside-avoid relative rounded-xl overflow-hidden border border-zinc-850 group cursor-pointer bg-[#171717] hover:border-[#E8C49A]/50 transition-colors"
              >
                {/* Poster / Thumbnail */}
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <span className="font-mono text-[9px] text-[#E8C49A] font-bold uppercase tracking-widest bg-black/60 border border-[#E8C49A]/30 px-2 py-0.5 rounded w-fit mb-2">
                    {item.category}
                  </span>
                  
                  <h4 className="text-sm font-sans font-semibold text-white tracking-wide">
                    {item.title}
                  </h4>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                    {item.videoUrl ? (
                      <span className="flex items-center gap-1.5 text-[#E8C49A] font-semibold">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        PLAY PREVIEW
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <Eye className="w-3.5 h-3.5" />
                        VIEW RETOUCH
                      </span>
                    )}
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500">VYRO STUDIO</span>
                  </div>
                </div>

                {/* Top-Right Badge */}
                <div className="absolute top-3 right-3 p-1.5 bg-black/70 backdrop-blur rounded border border-white/10 text-[#E8C49A] pointer-events-none">
                  {item.videoUrl ? <Film className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Video Preview Modal */}
        <AnimatePresence>
          {activeVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveVideo(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />

              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-3xl bg-[#171717] border border-[#E8C49A]/30 rounded-2xl overflow-hidden shadow-2xl z-10"
              >
                <button
                  onClick={() => setActiveVideo(null)}
                  className="absolute top-4 right-4 z-10 text-white hover:text-[#E8C49A] transition-colors p-1.5 bg-black/60 rounded-full border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="aspect-video bg-black flex items-center justify-center relative">
                  <video
                    src={activeVideo.videoUrl}
                    autoPlay
                    controls
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-5 w-full bg-[#171717] text-left border-t border-zinc-800">
                  <span className="font-mono text-[9px] bg-black/60 border border-[#E8C49A]/20 text-[#E8C49A] px-2 py-0.5 rounded uppercase tracking-wider">
                    {activeVideo.category} • 4K MASTER RENDER
                  </span>
                  <h3 className="text-base sm:text-lg font-sans font-semibold text-white tracking-wide mt-2">
                    {activeVideo.title}
                  </h3>
                  <p className="text-zinc-500 text-[11px] font-mono mt-1">
                    VYRO STUDIO PRODUCTION ARCHIVES • COPYRIGHT © 2026
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Photo Lightbox Modal */}
        <AnimatePresence>
          {activePhoto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                exit={{ opacity: 0 }}
                onClick={() => setActivePhoto(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />

              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative max-w-3xl max-h-[85vh] bg-[#171717] border border-[#E8C49A]/30 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col"
              >
                <button
                  onClick={() => setActivePhoto(null)}
                  className="absolute top-4 right-4 z-10 text-white hover:text-[#E8C49A] transition-colors p-1.5 bg-black/60 rounded-full border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <img
                  src={activePhoto.mediaUrl}
                  alt={activePhoto.title}
                  className="w-full max-h-[68vh] object-contain bg-black"
                  referrerPolicy="no-referrer"
                />

                <div className="p-5 w-full bg-[#171717] text-left border-t border-zinc-800">
                  <span className="font-mono text-[9px] bg-black/60 border border-[#E8C49A]/20 text-[#E8C49A] px-2 py-0.5 rounded uppercase tracking-wider">
                    {activePhoto.category} • RETOUCHED STUDIO STILL
                  </span>
                  <h3 className="text-base sm:text-lg font-sans font-semibold text-white tracking-wide mt-2">
                    {activePhoto.title}
                  </h3>
                  <p className="text-zinc-500 text-[11px] font-mono mt-1">
                    HIGH DYNAMIC RANGE STILL • VYRO STUDIO PHOTO DESK
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
