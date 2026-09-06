import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Cpu,
  Bell,
  Sliders,
  Check,
  RotateCcw,
  LogOut,
  ChevronLeft,
  Sparkles,
  Zap,
  Volume2,
  Activity,
  HardDrive,
  Clock,
  KeyRound,
  Building2,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { logoutUser } from '../services/firebase';

export default function SettingsPage({
  user,
  onBack,
  onSignOutSuccess
}) {
  // Active sub-section filter: 'all' | 'profile' | 'ai' | 'preferences'
  const [activeFilter, setActiveFilter] = useState('all');

  // Configurable states (curated, uncluttered)
  const [llmEngine, setLlmEngine] = useState('gemma'); // 'gemma' | 'gemini'
  const [adversarialCritic, setAdversarialCritic] = useState(true);
  const [approvalThreshold, setApprovalThreshold] = useState(90);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User display metadata
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : "Alex Morgan");
  const displayEmail = user?.email || "alex.morgan@reliai.io";
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      await logoutUser();
      if (onSignOutSuccess) onSignOutSuccess();
    } catch (err) {
      console.warn("Sign out triggered:", err);
    }
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  const handleReset = () => {
    setLlmEngine('gemma');
    setAdversarialCritic(true);
    setApprovalThreshold(90);
    setSoundAlerts(true);
    setAutoRefresh(true);
    setAuditLogging(true);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1800);
  };

  return (
    <div className="flex-1 min-w-0 h-full overflow-y-auto select-text px-3 py-4 sm:px-6 sm:py-6">
      {/* Center-aligned constrained container */}
      <div className="max-w-3xl mx-auto space-y-5 pb-8 animate-in fade-in duration-200">

        {/* 1. TOP HEADER & NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1.5 rounded-[9px] bg-white hover:bg-[#faeee5] border border-slate-200 hover:border-[#f5cdb6] text-slate-700 hover:text-[#c8764b] text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs group"
              title="Return to Dashboard"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition shrink-0" />
              <span>Back</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Settings & Profile
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#faeee5] text-[#c8764b] border border-[#efc4ab] text-[10px] font-mono font-bold">
                  v2.4 Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Manage operator credentials, reasoning parameters, and station telemetry
              </p>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-[10px] bg-slate-100/90 border border-slate-200/80 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer font-medium ${
                activeFilter === 'all'
                  ? 'bg-white text-[#c8764b] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('profile')}
              className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer font-medium ${
                activeFilter === 'profile'
                  ? 'bg-white text-[#c8764b] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ai')}
              className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer font-medium ${
                activeFilter === 'ai'
                  ? 'bg-white text-[#c8764b] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI & Reasoning
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('preferences')}
              className={`px-2.5 py-1 rounded-[7px] transition cursor-pointer font-medium ${
                activeFilter === 'preferences'
                  ? 'bg-white text-[#c8764b] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Preferences
            </button>
          </div>
        </div>

        {/* 2. OPERATOR PROFILE CARD */}
        {(activeFilter === 'all' || activeFilter === 'profile') && (
          <section className="bg-white rounded-[14px] border border-slate-200/90 p-5 shadow-xs transition-all space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {/* Avatar Badge */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f8dfd0] to-[#d98555] flex items-center justify-center text-white font-bold font-mono text-xl shadow-xs border border-white/80">
                    {initials}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse"
                    title="Operator Online"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                      {displayName}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      ISO-10218 Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#c8764b] font-mono font-medium">
                    Lead Systems Engineer & Automation Specialist
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {displayEmail}
                  </p>
                </div>
              </div>

              {/* Sign Out Action */}
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-[8px] bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="End Active Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Operator Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 font-mono text-xs">
              <div className="p-3 rounded-[10px] bg-[#fdfbf9] border border-[#f3e5db]/80">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#d98555]" /> Assigned Station
                </div>
                <div className="font-semibold text-slate-800 mt-1 truncate">STATION-TIRE-01</div>
                <div className="text-[10px] text-slate-400 mt-0.5">KUKA KR-210 Prime Cell</div>
              </div>

              <div className="p-3 rounded-[10px] bg-[#fdfbf9] border border-[#f3e5db]/80">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-[#d98555]" /> Access Clearance
                </div>
                <div className="font-semibold text-slate-800 mt-1">Level 4 Admin</div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Emergency Stop Override</div>
              </div>

              <div className="p-3 rounded-[10px] bg-[#fdfbf9] border border-[#f3e5db]/80">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#d98555]" /> Shift Schedule
                </div>
                <div className="font-semibold text-slate-800 mt-1">Day Shift (08:00 - 16:00)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Automotive Final Assembly</div>
              </div>
            </div>
          </section>
        )}

        {/* 3. AI & REASONING ENGINE SETTINGS */}
        {(activeFilter === 'all' || activeFilter === 'ai') && (
          <section className="bg-white rounded-[14px] border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#d98555]" />
                  AI Reasoning Engine
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Configure local Metal GPU inference and multi-agent debate parameters
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                Metal GPU Active
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Diagnostic Model Selector */}
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Primary Diagnostic LLM</span>
                  <span className="text-[10px] text-slate-400">Zero Cloud Data Leakage</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLlmEngine('gemma')}
                    className={`p-2.5 rounded-[8px] border text-left flex items-center justify-between transition cursor-pointer ${
                      llmEngine === 'gemma'
                        ? 'bg-white border-[#d98555] text-[#c8764b] ring-2 ring-[#d98555]/15 font-bold shadow-2xs'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Gemma-2 9B (Local GPU)</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">Ollama Metal Backend • &lt;200ms latency</div>
                    </div>
                    {llmEngine === 'gemma' && <Check className="w-4 h-4 text-[#d98555] shrink-0 ml-2" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLlmEngine('gemini')}
                    className={`p-2.5 rounded-[8px] border text-left flex items-center justify-between transition cursor-pointer ${
                      llmEngine === 'gemini'
                        ? 'bg-white border-[#d98555] text-[#c8764b] ring-2 ring-[#d98555]/15 font-bold shadow-2xs'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Gemini 2.5 Flash (Cloud API)</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">Advanced Complex Incident Synthesis</div>
                    </div>
                    {llmEngine === 'gemini' && <Check className="w-4 h-4 text-[#d98555] shrink-0 ml-2" />}
                  </button>
                </div>
              </div>

              {/* Adversarial Critic Toggle */}
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Adversarial Critic Verification</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Agent DAG actively challenges hypotheses against OEM ISO specs before verdict
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAdversarialCritic(!adversarialCritic)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 flex items-center shrink-0 ${
                    adversarialCritic ? 'bg-[#d98555]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      adversarialCritic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Confidence Threshold */}
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Automated Human Sign-off Confidence</span>
                  <span className="font-bold text-[#c8764b] bg-[#faeee5] px-2 py-0.5 rounded border border-[#efc4ab] text-[11px]">
                    {approvalThreshold}% Minimum
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="98"
                  step="1"
                  value={approvalThreshold}
                  onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                  className="w-full accent-[#d98555] cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>75% (Fast-pass)</span>
                  <span>90% (Industry Standard)</span>
                  <span>98% (Mission Critical)</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. STATION & TELEMETRY PREFERENCES */}
        {(activeFilter === 'all' || activeFilter === 'preferences') && (
          <section className="bg-white rounded-[14px] border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#d98555]" />
                Station Telemetry & Alerts
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Control audio warnings, stream refresh, and compliance records
              </p>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {/* Sound Alerts */}
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Audible Fault Chime</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Sound audio warning when sensor anomalies cross critical ISO thresholds
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundAlerts(!soundAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 flex items-center shrink-0 ${
                    soundAlerts ? 'bg-[#d98555]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Refresh */}
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Live 1000 Hz EtherCAT Telemetry</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Synchronize real-time vibration & thermal ring buffers automatically
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 flex items-center shrink-0 ${
                    autoRefresh ? 'bg-[#d98555]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      autoRefresh ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Audit Logging */}
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Immutable Audit Log Export</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Preserve tamper-proof incident verdicts with SHA-256 digital signatures
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditLogging(!auditLogging)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 flex items-center shrink-0 ${
                    auditLogging ? 'bg-[#d98555]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      auditLogging ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 5. FOOTER ACTIONS */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-[8px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2.5">
            {savedSuccess && (
              <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Preferences Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-[9px] bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b8663b] text-white font-mono font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
