import React from 'react';
import { Flame, Wind, AlertOctagon, Zap, Play } from 'lucide-react';

const SCENARIOS = [
  { id: "SCENARIO-01-THERMAL-OVERHEAT", code: "01", title: "Thermal Overheat", meta: "J3 • 88.5°C", icon: Flame, tone: "rose" },
  { id: "SCENARIO-02-PNEUMATIC-DROP", code: "02", title: "Pressure Drop", meta: "4.0 bar", icon: Wind, tone: "sky" },
  { id: "SCENARIO-03-CONTRADICTORY-FAULT", code: "03", title: "Sensor Conflict", meta: "92°C ↔ 3.1A", icon: AlertOctagon, tone: "amber" },
  { id: "SCENARIO-04-VOLTAGE-SAG", code: "04", title: "Power Sag", meta: "365V RMS", icon: Zap, tone: "indigo" }
];
const activeTone = {
  rose: "border-rose-400/55 bg-rose-500/[0.08] text-rose-200",
  sky: "border-sky-400/55 bg-sky-500/[0.08] text-sky-200",
  amber: "border-amber-400/55 bg-amber-500/[0.08] text-amber-200",
  indigo: "border-indigo-400/55 bg-indigo-500/[0.08] text-indigo-200"
};

export default function ScenarioSelector({ activeScenarioId, onSelectScenario, isInvestigating }) {
  return (
    <section className="glass-panel rounded-2xl p-2">
      <div className="flex flex-col xl:flex-row xl:items-center gap-2">
        <div className="px-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] font-mono text-slate-500 min-w-fit">
          <Play className="w-3.5 h-3.5 text-cyan-400" /> Benchmark Deck
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 flex-1">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const active = activeScenarioId === sc.id;
            return (
              <button key={sc.id} disabled={isInvestigating} onClick={() => onSelectScenario(sc.id)} className={`group h-[54px] rounded-xl border px-3 flex items-center gap-2.5 text-left transition-all ${active ? activeTone[sc.tone] : 'border-slate-800/80 bg-slate-950/45 text-slate-400 hover:border-slate-600 hover:bg-slate-900/70'} ${isInvestigating ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${active ? 'border-current/20 bg-black/10' : 'border-slate-800 bg-slate-950'}`}><Icon className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><span className="text-[8px] font-mono opacity-55">{sc.code}</span><span className={`font-heading font-semibold text-[12px] truncate ${active ? 'text-white' : 'text-slate-300'}`}>{sc.title}</span></div>
                  <div className="mt-0.5 text-[9px] font-mono opacity-65 truncate">{sc.meta}</div>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.75)]" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
