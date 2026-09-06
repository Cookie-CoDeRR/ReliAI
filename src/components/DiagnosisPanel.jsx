import React from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Wrench,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  FileSearch,
  CircleDot,
  Activity,
  CheckCircle2,
  Fingerprint
} from "lucide-react";

const clean = (status = "") => status.replaceAll("_", " ");

const AGENT_LABELS = {
  TRIAGE_AGENT: "Triage Agent",
  EVIDENCE_RAG_AGENT: "Evidence RAG",
  DOMAIN_ANALYSIS: "Domain Analysis",
  ROOT_CAUSE_AGENT: "Root Cause Agent",
  CRITIC_AGENT: "Adversarial Critic",
  CONFIDENCE_ENGINE: "Confidence Engine"
};

export default function DiagnosisPanel({
  status,
  verdict,
  isInvestigating,
  activeAgent,
  agentTraces = [],
  incidentId
}) {
  const root = verdict?.primary_root_cause;
  const score = verdict?.final_confidence_score;

  const numeric = Math.max(
    0,
    Math.min(100, Number(score || 0))
  );

  const completedAgents = new Set(
    agentTraces
      .filter(
        (trace) =>
          trace.step === "COMPLETED" ||
          trace.step === "FINAL_VERDICT"
      )
      .map((trace) => trace.agent)
  ).size;

  const evidenceTrace = agentTraces.find(
    (trace) =>
      trace.agent === "EVIDENCE_RAG_AGENT" &&
      trace.step === "COMPLETED"
  );

  const evidenceCount =
    evidenceTrace?.payload?.evidence_items?.length || 0;

  const criticTrace = agentTraces.find(
    (trace) =>
      trace.agent === "CRITIC_AGENT" &&
      trace.step === "COMPLETED"
  );

  const criticPayload = criticTrace?.payload;

  const criticStatus =
    criticPayload?.is_physically_possible === false
      ? "Contradiction detected"
      : criticTrace
        ? "Falsification passed"
        : "Pending";

  const action =
    verdict?.recommended_mitigation ||
    (
      isInvestigating
        ? "Awaiting final multi-agent verdict"
        : "Select or run an incident investigation"
    );

  const ringColor =
    score == null
      ? "#334155"
      : numeric >= 80
        ? "#34d399"
        : numeric <= 45
          ? "#fb7185"
          : "#fbbf24";

  return (
    <section className="next-panel rounded-2xl h-full overflow-hidden flex flex-col">

      <div className="h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">

        <div className="flex items-center gap-2.5">

          <div className="w-9 h-9 rounded-xl bg-violet-500/[0.08] border border-violet-500/25 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-violet-300" />
          </div>

          <div>
            <div className="text-[8px] font-mono tracking-[0.18em] uppercase text-slate-500">
              AI Investigation
            </div>

            <div className="font-heading text-[15px] font-bold text-white">
              Diagnosis Console
            </div>
          </div>

        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1.5">

          {isInvestigating ? (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          )}

          <span className="text-[8px] font-mono font-bold text-slate-400">
            {isInvestigating
              ? "LIVE REASONING"
              : clean(status)}
          </span>

        </div>

      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">

        {/* Incident + live agent */}
        <div className="grid grid-cols-2 gap-2">

          <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">

            <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-mono text-slate-500">
              <Fingerprint className="w-3 h-3 text-cyan-400" />
              Incident
            </div>

            <div className="mt-1.5 text-[10px] font-mono text-slate-300 truncate">
              {incidentId || "Pending ingestion"}
            </div>

          </div>

          <div className={`rounded-xl border p-3 ${
            isInvestigating
              ? "border-indigo-500/35 bg-indigo-500/[0.07]"
              : "border-slate-800 bg-slate-950/55"
          }`}>

            <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-mono text-slate-500">
              <Activity className="w-3 h-3 text-indigo-400" />
              Active Agent
            </div>

            <div className="mt-1.5 text-[10px] font-semibold text-slate-200">
              {activeAgent
                ? AGENT_LABELS[activeAgent] || activeAgent
                : verdict
                  ? "Investigation complete"
                  : "Waiting"}
            </div>

          </div>

        </div>

        {/* progress */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">

          <div className="flex items-center justify-between">

            <span className="text-[8px] uppercase tracking-[0.16em] font-mono text-slate-500">
              Investigation Progress
            </span>

            <span className="text-[9px] font-mono text-cyan-300">
              {completedAgents}/6 agents
            </span>

          </div>

          <div className="mt-2 h-1.5 rounded-full bg-slate-900 overflow-hidden">

            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (completedAgents / 6) * 100
                )}%`
              }}
            />

          </div>

        </div>

        {/* confidence + root cause */}
        <div className="flex items-start gap-4">

          <div
            className="relative w-[92px] h-[92px] rounded-full shrink-0 flex items-center justify-center"
            style={{
              background: `conic-gradient(
                ${ringColor} ${numeric * 3.6}deg,
                #111827 0deg
              )`
            }}
          >

            <div className="absolute inset-[7px] rounded-full bg-[#080f1b] border border-slate-800 flex flex-col items-center justify-center">

              <span className="text-[7px] uppercase tracking-widest font-mono text-slate-500">
                Confidence
              </span>

              <span className="text-[22px] leading-none mt-1 font-mono font-extrabold text-white">
                {score == null
                  ? "--"
                  : `${numeric.toFixed(0)}%`}
              </span>

            </div>

          </div>

          <div className="min-w-0 pt-1">

            <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.16em] text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              Primary Root Cause
            </div>

            <h2 className="mt-1.5 font-heading text-[17px] leading-[1.2] font-bold text-white">

              {root?.title ||
                (
                  isInvestigating
                    ? "Evidence synthesis in progress"
                    : "Awaiting diagnosis"
                )}

            </h2>

            <div className="mt-2 inline-flex max-w-full items-center gap-1.5 px-2 py-1 rounded-md border border-slate-800 bg-slate-950/70 text-[9px] font-mono text-slate-400">

              <Wrench className="w-3 h-3 text-violet-400 shrink-0" />

              <span className="truncate">
                {root?.affected_component ||
                  "Component pending"}
              </span>

            </div>

          </div>

        </div>

        {/* evidence and critic */}
        <div className="grid grid-cols-2 gap-2">

          <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">

            <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-mono text-slate-500">
              <FileSearch className="w-3 h-3 text-cyan-400" />
              Evidence Grounding
            </div>

            <div className="mt-1.5 flex items-end gap-2">

              <span className="text-xl leading-none font-mono font-bold text-cyan-300">
                {evidenceCount}
              </span>

              <span className="text-[9px] text-slate-500">
                evidence items
              </span>

            </div>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">

            <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-mono text-slate-500">
              <CircleDot className="w-3 h-3 text-indigo-400" />
              Critic Gate
            </div>

            <div className={`mt-1.5 text-[10px] font-semibold ${
              criticPayload?.is_physically_possible === false
                ? "text-rose-300"
                : criticTrace
                  ? "text-emerald-300"
                  : "text-slate-400"
            }`}>

              {criticStatus}

            </div>

          </div>

        </div>

        {/* recommended action */}
        <div className="mt-auto rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.025] p-3.5">

          <div className="flex items-center justify-between gap-2">

            <span className="text-[8px] uppercase tracking-[0.16em] font-mono text-emerald-400">
              Recommended Action
            </span>

            {verdict && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}

          </div>

          <p className="mt-2 text-[11px] leading-5 text-slate-200">
            {action}
          </p>

          {verdict && (
            <div className="mt-2 flex items-center gap-1 text-[8px] font-mono text-emerald-500">
              VIEW HUMAN GATE
              <ArrowUpRight className="w-3 h-3" />
            </div>
          )}

        </div>

      </div>

    </section>
  );
}
