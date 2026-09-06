import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../landing.css';

// ─── SVG Icon Library (theme-matched, no emojis) ─────────────────────────────
const Icon = {
  Logo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/>
    </svg>
  ),
  ArrowUpRight: () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
    </svg>
  ),
  Cpu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Brain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.46 2.5 2.5 0 01-1.07-4.85A3 3 0 016.5 9a2.5 2.5 0 01.5-4.96V4a2 2 0 012-2z"/>
      <path d="M14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 004.96-.46 2.5 2.5 0 001.07-4.85A3 3 0 0017.5 9a2.5 2.5 0 00-.5-4.96V4a2 2 0 00-2-2z"/>
    </svg>
  ),
  Swords: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
      <polyline points="16 16 20 20"/><line x1="19" y1="5" x2="5" y2="19"/>
      <polyline points="16 8 8 16"/><polyline points="4 20 20 4"/>
    </svg>
  ),
  Arm: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v7"/><path d="M10 7l-4 4-4-4"/>
      <path d="M6 11a8 8 0 008 8"/><path d="M14 15v4h4"/>
    </svg>
  ),
  CheckBadge: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Server: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Network: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="5" cy="19" r="2"/>
      <path d="M12 7v3M5.5 17.5L10 13M18.5 17.5L14 13"/>
    </svg>
  ),
  Terminal: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
};

// ─── Constants ───────────────────────────────────────────────────────────────
const MACHINES = [
  { name: "KUKA KR 210 R3100", type: "Heavy Payload", reach: "3100 mm", payload: "210 kg", axes: "6-DOF", image: "/machinery/kr210_prime.jpg", domain: "Automotive Assembly", status: "MONITORING", uptime: "99.8%" },
  { name: "ABB IRB 6700", type: "Industrial Robot", reach: "3200 mm", payload: "235 kg", axes: "6-DOF", image: "/machinery/abb_irb6700.jpg", domain: "Welding & Handling", status: "INCIDENT", uptime: "97.2%" },
  { name: "FANUC M-900iA", type: "Ultra-Payload", reach: "3696 mm", payload: "700 kg", axes: "6-DOF", image: "/machinery/fanuc_m900.jpg", domain: "Press & Stamping", status: "MONITORING", uptime: "99.4%" },
  { name: "KUKA LBR iiwa 14", type: "Collaborative", reach: "820 mm", payload: "14 kg", axes: "7-DOF", image: "/machinery/kuka_iiwa.jpg", domain: "Precision Assembly", status: "MONITORING", uptime: "99.9%" },
  { name: "Yaskawa GP280", type: "High-Speed", reach: "2702 mm", payload: "280 kg", axes: "6-DOF", image: "/machinery/yaskawa_gp280.jpg", domain: "Palletizing", status: "MONITORING", uptime: "99.6%" },
  { name: "KUKA KR Quantec", type: "Precision", reach: "2013 mm", payload: "120 kg", axes: "6-DOF", image: "/machinery/kr_quantum.jpg", domain: "Laser Cutting", status: "MONITORING", uptime: "99.7%" },
];

const AGENTS = [
  { id: "01", name: "Triage Agent", desc: "Parses thermal, acoustic, power & kinematic signals. Flags emergency containment needs.", color: "#f59e0b", icon: <Icon.Activity /> },
  { id: "02", name: "Evidence RAG", desc: "Computes golden baseline deviations. Retrieves historical incidents and maintenance SOPs.", color: "#6366f1", icon: <Icon.Database /> },
  { id: "03", name: "Kinematics Agent", desc: "6-axis joint torque, encoder position error & motor current analysis.", color: "#0ea5e9", icon: <Icon.Cpu /> },
  { id: "04", name: "Vision Agent", desc: "Qwen2.5-VL multimodal optical inspection & FLIR thermal heatmap analysis.", color: "#10b981", icon: <Icon.Eye /> },
  { id: "05", name: "Root Cause AI", desc: "Evidence-grounded ranked causal hypotheses via Gemma 2 reasoning engine.", color: "#d98555", icon: <Icon.Brain /> },
  { id: "06", name: "Critic Agent", desc: "Adversarial falsification loop — actively searches for contradictory physical evidence.", color: "#e11d48", icon: <Icon.Shield /> },
];

