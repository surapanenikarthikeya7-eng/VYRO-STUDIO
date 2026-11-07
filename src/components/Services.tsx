import { motion } from 'motion/react';
import { Check, Sparkles, Video, Camera, Instagram, Film } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface ServicesProps {
  onOpenBookingWithService: (service: string) => void;
}

export default function Services({ onOpenBookingWithService }: ServicesProps) {
  const { services } = useStudio();

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'reels_editing':
        return <Instagram className="w-6 h-6 text-[#E8C49A]" />;
      case 'videography':
        return <Film className="w-6 h-6 text-[#E8C49A]" />;
      case 'photography':
        return <Camera className="w-6 h-6 text-[#E8C49A]" />;
      default:
        return <Sparkles className="w-6 h-6 text-[#E8C49A]" />;
    }
  };

  return (
    <section id="services" className="py-24 bg-black relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Headings */}
        <div className="text-center mb-16 space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 bg-[#171717] border border-[#E8C49A]/30 px-3.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] text-[#E8C49A]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            STUDIO SERVICE SPECS
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-sans font-bold tracking-tight text-white uppercase"
          >
            PREMIUM <span className="text-[#E8C49A]">SERVICES</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto font-sans text-xs md:text-sm text-zinc-400 tracking-wide"
          >
            Production workflows, ultra-high-definition delivery, and tailored packages for creators, corporate events, and wedding memoirs.
          </motion.p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
          {services.map((service, idx) => {
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col justify-between bg-[#171717] border rounded-2xl p-6 md:p-8 overflow-hidden backdrop-blur-md transition-all duration-300 group ${
                  service.isPopular
                    ? 'border-[#E8C49A] shadow-[0_8px_30px_rgba(232,196,154,0.15)]'
                    : 'border-zinc-850 hover:border-[#E8C49A]/50'
                }`}
              >
                {/* Gold Top Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8C49A] to-transparent ${service.isPopular ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} transition-opacity`} />
                
                <div>
                  {service.isPopular && (
                    <span className="absolute top-4 right-4 bg-[#E8C49A] text-black font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded">
                      FEATURED
                    </span>
                  )}

                  <div className="w-12 h-12 rounded-xl bg-black border border-[#E8C49A]/20 flex items-center justify-center mb-6 group-hover:border-[#E8C49A]/50 transition-colors">
                    {getServiceIcon(service.id)}
                  </div>

                  <h3 className="text-lg md:text-xl font-sans font-bold text-white tracking-widest uppercase mb-1.5 group-hover:text-[#E8C49A] transition-colors">
                    {service.title}
                  </h3>

                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-2xl md:text-3xl font-sans font-extrabold text-white tracking-tight">
                      {service.priceRange}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">/ TIMELINES</span>
                  </div>

                  <hr className="border-zinc-800 mb-6" />

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <span className="p-0.5 bg-[#E8C49A]/10 border border-[#E8C49A]/30 text-[#E8C49A] rounded mt-0.5 shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Button */}
                <button
                  onClick={() => onOpenBookingWithService(service.id.toUpperCase())}
                  className={`w-full py-3 rounded-xl font-sans font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
                    service.isPopular
                      ? 'bg-[#E8C49A] hover:bg-[#d8b488] text-black shadow-[0_4px_20px_rgba(232,196,154,0.25)]'
                      : 'bg-black hover:bg-[#171717] border border-zinc-800 hover:border-[#E8C49A]/50 text-white hover:text-[#E8C49A]'
                  }`}
                >
                  Book Slot
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
