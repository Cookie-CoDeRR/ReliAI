import React, { useEffect, useState } from "react";
import { Compass, Database, Activity, GitCommit, ShieldAlert, CheckCircle, CheckCircle2, Loader2, ChevronRight } from "lucide-react";

const STEPS = [
  { id: "TRIAGE_AGENT", label: "Triage", icon: Compass },
  { id: "EVIDENCE_RAG_AGENT", label: "Evidence", icon: Database },
  { id: "DOMAIN_ANALYSIS", label: "Domain", icon: Activity },
  { id: "ROOT_CAUSE_AGENT", label: "Root Cause", icon: GitCommit },
  { id: "CRITIC_AGENT", label: "Critic", icon: ShieldAlert },
  { id: "CONFIDENCE_ENGINE", label: "Confidence", icon: CheckCircle }
];

export default function AgentDeliberationGraph({ agentTraces = [], activeAgent = null, isInvestigating = false }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => { if (activeAgent) setSelected(activeAgent); }, [activeAgent]);
  const done = (id) => agentTraces.some((t) => t.agent === id && (t.step === "COMPLETED" || t.step === "FINAL_VERDICT"));
  const trace = selected ? agentTraces.find((t) => t.agent === selected && (t.step === "COMPLETED" || t.step === "FINAL_VERDICT")) : null;

  return (
    <section className="os-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div><div className="os-kicker">Live Investigation</div><div className="mt-1 font-heading text-[14px] font-bold text-white">Multi-Agent Reasoning Chain</div></div>
        {isInvestigating && <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/[0.06]"><Loader2 className="w-3 h-3 text-indigo-400 animate-spin" /><span className="text-[8px] font-mono text-indigo-300">STREAMING</span></div>}
      </div>

      <div className="relative">
        <div className="hidden xl:block absolute left-[7%] right-[7%] top-[22px] h-px bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const finished = done(step.id);
            const active = isInvestigating && activeAgent === step.id;
            const selectedNow = selected === step.id;
            return (
              <button key={step.id} onClick={() => setSelected(selectedNow ? null : step.id)} className={`relative rounded-xl border p-3 text-left transition ${active ? "border-indigo-400/55 bg-indigo-500/[0.08] shadow-[0_0_26px_rgba(99,102,241,.10)]" : finished ? "border-emerald-500/20 bg-emerald-500/[0.035]" : "border-slate-800 bg-slate-950/50 hover:border-slate-700"} ${selectedNow ? "ring-1 ring-cyan-500/25" : ""}`}>
                <div className="flex items-center justify-between"><div className={`relative z-10 w-9 h-9 rounded-xl border flex items-center justify-center ${active ? "border-indigo-400/35 bg-indigo-500/10 text-indigo-300" : finished ? "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-300" : "border-slate-800 bg-slate-950 text-slate-600"}`}>{active ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}</div><span className="text-[8px] font-mono text-slate-600">0{idx + 1}</span></div>
                <div className="mt-2.5 flex items-center gap-1.5"><span className="font-heading text-[11px] font-semibold text-slate-200">{step.label}</span>{finished && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/55 px-3.5 py-3 flex items-start gap-2.5"><ChevronRight className="w-4 h-4 text-cyan-400 mt-0.5" /><div><div className="os-kicker">{selected.replaceAll("_", " ")} output</div><div className="mt-1.5 text-[10px] leading-5 text-slate-300">{trace?.message || trace?.payload?.title || trace?.verdict?.primary_root_cause?.title || (trace ? "Agent completed and evidence persisted." : "Awaiting this agent stage.")}</div></div></div>}
    </section>
  );
}
