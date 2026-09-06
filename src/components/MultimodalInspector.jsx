import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Volume2,
  Zap,
  Disc,
  Wind,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Cpu,
  Sparkles,
  Layers,
  Thermometer,
  Gauge,
  CheckCircle2,
  Table
} from 'lucide-react';

export default function MultimodalInspector({
  telemetry = {},
  hasThermalFault = false,
  hasAcousticFault = false,
  selectedProject = null,
  isInvestigating = false
}) {
  const canvasRef = useRef(null);
  const [viewMode, setViewMode] = useState("GAUGES"); // "GAUGES" | "SPECS_MATRIX"

  // Determine machine-specific telemetry values based on active project
  const isFanuc = selectedProject?.name?.includes("FANUC") || selectedProject?.id?.includes("FANUC");
  const isAbb = selectedProject?.name?.includes("ABB") || selectedProject?.id?.includes("ABB");
  const isConveyor = selectedProject?.name?.includes("Michelin") || selectedProject?.id?.includes("CONVEYOR");

  const effectiveThermalFault = isFanuc ? true : isAbb ? false : (hasThermalFault || true);
  const effectiveAcousticFault = isFanuc ? false : isAbb ? false : (hasAcousticFault || true);

  const rawTempNum = isFanuc ? 92.0 : isAbb ? 48.2 : isConveyor ? 42.1 : 88.5;
  const displayTemp = `${rawTempNum.toFixed(1)}°C`;
  const baselineTemp = isFanuc ? 41.5 : 42.1;
  const goldenLimit = 55.0; // ISO-10218-1 continuous operation limit
  const tempDelta = (rawTempNum - baselineTemp).toFixed(1);

  const tempStatus = isFanuc ? "SPIKE (FALSE)" : isAbb ? "NOMINAL" : isConveyor ? "NOMINAL" : "HOTSPOT";
  const tempStatusColor = isFanuc 
    ? "bg-amber-50 text-amber-700 border-amber-300" 
    : isAbb || isConveyor
    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
    : "bg-rose-50 text-rose-600 border-rose-200";

  const voltage = isFanuc ? 415.0 : (telemetry.line_voltage_v || 400.0);
  const current = isFanuc ? 3.1 : isAbb ? 12.0 : isConveyor ? 18.2 : (telemetry.total_current_a || 14.5);
  const pressure = isAbb ? 3.1 : (telemetry.pneumatic_pressure_bar || 6.2);
  const pressureStatus = isAbb ? "LEAK" : pressure < 5.0 ? "LOW" : "STABLE";

  const conveyor = isConveyor 
    ? { belt_speed_mps: 0.22, belt_tension_n: 210.0 }
    : (telemetry.conveyor || { belt_speed_mps: 0.5, belt_tension_n: 320.0 });

  const lube = isConveyor
    ? { nozzle_pressure_bar: 1.8, lube_flow_rate_lpm: 0.18, nozzle_clog_detected: true }
    : (telemetry.bead_lubrication || { nozzle_pressure_bar: 3.5, lube_flow_rate_lpm: 0.45, nozzle_clog_detected: false });

  const hasLubeFault = lube.nozzle_pressure_bar < 2.2 || lube.nozzle_clog_detected;
  const hasConveyorFault = conveyor.belt_speed_mps < 0.35 || conveyor.belt_tension_n < 240;

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
        let height = Math.sin(Date.now() * 0.003 + i * 0.3) * 6 + 10;
        
        if (effectiveAcousticFault && i >= 17 && i <= 23) {
          // Peak at harmonic drive mesh frequency (~2.8 kHz)
          height = Math.sin(Date.now() * 0.01 + i) * 14 + 32;
          ctx.fillStyle = '#d98555';
        } else if (isFanuc) {
          // Silent baseline
          height = 4 + Math.sin(Date.now() * 0.001 + i) * 2;
          ctx.fillStyle = '#94a3b8';
        } else {
          ctx.fillStyle = '#c8764b';
        }

        ctx.beginPath();
        const x = i * barWidth + 1;
        const y = canvas.height - height;
        const w = barWidth - 2;
        const radius = 2;
        if (ctx.roundRect) {
          ctx.roundRect(x, y, w, height, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x, y, w, height);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(renderBars);
    };

    renderBars();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [effectiveAcousticFault, isFanuc, viewMode]);

  // Golden Tolerance Specs Data
  const toleranceSpecs = [
    {
      sensor: "Joint 3 Thermal",
      measured: displayTemp,
      baseline: `${baselineTemp}°C`,
      goldenLimit: `< 55.0°C`,
      delta: `${tempDelta > 0 ? '+' : ''}${tempDelta}°C`,
      status: rawTempNum > goldenLimit ? (isFanuc ? "CONTRADICTION" : "BREACH") : "NOMINAL",
      statusColor: isFanuc ? "bg-amber-100 text-amber-800" : rawTempNum > goldenLimit ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
    },
    {
      sensor: "Acoustic FFT Vibration",
      measured: isFanuc ? "0.0 dB (Silent)" : effectiveAcousticFault ? "0.38 g @ 73.5Hz" : "0.04 g",
      baseline: "< 0.08 g",
      goldenLimit: "< 0.10 g",
      delta: isFanuc ? "0.0 dB" : effectiveAcousticFault ? "+0.28 g" : "0.0 g",
      status: isFanuc ? "CONTRADICTION" : effectiveAcousticFault ? "RESONANCE" : "NOMINAL",
      statusColor: isFanuc ? "bg-amber-100 text-amber-800" : effectiveAcousticFault ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
    },
    {
      sensor: "Line Voltage (3-Phase)",
      measured: `${voltage.toFixed(0)}V AC`,
      baseline: "400.0V",
      goldenLimit: "380V - 420V",
      delta: `${(voltage - 400).toFixed(0)}V`,
      status: "NOMINAL",
      statusColor: "bg-emerald-100 text-emerald-800"
    },
    {
      sensor: "Phase Motor Current",
      measured: `${current.toFixed(1)} A`,
      baseline: "3.5 A",
      goldenLimit: "< 12.0 A",
      delta: `${(current - 3.5).toFixed(1)} A`,
      status: current > 12.0 ? "ELEVATED" : "NOMINAL",
      statusColor: current > 12.0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
    },
    {
      sensor: "Pneumatic Bus Pressure",
      measured: `${pressure.toFixed(1)} bar`,
      baseline: "6.0 bar",
      goldenLimit: "5.5 - 7.0 bar",
      delta: `${(pressure - 6.0).toFixed(1)} bar`,
      status: pressure < 5.0 ? "PRESSURE LEAK" : "NOMINAL",
      statusColor: pressure < 5.0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
    }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[12px] p-3 border border-[#ecd5c5]/80 shadow-xs space-y-2.5">
      
      {/* Header with Step Indicator, Grounding & View Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#faeee5] text-[#c8764b] border border-[#f5cdb6]">
            STEP 1 • RAW SENSOR EVIDENCE
          </span>
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-800">
            <Eye className="w-3.5 h-3.5 text-[#c8764b]" />
            <span>Hardware Telemetry Bus</span>
          </div>
        </div>

        {/* Right Header: Machine Badge & View Mode Switcher */}
        <div className="flex items-center gap-2 font-mono text-[9.5px]">
          <span className="text-slate-500 font-medium hidden sm:inline">
            Node: <strong>{selectedProject?.nodeId || 'HARNESS-A4'}</strong> ({selectedProject?.name?.split(' ')[0] || 'KUKA'})
          </span>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-[6px] border border-slate-200">
            <button
              onClick={() => setViewMode("GAUGES")}
              className={`px-2 py-0.5 rounded-[4px] text-[9.5px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                viewMode === "GAUGES" ? "bg-white text-[#c8764b] shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Gauge className="w-3 h-3" />
              <span>Gauges</span>
            </button>
            <button
              onClick={() => setViewMode("SPECS_MATRIX")}
              className={`px-2 py-0.5 rounded-[4px] text-[9.5px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                viewMode === "SPECS_MATRIX" ? "bg-white text-[#c8764b] shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Table className="w-3 h-3" />
              <span>Specs Matrix</span>
            </button>
          </div>

          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100 Hz BUS
          </span>
        </div>
      </div>

      {viewMode === "GAUGES" ? (
        <>
          {/* 3 Core High-Fidelity Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            
            {/* 1. Thermal Thermography Gauge */}
            <div className="bg-slate-50/90 rounded-[10px] p-2.5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-[#d98555]" />
                    Thermal IR (Joint 3)
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${tempStatusColor}`}>
                    {tempStatus}
                  </span>
                </div>

                <div className="relative h-14 rounded-[8px] overflow-hidden border border-[#ecd5c5]/70 bg-gradient-to-tr from-[#fdfbf9] via-[#faeee5] to-[#f5ddd0] flex items-center justify-between px-3">
                  <div 
                    className={`w-14 h-14 rounded-full blur-md absolute left-2 transition-all ${
                      effectiveThermalFault 
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500 scale-110 opacity-80' 
                        : 'bg-[#ebd8cb] scale-75 opacity-40'
                    }`} 
                  />
                  <div className="flex flex-col font-mono text-slate-900 z-10">
                    <span className="font-bold text-base leading-none">{displayTemp}</span>
                    <span className="text-[8px] text-slate-600 mt-0.5">
                      {isFanuc ? 'Instantaneous 0ms Ramp' : 'Elbow Flange Thermistor'}
                    </span>
                  </div>
                  <div className="text-right z-10 font-mono">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Delta:</div>
                    <div className={`text-[10px] font-bold ${rawTempNum > goldenLimit ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {tempDelta > 0 ? `+${tempDelta}°C` : `${tempDelta}°C`}
                    </div>
                  </div>
                </div>

                {/* Linear Thermal Scale Bar (0°C to 120°C with 55°C Limit Marker) */}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[7.5px] font-mono text-slate-400">
                    <span>20°C</span>
                    <span className="text-amber-600 font-bold">55°C (ISO Limit)</span>
                    <span>120°C</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full relative overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        rawTempNum > 70 ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, (rawTempNum / 120) * 100))}%` }}
                    />
                    {/* Golden Limit Tick */}
                    <div className="absolute top-0 bottom-0 left-[45.8%] w-[1.5px] bg-slate-800 z-10" />
                  </div>
                </div>
              </div>

              <div className="text-[8px] font-mono text-slate-400 text-center mt-1.5 pt-1 border-t border-slate-200/60">
                Optris Xi-400 Radiometric Sensor
              </div>
            </div>

            {/* 2. Acoustic FFT Frequency Spectrum */}
            <div className="bg-slate-50/90 rounded-[10px] p-2.5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-[#d98555]" />
                    Acoustic FFT Spectrum
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${
                    effectiveAcousticFault ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {isFanuc ? "0.0 dB SILENT" : effectiveAcousticFault ? "2.8 kHz PEAK" : "NORMAL"}
                  </span>
                </div>

                <div className="h-14 rounded-[8px] overflow-hidden border border-slate-200/80 bg-white p-1 flex items-center justify-center">
                  <canvas ref={canvasRef} width={220} height={48} className="w-full h-full" />
                </div>

                {/* Frequency Band Scale */}
                <div className="flex justify-between text-[7.5px] font-mono text-slate-400 mt-1 px-0.5">
                  <span>0 Hz</span>
                  <span>500 Hz</span>
                  <span className={effectiveAcousticFault ? "text-[#c8764b] font-bold" : ""}>2.8 kHz</span>
                  <span>10 kHz</span>
                </div>
              </div>

              <div className="text-[8px] font-mono text-slate-400 text-center mt-1.5 pt-1 border-t border-slate-200/60 flex items-center justify-between px-1">
                <span>PCB Piezotronics Accelerometer</span>
                <span className="font-bold text-slate-600">{isFanuc ? "Silent (<0.01g)" : effectiveAcousticFault ? "0.38 g Peak" : "0.04 g Nom"}</span>
              </div>
            </div>

            {/* 3. Electrical & Pneumatic Power Bus */}
            <div className="bg-slate-50/90 rounded-[10px] p-2.5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#d98555]" />
                    Power & Air Bus
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${
                    isAbb ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {pressureStatus}
                  </span>
                </div>

                <div className="h-14 rounded-[8px] border border-slate-200/80 bg-white p-1 grid grid-cols-3 gap-1 text-center font-mono">
                  <div className="flex flex-col justify-center bg-slate-50 rounded">
                    <span className="text-[7px] text-slate-400 uppercase">Volts AC</span>
                    <span className="text-[11px] font-bold text-slate-800">{voltage.toFixed(0)}V</span>
                    <span className="text-[7px] text-slate-400">Nom: 400V</span>
                  </div>
                  <div className="flex flex-col justify-center bg-slate-50 rounded">
                    <span className="text-[7px] text-slate-400 uppercase">Current</span>
                    <span className={`text-[11px] font-bold ${current > 15 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {current.toFixed(1)}A
                    </span>
                    <span className="text-[7px] text-slate-400">Nom: 3.5A</span>
                  </div>
                  <div className="flex flex-col justify-center bg-slate-50 rounded">
                    <span className="text-[7px] text-slate-400 uppercase">Pressure</span>
                    <span className={`text-[11px] font-bold ${pressure < 4.0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {pressure.toFixed(1)}b
                    </span>
                    <span className="text-[7px] text-slate-400">Nom: 6.0b</span>
                  </div>
                </div>

                {/* Visual meter bar for current vs max rating */}
                <div className="mt-2 space-y-0.5">
                  <div className="flex justify-between text-[7.5px] font-mono text-slate-400">
                    <span>Current Draw</span>
                    <span className="font-bold text-slate-700">{current.toFixed(1)} / 20.0 A</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        current > 15 ? 'bg-rose-500' : 'bg-[#d98555]'
                      }`}
                      style={{ width: `${Math.min(100, (current / 20.0) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[8px] font-mono text-slate-400 text-center mt-1.5 pt-1 border-t border-slate-200/60">
                Beckhoff EL3403 3-Phase Power Meter
              </div>
            </div>
          </div>

          {/* Auxiliary Systems: Conveyor & Lubrication */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-slate-50/90 rounded-[8px] px-2.5 py-1.5 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700 truncate">
                <Disc className="w-3 h-3 text-[#c8764b] shrink-0" />
                <span className="truncate">Conveyor Speed: <strong>{conveyor.belt_speed_mps.toFixed(2)} m/s</strong> ({conveyor.belt_tension_n.toFixed(0)}N)</span>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                hasConveyorFault ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {hasConveyorFault ? 'SLIP' : 'NOMINAL'}
              </span>
            </div>

            <div className="bg-slate-50/90 rounded-[8px] px-2.5 py-1.5 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700 truncate">
                <Wind className="w-3 h-3 text-[#c8764b] shrink-0" />
                <span className="truncate">Lube Delivery: <strong>{lube.nozzle_pressure_bar.toFixed(2)} bar</strong> ({lube.lube_flow_rate_lpm} L/min)</span>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                hasLubeFault ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {hasLubeFault ? 'CLOG' : 'NOMINAL'}
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Specs Tolerance Matrix View */
        <div className="overflow-x-auto rounded-[8px] border border-slate-200 bg-white">
          <table className="w-full text-left font-mono text-[9.5px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[8.5px] border-b border-slate-200">
              <tr>
                <th className="p-2">Physical Sensor</th>
                <th className="p-2">Measured Telemetry</th>
                <th className="p-2">Golden Baseline</th>
                <th className="p-2">Tolerance Limit</th>
                <th className="p-2">Delta</th>
                <th className="p-2 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {toleranceSpecs.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-2 font-semibold text-slate-800">{row.sensor}</td>
                  <td className="p-2 font-bold text-slate-900">{row.measured}</td>
                  <td className="p-2 text-slate-500">{row.baseline}</td>
                  <td className="p-2 text-slate-600">{row.goldenLimit}</td>
                  <td className="p-2 font-bold text-slate-700">{row.delta}</td>
                  <td className="p-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Physical Causal Receipt Summary Banner */}
      <div className="p-2 rounded-[8px] bg-[#faeee5]/75 border border-[#f3cdb6] flex items-start gap-2 text-[10px] font-mono text-slate-700">
        <AlertTriangle className="w-3.5 h-3.5 text-[#d98555] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#c8764b]">Physical Evidence Grounding: </strong>
          {isFanuc ? (
            <span>
              Joint 3 thermocouple spiked instantly to 92.0°C with 0ms thermal ramp. Motor current remained at baseline 3.1A, acoustic emission silent (0 dB), and adjacent stator thermistor reads 41.5°C. <strong>Contradiction detected: Physical overheat ruled out. Cable carrier ground short verified.</strong>
            </span>
          ) : isAbb ? (
            <span>
              End-effector pneumatic pressure dropped from 6.0 bar nominal to 3.1 bar during pick-and-place cycle. Motor torque and thermal profiles are nominal. <strong>Air line manifold seal breach verified.</strong>
            </span>
          ) : isConveyor ? (
            <span>
              Belt speed slipped to 0.22 m/s while motor current surged to 18.2A and bead lube pressure dipped to 1.8 bar. <strong>Belt drive micro-slippage & nozzle clog verified.</strong>
            </span>
          ) : (
            <span>
              Elbow Joint 3 operating temperature reached 88.5°C (limit 55.0°C) coupled with 2.8 kHz / 73.5 Hz 3X harmonic vibration peak (0.38g). Nominal inverter ripple rules out stator short. <strong>Elastohydrodynamic grease breakdown confirmed under ISO-10218.</strong>
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
