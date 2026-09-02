import React from 'react';
import { Shield, Activity, Cpu, AlertTriangle, CheckCircle2, RotateCcw, Radio } from 'lucide-react';

export default function Header({ status, isInvestigating, onReset, stationId = "STATION-TIRE-FITTER-01" }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Station Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg text-white tracking-wide">ReliAI</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                HARNESS v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Industrial Investigation & Anti-Hallucination Command Center</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs font-mono text-slate-400">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>CELL: <strong className="text-slate-200">{stationId}</strong></span>
        </div>
      </div>

      {/* Operational Status Pill & Controls */}
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          {isInvestigating ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-indigo-400 font-semibold">AGENTS DELIBERATING...</span>
            </>
          ) : status === "INCONCLUSIVE_CONTRADICTIONS" ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-semibold">CONTRADICTIONS DETECTED</span>
            </>
          ) : status === "APPROVED" ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">MITIGATION APPROVED</span>
            </>
          ) : status === "PENDING_APPROVAL" ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-semibold">PENDING SIGN-OFF</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 font-semibold">SYSTEM NOMINAL</span>
            </>
          )}
        </div>

        {/* Reset / Reload Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition"
          title="Reset Active Incident"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
