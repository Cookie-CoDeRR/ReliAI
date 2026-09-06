import React, { useState } from 'react';
import {
  Settings,
  X,
  Sliders,
  Activity,
  Bell,
  Cpu,
  ShieldCheck,
  Zap,
  Check,
  RotateCcw,
  Download,
  Flame,
  Volume2
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState("General"); // "General" | "Investigation" | "Notifications" | "System"

  // State for interactive settings options
  const [theme, setTheme] = useState("champagne"); // "champagne" | "dark"
  const [defaultTab, setDefaultTab] = useState("Dashboard");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [reasoningDepth, setReasoningDepth] = useState("Thorough (Adversarial Critic)");
  const [llmModel, setLlmModel] = useState("Gemma-2 9B (Ollama GPU)");
  const [approvalThreshold, setApprovalThreshold] = useState(90);
  const [ethercatSampling, setEthercatSampling] = useState("1000 Hz Ring Buffer");

  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [minSeverityAlert, setMinSeverityAlert] = useState("HIGH");

  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000/api/v1");

  if (!isOpen) return null;

  const CATEGORIES = [
    { id: "General", label: "General", icon: Sliders, desc: "Appearance & interface" },
    { id: "Investigation", label: "Investigation", icon: Activity, desc: "AI DAG & reasoning" },
    { id: "Notifications", label: "Notifications", icon: Bell, desc: "Alerts & audio chimes" },
    { id: "System", label: "System", icon: Cpu, desc: "Hardware & backend APIs" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Settings Modal Container */}
      <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-xl border border-white/90 rounded-[20px] shadow-2xl overflow-hidden z-10 text-slate-800 flex flex-col h-[560px] animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#fdfbf9] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[10px] bg-[#faeee5] border border-[#efc4ab] text-[#c8764b]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900">Application Settings</h2>
              <p className="text-xs text-slate-500 font-mono">Configure ReliAI platform preferences & diagnostic parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body: Left Category Sidebar + Right Configuration Panel */}
        <div className="flex-1 min-h-0 flex items-stretch overflow-hidden">
          
          {/* Left Category Sub-Navigation */}
          <aside className="w-48 sm:w-56 bg-slate-50/80 border-r border-slate-200/80 p-3 space-y-1 shrink-0 overflow-y-auto font-mono">
            <div className="px-2 mb-2 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Settings Menu
            </div>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left p-2.5 rounded-[10px] transition cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? "bg-white text-[#c8764b] font-bold shadow-2xs border border-[#efc4ab]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#d98555]" : "text-slate-400"}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight">{cat.label}</div>
                    <div className="text-[9px] text-slate-400 font-normal truncate mt-0.5">{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Right Configuration Content Panel */}
          <main className="flex-1 min-w-0 p-5 overflow-y-auto text-xs font-mono space-y-5">
            
            {/* CATEGORY 1: GENERAL */}
            {activeCategory === "General" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-0.5">General Preferences</h3>
                  <p className="text-slate-500 text-[11px]">Customize interface aesthetics, default views, and refresh intervals.</p>
                </div>

                {/* Theme Selection */}
                <div className="space-y-1.5 p-3 rounded-[12px] bg-slate-50 border border-slate-200/80">
                  <label className="font-bold text-slate-700 block text-[11px]">Interface Aesthetic</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme("champagne")}
                      className={`p-2.5 rounded-[8px] border text-left flex items-center justify-between transition cursor-pointer ${
                        theme === "champagne"
                          ? "bg-white border-[#d98555] text-[#c8764b] ring-2 ring-[#d98555]/20 font-bold"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>Champagne Industrial (Light)</span>
                      {theme === "champagne" && <Check className="w-3.5 h-3.5 text-[#d98555]" />}
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-2.5 rounded-[8px] border text-left flex items-center justify-between transition cursor-pointer ${
                        theme === "dark"
                          ? "bg-slate-900 border-[#d98555] text-cyan-300 ring-2 ring-[#d98555]/20 font-bold"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>High-Contrast Dark OS</span>
                      {theme === "dark" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>
                </div>

                {/* Default Startup View */}
                <div className="space-y-1.5 p-3 rounded-[12px] bg-slate-50 border border-slate-200/80">
                  <label className="font-bold text-slate-700 block text-[11px]">Default Startup View</label>
                  <select
                    value={defaultTab}
                    onChange={(e) => setDefaultTab(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-[8px] text-xs font-mono text-slate-800 focus:outline-none focus:border-[#d98555]"
                  >
                    <option value="Dashboard">Dashboard Hero</option>
                    <option value="Streaming Visualisation">Streaming Visualisation (Neural DAG)</option>
                    <option value="Connected Machinery">Connected Machinery Fleet</option>
                    <option value="Toolbox & Hub">Toolbox & Intel Hub</option>
                    <option value="Landing">Landing Page</option>
                  </select>
                </div>

                {/* Auto-Refresh Toggle */}
                <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">Telemetry Auto-Poll</span>
                    <span className="text-[10px] text-slate-500">Periodically poll live sensor metrics every 4 seconds</span>
                  </div>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer relative ${
                      autoRefresh ? "bg-[#d98555]" : "bg-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      autoRefresh ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* CATEGORY 2: INVESTIGATION */}
            {activeCategory === "Investigation" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-0.5">Investigation DAG & AI Reasoning</h3>
                  <p className="text-slate-500 text-[11px]">Control multi-agent orchestration, critic debate rigor, and auto sign-off limits.</p>
                </div>

                {/* Reasoning Depth */}
                <div className="space-y-1.5 p-3 rounded-[12px] bg-slate-50 border border-slate-200/80">
                  <label className="font-bold text-slate-700 block text-[11px]">Autonomous Reasoning Rigor</label>
                  <select
                    value={reasoningDepth}
                    onChange={(e) => setReasoningDepth(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-[8px] text-xs font-mono text-slate-800 focus:outline-none focus:border-[#d98555]"
                  >
                    <option value="Thorough (Adversarial Critic)">Thorough (Full Adversarial Critic Debate)</option>
                    <option value="Fast Triage (Single Pass)">Fast Triage (Single Pass Anomaly Check)</option>
                    <option value="Strict Physics Verification">Strict Physics Verification (Golden SOP Audit)</option>
                  </select>
                </div>

                {/* LLM Engine Selection */}
                <div className="space-y-1.5 p-3 rounded-[12px] bg-slate-50 border border-slate-200/80">
                  <label className="font-bold text-slate-700 block text-[11px]">Primary Reasoning LLM</label>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-[8px] text-xs font-mono text-slate-800 focus:outline-none focus:border-[#d98555]"
                  >
                    <option value="Gemma-2 9B (Ollama GPU)">Gemma-2 9B (Local NVIDIA CUDA)</option>
                    <option value="DeepSeek-R1 Distill (Local)">DeepSeek-R1 Distill (Local Reasoning)</option>
                    <option value="Baseline Heuristic Engine">Baseline Heuristic Engine (Offline Rule-Based)</option>
                  </select>
                </div>

                {/* Auto Sign-off Confidence Threshold Slider */}
                <div className="space-y-2 p-3 rounded-[12px] bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-[11px]">Auto Sign-off Confidence Target</label>
                    <span className="font-mono font-bold text-[#c8764b] bg-[#faeee5] px-2 py-0.5 rounded text-[10.5px]">
                      {approvalThreshold}% Confidence
                    </span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="98"
                    value={approvalThreshold}
                    onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                    className="w-full accent-[#d98555] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Verdicts above {approvalThreshold}% automatically queue for single-click engineer sign-off.</p>
                </div>
              </div>
            )}

            {/* CATEGORY 3: NOTIFICATIONS */}
            {activeCategory === "Notifications" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-0.5">Alerts & Notifications</h3>
                  <p className="text-slate-500 text-[11px]">Manage real-time telemetry audio chimes, email digests, and audit logging.</p>
                </div>

                {/* Audio Chime */}
                <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#d98555]" />
                    <div>
                      <span className="font-bold text-slate-700 block text-[11px]">Audio Alert Chimes</span>
                      <span className="text-[10px] text-slate-500">Play alert sound on thermal overheat or pressure breach</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSoundAlerts(!soundAlerts)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer relative ${
                      soundAlerts ? "bg-[#d98555]" : "bg-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      soundAlerts ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Email Dispatch */}
                <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">Email Dossier Dispatch</span>
                    <span className="text-[10px] text-slate-500">Automatically email incident report PDF upon conclusive verdict</span>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer relative ${
                      emailAlerts ? "bg-[#d98555]" : "bg-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      emailAlerts ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Audit Logging */}
                <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">Immutable Audit Trail</span>
                    <span className="text-[10px] text-slate-500">Record all engineer sign-offs, overrides, and tech dispatches in DB</span>
                  </div>
                  <button
                    onClick={() => setAuditLogging(!auditLogging)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer relative ${
                      auditLogging ? "bg-[#d98555]" : "bg-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                      auditLogging ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* CATEGORY 4: SYSTEM */}
            {activeCategory === "System" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-0.5">System & Hardware Diagnostics</h3>
                  <p className="text-slate-500 text-[11px]">Inspect FastAPI backend connectivity, local CUDA GPU status, and EtherCAT node health.</p>
                </div>

                {/* Live Connection Badges */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200">
                    <span className="text-[9.5px] font-bold text-emerald-800 uppercase block">FastAPI REST Backend</span>
                    <span className="text-xs font-bold text-emerald-700 mt-1 block flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> ONLINE (Port 8000)
                    </span>
                  </div>

                  <div className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200">
                    <span className="text-[9.5px] font-bold text-emerald-800 uppercase block">NVIDIA CUDA GPU</span>
                    <span className="text-xs font-bold text-emerald-700 mt-1 block flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#d98555]" /> ACTIVE (34 tokens/sec)
                    </span>
                  </div>
                </div>

                {/* API Base URL */}
                <div className="space-y-1.5 p-3 rounded-[12px] bg-slate-50 border border-slate-200/80">
                  <label className="font-bold text-slate-700 block text-[11px]">FastAPI Backend URL</label>
                  <input
                    type="text"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-[8px] text-xs font-mono text-slate-800 focus:outline-none focus:border-[#d98555]"
                  />
                </div>

                {/* Export Diagnostic Logs */}
                <div className="p-3 rounded-[12px] bg-[#faeee5] border border-[#efc4ab] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">System Diagnostic Log Bundle</span>
                    <span className="text-[10px] text-slate-600">Export OLLAMA trace logs, DB schemas, and harness events</span>
                  </div>
                  <button
                    onClick={() => alert("ReliAI diagnostic log bundle exported successfully.")}
                    className="px-3 py-1.5 rounded-[8px] bg-[#d98555] hover:bg-[#c8764b] text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Logs
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-[#fdfbf9] flex items-center justify-between shrink-0 text-xs font-mono">
          <span className="text-slate-400">ReliAI OS v2.4.1 • Configuration Saved Automatically</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[8px] bg-[#d98555] hover:bg-[#c8764b] text-white font-bold transition cursor-pointer shadow-2xs"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
}
