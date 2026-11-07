import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogOut, User as UserIcon, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, profile, isAdmin, logout } = useAuth();
  const { settings } = useStudio();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (id: string) => {
    setIsOpen(false);
    setUserMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const menuItems = [
    { label: 'Home', id: 'home' },
    { label: 'Services', id: 'services' },
    { label: 'Portfolio', id: 'portfolio' },
    { label: 'Contact', id: 'contact' },
  ];

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Member';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-[#E8C49A]/15 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img
            src={settings.logoUrl || '/assets/aistudio/image_35d6318c.png'}
            alt="VYRO STUDIO"
            className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
          />
          <div>
            <h1 className="font-sans font-bold tracking-widest text-[#FFFFFF] text-sm uppercase">
              {settings.brandName || 'VYRO STUDIO'}
            </h1>
            <p className="font-mono text-[8px] text-zinc-400 tracking-widest uppercase">
              CINEMATOGRAPHY & ARTS
            </p>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-7">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.id)}
              className="text-xs font-mono uppercase tracking-widest text-zinc-300 hover:text-[#E8C49A] transition-colors cursor-pointer relative py-1"
            >
              {item.label}
            </button>
          ))}

          {/* Admin Dashboard Link */}
          <Link
            to="/admin"
            className="text-xs font-mono uppercase text-[#E8C49A] hover:text-white border border-[#E8C49A]/30 hover:border-[#E8C49A] bg-[#171717] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-[#E8C49A]" />
            Dashboard
          </Link>

          {/* User Profile Capsule with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 bg-[#171717] hover:bg-zinc-900 border border-zinc-800 hover:border-[#E8C49A]/40 rounded-full pl-2 pr-3 py-1 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#E8C49A] text-black font-bold text-[10px] flex items-center justify-center uppercase">
                {displayName.charAt(0)}
              </div>
              <span className="text-xs font-sans font-medium text-white max-w-[100px] truncate">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-[#171717] border border-[#E8C49A]/20 rounded-xl p-2 shadow-2xl z-50 text-white"
                >
                  <div className="px-3 py-2 border-b border-zinc-800/80">
                    <p className="text-xs font-sans font-bold text-white truncate">{displayName}</p>
                    <p className="text-[10px] font-mono text-zinc-400 truncate">{user?.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 font-mono text-[9px] bg-[#E8C49A]/20 text-[#E8C49A] px-1.5 py-0.5 rounded uppercase">
                        Studio Admin
                      </span>
                    )}
                  </div>

                  <Link
                    to="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-sans text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg mt-1"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#E8C49A]" />
                    Admin Control Desk
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-sans text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/admin"
            className="text-[10px] font-mono uppercase text-[#E8C49A] border border-[#E8C49A]/30 px-2.5 py-1 rounded bg-[#171717]"
          >
            Admin
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white focus:outline-none p-1.5 hover:bg-zinc-900 rounded"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-black/95 border-b border-[#E8C49A]/20 backdrop-blur-xl py-6 px-4 flex flex-col gap-3 md:hidden"
        >
          <div className="pb-3 border-b border-zinc-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{displayName}</p>
              <p className="text-[10px] font-mono text-zinc-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-mono text-red-400 flex items-center gap-1 uppercase"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.id)}
              className="text-left font-sans font-medium text-sm text-zinc-300 hover:text-[#E8C49A] py-1.5 uppercase tracking-wider"
            >
              {item.label}
            </button>
          ))}

          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className="text-center font-mono text-xs uppercase bg-[#171717] text-[#E8C49A] border border-[#E8C49A]/30 rounded-lg py-2.5 mt-2"
          >
            ADMIN CONTROL PANEL
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
