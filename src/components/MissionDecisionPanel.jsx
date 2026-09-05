import React from "react";
import { AlertTriangle, Wrench, Gauge, ShieldCheck, FileSearch, ArrowUpRight, Loader2, CircleDot, CheckCircle2, Activity } from "lucide-react";

export default function MissionDecisionPanel({ status, verdict, isInvestigating, activeAgent, agentTraces = [] }) {
  const root = verdict?.primary_root_cause;
  const score = verdict?.final_confidence_score;
  const numeric = Math.max(0, Math.min(100, Number(score || 0)));
  const action = verdict?.recommended_mitigation || "Awaiting multi-agent investigation verdict";
  const completed = new Set(agentTraces.filter((t) => t.step === "COMPLETED" || t.step === "FINAL_VERDICT").map((t) => t.agent)).size;
  const evidenceTrace = agentTraces.find((t) => t.agent === "EVIDENCE_RAG_AGENT" && t.step === "COMPLETED");
  const evidenceCount = evidenceTrace?.payload?.evidence_items?.length || 0;
  const criticTrace = agentTraces.find((t) => t.agent === "CRITIC_AGENT" && t.step === "COMPLETED");
  const critic = criticTrace?.payload;
  const contradiction = critic?.is_physically_possible === false;
  const ring = score == null ? "#334155" : numeric >= 80 ? "#34d399" : numeric <= 45 ? "#fb7185" : "#fbbf24";

  return (
    <section className="os-panel rounded-2xl h-full flex flex-col">
      <div className="h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500" />
      <div className="px-4 py-3 border-b border-slate-800/90 flex items-center justify-between">
        <div><div className="os-kicker">Decision Console</div><div className="mt-1 font-heading text-[16px] font-bold text-white">Root Cause & Action</div></div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/65">
          {isInvestigating ? <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="text-[8px] font-mono font-bold text-slate-400">{isInvestigating ? "REASONING" : status?.replaceAll("_", " ")}</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3.5">
        <div className="flex items-start gap-4">
          <div className="relative w-[108px] h-[108px] rounded-full shrink-0" style={{ background: `conic-gradient(${ring} ${numeric * 3.6}deg, #111827 0deg)` }}>
            <div className="absolute inset-[8px] rounded-full bg-[#07101b] border border-slate-800 flex flex-col items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-cyan-400 mb-1" />
              <span className="text-[7px] font-mono uppercase tracking-widest text-slate-600">Confidence</span>
              <span className="mt-1 text-[26px] leading-none font-mono font-extrabold text-white">{score == null ? "--" : `${numeric.toFixed(1)}%`}</span>
            </div>
          </div>
          <div className="min-w-0 pt-1">
            <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.16em] text-rose-400"><AlertTriangle className="w-3 h-3" /> Primary Root Cause</div>
            <h2 className="mt-1.5 font-heading text-[20px] leading-[1.16] font-bold text-white">{root?.title ||
  (status === "INCONCLUSIVE_CONTRADICTIONS"
    ? "Investigation Inconclusive"
    : isInvestigating
      ? "Evidence synthesis in progress"
      : "Awaiting diagnosis")}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 max-w-full px-2 py-1 rounded-md border border-slate-800 bg-slate-950/60 text-[9px] font-mono text-slate-400"><Wrench className="w-3 h-3 text-violet-400 shrink-0" /><span className="truncate">
  {root?.affected_component ||
    (status === "INCONCLUSIVE_CONTRADICTIONS"
      ? "Conflicting sensor evidence"
      : "Component pending")}
</span></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-center gap-1.5 os-label"><Activity className="w-3 h-3 text-indigo-400" />Agents</div><div className="mt-2 text-lg font-mono font-bold text-indigo-300">{completed}/6</div></div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-center gap-1.5 os-label"><FileSearch className="w-3 h-3 text-cyan-400" />Evidence</div><div className="mt-2 text-lg font-mono font-bold text-cyan-300">{evidenceCount}</div></div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex items-center gap-1.5 os-label"><CircleDot className="w-3 h-3 text-emerald-400" />Critic</div><div className={`mt-2 text-[10px] leading-5 font-semibold ${contradiction ? "text-rose-300" : criticTrace ? "text-emerald-300" : "text-slate-500"}`}>{contradiction ? "CHALLENGED" : criticTrace ? "VALIDATED" : "PENDING"}</div></div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
          <div className="flex items-center justify-between gap-2"><span className="os-label">Investigation Progress</span><span className="text-[8px] font-mono text-cyan-300">{activeAgent ? activeAgent.replaceAll("_", " ") : completed === 6 ? "COMPLETE" : "IDLE"}</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-900 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-all duration-500" style={{ width: `${Math.min(100, (completed / 6) * 100)}%` }} /></div>
        </div>

        <div className="mt-auto rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] via-cyan-500/[0.03] to-transparent p-3.5">
          <div className="flex items-center justify-between"><span className="text-[8px] font-mono uppercase tracking-[0.16em] text-emerald-400">Recommended Action</span>{verdict ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}</div>
          <div className="mt-2 text-[11px] leading-5 text-slate-200">{action}</div>
        </div>
      </div>
    </section>
  );
}
