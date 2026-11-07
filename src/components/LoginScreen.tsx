import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onNavigateToRegister }: LoginScreenProps) {
  const { loginWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const { settings } = useStudio();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your Gmail and password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid Gmail address.');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Could not send reset email. Verify address.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-[#E8C49A]/30">
      
      {/* Background Studio Vignette & Subtle Warm Gold Spotlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#E8C49A]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[300px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 relative group"
          >
            <div className="w-24 h-24 p-1.5 rounded-2xl bg-[#171717] border border-[#E8C49A]/30 flex items-center justify-center shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
              <img
                src={settings.logoUrl || '/assets/aistudio/image_35d6318c.png'}
                alt="VYRO STUDIO"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </motion.div>

          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#E8C49A]">
            PORTAL ACCESS • MEMBERS ONLY
          </span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-widest text-white uppercase mt-1">
            VYRO <span className="text-[#E8C49A]">STUDIO</span>
          </h1>
          <p className="text-xs text-zinc-400 font-sans tracking-wide mt-1.5">
            Sign in to access curated visual portfolios and book premier studio slots.
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-[#171717]/80 backdrop-blur-xl border border-[#E8C49A]/20 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative">
          
          {/* Subtle top gold accent line */}
          <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#E8C49A]/50 to-transparent" />

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 font-sans"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Gmail Input */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                Gmail Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="w-full bg-[#000000]/80 border border-zinc-800 rounded-xl px-4 py-3 pl-11 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8C49A] transition-colors font-sans"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[11px] text-[#E8C49A] hover:text-white transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#000000]/80 border border-zinc-800 rounded-xl px-4 py-3 pl-11 pr-11 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8C49A] transition-colors font-sans"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#E8C49A] hover:bg-[#d8b488] active:scale-[0.99] text-[#000000] font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,196,154,0.25)] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  LOGIN <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <span className="relative bg-[#171717] px-3 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              OR CONTINUE WITH
            </span>
          </div>

          {/* Google One-Click Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-[#000000] hover:bg-zinc-900 border border-zinc-800 hover:border-[#E8C49A]/40 text-white text-xs font-sans font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            {googleLoading ? 'Connecting Google Account...' : 'Continue with Google Account'}
          </button>

          {/* Create Account Prompt */}
          <div className="mt-6 pt-5 border-t border-zinc-850/60 text-center">
            <p className="text-xs text-zinc-400 font-sans">
              Don't have an account yet?
            </p>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="mt-2 w-full bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-[#E8C49A]/30 text-[#E8C49A] font-sans font-semibold text-xs tracking-wider uppercase py-2.5 rounded-xl transition-all cursor-pointer"
            >
              CREATE ACCOUNT
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <p className="mt-8 text-center text-[10px] font-mono text-zinc-600 tracking-widest uppercase">
          VYRO STUDIO © 2026 • HIGH FIDELITY VISUAL PRODUCTION
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setForgotOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#171717] border border-[#E8C49A]/30 rounded-2xl p-6 shadow-2xl z-10 text-white"
            >
              <div className="w-10 h-10 rounded-full bg-[#E8C49A]/10 border border-[#E8C49A]/30 flex items-center justify-center mb-4 text-[#E8C49A]">
                <KeyRound className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-sans font-bold text-white tracking-wide">
                Reset Password
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your registered Gmail address. We'll send an official Firebase recovery link.
              </p>

              {resetSent ? (
                <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>Recovery link sent! Please inspect your Gmail inbox and spam folder.</span>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                  {resetError && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                      {resetError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                      Gmail Address
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      required
                      className="w-full bg-[#000000] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8C49A]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="flex-1 py-2.5 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 py-2.5 bg-[#E8C49A] hover:bg-[#d8b488] text-black rounded-lg text-xs font-bold font-sans uppercase tracking-wider disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>
              )}

              {resetSent && (
                <button
                  onClick={() => {
                    setForgotOpen(false);
                    setResetSent(false);
                  }}
                  className="w-full mt-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-mono uppercase text-[#E8C49A]"
                >
                  Close
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
