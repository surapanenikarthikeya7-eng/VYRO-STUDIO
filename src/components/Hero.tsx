import { motion } from 'motion/react';
import { Calendar, Eye } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface HeroProps {
  onOpenBooking: () => void;
  onScrollView: (id: string) => void;
}

export default function Hero({ onOpenBooking, onScrollView }: HeroProps) {
  const { settings } = useStudio();

  return (
    <section id="home" className="relative h-screen min-h-[550px] w-full flex items-center justify-center overflow-hidden bg-black font-sans">
      {/* Background Cinematic Video Loop */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 pointer-events-none"
      >
        <source
          src={settings.backgroundVideoUrl || "https://assets.mixkit.co/videos/preview/mixkit-cinematographer-shooting-at-a-studio-setting-42353-large.mp4"}
          type="video/mp4"
        />
        <source
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          type="video/mp4"
        />
      </video>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]" />

      {/* Subtle Warm Champagne Glow Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#E8C49A]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-4 mx-auto space-y-6 flex flex-col items-center">
        
        {/* Floating Accent Capsule */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-[#171717]/80 border border-[#E8C49A]/30 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#E8C49A]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8C49A] animate-ping" />
          {settings.brandName || 'VYRO STUDIO'} • {settings.tagline || 'PRESTIGE KINETICS'}
        </motion.div>

        {/* Cinematic Main Title */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-4xl sm:text-6xl md:text-7xl font-sans font-bold tracking-tight text-white leading-[1.1]"
          >
            {settings.heroTitleLine1 || 'Capture Moments.'}
            <br />
            <span className="text-[#E8C49A] font-extrabold">
              {settings.heroTitleHighlight || 'Create Stories.'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="text-sm sm:text-lg md:text-xl text-zinc-300 font-sans tracking-wide max-w-2xl mx-auto font-light"
          >
            {settings.heroSubtitle || 'Professional Photography & Cinematic Videography Services'}
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-2"
        >
          {/* CTA: Book Slots */}
          <button
            onClick={onOpenBooking}
            className="w-full sm:w-auto bg-[#E8C49A] hover:bg-[#d8b488] text-black font-sans font-bold text-xs tracking-widest uppercase px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_25px_rgba(232,196,154,0.3)] hover:scale-105 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            Book Slots
          </button>

          {/* CTA: View Portfolio */}
          <button
            onClick={() => onScrollView('portfolio')}
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/15 hover:border-[#E8C49A]/40 font-sans font-medium text-xs tracking-widest uppercase px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95"
          >
            <Eye className="w-4 h-4 text-[#E8C49A]" />
            View Portfolio
          </button>
        </motion.div>
      </div>
    </section>
  );
}
