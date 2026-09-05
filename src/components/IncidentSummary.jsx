import React from 'react';
import { AlertTriangle, Fingerprint, Loader2, ShieldCheck, Activity } from 'lucide-react';

const TITLES = {
  "SCENARIO-01-THERMAL-OVERHEAT": "Joint 3 Thermal Overheat",
  "SCENARIO-02-PNEUMATIC-DROP": "Pneumatic Pressure Drop",
  "SCENARIO-03-CONTRADICTORY-FAULT": "Contradictory Sensor Anomaly",
  "SCENARIO-04-VOLTAGE-SAG": "3-Phase Power Sag"
};
const clean = (status = '') => status.replaceAll('_', ' ');

export default function IncidentSummary({ scenarioId, incidentId, status, isInvestigating }) {
  const title = TITLES[scenarioId] || 'Industrial Incident';
  return (
    <section className="glass-panel rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-rose-500/[0.08] border border-rose-500/25 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-[0.20em] text-slate-500">
            <Activity className="w-3 h-3 text-cyan-400" /> Active Incident
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h1 className="text-[18px] leading-tight font-heading font-bold text-white">{title}</h1>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500 border border-slate-800 bg-slate-950/70 rounded-md px-2 py-0.5">
              <Fingerprint className="w-3 h-3" /> {incidentId || 'NEW'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/65">
        {isInvestigating ? <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
        <span className="text-[9px] font-mono font-semibold text-slate-300">{isInvestigating ? 'INVESTIGATING' : clean(status)}</span>
      </div>
    </section>
  );
}
