import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle 
} from '../services/firebase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isSignUp) {
        res = await registerWithEmail(email, password, displayName);
      } else {
        res = await loginWithEmail(email, password);
      }

      if (res.success) {
        onAuthSuccess && onAuthSuccess(res.user);
        onClose();
      } else {
        // Humanize common Firebase error messages
        let msg = res.error || "Authentication failed. Please check credentials.";
        if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password")) {
          msg = "Invalid email or password. You can also use the Instant Demo Operator mode below.";
        } else if (msg.includes("auth/email-already-in-use")) {
          msg = "This email is already registered. Please sign in instead.";
        } else if (msg.includes("auth/weak-password")) {
          msg = "Password should be at least 6 characters.";
        }
        setError(msg);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      onAuthSuccess && onAuthSuccess(res.user);
      onClose();
    } else {
      setError(res.error || "Google Sign-In failed or popup was closed.");
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      uid: "demo-operator-01",
      email: "engineer@reliai.industrial",
      displayName: "Lead Reliability Engineer",
      photoURL: null,
      isAnonymous: true
    };
    onAuthSuccess && onAuthSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md overflow-hidden bg-white/95 backdrop-blur-2xl rounded-[12px] border border-white/80 shadow-2xl p-6 sm:p-8"
        style={{
          boxShadow: '0 20px 40px -15px rgba(217, 133, 85, 0.15), 0 0 0 1px rgba(236, 215, 199, 0.8)'
        }}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d98555] via-[#faeee5] to-[#c8764b]" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-gradient-to-br from-[#faeee5] to-[#eddcd0] border border-[#d98555]/30 text-[#c8764b] shadow-xs mb-3">
            <Cpu size={24} className="text-[#c8764b]" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-800">
            {isSignUp ? "Create ReliAI Account" : "Access ReliAI Console"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-body">
            {isSignUp 
              ? "Join industrial multi-agent autonomous engineering" 
              : "Sign in with your plant operator credentials"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#faeee5]/60 p-1 rounded-[8px] border border-[#ecd7c7] mb-5">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all ${
              !isSignUp 
                ? 'bg-white text-[#c8764b] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all ${
              isSignUp 
                ? 'bg-white text-[#c8764b] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed animate-shake">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Full Name / Station Call
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Mercer (Line Lead)"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#ecd7c7] rounded-[8px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d98555]/30 focus:border-[#d98555] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@plant.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#ecd7c7] rounded-[8px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d98555]/30 focus:border-[#d98555] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#ecd7c7] rounded-[8px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d98555]/30 focus:border-[#d98555] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b6653c] text-white text-xs font-semibold rounded-[8px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Authenticating with Firebase...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? "Create Plant Operator Account" : "Authenticate & Launch Console"}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#ecd7c7]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white/95 px-2 text-slate-400 font-medium tracking-wider">
              Or quick access
            </span>
          </div>
        </div>

        {/* Alternative Login Actions */}
        <div className="space-y-2">
          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 px-3 bg-white border border-[#ecd7c7] hover:bg-[#faeee5]/40 text-slate-700 text-xs font-medium rounded-[8px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Instant Demo Operator Login */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 px-3 bg-gradient-to-r from-[#faeee5] to-[#eddcd0] border border-[#d98555]/30 hover:border-[#d98555] text-[#c8764b] text-xs font-semibold rounded-[8px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles size={14} className="text-[#d98555]" />
            <span>Instant Demo Lead Engineer Mode</span>
          </button>
        </div>

        {/* Security Footer */}
        <div className="mt-5 pt-3 border-t border-[#ecd7c7]/60 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Secured via Firebase Identity & ISO-10218 RBAC</span>
        </div>
      </div>
    </div>
  );
}
