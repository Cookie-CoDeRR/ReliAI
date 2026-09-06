import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

export default function EnergizedWireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.38
  });

  const {
    state = 'idle', // idle | queued | active | streaming | done | error
    animated = true,
    isCircuitFlash = false
  } = data || {};

  // Color mapping based on our signature champagne / terracotta theme
  const EDGE_COLORS = {
    idle: {
      stroke: 'rgba(203, 213, 225, 0.8)',
      glow: 'none',
      width: 1.5
    },
    queued: {
      stroke: 'rgba(245, 158, 11, 0.85)',
      glow: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.35))',
      width: 2
    },
    active: {
      stroke: 'url(#theme-edge-active-gradient)',
      glow: 'drop-shadow(0 0 6px rgba(217, 133, 85, 0.6))',
      width: 2.5
    },
    streaming: {
      stroke: 'url(#theme-edge-streaming-gradient)',
      glow: 'drop-shadow(0 0 8px rgba(200, 118, 75, 0.7))',
      width: 3
    },
    done: {
      stroke: 'rgba(16, 185, 129, 0.85)',
      glow: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))',
      width: 2
    },
    error: {
      stroke: 'rgba(244, 63, 94, 0.85)',
      glow: 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.5))',
      width: 2
    }
  };

  const currentTheme = EDGE_COLORS[state] || EDGE_COLORS.idle;
  const isEnergized = state === 'active' || state === 'streaming' || state === 'queued';

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          {/* Active Gradient: Terracotta to Warm Amber */}
          <linearGradient id="theme-edge-active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d98555" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#c8764b" stopOpacity="1" />
          </linearGradient>

          {/* Streaming Gradient: Deep Terracotta to Bright Peach Glow */}
          <linearGradient id="theme-edge-streaming-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c8764b" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#d98555" stopOpacity="1" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Ambient background wire track */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(217, 133, 85, 0.12)"
        strokeWidth={currentTheme.width + 2}
        className="transition-all duration-300"
      />

      {/* Main Energized Wire Stroke */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={currentTheme.stroke}
        strokeWidth={currentTheme.width}
        style={{
          filter: currentTheme.glow,
          ...style
        }}
        className={`transition-all duration-300 ${
          isEnergized ? 'animate-dash-flow' : ''
        } ${isCircuitFlash ? 'animate-circuit-flash' : ''}`}
      />

      {/* Travelling Particle Pulse for Active / Streaming State */}
      {isEnergized && (
        <circle r="3.5" fill="#d98555" className="shadow-[0_0_8px_#d98555]">
          <animateMotion
            dur={state === 'streaming' ? '1.2s' : '1.8s'}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </>
  );
}
