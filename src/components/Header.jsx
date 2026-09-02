import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  ShieldAlert, 
  Radio, 
  Cpu, 
  RotateCcw, 
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';

export default function Header({ 
  activeMode, 
  setActiveMode, 
  isEStop, 
  setIsEStop, 
  onResetView,
  isLevitating,
  setIsLevitating
}) {
  const [uptime, setUptime] = useState(1482); // in seconds
  const [fps, setFps] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
      // Subtle random fluctuation for realistic 118-120 fps reading
      setFps(Math.floor(118 + Math.random() * 3));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <header className="h-16 px-5 border-b border-cyan-500/20 bg-[#0a0f1d]/90 backdrop-blur-xl flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Unit Identifier */}
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-cyan-500/10 border border-orange-500/40 glow-orange">
          <Zap className="w-5 h-5 text-orange-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 glow-emerald ring-2 ring-[#0a0f1d]"></span>
        </div>

        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
              ReliAi <span className="text-cyan-400 font-mono font-medium text-sm px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">Telemetry Control</span>
            </h1>
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300">
              v3.8-RT
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <span>UNIT: <span className="text-slate-200">KUKA-AG7-LAB</span></span>
            <span className="text-slate-600">/</span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>DDS PROTOCOL OK</span>
            </span>
          </div>
        </div>
      </div>

      {/* Global Status Badges */}
      <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
        {/* Levitation Plinth Status */}
        <button 
          onClick={() => setIsLevitating(!isLevitating)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
            isLevitating 
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 glow-cyan' 
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
          title="Toggle Electromagnetic Levitation Field"
        >
          <Layers className={`w-3.5 h-3.5 ${isLevitating ? 'text-cyan-400 animate-bounce' : 'text-slate-500'}`} />
          <span className="font-semibold">ANTIGRAVITY:</span>
          <span className={isLevitating ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
            {isLevitating ? 'ACTIVE (12.4cm)' : 'STANDBY'}
          </span>
        </button>

        {/* Link / Latency */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">LINK:</span>
          <span className="text-cyan-300 font-semibold">{fps} FPS</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">3.8 ms</span>
        </div>

        {/* Uptime */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-slate-400">UPTIME:</span>
          <span className="text-orange-300 font-semibold">{formatUptime(uptime)}</span>
        </div>

        {/* Active Mode Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border border-cyan-500/30 text-cyan-200">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-400">MODE:</span>
          <span className="text-cyan-300 font-bold uppercase">{activeMode}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onResetView}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-750 hover:text-white border border-slate-700/80 hover:border-cyan-500/40 rounded-md transition-all shadow-sm cursor-pointer"
          title="Reset 3D Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">RESET CAM</span>
        </button>

        {/* Emergency Stop Button */}
        <button
          onClick={() => setIsEStop(!isEStop)}
          className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-mono font-bold tracking-wider rounded-md transition-all cursor-pointer uppercase ${
            isEStop
              ? 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 glow-rose animate-pulse'
              : 'bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-500/40'
          }`}
          title="Emergency Hardware Kill Switch"
        >
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>{isEStop ? 'E-STOP ENGAGED' : 'E-STOP'}</span>
        </button>
      </div>
    </header>
  );
}
