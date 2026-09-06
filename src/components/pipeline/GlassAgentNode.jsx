import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ShieldAlert,
  Database,
  Activity,
  Brain,
  Scale,
  CheckCircle2,
  FileCheck2,
  AlertOctagon,
  Sparkles,
  Zap,
  Loader2,
  Cpu,
  Flame,
  Layers,
  Search
} from 'lucide-react';

const ICON_MAP = {
  prompt: MessageSquare,
  triage: ShieldAlert,
  rag: Database,
  domain: Activity,
  fft: Activity,
  root_cause: Brain,
  critic: Scale,
  safety: Cpu,
  verdict: FileCheck2,
  default: Sparkles
};

// 6 distinct state visual treatments matching our signature Champagne / Terracotta theme
const STATE_STYLES = {
  idle: {
    badge: 'IDLE',
    border: 'border-slate-200/80 bg-white/80 text-slate-500',
    glow: 'shadow-2xs',
    iconBg: 'bg-slate-100 text-slate-500',
    halo: 'border-transparent',
    accent: '#64748b',
    opacity: 'opacity-70'
  },
  queued: {
    badge: 'QUEUED',
    border: 'border-amber-300 bg-[#fffdfa] text-amber-800',
    glow: 'shadow-[0_4px_16px_rgba(245,158,11,0.18)]',
    iconBg: 'bg-amber-100 text-amber-700',
    halo: 'border-amber-400/50 animate-pulse',
    accent: '#f59e0b',
    opacity: 'opacity-90'
  },
  active: {
    badge: 'THINKING',
    border: 'border-[#d98555] bg-gradient-to-br from-white via-[#fffaf7] to-[#faeee5] text-slate-800',
    glow: 'shadow-[0_8px_24px_rgba(217,133,85,0.28),0_0_0_1px_rgba(217,133,85,0.3)]',
    iconBg: 'bg-gradient-to-tr from-[#d98555] to-[#c8764b] text-white shadow-[0_2px_10px_rgba(217,133,85,0.4)]',
    halo: 'border-[#d98555]/80 shadow-[0_0_16px_rgba(217,133,85,0.35)] animate-pulse-halo',
    accent: '#d98555',
    opacity: 'opacity-100'
  },
  streaming: {
    badge: 'STREAMING',
    border: 'border-[#c8764b] bg-gradient-to-br from-white via-[#fffaf6] to-[#faeee5] text-slate-800',
    glow: 'shadow-[0_10px_28px_rgba(217,133,85,0.32),0_0_0_1.5px_rgba(200,118,75,0.4)]',
    iconBg: 'bg-gradient-to-tr from-[#d98555] to-[#b7653b] text-white shadow-[0_2px_12px_rgba(200,118,75,0.5)]',
    halo: 'border-t-[#d98555] border-r-amber-400 border-b-[#c8764b] border-l-transparent animate-rotate-halo',
    accent: '#c8764b',
    opacity: 'opacity-100'
  },
  done: {
    badge: 'VERIFIED',
    border: 'border-emerald-300 bg-gradient-to-br from-white to-emerald-50/40 text-slate-800',
    glow: 'shadow-[0_4px_16px_rgba(16,185,129,0.18)]',
    iconBg: 'bg-emerald-100 border border-emerald-300 text-emerald-800',
    halo: 'border-emerald-400/40',
    accent: '#10b981',
    opacity: 'opacity-100'
  },
  error: {
    badge: 'FAILED',
    border: 'border-rose-300 bg-gradient-to-br from-white to-rose-50/50 text-rose-900',
    glow: 'shadow-[0_6px_20px_rgba(244,63,94,0.22)]',
    iconBg: 'bg-rose-100 text-rose-700',
    halo: 'border-rose-400/70 animate-ping',
    accent: '#f43f5e',
    opacity: 'opacity-100'
  }
};

