import React from 'react';
import { GitCommit, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function CriticDebateView({ rootCause = null, criticReport = null, isInvestigating = false }) {
  if (isInvestigating && (!rootCause || !criticReport)) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        {/* Top Shimmer Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Adversarial Debate & Anti-Hallucination Critic Loop</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>AI HYPOTHESIS & CRITIC DELIBERATION IN FLIGHT...</span>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Skeleton: Root Cause Generator */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-800 rounded w-48" />
              <div className="h-4 bg-slate-800 rounded w-16" />
            </div>
            <div className="h-5 bg-slate-800/90 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-800/60 rounded w-full" />
              <div className="h-3 bg-slate-800/60 rounded w-5/6" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-slate-800/40 rounded w-32" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-800" />
                <div className="h-3 bg-slate-800/50 rounded grow" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-800" />
                <div className="h-3 bg-slate-800/50 rounded grow" />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800/60 flex items-center gap-2">
              <div className="h-4 bg-slate-800/50 rounded w-20" />
              <div className="h-4 bg-cyan-950/40 border border-cyan-800/40 rounded w-16" />
              <div className="h-4 bg-cyan-950/40 border border-cyan-800/40 rounded w-16" />
            </div>
          </div>

          {/* Right Skeleton: Adversarial Critic */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-800 rounded w-44" />
              <div className="h-4 bg-slate-800 rounded w-20" />
            </div>
            <div className="h-5 bg-amber-950/30 border border-amber-800/30 rounded w-2/3" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-800/60 rounded w-full" />
              <div className="h-3 bg-slate-800/60 rounded w-4/5" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-slate-800/40 rounded w-36" />
              <div className="h-10 bg-slate-800/40 rounded w-full" />
            </div>
            <div className="pt-3 border-t border-slate-800/60 flex items-center gap-2">
              <div className="h-4 bg-slate-800/50 rounded w-28" />
              <div className="h-4 bg-emerald-950/40 border border-emerald-800/40 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rootCause && !criticReport) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-slate-800 text-center text-slate-500 font-mono text-xs">
        Select a scenario or trigger investigation to view the Adversarial Reasoning Debate.
      </div>
    );
  }

  const hasContradictions = criticReport?.contradictions_detected?.length > 0;

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Adversarial Debate & Anti-Hallucination Critic Loop</span>
        </div>
        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border font-bold ${
          hasContradictions 
            ? 'bg-rose-950 text-rose-300 border-rose-800' 
            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
        }`}>
          {hasContradictions ? 'CONTRADICTION DETECTED — AI REFUSAL ENFORCED' : 'CROSS-VALIDATED CONSISTENT'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Generator Hypothesis */}
        <div className="bg-slate-900/90 rounded-lg p-3.5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-indigo-400 mb-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" />
                Root Cause Hypothesis (Generator)
              </span>
              <span className="text-slate-400 font-normal">Score: {rootCause?.preliminary_confidence || 85}%</span>
            </div>

            <h3 className="font-heading font-bold text-sm text-white mb-1.5">
              {rootCause?.title || "Evaluating Telemetry..."}
            </h3>
            <p className="text-xs text-slate-300 font-mono leading-5 mb-2">
              {rootCause?.description || "Awaiting multi-agent telemetry synthesis."}
            </p>

            {/* Causal Chain */}
            {rootCause?.causal_chain && (
              <div className="space-y-1 mb-3">
                <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Causal Failure Chain:</div>
                {rootCause.causal_chain.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 flex items-center justify-center text-[9px] shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cited Evidence Badges */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500">Cited Evidence:</span>
            {rootCause?.cited_evidence_ids?.map((evId) => (
              <span key={evId} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono text-cyan-400 font-bold">
                {evId}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Adversarial Critic Audit */}
        <div className={`rounded-lg p-3.5 border flex flex-col justify-between ${
          hasContradictions 
            ? 'bg-amber-950/30 border-amber-500/50' 
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2 font-semibold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Adversarial Critic (Falsification)
              </span>
              <span className="text-slate-400 font-normal">
                Penalty: -{criticReport?.confidence_penalty || 0}%
              </span>
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {criticReport?.is_physically_possible ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Physically Plausible Failure Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400">
                    <XCircle className="w-4 h-4" />
                    Physical Inconsistency Detected
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-5 mb-2">
              {criticReport?.objection_summary || "Performing sensor cross-validation."}
            </p>

            {/* Contradiction Callout Box */}
            {hasContradictions && (
              <div className="bg-rose-950/70 border border-rose-600/70 rounded-lg p-3 text-[11px] font-mono text-rose-200 mb-3">
                <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Anti-Hallucination Objection:
                </div>
                <div>{criticReport.contradictions_detected[0]}</div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Model: DeepSeek-R1 / Qwen-2.5</span>
            <span className="text-slate-500">Autonomous Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
