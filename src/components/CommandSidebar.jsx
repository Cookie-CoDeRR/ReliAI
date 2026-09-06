import React from "react";
import {
  Shield, LayoutDashboard, Activity, ScanSearch, BarChart3, History,
  Cpu, Flame, Wind, AlertTriangle, Zap, ChevronRight
} from "lucide-react";

const SCENARIOS = [
  { id: "SCENARIO-01-THERMAL-OVERHEAT", short: "Thermal", meta: "J3 / 88.5°C", icon: Flame, tone: "text-rose-300" },
  { id: "SCENARIO-02-PNEUMATIC-DROP", short: "Pneumatic", meta: "4.0 bar", icon: Wind, tone: "text-sky-300" },
  { id: "SCENARIO-03-CONTRADICTORY-FAULT", short: "Conflict", meta: "92°C ↔ 3.1A", icon: AlertTriangle, tone: "text-amber-300" },
  { id: "SCENARIO-04-VOLTAGE-SAG", short: "Power Sag", meta: "365V RMS", icon: Zap, tone: "text-indigo-300" }
];

const NAV = [
  { id: "command", label: "Command", icon: LayoutDashboard },
  { id: "investigation", label: "Investigation", icon: Activity },
  { id: "evidence", label: "Evidence", icon: ScanSearch }
];

export default function CommandSidebar({
  activeScenarioId, onSelectScenario, isInvestigating, onOpenAnalytics, onOpenHistory
}) {
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[230px] border-r border-slate-800/80 bg-[#050a12]/96 backdrop-blur-xl flex-col">
      <div className="h-16 px-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <Shield className="w-5 h-5 text-white" />
          <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#050a12]" />
        </div>
        <div>
          <div className="font-heading font-extrabold text-[17px] text-white tracking-wide">ReliAI</div>
          <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-cyan-400/75">Investigation OS</div>
        </div>
      </div>

      <div className="px-3 py-4">
        <div className="px-2 mb-2 text-[8px] font-mono uppercase tracking-[0.18em] text-slate-600">Workspace</div>
        <div className="space-y-1">
          {NAV.map((item, index) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => go(item.id)} className={`w-full h-9 rounded-lg px-2.5 flex items-center gap-2.5 text-left border transition ${index === 0 ? "border-cyan-500/20 bg-cyan-500/[0.055] text-cyan-200" : "border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-900/70"}`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {index === 0 && <ChevronRight className="w-3 h-3 ml-auto text-cyan-500" />}
              </button>
            );
          })}

          <button onClick={onOpenAnalytics} className="w-full h-9 rounded-lg px-2.5 flex items-center gap-2.5 text-left border border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-900/70 transition">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>

          <button onClick={onOpenHistory} className="w-full h-9 rounded-lg px-2.5 flex items-center gap-2.5 text-left border border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-900/70 transition">
            <History className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">History</span>
          </button>
        </div>
      </div>

      <div className="px-3 pt-2">
        <div className="px-2 mb-2 text-[8px] font-mono uppercase tracking-[0.18em] text-slate-600">Incident Benchmarks</div>
        <div className="space-y-1.5">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon;
            const active = activeScenarioId === scenario.id;
            return (
              <button key={scenario.id} disabled={isInvestigating} onClick={() => onSelectScenario(scenario.id)} className={`w-full rounded-xl border px-2.5 py-2.5 flex items-center gap-2.5 text-left transition ${active ? "border-cyan-500/30 bg-cyan-500/[0.055]" : "border-slate-800/70 bg-slate-950/35 hover:border-slate-700"} ${isInvestigating ? "opacity-45 cursor-not-allowed" : ""}`}>
                <div className={`w-8 h-8 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center ${scenario.tone}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[10px] font-semibold truncate ${active ? "text-white" : "text-slate-400"}`}>{scenario.short}</div>
                  <div className="mt-0.5 text-[8px] font-mono text-slate-600 truncate">{scenario.meta}</div>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.85)]" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
          <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-wider text-slate-600">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Local AI Runtime
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-mono text-emerald-300">OLLAMA ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