export default function GlassAgentNode({ data, selected }) {
  const {
    label = 'Agent',
    role = 'Specialist',
    state = 'idle', // idle | queued | active | streaming | done | error
    iconType = 'default',
    latency = null,
    tokens = null,
    outputSnippet = '',
    confidence = null,
    isRoot = false,
    isTarget = false
  } = data || {};

  const Icon = ICON_MAP[iconType] || ICON_MAP.default;
  const currentStyle = STATE_STYLES[state] || STATE_STYLES.idle;
  const isActiveOrStreaming = state === 'active' || state === 'streaming';

  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{
        scale: isActiveOrStreaming ? 1.04 : 1,
        opacity: 1
      }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 24
      }}
      className={`relative group select-none min-w-[210px] max-w-[250px] ${currentStyle.opacity}`}
    >
      {/* Target input connection handle */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-[#d98555] !border-2 !border-white rounded-full shadow-[0_0_8px_rgba(217,133,85,0.6)] -left-1.5 transition-transform group-hover:scale-125"
        />
      )}

      {/* Rotating / Pulsing Ambient Halo */}
      {isActiveOrStreaming && (
        <div
          className={`absolute -inset-1.5 rounded-[14px] pointer-events-none border-2 ${currentStyle.halo}`}
        />
      )}

      {/* Main Frosted Glassmorphic Squircle Card with 10px corners */}
      <div
        className={`relative overflow-hidden rounded-[10px] sm:rounded-[12px] p-3 bg-white/95 backdrop-blur-xl border transition-all duration-300 ${
          currentStyle.border
        } ${currentStyle.glow} ${
          selected ? 'ring-2 ring-[#d98555] ring-offset-2 ring-offset-[#eddcd0]' : ''
        }`}
      >
        {/* Specular Light Sweep Animation on glass */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[10px]">
          <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-specular-sweep" />
        </div>

        {/* Top Header Strip: Icon + Badge */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-transform group-hover:scale-110 ${currentStyle.iconBg}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-xs text-slate-800 tracking-tight leading-none truncate max-w-[110px]">
                {label}
              </h4>
              <p className="font-mono text-[9px] text-slate-400 leading-tight mt-0.5 truncate max-w-[110px]">
                {role}
              </p>
            </div>
          </div>

          {/* State Badge */}
          <div className="flex flex-col items-end">
            <span
              className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[8px] font-bold tracking-wider uppercase ${
                state === 'active'
                  ? 'bg-[#faeee5] text-[#c8764b] border border-[#f5cdb6] animate-pulse'
                  : state === 'streaming'
                  ? 'bg-[#faeee5] text-[#c8764b] border border-[#d98555] animate-pulse'
                  : state === 'done'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : state === 'queued'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {currentStyle.badge}
            </span>
          </div>
        </div>

        {/* Middle Body: Dynamic Content / Live Reasoning */}
        <div className="pt-2 relative z-10">
          {outputSnippet ? (
            <p className="font-mono text-[9.5px] text-slate-700 leading-snug line-clamp-2 bg-[#faf5f0] p-1.5 rounded-[6px] border border-[#ecd7c7]">
              {outputSnippet}
            </p>
          ) : (
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                {isActiveOrStreaming ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-[#d98555]" />
                    <span className="text-[#c8764b] font-medium">Processing prompt...</span>
                  </>
                ) : state === 'done' ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span>Awaiting trigger</span>
                )}
              </span>
              {confidence && (
                <span className="text-[#d98555] font-bold">{confidence}%</span>
              )}
            </div>
          )}
        </div>

        {/* Footer Strip: Latency + Token Counter */}
        {(latency || tokens) && (
          <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 pt-1.5 mt-1.5 border-t border-slate-100">
            {latency && <span>⏱ {latency}ms</span>}
            {tokens && <span>⚡ {tokens} tokens</span>}
          </div>
        )}
      </div>

      {/* Source output connection handle */}
      {!isTarget && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-[#d98555] !border-2 !border-white rounded-full shadow-[0_0_8px_rgba(217,133,85,0.6)] -right-1.5 transition-transform group-hover:scale-125"
        />
      )}
    </motion.div>
  );
}
