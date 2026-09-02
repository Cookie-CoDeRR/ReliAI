import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  Zap, 
  Move3d, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Compass, 
  ShieldCheck, 
  Eye, 
  User, 
  ChevronRight,
  TrendingUp,
  Radio
} from 'lucide-react';

export default function TelemetryPanels({
  jointAngles,
  setJointAngles,
  activeMode,
  isLevitating,
  isEStop
}) {
  const [collapsed, setCollapsed] = useState({
    kinematics: false,
    cartesian: false,
    tracking: false,
    diagnostics: false,
  });

  const [logs, setLogs] = useState([
    { id: 1, time: '11:59:42', text: 'CAN-FD Master sync locked @ 1000kbps', level: 'info' },
    { id: 2, time: '11:59:45', text: 'Mag-Levitation Plinth active (124.0mm)', level: 'success' },
    { id: 3, time: '11:59:50', text: 'Optical skeleton tracker linked to Operator-01', level: 'info' },
    { id: 4, time: '12:00:02', text: 'Trajectory filter: Hermite spline 120Hz', level: 'info' },
  ]);

  // Periodic simulated telemetry log updates
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = [
        'DDS Topic /joint_states published (60Hz)',
        'Kinematic Jacobian matrix condition: 1.04',
        'End-effector pose deviation < 0.12mm',
        'Plinth magnetic field flux equilibrium verified',
        'Human gesture confidence: 99.1% [POINT_TRACK]',
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLogs((prev) => [
        { id: Date.now(), time: timeStr, text: randomMsg, level: 'info' },
        ...prev.slice(0, 5),
      ]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const togglePanel = (panelKey) => {
    setCollapsed((prev) => ({ ...prev, [panelKey]: !prev[panelKey] }));
  };

  const handleSliderChange = (joint, value) => {
    setJointAngles((prev) => ({ ...prev, [joint]: parseFloat(value) }));
  };

  // Approximate Cartesian XYZ calculation based on joint angles
  const xMm = (540 + Math.sin((jointAngles.j1 * Math.PI) / 180) * 320).toFixed(1);
  const yMm = (420 + Math.cos((jointAngles.j2 * Math.PI) / 180) * 280 + Math.sin((jointAngles.j3 * Math.PI) / 180) * 220).toFixed(1);
  const zMm = (680 + Math.sin((jointAngles.j2 * Math.PI) / 180) * 350).toFixed(1);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10 select-none overflow-hidden">
      {/* Top Row: Joint Kinematics (Left) & Cartesian / Antigravity Matrix (Right) */}
      <div className="flex justify-between items-start space-x-4">
        {/* TOP LEFT: Joint Kinematics Panel */}
        <div className="pointer-events-auto w-80 glass-panel rounded-xl shadow-2xl transition-all duration-300">
          <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/60 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <Move3d className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase">
                Joint Kinematics (6-DOF)
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                {activeMode === 'manual' ? 'MANUAL' : 'TRACKING'}
              </span>
              <button 
                onClick={() => togglePanel('kinematics')} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {collapsed.kinematics ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!collapsed.kinematics && (
            <div className="p-3 space-y-2.5 font-mono text-xs">
              {[
                { id: 'j1', label: 'J1: Base Yaw', min: -180, max: 180, unit: '°' },
                { id: 'j2', label: 'J2: Shoulder Pitch', min: -90, max: 90, unit: '°' },
                { id: 'j3', label: 'J3: Elbow Pitch', min: -120, max: 120, unit: '°' },
                { id: 'j4', label: 'J4: Wrist Roll', min: -180, max: 180, unit: '°' },
                { id: 'j5', label: 'J5: Wrist Pitch', min: -110, max: 110, unit: '°' },
                { id: 'j6', label: 'J6: Tool Flange', min: -360, max: 360, unit: '°' },
              ].map((joint) => {
                const val = jointAngles[joint.id];
                const pct = ((val - joint.min) / (joint.max - joint.min)) * 100;
                return (
                  <div key={joint.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium">{joint.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-cyan-300 font-bold">{val.toFixed(1)}{joint.unit}</span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          ({((val * Math.PI) / 180).toFixed(2)} rad)
                        </span>
                      </div>
                    </div>

                    {activeMode === 'manual' ? (
                      <input
                        type="range"
                        min={joint.min}
                        max={joint.max}
                        step="0.5"
                        value={val}
                        onChange={(e) => handleSliderChange(joint.id, e.target.value)}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    ) : (
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-orange-400 transition-all duration-150"
                          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOP RIGHT: Cartesian State & Levitation Field Matrix */}
        <div className="pointer-events-auto w-84 glass-panel rounded-xl shadow-2xl transition-all duration-300">
          <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/60 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-orange-400" />
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase">
                Tool Pose & Mag-Levitation
              </h2>
            </div>
            <button 
              onClick={() => togglePanel('cartesian')} 
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              {collapsed.cartesian ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!collapsed.cartesian && (
            <div className="p-3.5 space-y-3 font-mono text-xs">
              {/* Cartesian Coordinates Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400">POS X</div>
                  <div className="text-sm font-bold text-cyan-300">{xMm}</div>
                  <div className="text-[9px] text-slate-400">mm</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400">POS Y</div>
                  <div className="text-sm font-bold text-cyan-300">{yMm}</div>
                  <div className="text-[9px] text-slate-400">mm</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400">POS Z</div>
                  <div className="text-sm font-bold text-cyan-300">{zMm}</div>
                  <div className="text-[9px] text-slate-400">mm</div>
                </div>
              </div>

              {/* Levitation Field Metrics */}
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center space-x-1.5 text-cyan-300 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>EM LEVITATION MATRIX</span>
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isLevitating ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isLevitating ? 'FIELD LOCKED' : 'OFFLINE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <div>
                    <span className="text-slate-400">FLUX DENSITY:</span>
                    <div className="text-slate-200 font-bold text-xs">{isLevitating ? '2.45 Tesla' : '0.00 T'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">AIR GAP:</span>
                    <div className="text-cyan-300 font-bold text-xs">{isLevitating ? '124.2 mm' : '0.0 mm'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">STABILITY INDEX:</span>
                    <div className="text-emerald-400 font-bold text-xs">{isLevitating ? '99.98%' : '0.0%'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">COIL TEMP:</span>
                    <div className="text-orange-300 font-bold text-xs">44.8°C</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Human Follow Skeletal Tracking (Left) & Diagnostics Logs (Right) */}
      <div className="flex justify-between items-end space-x-4">
        {/* BOTTOM LEFT: Human-Follow Tracking Overlay */}
        <div className="pointer-events-auto w-80 glass-panel rounded-xl shadow-2xl transition-all duration-300">
          <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/60 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase">
                Human-Follow Tracking
              </h2>
            </div>
            <button 
              onClick={() => togglePanel('tracking')} 
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              {collapsed.tracking ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!collapsed.tracking && (
            <div className="p-3 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[11px] text-slate-200 font-semibold">TESTER-ALPHA-01</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">OPTICAL 120Hz</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>DETECTED GESTURE:</span>
                  <span className="text-orange-300 font-bold">PRECISION_POINT</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SKELETAL CONFIDENCE:</span>
                  <span className="text-cyan-300 font-bold">98.8%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>MAPPING LATENCY:</span>
                  <span className="text-emerald-300 font-bold">1.4 ms</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full w-[98%]" />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM RIGHT: Joint Torque Meters & Telemetry Stream Log */}
        <div className="pointer-events-auto w-96 glass-panel rounded-xl shadow-2xl transition-all duration-300">
          <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/60 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase">
                Actuator Loads & Event Log
              </h2>
            </div>
            <button 
              onClick={() => togglePanel('diagnostics')} 
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              {collapsed.diagnostics ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!collapsed.diagnostics && (
            <div className="p-3 space-y-3 font-mono text-xs">
              {/* Joint Torques load bar meters */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex justify-between">
                  <span>Joint Torque Loads</span>
                  <span className="text-slate-400">NOMINAL &lt; 65%</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 text-center text-[10px]">
                  {['J1', 'J2', 'J3', 'J4', 'J5', 'J6'].map((jName, idx) => {
                    // Realistic fluctuating load values
                    const loadPct = [28, 54, 46, 18, 22, 14][idx];
                    return (
                      <div key={jName} className="p-1 rounded bg-slate-950/80 border border-slate-800">
                        <div className="text-slate-400">{jName}</div>
                        <div className="text-cyan-300 font-bold">{loadPct}%</div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full ${loadPct > 60 ? 'bg-orange-400' : 'bg-cyan-400'}`}
                            style={{ width: `${loadPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Event Log Stream */}
              <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800/80 max-h-24 overflow-y-auto space-y-1 font-mono text-[10px]">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-1.5 text-slate-300">
                    <span className="text-slate-400 shrink-0">[{log.time}]</span>
                    <span className={log.level === 'success' ? 'text-emerald-300' : 'text-slate-300'}>
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
