import React from 'react';
import { 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  Play, 
  Layers, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Database, 
  Search, 
  FileText,
  Workflow,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Terminal
} from 'lucide-react';

export default function LandingPageView({ onEnterApp, onOpenAuth, user }) {
  return (
    <div className="min-h-screen bg-[#fcfaf8] text-slate-800 font-body relative overflow-x-hidden selection:bg-[#faeee5] selection:text-[#c8764b]">
      {/* Ambient Wave Glows */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-3xl opacity-40 z-0"
        style={{
          background: 'radial-gradient(circle, rgba(217, 133, 85, 0.35) 0%, rgba(250, 238, 229, 0.6) 50%, transparent 80%)'
        }}
      />
      <div 
        className="pointer-events-none absolute top-[900px] right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-25 z-0"
        style={{
          background: 'radial-gradient(circle, rgba(200, 118, 75, 0.3) 0%, rgba(250, 238, 229, 0.4) 60%, transparent 80%)'
        }}
      />

      {/* Subtle Terracotta Dotted Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(217, 133, 85, 0.25) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR                                                     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#ecd7c7]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#faeee5] to-[#eddcd0] border border-[#d98555]/30 flex items-center justify-center text-[#c8764b] shadow-xs">
              <Cpu size={20} className="text-[#c8764b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg tracking-tight text-slate-800">
                  Reli<span className="text-[#d98555]">AI</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-[#faeee5] text-[#c8764b] border border-[#ecd7c7]">
                  v2.4 Metal
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-none">
                Autonomous Industrial Reliability
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#capabilities" className="hover:text-[#c8764b] transition-colors">Capabilities</a>
            <a href="#architecture" className="hover:text-[#c8764b] transition-colors">Agent Pipeline</a>
            <a href="#fleet" className="hover:text-[#c8764b] transition-colors">Connected Machinery</a>
            <a href="#specs" className="hover:text-[#c8764b] transition-colors">Hardware & GPU</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{user.displayName || user.email?.split('@')[0] || "Plant Engineer"}</span>
                  <span className="text-[10px] text-emerald-600 font-mono">Authenticated</span>
                </div>
                <button
                  onClick={onEnterApp}
                  className="px-4 py-2 bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b6653c] text-white text-xs font-semibold rounded-[8px] shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Console</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-[#faeee5]/80 hover:bg-[#faeee5] border border-[#ecd7c7] rounded-[8px] transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onEnterApp}
                  className="px-4 py-2 bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b6653c] text-white text-xs font-semibold rounded-[8px] shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Launch App</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] bg-white/90 backdrop-blur-md border border-[#ecd7c7] shadow-xs mb-6 text-xs text-slate-700 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800">Edge Industrial LLM Engine:</span>
          <span className="text-[#c8764b] font-medium">Apple Silicon Metal Hardware Accelerated</span>
          <ChevronRight size={14} className="text-slate-400" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Autonomous Multi-Agent Reliability Engineering for{' '}
          <span className="bg-gradient-to-r from-[#d98555] via-[#c8764b] to-[#b6653c] bg-clip-text text-transparent">
            Industrial Robotics
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-body leading-relaxed">
          From microsecond EtherCAT bus telemetry spikes to physically grounded root cause diagnoses in under 5 seconds. Multi-agent adversarial debate running entirely locally on your factory edge.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onEnterApp}
            className="px-6 py-3 bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b6653c] text-white text-sm font-semibold rounded-[10px] shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play size={16} className="fill-white" />
            <span>Launch Command Center</span>
          </button>
          <a
            href="#architecture"
            className="px-5 py-3 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-[#ecd7c7] text-sm font-semibold rounded-[10px] shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
          >
            <Workflow size={16} className="text-[#d98555]" />
            <span>Explore Agent Architecture</span>
          </a>
        </div>

        {/* Key Metrics Strip */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 bg-white/90 backdrop-blur-md rounded-[10px] border border-white/80 shadow-xs">
            <div className="text-2xl font-bold font-heading text-slate-900">&lt; 4.8s</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Mean Time To Root Cause</div>
          </div>
          <div className="p-4 bg-white/90 backdrop-blur-md rounded-[10px] border border-white/80 shadow-xs">
            <div className="text-2xl font-bold font-heading text-emerald-600">99.4%</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Adversarial Critic Precision</div>
          </div>
          <div className="p-4 bg-white/90 backdrop-blur-md rounded-[10px] border border-white/80 shadow-xs">
            <div className="text-2xl font-bold font-heading text-[#c8764b]">57.2 t/s</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Local Metal GPU Inference</div>
          </div>
          <div className="p-4 bg-white/90 backdrop-blur-md rounded-[10px] border border-white/80 shadow-xs">
            <div className="text-2xl font-bold font-heading text-slate-900">ISO-10218</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Safety Spec RAG Grounding</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LIVE CAPABILITIES MATRIX                                               */}
      {/* ========================================================================= */}
      <section id="capabilities" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#d98555] mb-2 font-mono">
            Full-Stack Autonomous Reliability
          </h2>
          <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Engineered for High-Consequence Production Lines
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 bg-white/95 backdrop-blur-xl rounded-[12px] border border-white/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#faeee5] border border-[#ecd7c7] flex items-center justify-center text-[#c8764b] mb-4 group-hover:scale-105 transition-transform">
                <Radio size={20} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-800 mb-2">
                Real-Time Telemetry & EtherCAT Ingestion
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                Continuous 1000Hz sampling across 6-axis joint kinematics, three-phase bus voltage, pneumatic manifold pressure, and high-frequency vibration FFT spectra.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#ecd7c7]/60 flex items-center justify-between text-[11px] text-[#c8764b] font-semibold">
              <span>Zero-lag edge stream</span>
              <Activity size={14} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white/95 backdrop-blur-xl rounded-[12px] border border-white/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#faeee5] border border-[#ecd7c7] flex items-center justify-center text-[#c8764b] mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-800 mb-2">
                Adversarial Critic & Contradiction Audit
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                Our Critic Agent cross-examines hypotheses against empirical telemetry (e.g., thermal spike vs nominal motor current) to reject sensor false alarms before human escalation.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#ecd7c7]/60 flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
              <span>Eliminates false alarms</span>
              <CheckCircle2 size={14} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white/95 backdrop-blur-xl rounded-[12px] border border-white/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#faeee5] border border-[#ecd7c7] flex items-center justify-center text-[#c8764b] mb-4 group-hover:scale-105 transition-transform">
                <Zap size={20} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-800 mb-2">
                Golden Baseline RAG & SOP Matching
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                Autonomous retrieval from maintenance SOPs, OEM service manuals, and historical case databases with instant mathematical deviation scoring.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#ecd7c7]/60 flex items-center justify-between text-[11px] text-[#c8764b] font-semibold">
              <span>ISO & OEM Compliant</span>
              <Database size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. AGENT ARCHITECTURE SECTION                                             */}
      {/* ========================================================================= */}
      <section id="architecture" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 bg-white/95 backdrop-blur-xl rounded-[12px] border border-white/80 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d98555] font-mono">
                Multi-Agent Consensus Graph
              </span>
              <h3 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                6-Stage Distributed Investigation Harness
              </h3>
            </div>
            <button
              onClick={onEnterApp}
              className="px-4 py-2 bg-[#faeee5] hover:bg-[#faeee5]/80 text-[#c8764b] text-xs font-semibold rounded-[8px] border border-[#ecd7c7] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Live Visualizer</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { role: "Triage Agent", desc: "Domain & Severity Classification", icon: Flame, color: "text-amber-600" },
              { role: "Evidence RAG", desc: "Golden Baselines & Deviation Vector", icon: Database, color: "text-[#d98555]" },
              { role: "Kinematics", desc: "6-Axis Motor & Gear Torque FFT", icon: Activity, color: "text-indigo-600" },
              { role: "Vision VL", desc: "Qwen2.5-VL Optical & FLIR Heatmap", icon: Bot, color: "text-teal-600" },
              { role: "Root Cause", desc: "Physics Hypotheses via Gemma 2", icon: Cpu, color: "text-[#c8764b]" },
              { role: "Critic Agent", desc: "Adversarial Physical Validation", icon: ShieldCheck, color: "text-emerald-600" }
            ].map((node, i) => {
              const Icon = node.icon;
              return (
                <div 
                  key={i} 
                  className="p-4 rounded-[10px] bg-[#faeee5]/40 border border-[#ecd7c7] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400">0{i+1}</span>
                      <Icon size={16} className={node.color} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 font-heading">{node.role}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{node.desc}</p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Resident</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HARDWARE & GPU SPECIFICATIONS                                          */}
      {/* ========================================================================= */}
      <section id="specs" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#d98555] font-mono">
              Hardware Diagnostics
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-1 mb-4">
              Local Apple Silicon Metal GPU Acceleration
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body mb-6">
              Complete data privacy and zero cloud dependence. ReliAI runs quantized Gemma 2 models directly on local Unified Memory, delivering token generation throughput with instant response times.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/90 rounded-[8px] border border-[#ecd7c7]">
                <Cpu size={18} className="text-[#c8764b]" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Apple Silicon Unified VRAM Engine</div>
                  <div className="text-[11px] text-slate-500">Zero CPU-to-GPU memory copy overhead</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600">Active</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/90 rounded-[8px] border border-[#ecd7c7]">
                <Zap size={18} className="text-[#d98555]" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">512-Token Optimized Response Headroom</div>
                  <div className="text-[11px] text-slate-500">Sub-5s report compile time without truncation</div>
                </div>
                <span className="text-xs font-mono font-bold text-[#c8764b]">57.2 t/s</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900 text-slate-100 rounded-[12px] border border-slate-800 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 text-[11px] text-slate-300">reliai-gpu-health.sh</span>
              </div>
              <span className="text-[10px] text-emerald-400">METAL ACCELERATED</span>
            </div>
            <pre className="text-emerald-400 text-[11px] leading-relaxed overflow-x-auto">
{`$ curl -s http://127.0.0.1:8001/api/v1/system/gpu
{
  "hardware": {
    "gpu_vendor": "Apple Silicon (Metal)",
    "device_utilization_pct": 99,
    "renderer_utilization_pct": 64,
    "gpu_model": "Apple M-Series Metal"
  },
  "ollama_vram": {
    "running": true,
    "models": [
      { "name": "gemma2:latest", "gpu_vram_pct": 100.0 }
    ]
  },
  "token_throughput": {
    "eval_tokens_per_sec": 57.24,
    "prompt_tokens_per_sec": 14725.62,
    "gpu_accelerated": true
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION & FOOTER                                                */}
      {/* ========================================================================= */}
      <footer className="relative z-10 mt-16 bg-white/90 backdrop-blur-xl border-t border-[#ecd7c7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading font-extrabold text-lg text-slate-900">
                Reli<span className="text-[#d98555]">AI</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">© 2026 ReliAI Systems</span>
            </div>
            <p className="text-xs text-slate-500">
              Autonomous Industrial Multi-Agent Reliability Harness. Built for Apple Silicon Metal & Factory Edge.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-[8px] border border-[#ecd7c7] cursor-pointer shadow-2xs"
            >
              Sign In / Operator Login
            </button>
            <button
              onClick={onEnterApp}
              className="px-5 py-2 bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b6653c] text-white text-xs font-semibold rounded-[8px] shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Command Center</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
