import React from "react";
import { GitCommit, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Scale, Loader2 } from "lucide-react";

export default function CriticDebateView({ rootCause = null, criticReport = null, isInvestigating = false }) {
  const contradictions = criticReport?.contradictions_detected || [];
  const challenged = contradictions.length > 0 || criticReport?.is_physically_possible === false;

  return (
    <section className="os-panel rounded-2xl h-full p-4 flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <div><div className="os-kicker">Adversarial Validation</div><div className="mt-1 font-heading text-[14px] font-bold text-white">AI Claim vs Critic</div></div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-mono ${isInvestigating && !criticReport ? "border-indigo-500/25 bg-indigo-500/[0.06] text-indigo-300" : challenged ? "border-rose-500/25 bg-rose-500/[0.06] text-rose-300" : criticReport ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300" : "border-slate-800 bg-slate-950/60 text-slate-500"}`}>
          {isInvestigating && !criticReport ? <Loader2 className="w-3 h-3 animate-spin" /> : challenged ? <XCircle className="w-3 h-3" /> : criticReport ? <CheckCircle2 className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
          {isInvestigating && !criticReport ? "AUDITING" : challenged ? "CHALLENGED" : criticReport ? "VALIDATED" : "STANDBY"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 flex-1">
        <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.025] p-3">
          <div className="flex items-center gap-1.5 os-label"><GitCommit className="w-3 h-3 text-indigo-400" /> Generator Claim</div>
          <div className="mt-2 text-[12px] font-semibold text-slate-200 leading-5">{rootCause?.title || (isInvestigating ? "Root-cause hypothesis is being generated..." : "No active hypothesis")}</div>
          <div className="mt-1.5 text-[9px] font-mono text-slate-500">Preliminary confidence: {rootCause?.preliminary_confidence != null ? `${rootCause.preliminary_confidence}%` : "--"}</div>
        </div>

        <div className={`rounded-xl border p-3 ${challenged ? "border-rose-500/25 bg-rose-500/[0.04]" : "border-amber-500/15 bg-amber-500/[0.025]"}`}>
          <div className="flex items-center gap-1.5 os-label"><ShieldAlert className="w-3 h-3 text-amber-400" /> Critic Objection</div>
          <div className={`mt-2 text-[11px] leading-5 ${challenged ? "text-rose-200" : "text-slate-300"}`}>{criticReport?.objection_summary || (isInvestigating ? "Cross-checking physical consistency, sensor agreement, and evidence coverage..." : "Critic has not executed yet.")}</div>
          {challenged && contradictions[0] && <div className="mt-2.5 rounded-lg border border-rose-500/25 bg-rose-950/40 p-2.5"><div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-rose-400"><AlertTriangle className="w-3 h-3" /> Anti-hallucination trigger</div><div className="mt-1.5 text-[9px] leading-4 text-rose-200">{contradictions[0]}</div></div>}
        </div>
      </div>
    </section>
  );
}
