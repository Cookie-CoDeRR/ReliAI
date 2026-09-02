import React from 'react';
import { 
  Gauge, 
  Cpu, 
  Workflow, 
  Cable, 
  Sliders, 
  Settings2, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Move3d,
  Crosshair,
  UserCheck,
  Compass
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'System Overview', icon: Gauge, badge: 'NOMINAL' },
  { id: 'kinematics', label: 'Kinematics & Pose', icon: Move3d, badge: '6-DOF' },
  { id: 'harness', label: 'Harness Diagnostics', icon: Cable, badge: 'OK' },
  { id: 'antigravity', label: 'Levitation Field', icon: Layers, badge: 'ACTIVE' },
  { id: 'path', label: 'Path Planner', icon: Workflow, badge: 'READY' },
  { id: 'settings', label: 'Configuration', icon: Settings2, badge: null },
];

const MODES = [
  { id: 'human-follow', label: 'HUMAN-FOLLOW', desc: 'Real-time gesture tracking', icon: UserCheck, color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 glow-cyan' },
  { id: 'manual', label: 'MANUAL JOG', desc: 'Direct joint control', icon: Sliders, color: 'border-orange-500/50 bg-orange-950/30 text-orange-300' },
  { id: 'trajectory', label: 'TRAJECTORY', desc: 'Pre-computed spline execution', icon: Crosshair, color: 'border-purple-500/50 bg-purple-950/30 text-purple-300' },
  { id: 'calibrate', label: 'CALIBRATE', desc: 'Zero-point homing sequence', icon: Compass, color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300' },
];

const HARDWARE_NODES = [
  { id: 'J1', name: 'Base Yaw Actuator', status: 'optimal', temp: '38.4°C' },
  { id: 'J2', name: 'Shoulder Pitch', status: 'optimal', temp: '42.1°C' },
  { id: 'J3', name: 'Elbow Articulation', status: 'optimal', temp: '40.6°C' },
  { id: 'J4-6', name: 'Wrist Cluster 3-DOF', status: 'optimal', temp: '36.9°C' },
  { id: 'MAG', name: 'Levitation Mag-Field', status: 'active', temp: '45.2°C' },
];

export default function Sidebar({ 
  activeNav, 
  setActiveNav, 
  activeMode, 
  setActiveMode,
  jointAngles,
  setJointAngles
}) {
  return (
    <aside className="w-72 bg-[#090e1b]/95 border-r border-cyan-500/20 flex flex-col justify-between overflow-y-auto shrink-0 z-20 select-none">
      {/* Navigation Menu */}
      <div className="p-4 space-y-6">
        {/* Navigation Categories */}
        <div className="space-y-1">
          <div className="px-2 pb-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>Primary Subsystems</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400/40 animate-pulse"></span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-500/40 glow-cyan font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Operating Mode Selector */}
        <div className="space-y-2">
          <div className="px-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            Control Mode
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                    isSelected
                      ? mode.color
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono leading-tight">{mode.label}</div>
                    <div className="text-[10px] text-slate-400">{mode.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hardware Nodes Health */}
        <div className="space-y-2">
          <div className="px-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>CAN-FD Node Matrix</span>
            <span className="text-[10px] text-emerald-400 font-bold">5/5 ONLINE</span>
          </div>

          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 space-y-2 font-mono text-[11px]">
            {HARDWARE_NODES.map((node) => (
              <div key={node.id} className="flex items-center justify-between py-0.5 border-b border-slate-800/40 last:border-0">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300 font-semibold">{node.id}</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline">{node.name}</span>
                </div>
                <span className="text-slate-400 text-[10px]">{node.temp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer System Power & Diagnostics */}
      <div className="p-4 border-t border-cyan-500/20 bg-slate-950/80 font-mono text-xs space-y-2">
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>RAIL VOLTAGE:</span>
          <span className="text-cyan-300 font-bold">48.24 V</span>
        </div>
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>TOTAL CURRENT:</span>
          <span className="text-orange-300 font-bold">14.62 A</span>
        </div>
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>CONTROLLER TEMP:</span>
          <span className="text-emerald-300 font-bold">39.1°C</span>
        </div>
        <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <span>HOST: ROS2-HUMBLE</span>
          <span className="text-emerald-400 font-bold">SYNCED</span>
        </div>
      </div>
    </aside>
  );
}
