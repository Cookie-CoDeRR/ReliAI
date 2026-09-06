import React, { useRef, useEffect } from 'react';
import { Eye, Volume2, Zap, Disc, Wind } from 'lucide-react';

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
      const numBars = 28;
      const barWidth = canvas.width / numBars;

      for (let i = 0; i < numBars; i++) {
        let height = Math.sin(Date.now() * 0.003 + i * 0.3) * 10 + 14;
        
        if (hasAcousticFault && i >= 16 && i <= 20) {
          height = Math.sin(Date.now() * 0.01 + i) * 16 + 36;
          ctx.fillStyle = '#e11d48';
        } else {
          ctx.fillStyle = '#d98555';
        }

        ctx.beginPath();
        const x = i * barWidth + 1.5;
        const y = canvas.height - height;
        const w = barWidth - 3;
        const radius = 2;
        ctx.roundRect ? ctx.roundRect(x, y, w, height, [radius, radius, 0, 0]) : ctx.rect(x, y, w, height);
        ctx.fill();
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

  const hasLubeFault = lube.nozzle_pressure_bar < 2.2 || lube.nozzle_clog_detected;
  const hasConveyorFault = conveyor.belt_speed_mps < 0.35 || conveyor.belt_tension_n < 240;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[16px] p-3 border border-[#ecd5c5]/80 shadow-xs space-y-2.5">
      {/* Clean, simplified header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-800">
          <Eye className="w-3.5 h-3.5 text-[#c8764b]" />
          <span>Hardware Telemetry Bus</span>
        </div>
        <span className="text-[9px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          ONLINE
        </span>
      </div>

      {/* 3 Calm Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* 1. Thermal Thermography */}
        <div className="bg-slate-50/90 rounded-[12px] p-2 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mb-1">
            <span>Thermal IR</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${hasThermalFault ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {hasThermalFault ? "HOTSPOT" : "NOMINAL"}
            </span>
          </div>

          <div className="relative h-16 rounded-[8px] overflow-hidden border border-[#ecd5c5]/70 bg-gradient-to-tr from-[#fdfbf9] via-[#faeee5] to-[#f5ddd0] flex items-center justify-center">
            <div 
              className={`w-14 h-14 rounded-full blur-lg transition-all ${
                hasThermalFault 
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 scale-110 opacity-80' 
                  : 'bg-[#ebd8cb] scale-75 opacity-40'
              }`} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-slate-900">
              <span className="font-bold text-sm">{hasThermalFault ? '88.5°C' : '44.2°C'}</span>
              <span className="text-[8.5px] text-slate-600">Joint 3</span>
            </div>
          </div>
        </div>

        {/* 2. Acoustic FFT */}
        <div className="bg-slate-50/90 rounded-[12px] p-2 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mb-1">
            <span>Acoustic FFT</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${hasAcousticFault ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {hasAcousticFault ? "2.8 kHz PEAK" : "NORMAL"}
            </span>
          </div>

          <div className="h-16 rounded-[8px] overflow-hidden border border-slate-200/80 bg-white p-1.5 flex items-center justify-center">
            <canvas ref={canvasRef} width={200} height={56} className="w-full h-full" />
          </div>
        </div>

        {/* 3. Power & Pressure */}
        <div className="bg-slate-50/90 rounded-[12px] p-2 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mb-1">
            <span>Power & Pressure</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${voltage < 380 || pressure < 5.0 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {voltage < 380 ? "SAG" : pressure < 5.0 ? "LOW" : "STABLE"}
            </span>
          </div>

          <div className="h-16 rounded-[8px] border border-slate-200/80 bg-white p-1 grid grid-cols-3 gap-1 text-center font-mono">
            <div className="flex flex-col justify-center bg-slate-50 rounded">
              <span className="text-[7.5px] text-slate-400">VOLTS</span>
              <span className={`text-[10px] font-bold ${voltage < 380 ? 'text-rose-600' : 'text-slate-800'}`}>{voltage.toFixed(0)}V</span>
            </div>
            <div className="flex flex-col justify-center bg-slate-50 rounded">
              <span className="text-[7.5px] text-slate-400">AMPS</span>
              <span className={`text-[10px] font-bold ${current > 20 ? 'text-rose-600' : 'text-slate-800'}`}>{current.toFixed(1)}A</span>
            </div>
            <div className="flex flex-col justify-center bg-slate-50 rounded">
              <span className="text-[7.5px] text-slate-400">BAR</span>
              <span className={`text-[10px] font-bold ${pressure < 5.0 ? 'text-rose-600' : 'text-slate-800'}`}>{pressure.toFixed(1)}b</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conveyor & Lube Status (Clean summary line) */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="bg-slate-50/90 rounded-[10px] px-2.5 py-1.5 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Disc className="w-3 h-3 text-[#c8764b]" />
            <span>Conveyor: <strong>{conveyor.belt_speed_mps.toFixed(2)} m/s</strong></span>
          </div>
          <span className={`text-[8px] font-bold ${hasConveyorFault ? 'text-rose-600' : 'text-emerald-700'}`}>
            {hasConveyorFault ? 'SLIP' : 'OK'}
          </span>
        </div>

        <div className="bg-slate-50/90 rounded-[10px] px-2.5 py-1.5 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Wind className="w-3 h-3 text-[#c8764b]" />
            <span>Lube: <strong>{lube.nozzle_pressure_bar.toFixed(2)} bar</strong></span>
          </div>
          <span className={`text-[8px] font-bold ${hasLubeFault ? 'text-rose-600' : 'text-emerald-700'}`}>
            {hasLubeFault ? 'CLOG' : 'OK'}
          </span>
        </div>
      </div>
    </div>
  );
}