const TICKER_ITEMS = [
  "Joint_3 Thermal Overheat — Root Cause Identified in 4.2s",
  "Pneumatic Drop [ABB IRB 6700] — Solenoid Seal Confirmed",
  "Phase Undervoltage — Critic Agent Validated 94% Confidence",
  "KUKA KR 210 — Bead Seating Offset +1.55mm | Action: APPROVED",
  "Yaskawa GP280 — FFT Anomaly Detected | Investigation Launched",
  "Investigation Inconclusive — Human Inspection Triggered (HITL)",
];

// ─── Cursor-Reactive Grid Background ─────────────────────────────────────────
function InteractiveGrid() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const CELL = 42;
    let t = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const INFLUENCE = 180;

      const cols = Math.ceil(W / CELL) + 1;
      const rows = Math.ceil(H / CELL) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CELL;
          const y = r * CELL;
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - dist / INFLUENCE);

          // Tiny, faint dots at rest — glow hard on hover
          const breathe = 0.04 * Math.sin(t * 0.5 + c * 0.4 + r * 0.6);
          const baseAlpha = 0.10 + breathe;           // very subtle at rest
          const dotAlpha = baseAlpha + proximity * 0.85; // strong on hover
          const dotRadius = 0.7 + proximity * 2.8;    // tiny rest, big hover

          // Color: warm champagne at rest → vivid terracotta on hover
          const r1 = Math.round(190 + proximity * 27);
          const g1 = Math.round(140 + proximity * (-7));
          const b1 = Math.round(110 + proximity * (-45));

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);

          // Add glow bloom on hover via shadow
          if (proximity > 0.05) {
            ctx.shadowColor = `rgba(217, 133, 85, ${proximity * 0.9})`;
            ctx.shadowBlur = proximity * 10;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillStyle = `rgba(${r1}, ${g1}, ${b1}, ${Math.min(dotAlpha, 0.95)})`;
          ctx.fill();
          ctx.shadowBlur = 0; // reset so dots don't bleed into each other
        }
      }

      // Draw cursor glow halo
      if (mx > 0 && my > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, INFLUENCE * 0.55);
        grad.addColorStop(0, 'rgba(217, 133, 85, 0.09)');
        grad.addColorStop(1, 'rgba(217, 133, 85, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      t += 0.015;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    canvas.parentElement.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── Floating Orbs ────────────────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-[#d98555]/8 blur-[80px] animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }} />
      <div className="absolute top-[50%] right-[8%] w-64 h-64 rounded-full bg-[#c8764b]/6 blur-[70px] animate-float" style={{ animationDelay: '3s', animationDuration: '10s' }} />
      <div className="absolute bottom-[10%] left-[30%] w-96 h-48 rounded-full bg-[#d98555]/5 blur-[90px] animate-float" style={{ animationDelay: '1.5s', animationDuration: '12s' }} />
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function TickerTape() {
  return (
    <div className="relative bg-slate-950/95 border-b border-slate-800/80 py-2 overflow-hidden backdrop-blur-sm">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 text-[10px] font-mono text-slate-400 px-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d98555] flex-shrink-0" />
            <span>{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Machine Card ─────────────────────────────────────────────────────────────
function MachineCard({ machine, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative group bg-white rounded-[12px] border border-slate-200/60 overflow-hidden card-hover"
      style={{ animationDelay: `${delay}ms`, boxShadow: hovered ? '0 24px 48px -12px rgba(217,133,85,0.2)' : '0 4px 16px -4px rgba(0,0,0,0.07)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status badge */}
      <div className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold ${
        machine.status === 'INCIDENT' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${machine.status === 'INCIDENT' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
        {machine.status}
      </div>

      {/* Image */}
      <div className="relative h-44 bg-slate-50 overflow-hidden">
        <img src={machine.image} alt={machine.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {hovered && <div className="absolute inset-0 pointer-events-none overflow-hidden"><div className="w-full h-0.5 bg-[#d98555]/20 animate-scanline" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] font-mono font-bold text-[#d98555] uppercase tracking-widest mb-0.5">{machine.domain}</p>
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold font-heading text-slate-900 leading-tight">{machine.name}</h3>
          <span className="text-[9px] px-2 py-0.5 bg-[#faeee5] text-[#c8764b] rounded-md font-mono font-semibold border border-[#ecd7c7] whitespace-nowrap shrink-0">{machine.axes}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100">
          {[{ label: 'Reach', val: machine.reach }, { label: 'Payload', val: machine.payload }, { label: 'Uptime', val: machine.uptime }].map(({ label, val }) => (
            <div key={label}>
              <p className="text-[9px] text-slate-400 font-mono">{label}</p>
              <p className="text-[11px] font-mono font-semibold text-slate-700">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Node ───────────────────────────────────────────────────────────────
function AgentNode({ agent, isActive, index }) {
  return (
    <div className={`relative flex flex-col items-center transition-all duration-500 ${isActive ? 'scale-105' : 'opacity-50 scale-95'}`}>
      <div
        className={`w-14 h-14 rounded-[14px] flex items-center justify-center border-2 transition-all duration-500`}
        style={isActive ? {
          background: `linear-gradient(135deg, ${agent.color}20, ${agent.color}08)`,
          borderColor: agent.color,
          boxShadow: `0 0 0 4px ${agent.color}18, 0 8px 24px ${agent.color}30`,
        } : {
          background: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <span className={`w-6 h-6 transition-colors duration-500`} style={{ color: isActive ? agent.color : '#4b5563' }}>
          {agent.icon}
        </span>
      </div>
      <p className="text-[10px] font-mono font-bold text-slate-300 mt-2.5 text-center leading-snug max-w-[76px]">{agent.name}</p>
      {/* Connector line */}
      {index < AGENTS.length - 1 && (
        <div className="absolute left-full top-7 hidden lg:block w-full pointer-events-none" style={{ width: 'calc(100% - 56px)', left: '100%' }}>
          <div className={`h-px w-full transition-all duration-700 ${isActive ? 'bg-gradient-to-r from-[#d98555] via-[#d98555]/60 to-transparent' : 'bg-white/10'}`} />
        </div>
      )}
    </div>
  );
}

// ─── Stat Counter ─────────────────────────────────────────────────────────────
function StatCounter({ value, suffix, label, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`text-center transition-all duration-700`} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transitionDelay: `${delay}ms` }}>
      <div className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">{value}<span className="text-[#d98555]">{suffix}</span></div>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage({ onEnterApp, onOpenAuth, user }) {
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setActiveAgentIndex(p => (p + 1) % AGENTS.length), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 24);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, []);

  return (
    <div ref={containerRef} className="landing-body landing-scroll bg-[#fcfaf8] font-body text-slate-900 h-full">
      <TickerTape />

      {/* ── NAV ── */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/96 backdrop-blur-xl border-b border-[#ecd7c7]/70 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[#d98555] to-[#c8764b] flex items-center justify-center text-white shadow-sm">
              <span className="w-4 h-4"><Icon.Logo /></span>
            </div>
            <span className="font-heading font-black text-xl tracking-tight text-slate-900">Reli<span className="text-[#d98555]">AI</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-slate-600">
            <a href="#machines" className="hover:text-[#d98555] transition-colors">Fleet</a>
            <a href="#pipeline" className="hover:text-[#d98555] transition-colors">Pipeline</a>
            <a href="#why" className="hover:text-[#d98555] transition-colors">Why ReliAI</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {user ? (
              <button onClick={onEnterApp} className="flex items-center gap-2 px-4 py-2 bg-[#d98555] hover:bg-[#c8764b] text-white text-sm font-semibold rounded-[9px] shadow-sm transition-all cursor-pointer">
                Launch Console <span className="w-4 h-4"><Icon.ArrowRight /></span>
              </button>
            ) : (
              <>
                <button onClick={onOpenAuth} className="px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-[#ecd7c7] rounded-[8px] hover:bg-[#fdfaf8] transition-all cursor-pointer">Sign In</button>
                <button onClick={onEnterApp} className="flex items-center gap-1.5 px-4 py-2 bg-[#d98555] hover:bg-[#c8764b] text-white text-sm font-semibold rounded-[9px] shadow-sm transition-all cursor-pointer">
                  Demo Preview <span className="w-4 h-4"><Icon.ArrowRight /></span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-5 py-24 overflow-hidden">
        <InteractiveGrid />
        <FloatingOrbs />

        <div className="relative z-10 flex flex-col items-center">
          {/* Headline */}
          <h1 className="animate-fade-slide-up text-5xl sm:text-6xl lg:text-[74px] font-extrabold font-heading leading-[1.07] tracking-tight max-w-4xl" style={{ animationDelay: '80ms' }}>
            Industrial AI that<br />
            <span className="bg-gradient-to-r from-[#d98555] via-[#c8764b] to-[#b6653c] bg-clip-text text-transparent">Investigates.</span>{' '}Not Guesses.
          </h1>

          <p className="animate-fade-slide-up mt-6 text-[17px] text-slate-500 max-w-xl leading-relaxed" style={{ animationDelay: '160ms' }}>
            A multi-agent harness for robotic manufacturing lines. Every hypothesis is evidence-grounded, adversarially challenged, and human-approved before any action.
          </p>

          {/* CTAs */}
          <div className="animate-fade-slide-up flex flex-wrap items-center justify-center gap-3 mt-10" style={{ animationDelay: '240ms' }}>
            <button onClick={onEnterApp} className="group flex items-center gap-2 px-7 py-3.5 bg-[#d98555] hover:bg-[#c8764b] text-white font-semibold rounded-[10px] shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer text-[15px]">
              Open Command Center
              <span className="w-5 h-5 group-hover:translate-x-0.5 transition-transform"><Icon.ArrowRight /></span>
            </button>
            <a href="#pipeline" className="flex items-center gap-2 px-6 py-3.5 bg-white/90 backdrop-blur border border-[#ecd7c7] hover:border-[#d98555]/50 text-slate-700 font-semibold rounded-[10px] shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer text-[15px]">
              Agent Pipeline
              <span className="w-4 h-4 text-[#d98555]"><Icon.ArrowUpRight /></span>
            </a>
          </div>

          {/* Terminal preview */}
          <div className="animate-fade-slide-up mt-16 w-full max-w-2xl" style={{ animationDelay: '380ms' }}>
            <div className="bg-slate-950 rounded-[14px] border border-slate-800/80 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/70 bg-slate-900/60">
                <span className="w-3 h-3 rounded-full bg-rose-500/90" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
                <span className="ml-3 text-[11px] font-mono text-slate-500">reliai — investigation harness</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> GPU Metal Active · 57.2 t/s
                </span>
              </div>
              <div className="p-5 font-mono text-[12px] space-y-1.5 text-left leading-relaxed">
                <p className="text-slate-600"># Joint_3 thermal anomaly · ABB IRB 6700</p>
                <p><span className="text-amber-400">TRIAGE</span> <span className="text-slate-600">›</span> <span className="text-amber-200">THERMAL_OVERHEAT</span> <span className="text-slate-600">· Severity: CRITICAL</span></p>
                <p><span className="text-indigo-400">EVIDENCE</span> <span className="text-slate-600">›</span> <span className="text-slate-300">Δtemp <span className="text-rose-400">+18.5°C</span> vs baseline · SOP-HARMONIC-001 matched</span></p>
                <p><span className="text-sky-400">KINEMATICS</span> <span className="text-slate-600">›</span> <span className="text-slate-300">Torque spike <span className="text-amber-300">23.4 Nm</span> · 847 Hz harmonic at Joint_3</span></p>
                <p><span className="text-[#d98555]">ROOT_CAUSE</span> <span className="text-slate-600">›</span> <span className="text-green-300">Harmonic drive lubrication breakdown · conf: 88.5%</span></p>
                <p><span className="text-rose-400">CRITIC</span> <span className="text-slate-600">›</span> <span className="text-slate-300">Motor current nominal <span className="text-emerald-400">3.1 A ✓</span> · No contradiction</span></p>
                <p><span className="text-emerald-400 font-bold">VERDICT</span> <span className="text-slate-600">›</span> <span className="text-white font-semibold">Harmonic drive failure confirmed</span> <span className="text-slate-500">· HITL gate pending</span></p>
                <p className="text-slate-700">_ <span className="animate-blink text-slate-500">▋</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white border-y border-[#ecd7c7]/60 py-12">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <StatCounter value="< 5" suffix="s" label="Mean time to root cause" delay={0} />
          <StatCounter value="99.4" suffix="%" label="Critic agent precision" delay={100} />
          <StatCounter value="57" suffix=" t/s" label="Local GPU token throughput" delay={200} />
          <StatCounter value="6" suffix="" label="Specialized AI agents" delay={300} />
        </div>
      </section>

      {/* ── FLEET ── */}
      <section id="machines" className="relative py-20 px-5 sm:px-8 overflow-hidden">
        {/* Subtle background for fleet section */}
        <div className="absolute inset-0 bg-[#fdf9f6]" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(217,133,85,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-mono font-bold text-[#d98555] uppercase tracking-widest mb-2">Monitored Fleet</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">Connected Industrial Robots</h2>
            <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">ReliAI monitors 6-DOF robotic arms across automotive, stamping, welding, and assembly lines in real time.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MACHINES.map((m, i) => <MachineCard key={m.name} machine={m} delay={i * 80} />)}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section id="pipeline" className="py-20 bg-slate-950 relative overflow-hidden">
        {/* Animated grid bg */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(217,133,85,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(217,133,85,0.6) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(217,133,85,0.08)_0%,transparent_70%)]" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono font-bold text-[#d98555] uppercase tracking-widest mb-2">Multi-Agent Harness</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">Adversarial Investigation Pipeline</h2>
            <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">Each agent is an independent specialist. The Critic Agent actively tries to disprove the hypothesis before any mitigation is authorized.</p>
          </div>

          {/* Nodes */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-0">
            {AGENTS.map((agent, i) => (
              <div key={agent.id} className="flex flex-col lg:flex-row items-center w-full lg:w-auto">
                <AgentNode agent={agent} isActive={activeAgentIndex >= i} index={i} />
                {i < AGENTS.length - 1 && (
                  <div className={`lg:hidden w-px h-8 mt-2 transition-all duration-500 ${activeAgentIndex > i ? 'bg-[#d98555]' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Active agent description */}
          <div className="mt-12 flex justify-center">
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-[12px] px-8 py-5 max-w-md text-center transition-all duration-500">
              <p className="text-[10px] font-mono text-[#d98555] uppercase tracking-widest mb-1">Currently active</p>
              <p className="text-white font-bold font-heading text-lg mb-1">{AGENTS[activeAgentIndex].name}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{AGENTS[activeAgentIndex].desc}</p>
            </div>
          </div>

          {/* HITL note */}
          <div className="mt-8 flex items-center justify-center gap-3 text-sm font-mono flex-wrap">
            <span className="text-slate-600">All agents complete →</span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-[8px] font-bold">
              <span className="w-4 h-4"><Icon.Users /></span>
              Human-in-the-Loop Gate
            </span>
            <span className="text-slate-600">Required for all mitigations</span>
          </div>
        </div>
      </section>

      {/* ── WHY RELIAI ── */}
      <section id="why" className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono font-bold text-[#d98555] uppercase tracking-widest mb-2">The Difference</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">Why Not Just Use ChatGPT?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Icon.Lock />, title: "Zero Data Leakage", desc: "Machine schematics, defect rates, and telemetry never leave your factory. Runs fully air-gapped on local Apple Silicon GPU.", accent: "#10b981" },
              { icon: <Icon.Brain />, title: "Evidence-Grounded Only", desc: "Cannot speculate. Every hypothesis must cite specific sensor deviations or it outputs INCONCLUSIVE and escalates to a human.", accent: "#d98555" },
              { icon: <Icon.Shield />, title: "Adversarial Critic Loop", desc: "A separate Critic Agent actively tries to disprove every hypothesis by searching for contradictory physical evidence.", accent: "#e11d48" },
            ].map(item => (
              <div key={item.title} className="p-6 rounded-[12px] border border-[#ecd7c7]/80 card-hover bg-[#fdfaf8]">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4" style={{ background: `${item.accent}12`, color: item.accent }}>
                  <span className="w-5 h-5">{item.icon}</span>
                </div>
                <h3 className="font-bold font-heading text-slate-900 text-base mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                <div className="mt-5 h-0.5 w-10 rounded-full" style={{ backgroundColor: item.accent }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative py-24 px-5 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,133,85,0.1)_0%,transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(rgba(217,133,85,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#d98555]/10 border border-[#d98555]/25 rounded-full text-[11px] font-mono text-[#d98555] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d98555] animate-pulse" />
            Running on Apple M-Series · 57.2 tokens/sec
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white mb-4">Ready to stop guessing<br />and start investigating?</h2>
          <p className="text-slate-500 text-sm mb-10">Deploy ReliAI on your factory floor. Multi-agent, air-gapped, real-time.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onEnterApp} className="flex items-center gap-2 px-7 py-3.5 bg-[#d98555] hover:bg-[#c8764b] text-white font-bold rounded-[10px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
              Open Command Center <span className="w-5 h-5"><Icon.ArrowRight /></span>
            </button>
            <button onClick={onOpenAuth} className="px-6 py-3.5 bg-white/8 border border-white/15 hover:bg-white/12 text-white font-semibold rounded-[10px] transition-all cursor-pointer">
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-[#ecd7c7]/60 py-7 px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#d98555] to-[#c8764b] flex items-center justify-center text-white">
              <span className="w-3.5 h-3.5"><Icon.Logo /></span>
            </div>
            <span className="font-heading font-black text-base text-slate-900">Reli<span className="text-[#d98555]">AI</span></span>
            <span className="text-xs text-slate-400 font-mono">© 2026 ReliAI Systems</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </footer>
    </div>
  );
}
