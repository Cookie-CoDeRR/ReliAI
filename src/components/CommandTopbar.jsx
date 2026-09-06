import React from "react";
import { Radio, BrainCircuit, Database, RotateCcw, CircleDot } from "lucide-react";

const TITLES = {
  "SCENARIO-01-THERMAL-OVERHEAT": "Joint 3 Thermal Overheat",
  "SCENARIO-02-PNEUMATIC-DROP": "Pneumatic Pressure Drop",
  "SCENARIO-03-CONTRADICTORY-FAULT": "Contradictory Sensor Anomaly",
  "SCENARIO-04-VOLTAGE-SAG": "3-Phase Power Sag"
};
const clean = (value = "") => value.replaceAll("_", " ");

export default function CommandTopbar({ scenarioId, incidentId, status, isInvestigating, activeAgent, onReset }) {
  const title = TITLES[scenarioId] || "Industrial Incident";
  const statusText = isInvestigating ? "LIVE INVESTIGATION" : clean(status);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#050a12]/90 backdrop-blur-xl px-4 md:px-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-[0.16em] text-slate-600">
          <Radio className="w-3 h-3 text-cyan-400" /> STATION-TIRE-FITTER-01
          <span className="text-slate-800">/</span>
          <span className="text-slate-500">{incidentId || "NEW INCIDENT"}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="font-heading text-[17px] font-bold text-white truncate">{title}</h1>
          <span className={`px-2 py-0.5 rounded-md border text-[8px] font-mono font-bold ${isInvestigating ? "border-indigo-500/30 bg-indigo-500/[0.07] text-indigo-300" : status === "INCONCLUSIVE_CONTRADICTIONS" ? "border-amber-500/30 bg-amber-500/[0.07] text-amber-300" : "border-cyan-500/20 bg-cyan-500/[0.045] text-cyan-300"}`}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <div className="h-9 px-3 rounded-lg border border-slate-800 bg-slate-950/55 flex items-center gap-2">
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
          <div>
            <div className="text-[7px] font-mono uppercase tracking-wider text-slate-600">Active Agent</div>
            <div className="text-[9px] font-mono text-slate-300">{activeAgent ? clean(activeAgent) : isInvestigating ? "INITIALIZING" : "IDLE"}</div>
          </div>
        </div>
        <div className="h-9 px-3 rounded-lg border border-slate-800 bg-slate-950/55 flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <div className="text-[7px] font-mono uppercase tracking-wider text-slate-600">Evidence Store</div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-300"><CircleDot className="w-2.5 h-2.5" /> CONNECTED</div>
          </div>
        </div>
        <button onClick={onReset} className="w-9 h-9 rounded-lg border border-slate-800 bg-slate-950/55 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition" title="Reset active incident">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
