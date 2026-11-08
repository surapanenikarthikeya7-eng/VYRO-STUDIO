import { Link } from 'react-router-dom';
import { Phone, Mail, Instagram, MessageCircle, ArrowUp } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { settings } = useStudio();
  const { isAdmin } = useAuth();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-black border-t border-zinc-900 text-zinc-400 py-16 relative overflow-hidden font-sans">
      
      {/* Ambient background accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-[#E8C49A]/5 rounded-full blur-[90px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Column 1: Branding & Description */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" onClick={handleScrollToTop} className="flex items-center gap-2.5 group">
              <img
                src={settings.logoUrl || '/assets/aistudio/image_35d6318c.png'}
                alt="VYRO STUDIO"
                className="w-10 h-10 object-contain rounded-lg"
              />
              <h3 className="font-sans font-bold tracking-widest text-white uppercase text-base">
                {settings.brandName || 'VYRO STUDIO'}
              </h3>
            </Link>
            
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              {settings.brandName || 'VYRO STUDIO'} specializes in premium cinematography, high-contrast luxury photography, viral social reels editing, and wedding master films.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a 
                href={`https://wa.me/${(settings.whatsapp || '918639063089').replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-[#171717] hover:bg-emerald-950/40 border border-zinc-850 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors"
                title="WhatsApp Direct"
              >
                <MessageCircle className="w-4 h-4 fill-currentColor" />
              </a>
              <a 
                href={settings.instagram || 'https://www.instagram.com/vyro_studo?obrf=MWkwbmE3ZzF5cTBqcw%3D%3D&utm_source=qr'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-[#171717] hover:bg-[#E8C49A]/15 border border-zinc-850 rounded-lg text-zinc-400 hover:text-[#E8C49A] transition-colors"
                title="Instagram Profile"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#E8C49A]">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => handleScrollToSection('home')} className="hover:text-[#E8C49A] transition-colors cursor-pointer text-left">
                  Home Showcase
                </button>
              </li>
              <li>
                <button onClick={() => handleScrollToSection('services')} className="hover:text-[#E8C49A] transition-colors cursor-pointer text-left">
                  Service Packages
                </button>
              </li>
              <li>
                <Link to="/portfolio" onClick={handleScrollToTop} className="hover:text-[#E8C49A] transition-colors cursor-pointer text-left block">
                  Cinematic Portfolio
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={handleScrollToTop} className="hover:text-[#E8C49A] transition-colors cursor-pointer text-left block">
                  Inquiry Desk & Contact
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className="hover:text-[#E8C49A] transition-colors">
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Contact details */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#E8C49A]">
              Studio Inquiries
            </h4>
            
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E8C49A]" />
                <span className="text-zinc-500 font-mono text-[11px]">Phone:</span>
                <a href={`tel:${settings.phone || '8639063089'}`} className="hover:text-white transition-colors">
                  {settings.phone || '8639063089'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10" />
                <span className="text-zinc-500 font-mono text-[11px]">WhatsApp:</span>
                <a href={`https://wa.me/${(settings.whatsapp || '918639063089').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {settings.whatsapp || '+91 8639063089'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E8C49A]" />
                <span className="text-zinc-500 font-mono text-[11px]">Gmail:</span>
                <a href={`mailto:${settings.email || 'vyrostudo@gmail.com'}`} className="text-zinc-300 hover:text-white transition-colors">
                  {settings.email || 'vyrostudo@gmail.com'}
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Closing details */}
        <div className="pt-10 mt-12 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-end gap-4 text-[10px] text-zinc-500 font-mono">
          <button
            onClick={handleScrollToTop}
            className="flex items-center gap-1.5 hover:text-white uppercase tracking-wider transition-colors cursor-pointer ml-auto"
          >
            BACK TO TOP
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
