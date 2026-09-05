import React from 'react';
import { Shield, RotateCcw, Radio, Clock, BarChart3, Sparkles } from 'lucide-react';

export default function Header({ status, isInvestigating, onReset, onOpenHistory, onOpenAnalytics, stationId = "STATION-TIRE-FITTER-01" }) {
  const meta = isInvestigating
    ? { label: 'AGENTS ACTIVE', dot: 'bg-indigo-400 animate-pulse', text: 'text-indigo-300' }
    : status === 'INCONCLUSIVE_CONTRADICTIONS'
      ? { label: 'CONTRADICTION', dot: 'bg-amber-400', text: 'text-amber-300' }
      : status === 'APPROVED'
        ? { label: 'APPROVED', dot: 'bg-emerald-400', text: 'text-emerald-300' }
        : status === 'PENDING_APPROVAL'
          ? { label: 'PENDING SIGN-OFF', dot: 'bg-cyan-400 animate-pulse', text: 'text-cyan-300' }
          : { label: 'SYSTEM NOMINAL', dot: 'bg-emerald-400', text: 'text-emerald-300' };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#060b14]/90 backdrop-blur-xl">
      <div className="h-14 px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Shield className="w-5 h-5 text-white" />
              <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#060b14]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-[17px] text-white tracking-wide">ReliAI</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[8px] font-mono font-bold tracking-wider text-cyan-300 border border-cyan-500/25 bg-cyan-500/[0.06] px-1.5 py-0.5 rounded">
                  <Sparkles className="w-2.5 h-2.5" /> INVESTIGATION OS
                </span>
              </div>
              <div className="hidden lg:block text-[9px] text-slate-500">Evidence-grounded industrial incident intelligence</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 font-mono text-[10px] text-slate-500">
            <Radio className="w-3 h-3 text-cyan-400" /> <span>{stationId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60">
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            <span className={`text-[9px] font-mono font-semibold ${meta.text}`}>{meta.label}</span>
          </div>
          <button onClick={onOpenAnalytics} className="h-8 px-2.5 rounded-lg border border-indigo-500/25 bg-indigo-500/[0.06] text-indigo-300 hover:text-white hover:border-indigo-400/50 transition flex items-center gap-1.5 text-[10px] font-mono">
            <BarChart3 className="w-3.5 h-3.5" /><span className="hidden md:inline">Analytics</span>
          </button>
          <button onClick={onOpenHistory} className="h-8 px-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] text-cyan-300 hover:text-white hover:border-cyan-400/50 transition flex items-center gap-1.5 text-[10px] font-mono">
            <Clock className="w-3.5 h-3.5" /><span className="hidden md:inline">History</span>
          </button>
          <button onClick={onReset} className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white hover:border-slate-600 transition flex items-center justify-center" title="Reset active incident">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
