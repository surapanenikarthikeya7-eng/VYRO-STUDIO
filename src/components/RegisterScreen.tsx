import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps) {
  const { registerWithEmail } = useAuth();
  const { settings } = useStudio();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Real-time password strength calculation
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-zinc-800' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'WEAK', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'FAIR', color: 'bg-amber-500' };
    if (score === 3 || score === 4) return { score: 3, label: 'STRONG', color: 'bg-[#E8C49A]' };
    return { score: 4, label: 'EXCELLENT', color: 'bg-emerald-400' };
  }, [password]);

  // Passwords match validation
  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Email validation (supports all email domains)
  const isEmailValid = useMemo(() => {
    if (!email) return null;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !isEmailValid) {
      setError('Please provide a valid email address (e.g. yourname@gmail.com).');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(name, email, password);
      setSuccess(true);
    } catch (err: any) {
      setSuccess(false);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-[#E8C49A]/30">
      
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#E8C49A]/5 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <button
          onClick={onNavigateToLogin}
          className="mb-6 inline-flex items-center gap-2 text-xs font-mono tracking-wider text-zinc-400 hover:text-[#E8C49A] transition-colors cursor-pointer uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 p-1 rounded-2xl bg-[#171717] border border-[#E8C49A]/30 flex items-center justify-center mb-3">
            <img
              src={settings.logoUrl || '/assets/aistudio/image_35d6318c.png'}
              alt="VYRO STUDIO"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#E8C49A]">
            NEW MEMBER ENROLLMENT
          </span>
          <h1 className="text-2xl font-sans font-bold tracking-widest text-white uppercase mt-0.5">
            CREATE <span className="text-[#E8C49A]">ACCOUNT</span>
          </h1>
          <p className="text-xs text-zinc-400 font-sans tracking-wide mt-1">
            Join the VYRO STUDIO collective to access exclusive cinematics & reserve production slots.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#171717]/85 backdrop-blur-xl border border-[#E8C49A]/20 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative">
          
          <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#E8C49A]/50 to-transparent" />

          {/* Success Notification */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-center mb-6 space-y-2"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-sans font-bold text-sm tracking-wide text-white uppercase">
                  Account Created Successfully!
                </h4>
                <p className="text-xs text-emerald-300">
                  Welcome to VYRO STUDIO. Redirecting you to sign in...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Notification */}
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

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full bg-[#000000]/80 border border-zinc-800 rounded-xl px-4 py-3 pl-11 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8C49A] transition-colors font-sans"
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                    Email Address
                  </label>
                  {email && isEmailValid !== null && (
                    <span className={`text-[10px] font-mono ${isEmailValid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isEmailValid ? 'VALID' : 'INVALID FORMAT'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com or email"
                    required
                    className={`w-full bg-[#000000]/80 border rounded-xl px-4 py-3 pl-11 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors font-sans ${
                      email && isEmailValid === false ? 'border-red-500/60' : 'border-zinc-800 focus:border-[#E8C49A]'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">STRENGTH</span>
                      <span className="text-[#E8C49A] font-bold">{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strength.score >= step ? strength.color : 'bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                    Confirm Password
                  </label>
                  {confirmPassword && passwordsMatch !== null && (
                    <span className={`text-[10px] font-mono ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                      {passwordsMatch ? 'MATCHED' : 'DOES NOT MATCH'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className={`w-full bg-[#000000]/80 border rounded-xl px-4 py-3 pl-11 pr-11 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors font-sans ${
                      confirmPassword && !passwordsMatch ? 'border-red-500/60' : 'border-zinc-800 focus:border-[#E8C49A]'
                    }`}
                  />
                  <ShieldCheck className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || (confirmPassword ? !passwordsMatch : false)}
                className="w-full mt-3 bg-[#E8C49A] hover:bg-[#d8b488] active:scale-[0.99] text-[#000000] font-sans font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,196,154,0.25)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    CREATING SECURE ACCOUNT...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>
          )}

          {/* Already have account */}
          <div className="mt-6 pt-5 border-t border-zinc-850/60 text-center">
            <p className="text-xs text-zinc-400 font-sans">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="mt-2 text-xs font-semibold text-[#E8C49A] hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
            >
              Sign In Instead
            </button>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
