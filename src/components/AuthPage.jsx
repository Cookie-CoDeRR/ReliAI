import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../services/firebase';
import '../landing.css';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const AtIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg>;
const LockIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ShieldIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
const ZapIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const UsersIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const LogoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const ArrowRightIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/></svg>;
const BackIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/></svg>;
const WarningIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

// ─── Google Icon ─────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function AuthInput({ label, type, value, onChange, placeholder, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className={`relative flex items-center rounded-[9px] border transition-all duration-200 bg-white ${focused ? 'border-[#d98555] shadow-[0_0_0_3px_rgba(217,133,85,0.12)]' : 'border-[#ecd7c7]'}`}>
        {icon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 outline-none rounded-[9px] font-body"
          style={{ paddingLeft: icon ? '2.5rem' : '1rem' }}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
        />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AuthPage({ onSuccess, onBack }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (mode === 'login') {
      result = await loginWithEmail(email, password);
    } else {
      result = await registerWithEmail(email, password, displayName);
    }

    setLoading(false);

    if (result.success) {
      onSuccess(result.user);
    } else {
      // Make Firebase error messages friendlier
      const msg = result.error || 'Authentication failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password.');
      } else if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError(msg);
      }
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success) {
      onSuccess(result.user);
    } else {
      setError(result.error || 'Google sign-in failed.');
    }
  };

  return (
    <div className="landing-body min-h-screen bg-[#fcfaf8] flex overflow-auto">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative overflow-hidden flex-col justify-between p-12">
        {/* Background animated grid */}
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(217,133,85,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(217,133,85,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(217,133,85,0.11)_0%,transparent_65%)]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,118,75,0.08)_0%,transparent_70%)]" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#d98555] to-[#c8764b] flex items-center justify-center text-white shadow-md">
            <LogoIcon />
          </div>
          <span className="font-heading font-black text-2xl tracking-tight text-white">
            Reli<span className="text-[#d98555]">AI</span>
          </span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <blockquote className="text-2xl sm:text-3xl font-extrabold font-heading text-white leading-tight mb-4">
            "An AI that doesn't just generate a root cause — it <span className="text-[#d98555]">investigates</span>, challenges, and <span className="text-[#d98555]">validates</span>."
          </blockquote>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Multi-agent investigation harness for robotic manufacturing lines. Runs fully on-device with zero data leakage.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3.5">
            {[
              { icon: <ShieldIcon />, text: "Adversarial Critic Agent — no false positives" },
              { icon: <LockIcon />, text: "Air-gapped · Apple Silicon Metal" },
              { icon: <ZapIcon />, text: "Root cause in under 5 seconds" },
              { icon: <UsersIcon />, text: "Human-in-the-Loop approval gate" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="text-[#d98555] flex-shrink-0">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live terminal snippet */}
        <div className="relative z-10">
          <div className="bg-black/40 border border-white/10 rounded-[10px] p-4 font-mono text-[11px]">
            <p className="text-slate-500 mb-1"># Investigation result</p>
            <p><span className="text-emerald-400">VERDICT</span> <span className="text-slate-400">→</span> <span className="text-white">Harmonic drive failure confirmed</span></p>
            <p><span className="text-[#d98555]">CONFIDENCE</span> <span className="text-slate-400">:</span> <span className="text-emerald-300">88.5%</span> <span className="text-slate-500">· Human gate: PENDING</span></p>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-12 py-16 min-h-screen">
        {/* Back button */}
        <div className="w-full max-w-sm mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium">
            <BackIcon />
            Back to landing
          </button>
        </div>

        <div className="w-full max-w-sm">
          {/* Logo on mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[#d98555] to-[#c8764b] flex items-center justify-center text-white">
              <LogoIcon />
            </div>
            <span className="font-heading font-black text-xl text-slate-900">Reli<span className="text-[#d98555]">AI</span></span>
          </div>

          {/* Header */}
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 mb-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-500 mb-7">
            {mode === 'login'
              ? "Access the ReliAI command center."
              : "Join ReliAI to monitor your industrial fleet."}
          </p>

          {/* Tab toggle */}
          <div className="flex items-center bg-slate-100 rounded-[9px] p-0.5 mb-7">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-[8px] transition-all cursor-pointer ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-[8px] transition-all cursor-pointer ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Register
            </button>
          </div>

          {/* Google sign-in */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-[#ecd7c7] hover:border-[#d98555]/40 hover:bg-[#fdfaf8] rounded-[9px] text-sm font-semibold text-slate-700 shadow-xs transition-all mb-5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#ecd7c7]" />
            <span className="text-[11px] font-mono text-slate-400">or with email</span>
            <div className="flex-1 h-px bg-[#ecd7c7]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <AuthInput
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                icon={<UserIcon />}
              />
            )}
            <AuthInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@factory.com"
              icon={<AtIcon />}
            />
            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<LockIcon />}
            />

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-[8px] text-rose-700 text-sm">
                <span className="text-rose-500 mt-0.5"><WarningIcon /></span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#d98555] hover:bg-[#c8764b] disabled:bg-[#e5b899] text-white font-bold rounded-[9px] text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none mt-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to ReliAI' : 'Create Account'}</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Skip auth */}
          <p className="text-center text-[11px] text-slate-400 mt-6">
            Don't have an account?{' '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-[#d98555] font-semibold hover:underline cursor-pointer">
              {mode === 'login' ? 'Register instead' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
