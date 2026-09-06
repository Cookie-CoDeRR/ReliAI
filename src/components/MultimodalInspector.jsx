import React, { useRef, useEffect } from 'react';
import { Eye, Volume2, Zap, Wind, AlertTriangle, ShieldCheck, Tag, Disc } from 'lucide-react';

export default function MultimodalInspector({ telemetry = {}, hasThermalFault = false, hasAcousticFault = false }) {
  const canvasRef = useRef(null);

  // Animated Acoustic FFT Canvas Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const renderBars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const numBars = 32;
      const barWidth = canvas.width / numBars;

      for (let i = 0; i < numBars; i++) {
        let height = Math.sin(Date.now() * 0.003 + i * 0.3) * 15 + 20;
        
        // Spike around high harmonic band (index 18-22 ~ 2.8kHz) if fault active
        if (hasAcousticFault && i >= 18 && i <= 22) {
          height = Math.sin(Date.now() * 0.01 + i) * 25 + 50;
          ctx.fillStyle = '#ef4444';
        } else {
          ctx.fillStyle = '#06b6d4';
        }

        ctx.fillRect(i * barWidth + 1, canvas.height - height, barWidth - 2, height);
      }

      animationFrameId = requestAnimationFrame(renderBars);
    };

    renderBars();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasAcousticFault]);

  const voltage = telemetry.line_voltage_v || 400.0;
  const current = telemetry.total_current_a || 14.5;
  const pressure = telemetry.pneumatic_pressure_bar || 6.2;
  const conveyor = telemetry.conveyor || { belt_speed_mps: 0.5, belt_tension_n: 320.0 };
  const lube = telemetry.bead_lubrication || { nozzle_pressure_bar: 3.5, lube_flow_rate_lpm: 0.45, nozzle_clog_detected: false };
  const tire = telemetry.tire_metadata || { tire_sku: "Michelin Pilot Sport 5 225/45 R17", dot_code: "DOT 6X 7Y 0126" };

  const hasLubeFault = lube.nozzle_pressure_bar < 2.2 || lube.nozzle_clog_detected;
  const hasConveyorFault = conveyor.belt_speed_mps < 0.35 || conveyor.belt_tension_n < 240;

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Multimodal Hardware Telemetry & Michelin Conveyor Bus</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {tire.tire_sku.split(" ")[0]} {tire.tire_sku.split(" ")[1] || "TIRE"}
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800">
            OPC UA / SPARKPLUG B
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Thermal Thermography Inspector */}
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              FLIR IR Thermal Matrix
            </span>
            <span className={hasThermalFault ? "text-rose-400 font-bold" : "text-emerald-400"}>
              {hasThermalFault ? "HOTSPOT DETECTED" : "NOMINAL"}
            </span>
          </div>

          <div className="relative h-24 rounded-lg overflow-hidden border border-slate-800 bg-gradient-to-tr from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center">
            <div 
              className={`w-20 h-20 rounded-full blur-xl transition-all ${
                hasThermalFault 
                  ? 'bg-gradient-to-r from-amber-500 via-rose-600 to-red-500 scale-125 animate-pulse opacity-90' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 scale-75 opacity-40'
              }`} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-[11px] text-white drop-shadow">
              <span className="font-bold text-base">{hasThermalFault ? '88.5°C' : '44.2°C'}</span>
              <span className="text-[9px] text-slate-300">Joint 3 Housing</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-2">IR Matrix 160x120 px • Limit: 65°C</p>
        </div>

        {/* 2. Acoustic FFT Waveform Inspector */}
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              Acoustic Hydrophone FFT
            </span>
            <span className={hasAcousticFault ? "text-rose-400 font-bold" : "text-emerald-400"}>
              {hasAcousticFault ? "2.8 kHz PEAK" : "72 dB NOMINAL"}
            </span>
          </div>

          <div className="h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-center">
            <canvas ref={canvasRef} width={220} height={90} className="w-full h-full" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-2">Sampling: 48 kHz • Band: 0 - 24 kHz</p>
        </div>

        {/* 3. Electrical & Pneumatic Power Grid */}
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Power & Pneumatics
            </span>
            <span className={voltage < 380 || pressure < 5.0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
              {voltage < 380 ? "VOLTAGE SAG" : pressure < 5.0 ? "LOW PRESSURE" : "GRID STABLE"}
            </span>
          </div>

          <div className="h-24 rounded-lg border border-slate-800 bg-slate-950 p-3 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="flex flex-col justify-center bg-slate-900/80 rounded p-1">
              <span className="text-[9px] text-slate-400">VOLTAGE</span>
              <span className={`text-xs font-bold ${voltage < 380 ? 'text-rose-400' : 'text-cyan-300'}`}>{voltage.toFixed(0)}V</span>
              <span className="text-[8px] text-slate-500">Nom: 400V</span>
            </div>

            <div className="flex flex-col justify-center bg-slate-900/80 rounded p-1">
              <span className="text-[9px] text-slate-400">CURRENT</span>
              <span className={`text-xs font-bold ${current > 20 ? 'text-rose-400' : 'text-cyan-300'}`}>{current.toFixed(1)}A</span>
              <span className="text-[8px] text-slate-500">Max: 24A</span>
            </div>

            <div className="flex flex-col justify-center bg-slate-900/80 rounded p-1">
              <span className="text-[9px] text-slate-400">PRESSURE</span>
              <span className={`text-xs font-bold ${pressure < 5.0 ? 'text-rose-400' : 'text-sky-300'}`}>{pressure.toFixed(1)}b</span>
              <span className="text-[8px] text-slate-500">Nom: 6.2b</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-2">3-Phase 400V RMS • 6.2 bar Gripper Line</p>
        </div>
      </div>

      {/* Michelin Conveyor Belt & Bead Lubrication Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Conveyor Line Telemetry */}
        <div className="bg-slate-900/70 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <Disc className={`w-4 h-4 ${hasConveyorFault ? 'text-rose-400 animate-spin' : 'text-cyan-400'}`} />
            <div>
              <div className="text-[10px] text-slate-400 font-sans font-semibold">INFEED CONVEYOR BELT</div>
              <div className="text-slate-200">
                Speed: <span className={hasConveyorFault ? "text-rose-400 font-bold" : "text-cyan-300 font-bold"}>{conveyor.belt_speed_mps.toFixed(2)} m/s</span>
                <span className="text-slate-500 mx-1.5">•</span>
                Tension: <span className="text-slate-300">{conveyor.belt_tension_n.toFixed(0)} N</span>
              </div>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] ${hasConveyorFault ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
            {hasConveyorFault ? 'BELT SLIP' : 'TRACKING OK'}
          </span>
        </div>

        {/* Bead Lubrication System */}
        <div className="bg-slate-900/70 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <Wind className={`w-4 h-4 ${hasLubeFault ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`} />
            <div>
              <div className="text-[10px] text-slate-400 font-sans font-semibold">BEAD LUBRICANT ATOMIZER</div>
              <div className="text-slate-200">
                Pressure: <span className={hasLubeFault ? "text-rose-400 font-bold" : "text-teal-300 font-bold"}>{lube.nozzle_pressure_bar.toFixed(2)} bar</span>
                <span className="text-slate-500 mx-1.5">•</span>
                Flow: <span className="text-slate-300">{lube.lube_flow_rate_lpm.toFixed(2)} LPM</span>
              </div>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] ${hasLubeFault ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
            {hasLubeFault ? 'NOZZLE CLOGGED' : 'ATOMIZING OK'}
          </span>
        </div>
      </div>
    </div>
  );
}
