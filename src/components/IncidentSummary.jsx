import React from 'react';
import {
  AlertTriangle,
  Wrench,
  Gauge,
  ArrowRight,
  Loader2,
  ShieldCheck
} from 'lucide-react';

const TITLES = {
  "SCENARIO-01-THERMAL-OVERHEAT": "Joint 3 Thermal Overheat",
  "SCENARIO-02-PNEUMATIC-DROP": "Pneumatic Pressure Drop",
  "SCENARIO-03-CONTRADICTORY-FAULT": "Contradictory Sensor Anomaly",
  "SCENARIO-04-VOLTAGE-SAG": "3-Phase Power Sag"
};

const statusLabel = (status = "") =>
  status.replaceAll("_", " ");

export default function IncidentSummary({
  scenarioId,
  incidentId,
  status,
  verdict,
  isInvestigating
}) {
  const score = verdict?.final_confidence_score;
  const root = verdict?.primary_root_cause;
  const title = TITLES[scenarioId] || "Industrial Incident";
  const action = verdict?.recommended_mitigation || "Awaiting investigation result";

  const confidenceClass =
    score == null
      ? "text-slate-500"
      : score >= 80
        ? "text-emerald-400"
        : score <= 45
          ? "text-rose-400"
          : "text-amber-400";

  return (
    <section className="glass-panel rounded-xl overflow-hidden border border-slate-800">
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] font-mono text-slate-500">
            Active Incident
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-lg font-bold text-white">
              {title}
            </h1>

            <span className="text-[9px] font-mono text-slate-500 border border-slate-800 bg-slate-950 rounded px-2 py-0.5">
              {incidentId || "NEW"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5">
          {isInvestigating ? (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          )}

          <span className="text-[10px] font-mono font-semibold text-slate-300">
            {isInvestigating ? "INVESTIGATING" : statusLabel(status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4">
        <div className="p-3.5 border-b xl:border-b-0 xl:border-r border-slate-800">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-500">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Incident
          </div>
          <div className="mt-1.5 text-xs font-semibold text-white">
            {title}
          </div>
        </div>

        <div className="p-3.5 border-b xl:border-b-0 xl:border-r border-slate-800">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-500">
            <Wrench className="w-3 h-3 text-violet-400" />
            Root Cause
          </div>
          <div className="mt-1.5 text-xs font-semibold text-white leading-4">
            {root?.title || "Under analysis"}
          </div>
          <div className="text-[10px] mt-1 text-slate-500">
            {root?.affected_component || "Evidence processing"}
          </div>
        </div>

        <div className="p-3.5 xl:border-r border-slate-800">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-500">
            <Gauge className="w-3 h-3 text-cyan-400" />
            Confidence
          </div>
          <div className={`mt-1 font-mono text-2xl font-bold ${confidenceClass}`}>
            {score == null ? "--" : `${Number(score).toFixed(1)}%`}
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-500">
            <ArrowRight className="w-3 h-3 text-emerald-400" />
            Required Action
          </div>
          <div
            title={action}
            className="mt-1.5 text-xs leading-4 text-slate-200 max-h-8 overflow-hidden"
          >
            {action}
          </div>
        </div>
      </div>
    </section>
  );
}
