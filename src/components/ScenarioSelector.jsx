import React from 'react';
import { Flame, Wind, AlertOctagon, Zap, Play } from 'lucide-react';

const SCENARIOS = [
  {
    id: "SCENARIO-01-THERMAL-OVERHEAT",
    title: "Joint 3 Thermal Overheat",
    subtitle: "Harmonic Gear Friction (88.5°C)",
    icon: Flame,
    color: "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-300 hover:border-rose-400"
  },
  {
    id: "SCENARIO-02-PNEUMATIC-DROP",
    title: "Pneumatic Pressure Drop",
    subtitle: "Gripper Manifold Leak (4.0 bar)",
    icon: Wind,
    color: "from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-300 hover:border-sky-400"
  },
  {
    id: "SCENARIO-03-CONTRADICTORY-FAULT",
    title: "Contradictory Sensor Anomaly",
    subtitle: "False 92°C vs 3.1A Idle Current",
    icon: AlertOctagon,
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300 hover:border-amber-400"
  },
  {
    id: "SCENARIO-04-VOLTAGE-SAG",
    title: "3-Phase Power Sag",
    subtitle: "Substation Brownout (365V RMS)",
    icon: Zap,
    color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-300 hover:border-indigo-400"
  }
];

export default function ScenarioSelector({ activeScenarioId, onSelectScenario, isInvestigating }) {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>Industrial Incident Scenarios (Preset Benchmarks)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">SELECT TO RUN AI HARNESS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const isSelected = activeScenarioId === sc.id;

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              disabled={isInvestigating}
              className={`text-left p-3.5 rounded-xl border bg-gradient-to-b transition-all relative overflow-hidden flex flex-col justify-between ${
                sc.color
              } ${isSelected ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-950/50 scale-[1.02]' : 'opacity-85 hover:opacity-100'} ${
                isInvestigating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/50 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-400 text-slate-950 uppercase">
                    ACTIVE
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-white leading-tight">{sc.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{sc.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
