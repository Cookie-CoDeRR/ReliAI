import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Activity,
  Zap,
  Flame,
  Radio,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  HardDrive,
  Clock,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Database,
  Gauge,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Layers,
  Bot
} from 'lucide-react';
import RobotViewer from './RobotViewer';

const INITIAL_MACHINERY = [
  {
    id: "KR-210-R2700",
    name: "KUKA KR-210 R2700",
    brand: "KUKA",
    modelCode: "KR-210-2",
    nodeId: "HARNESS-A4",
    cellLocation: "Cell 04 • Heavy Handling",
    type: "6-Axis Heavy Articulated",
    scenarioId: "SCENARIO-01-THERMAL-OVERHEAT",
    faultJoint: "Joint_3",
    status: "INVESTIGATING",
    statusDotColor: "bg-amber-400 ring-4 ring-amber-300/40 animate-pulse",
    statusBorder: "hover:border-amber-400/80",
    image: "/machinery/kr210_prime.jpg",
    payloadCapacity: "210 kg",
    reach: "2700 mm",
    uptime: "99.4%",
    cycles: "2,419,200",
    tempMax: "82.4°C",
    tempAvg: "64.1°C",
    loadAvg: "84.2%",
    vibrationRms: "0.48 g",
    harnessPing: "0.8 ms",
    oee: "89.2%",
    mtbf: "3,840 hrs",
    nominalTemp: "42.1°C",
    nominalVibe: "0.12 g",
    incidentDescription: "Joint 3 Harmonic Drive Lubricant Breakdown causing rapid thermal elevation and 73.5 Hz 3X vibration harmonic resonance.",
    joints: [
      { name: "Joint 1 (Base Rotation)", temp: 42.1, torque: 38, status: "NOMINAL" },
      { name: "Joint 2 (Lower Arm)", temp: 51.4, torque: 64, status: "NOMINAL" },
      { name: "Joint 3 (Arm Elevation)", temp: 82.4, torque: 88, status: "ELEVATED", isFault: true },
      { name: "Joint 4 (Wrist Pitch)", temp: 49.0, torque: 42, status: "NOMINAL" },
      { name: "Joint 5 (Wrist Yaw)", temp: 46.8, torque: 36, status: "NOMINAL" },
      { name: "Joint 6 (Tool Flange)", temp: 43.5, torque: 29, status: "NOMINAL" },
    ],
    fftPeaks: [
      { freq: "24.5 Hz (1X Fundamental)", amp: "0.12 g", status: "NORMAL" },
      { freq: "73.5 Hz (3X Harmonics)", amp: "0.38 g", status: "ALERT" },
      { freq: "147.0 Hz (Bearing BPFO)", amp: "0.22 g", status: "CAUTION" },
      { freq: "294.0 Hz (Gear Mesh)", amp: "0.08 g", status: "NORMAL" },
    ],
    hourlyThermalTrend: [44, 48, 52, 59, 68, 74, 82.4]
  },
  {
    id: "KR-QUANTUM-300",
    name: "KUKA KR-QUANTUM 300",
    brand: "KUKA",
    modelCode: "KR-QUANTUM-300",
    nodeId: "HARNESS-B1",
    cellLocation: "Cell 01 • Fast Palletizing",
    type: "High-Speed Kinetic Manipulator",
    scenarioId: "SCENARIO-01-THERMAL-OVERHEAT",
    faultJoint: null,
    status: "NOMINAL",
    statusDotColor: "bg-emerald-500 ring-4 ring-emerald-300/40",
    statusBorder: "hover:border-emerald-400/80",
    image: "/machinery/kr_quantum.jpg",
    payloadCapacity: "300 kg",
    reach: "3100 mm",
    uptime: "99.9%",
    cycles: "1,894,300",
    tempMax: "48.2°C",
    tempAvg: "44.6°C",
    loadAvg: "42.1%",
    vibrationRms: "0.12 g",
    harnessPing: "1.1 ms",
    oee: "96.4%",
    mtbf: "5,200 hrs",
    nominalTemp: "44.6°C",
    nominalVibe: "0.12 g",
    incidentDescription: "No active incident. All 6 kinematic axes operating within ISO-10218 continuous tolerance.",
    joints: [
      { name: "Joint 1 (Base Rotation)", temp: 41.0, torque: 32, status: "NOMINAL" },
      { name: "Joint 2 (Lower Arm)", temp: 47.5, torque: 45, status: "NOMINAL" },
      { name: "Joint 3 (Arm Elevation)", temp: 48.2, torque: 49, status: "NOMINAL" },
      { name: "Joint 4 (Wrist Pitch)", temp: 43.1, torque: 28, status: "NOMINAL" },
      { name: "Joint 5 (Wrist Yaw)", temp: 39.8, torque: 22, status: "NOMINAL" },
      { name: "Joint 6 (Tool Flange)", temp: 36.5, torque: 18, status: "NOMINAL" },
    ],
    fftPeaks: [
      { freq: "20.0 Hz (1X Fundamental)", amp: "0.05 g", status: "NORMAL" },
      { freq: "60.0 Hz (3X Harmonics)", amp: "0.08 g", status: "NORMAL" },
      { freq: "120.0 Hz (Bearing BPFO)", amp: "0.04 g", status: "NORMAL" },
      { freq: "240.0 Hz (Gear Mesh)", amp: "0.03 g", status: "NORMAL" },
    ],
    hourlyThermalTrend: [40, 42, 43, 45, 46, 47, 48.2]
  },
  {
    id: "ABB-IRB-6700",
    name: "ABB IRB 6700 PowerSpot",
    brand: "ABB",
    modelCode: "IRB 6700",
    nodeId: "HARNESS-C3",
    cellLocation: "Cell 03 • Spot-Welding",
    type: "Heavy Spot-Welding Cell",
    scenarioId: "SCENARIO-02-PNEUMATIC-DROP",
    faultJoint: null,
    status: "NOMINAL",
    statusDotColor: "bg-emerald-500 ring-4 ring-emerald-300/40",
    statusBorder: "hover:border-emerald-400/80",
    image: "/machinery/abb_irb6700.jpg",
    payloadCapacity: "235 kg",
    reach: "2650 mm",
    uptime: "99.7%",
    cycles: "3,120,500",
    tempMax: "53.1°C",
    tempAvg: "49.0°C",
    loadAvg: "68.5%",
    vibrationRms: "0.18 g",
    harnessPing: "0.9 ms",
    oee: "94.8%",
    mtbf: "4,680 hrs",
    nominalTemp: "49.0°C",
    nominalVibe: "0.18 g",
    incidentDescription: "Pneumatic supply pressure decay on end-effector clamp circuit (dropping from 6.2 bar to 2.8 bar).",
    joints: [
      { name: "Joint 1 (Base Rotation)", temp: 45.2, torque: 52, status: "NOMINAL" },
      { name: "Joint 2 (Lower Arm)", temp: 53.1, torque: 71, status: "NOMINAL" },
      { name: "Joint 3 (Arm Elevation)", temp: 51.0, torque: 68, status: "NOMINAL" },
      { name: "Joint 4 (Wrist Pitch)", temp: 48.3, torque: 44, status: "NOMINAL" },
      { name: "Joint 5 (Wrist Yaw)", temp: 44.0, torque: 38, status: "NOMINAL" },
      { name: "Joint 6 (Tool Flange)", temp: 42.1, torque: 31, status: "NOMINAL" },
    ],
    fftPeaks: [
      { freq: "22.5 Hz (1X Fundamental)", amp: "0.08 g", status: "NORMAL" },
      { freq: "67.5 Hz (3X Harmonics)", amp: "0.11 g", status: "NORMAL" },
      { freq: "135.0 Hz (Bearing BPFO)", amp: "0.07 g", status: "NORMAL" },
      { freq: "270.0 Hz (Gear Mesh)", amp: "0.05 g", status: "NORMAL" },
    ],
    hourlyThermalTrend: [46, 48, 49, 50, 51, 52, 53.1]
  },
  {
    id: "FANUC-M900IB",
    name: "Fanuc M-900iB/700 Ultra",
    brand: "FANUC",
    modelCode: "M-2000iA/700",
    nodeId: "HARNESS-D2",
    cellLocation: "Cell 02 • Heavy Ingot Foundry",
    type: "Ultra Heavy-Duty Transfer",
    scenarioId: "SCENARIO-03-CONTRADICTORY-VIBRATION",
    faultJoint: "Joint_3",
    status: "STANDBY",
    statusDotColor: "bg-slate-400 ring-4 ring-slate-300/40",
    statusBorder: "hover:border-slate-400/80",
    image: "/machinery/fanuc_m900.jpg",
    payloadCapacity: "700 kg",
    reach: "2830 mm",
    uptime: "100.0%",
    cycles: "954,100",
    tempMax: "34.6°C",
    tempAvg: "32.0°C",
    loadAvg: "12.0%",
    vibrationRms: "0.04 g",
    harnessPing: "1.4 ms",
    oee: "98.1%",
    mtbf: "6,400 hrs",
    nominalTemp: "32.0°C",
    nominalVibe: "0.04 g",
    incidentDescription: "Actuator bus voltage ripple causing high frequency torque spikes on foundry transfer cycles.",
    joints: [
      { name: "Joint 1 (Base Rotation)", temp: 32.0, torque: 12, status: "NOMINAL" },
      { name: "Joint 2 (Lower Arm)", temp: 34.6, torque: 16, status: "NOMINAL" },
      { name: "Joint 3 (Arm Elevation)", temp: 33.2, torque: 15, status: "NOMINAL" },
      { name: "Joint 4 (Wrist Pitch)", temp: 31.0, torque: 10, status: "NOMINAL" },
      { name: "Joint 5 (Wrist Yaw)", temp: 30.2, torque: 8, status: "NOMINAL" },
      { name: "Joint 6 (Tool Flange)", temp: 29.5, torque: 6, status: "NOMINAL" },
    ],
    fftPeaks: [
      { freq: "15.0 Hz (1X Fundamental)", amp: "0.02 g", status: "NORMAL" },
      { freq: "45.0 Hz (3X Harmonics)", amp: "0.03 g", status: "NORMAL" },
      { freq: "90.0 Hz (Bearing BPFO)", amp: "0.01 g", status: "NORMAL" },
      { freq: "180.0 Hz (Gear Mesh)", amp: "0.01 g", status: "NORMAL" },
    ],
    hourlyThermalTrend: [30, 31, 31, 32, 33, 34, 34.6]
  },
  {
    id: "KUKA-IIWA-14",
    name: "KUKA LBR iiwa 14 R820",
    brand: "KUKA",
    modelCode: "LBR iiwa 14",
    nodeId: "HARNESS-E5",
    cellLocation: "Cell 05 • Micro-Assembly",
    type: "7-Axis Collaborative Cobot",
    scenarioId: "SCENARIO-01-THERMAL-OVERHEAT",
    faultJoint: null,
    status: "NOMINAL",
    statusDotColor: "bg-emerald-500 ring-4 ring-emerald-300/40",
    statusBorder: "hover:border-emerald-400/80",
    image: "/machinery/kuka_iiwa.jpg",
    payloadCapacity: "14 kg",
    reach: "820 mm",
    uptime: "99.8%",
    cycles: "642,800",
    tempMax: "38.9°C",
    tempAvg: "36.2°C",
    loadAvg: "31.4%",
    vibrationRms: "0.08 g",
    harnessPing: "0.7 ms",
    oee: "95.7%",
    mtbf: "5,800 hrs",
    nominalTemp: "36.2°C",
    nominalVibe: "0.08 g",
    incidentDescription: "No active incident. Collaborative torque sensors zeroed within ISO TS 15066 safety envelope.",
    joints: [
      { name: "Joint 1 (Base Yaw)", temp: 34.1, torque: 22, status: "NOMINAL" },
      { name: "Joint 2 (Shoulder Pitch)", temp: 38.9, torque: 35, status: "NOMINAL" },
      { name: "Joint 3 (Elbow Yaw)", temp: 36.4, torque: 28, status: "NOMINAL" },
      { name: "Joint 4 (Elbow Pitch)", temp: 35.8, torque: 26, status: "NOMINAL" },
      { name: "Joint 5 (Wrist Yaw)", temp: 33.2, torque: 18, status: "NOMINAL" },
      { name: "Joint 6 (Wrist Pitch)", temp: 32.0, torque: 14, status: "NOMINAL" },
    ],
    fftPeaks: [
      { freq: "25.0 Hz (1X Fundamental)", amp: "0.03 g", status: "NORMAL" },
      { freq: "75.0 Hz (3X Harmonics)", amp: "0.04 g", status: "NORMAL" },
      { freq: "150.0 Hz (Bearing BPFO)", amp: "0.02 g", status: "NORMAL" },
      { freq: "300.0 Hz (Gear Mesh)", amp: "0.02 g", status: "NORMAL" },
    ],
    hourlyThermalTrend: [33, 34, 35, 36, 37, 38, 38.9]
  },
  {
    id: "YASKAWA-GP280",
    name: "Yaskawa Motoman GP280",
    brand: "Yaskawa",
    modelCode: "GP25/280",
    nodeId: "HARNESS-F1",
    cellLocation: "Cell 06 • Stamping Press",
    type: "High-Inertia Press Automation",
    scenarioId: "SCENARIO-01-THERMAL-OVERHEAT",
    faultJoint: null,
    status: "NOMINAL",
    statusDotColor: "bg-emerald-500 ring-4 ring-emerald-300/40",
    statusBorder: "hover:border-emerald-400/80",
    image: "/machinery/yaskawa_gp280.jpg",
    payloadCapacity: "280 kg",
    reach: "2702 mm",
    uptime: "99.5%",
    cycles: "1,410,200",
    tempMax: "45.2°C",
    tempAvg: "41.8°C",
    loadAvg: "55.0%",
    vibrationRms: "0.15 g",
    harnessPing: "1.0 ms",
    oee: "93.6%",
    mtbf: "4,900 hrs",
    nominalTemp: "41.8°C",
    nominalVibe: "0.15 g",
    incidentDescription: "No active incident. High-speed press loading cycle nominal.",
    joints: [
      { name: "Joint 1 (Base Rotation)", temp: 39.5, torque: 48, status: "NOMINAL" },
      { name: "Joint 2 (Lower Arm)", temp: 45.2, torque: 62, status: "NOMINAL" },
      { name: "Joint 3 (Arm Elevation)", temp: 43.8, torque: 58, status: "NOMINAL" },
      { name: "Joint 4 (Wrist Pitch)", temp: 40.1, torque: 34, status: "NOMINAL" },
      { name: "Joint 5 (Wrist Yaw)", temp: 38.0, torque: 29, status: "NOMINAL" },
      { name: "Joint 6 (Tool Flange)", temp: 35.4, torque: 21, status: "NOMINAL" },
    ],
    fftPeaks: [
      { freq: "21.0 Hz (1X Fundamental)", amp: "0.06 g", status: "NORMAL" },
      { freq: "63.0 Hz (3X Harmonics)", amp: "0.09 g", status: "NORMAL" },
      { freq: "126.0 Hz (Bearing BPFO)", amp: "0.05 g", status: "NORMAL" },
      { freq: "252.0 Hz (Gear Mesh)", amp: "0.04 g", status: "NORMAL" },
    ],
    hourlyThermalTrend: [38, 39, 41, 42, 43, 44, 45.2]
  }
];

export default function ConnectedMachineryView({
  onTriggerInvestigation,
  onNavigateToTwin,
  onNavigateToStreaming,
  isInvestigating = false,
  activeAgent = null
}) {
  const [selectedMachineId, setSelectedMachineId] = useState("KR-210-R2700");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [renderMode, setRenderMode] = useState("3D_TWIN"); // "3D_TWIN" | "PHOTO"
  const [isIncidentActive, setIsIncidentActive] = useState(true);
  const [customMachineQuery, setCustomMachineQuery] = useState("");
  const [liveStreamedReasoning, setLiveStreamedReasoning] = useState("");
  const [isStreamingLocal, setIsStreamingLocal] = useState(false);
  const terminalBottomRef = useRef(null);

  const selectedMachine = INITIAL_MACHINERY.find(m => m.id === selectedMachineId);

  const filteredMachinery = INITIAL_MACHINERY.filter(m => {
    if (filterStatus !== "ALL" && m.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.nodeId.toLowerCase().includes(q) ||
        m.cellLocation.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle asking "What's the problem with this device?" with real streaming
  const handleAskDeviceProblem = (promptOverride = null) => {
    if (!selectedMachine) return;
    const query = promptOverride || customMachineQuery.trim() || `What is the problem with ${selectedMachine.name}? Diagnose telemetry anomalies, joint health, and root cause.`;
    setCustomMachineQuery("");
    
    // Activate incident state on 3D twin
    setIsIncidentActive(true);
    setIsStreamingLocal(true);
    setLiveStreamedReasoning(`Connecting to harness for ${selectedMachine.name} (Node: ${selectedMachine.nodeId})...\nIngesting high-frequency CAN telemetry streams...`);

    if (onTriggerInvestigation) {
      onTriggerInvestigation(selectedMachine.id, query);
    }
  };

  const currentFaultJoint = isIncidentActive ? (selectedMachine?.faultJoint || "Joint_3") : null;
  const currentTempDisplay = isIncidentActive ? selectedMachine?.tempMax : selectedMachine?.nominalTemp;
  const currentVibeDisplay = isIncidentActive ? selectedMachine?.vibrationRms : selectedMachine?.nominalVibe;

  return (
    <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-[10px] sm:rounded-[12px] p-3 sm:p-3.5 border border-white/80 shadow-xs flex flex-col overflow-hidden text-slate-800">
      
      {/* ============================================================ */}
      {/* 1. DETAILED STATISTICAL DASHBOARD + SIMULATED 3D RENDER      */}
      {/* ============================================================ */}
      {selectedMachine ? (
        <div className="h-full flex flex-col justify-between overflow-hidden gap-2 animate-in fade-in duration-200">
          
          {/* Top Bar with Back Breadcrumb & Controls */}
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMachineId(null)}
                className="px-2.5 py-1 rounded-[8px] bg-slate-100 hover:bg-[#faeee5] hover:text-[#c8764b] text-slate-600 transition cursor-pointer flex items-center gap-1 text-xs font-mono font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Fleet</span>
              </button>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isIncidentActive ? 'bg-amber-500 animate-pulse ring-4 ring-amber-300/40' : selectedMachine.statusDotColor}`} />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-heading leading-tight">
                  {selectedMachine.name}
                </h2>
                <span className="font-mono text-[9.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                  {selectedMachine.nodeId}
                </span>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Incident Simulation Toggle */}
              <button
                onClick={() => setIsIncidentActive(prev => !prev)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs border ${
                  isIncidentActive
                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${isIncidentActive ? 'text-amber-100' : 'text-slate-500'}`} />
                <span>{isIncidentActive ? "Simulating Anomaly" : "Simulate Anomaly"}</span>
              </button>

              {/* Ask Question / Trigger Harness Button */}
              <button
                onClick={() => handleAskDeviceProblem(`What's the problem with ${selectedMachine.name}? Diagnose current sensor anomalies and joint health.`)}
                disabled={isInvestigating}
                className="px-3 py-1.5 rounded-[8px] bg-gradient-to-r from-[#d98555] to-[#c8764b] hover:from-[#c8764b] hover:to-[#b7653b] text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Ask: What's the problem with this device?</span>
              </button>

              {onNavigateToStreaming && (
                <button
                  onClick={onNavigateToStreaming}
                  className="px-2.5 py-1.5 rounded-[8px] bg-white border border-slate-200/80 hover:border-[#d98555] hover:text-[#d98555] text-slate-700 text-xs font-mono transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Deliberation DAG</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
            
            {/* ======================================================== */}
            {/* SIMULATED 3D RENDER CANVAS + TELEMETRY GAUGES           */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-2.5">
              
              {/* 3D Simulated Robot Stage */}
              <div className="h-[280px] sm:h-[320px] bg-gradient-to-b from-[#faf5f0] to-[#f5ebe1] rounded-[10px] border border-[#ecd7c7] relative overflow-hidden flex flex-col justify-between p-2.5 shadow-2xs">
                
                {/* 3D Canvas View Controls */}
                <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <span className="px-2.5 py-1 rounded-[6px] bg-white/90 backdrop-blur-md border border-[#e8d2c2] text-[10px] font-mono font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
                      <Bot className="w-3 h-3 text-[#d98555]" />
                      SIMULATED TWIN • {selectedMachine.brand}
                    </span>
                    {isIncidentActive && (
                      <span className="px-2.5 py-1 rounded-[6px] bg-red-500/90 backdrop-blur-md border border-red-400 text-[10px] font-mono font-bold text-white shadow-2xs animate-pulse flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-200" />
                        {currentFaultJoint || "JOINT_3"} ANOMALY
                      </span>
                    )}
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-[6px] border border-[#e8d2c2] pointer-events-auto">
                    <button
                      onClick={() => setRenderMode("3D_TWIN")}
                      className={`px-2 py-0.5 rounded-[4px] text-[9.5px] font-mono font-semibold transition cursor-pointer ${
                        renderMode === "3D_TWIN" ? "bg-[#d98555] text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      3D Model
                    </button>
                    <button
                      onClick={() => setRenderMode("PHOTO")}
                      className={`px-2 py-0.5 rounded-[4px] text-[9.5px] font-mono font-semibold transition cursor-pointer ${
                        renderMode === "PHOTO" ? "bg-[#d98555] text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Blueprint
                    </button>
                  </div>
                </div>

                {/* 3D Dynamic RobotViewer */}
                <div className="flex-1 w-full h-full relative">
                  {renderMode === "3D_TWIN" ? (
                    <RobotViewer
                      activeFaultJoint={currentFaultJoint}
                      variant="glass"
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={selectedMachine.image}
                        alt={selectedMachine.name}
                        className="max-h-full max-w-full object-contain drop-shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Canvas Telemetry Strip */}
                <div className="shrink-0 flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 bg-white/50 px-2 py-1 rounded-[6px]">
                  <span>Sensor Ring: 1000Hz EtherCAT</span>
                  <span>Incident Sim: <strong className={isIncidentActive ? "text-amber-600" : "text-emerald-600"}>{isIncidentActive ? "ACTIVE (82.4°C Spike)" : "NOMINAL"}</strong></span>
                  <span>Drag to rotate • Scroll to zoom</span>
                </div>

              </div>

              {/* Right Side: Interactive Diagnostic Console & Live Telemetry Matrix */}
              <div className="flex flex-col justify-between gap-2">
                
                {/* 4 Core Quick Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <div className={`border rounded-[8px] p-2 flex flex-col justify-between transition ${isIncidentActive ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-[#f0dfd3]'}`}>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Live Temp</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-base sm:text-lg font-bold font-mono leading-none ${isIncidentActive ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                        {currentTempDisplay}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${isIncidentActive ? 'bg-amber-500' : 'bg-[#d98555]'}`} style={{ width: isIncidentActive ? '88%' : '45%' }} />
                    </div>
                  </div>

                  <div className={`border rounded-[8px] p-2 flex flex-col justify-between transition ${isIncidentActive ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-[#f0dfd3]'}`}>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Vibration</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-base sm:text-lg font-bold font-mono leading-none ${isIncidentActive ? 'text-amber-600' : 'text-slate-800'}`}>
                        {currentVibeDisplay}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${isIncidentActive ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: isIncidentActive ? '65%' : '20%' }} />
                    </div>
                  </div>

                  <div className="bg-white border border-[#f0dfd3] rounded-[8px] p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Harness Ping</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base sm:text-lg font-bold font-mono leading-none text-emerald-600">{selectedMachine.harnessPing}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>

                  <div className="bg-white border border-[#f0dfd3] rounded-[8px] p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">OEE</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base sm:text-lg font-bold font-mono leading-none text-slate-800">{selectedMachine.oee}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-[#d98555] h-full rounded-full" style={{ width: '89%' }} />
                    </div>
                  </div>
                </div>

                {/* Interactive Diagnostic Inquiry Prompt Box */}
                <div className="bg-[#faf5f0] rounded-[10px] border border-[#ecd7c7] p-2.5 flex flex-col justify-between gap-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#d98555]" />
                      Autonomous Diagnostic Inquiry
                    </span>
                    <span className="text-[8.5px] font-mono text-[#d98555] font-bold bg-white px-2 py-0.5 rounded border border-[#f0dfd3]">
                      LIVE HARNESS STREAMING
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-slate-600 leading-relaxed">
                    {isIncidentActive
                      ? `⚠️ Active Anomaly on ${selectedMachine.name}: Joint 3 thermal elevation (82.4°C) with harmonic vibration resonance.`
                      : `Normal operating conditions. All 6 kinematic axes synchronized with golden engineering baselines.`}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customMachineQuery}
                      onChange={(e) => setCustomMachineQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAskDeviceProblem();
                      }}
                      placeholder={`Ask harness: What's the problem with ${selectedMachine.name}?`}
                      className="flex-1 bg-white border border-slate-200 rounded-[8px] px-2.5 py-1.5 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#d98555]"
                    />
                    <button
                      onClick={() => handleAskDeviceProblem()}
                      disabled={isInvestigating}
                      className="px-3 py-1.5 rounded-[8px] bg-[#d98555] hover:bg-[#c8764b] text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Diagnose</span>
                    </button>
                  </div>
                </div>

                {/* 6-Axis Real-Time Joint Telemetry Matrix */}
                <div className="bg-white rounded-[10px] border border-slate-200/80 p-2 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-mono text-[10.5px] font-bold text-slate-800 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-[#d98555]" />
                      6-Axis Kinematic Telemetry
                    </h3>
                    <span className="text-[8px] font-mono text-slate-400">Node: {selectedMachine.nodeId}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {selectedMachine.joints.map((joint, idx) => {
                      const isFaulty = isIncidentActive && joint.isFault;
                      return (
                        <div
                          key={idx}
                          className={`p-1.5 rounded-[6px] border transition ${
                            isFaulty
                              ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300"
                              : "bg-slate-50/80 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            <span className="font-semibold text-slate-700 truncate">{joint.name.split(' ')[0]} {joint.name.split(' ')[1]}</span>
                            <span className={`text-[7.5px] px-1 rounded font-bold ${
                              isFaulty ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {isFaulty ? "ELEVATED" : "OK"}
                            </span>
                          </div>
                          <div className="text-[8.5px] font-mono text-slate-500 mt-0.5 flex justify-between">
                            <span>{isFaulty ? joint.temp : (joint.temp * 0.7).toFixed(1)}°C</span>
                            <span>{joint.torque}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* FFT Vibration Spectrum & Thermal Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              
              {/* FFT Spectrum */}
              <div className="bg-white rounded-[10px] border border-slate-200/80 p-2.5 shadow-2xs">
                <h3 className="font-mono text-[11px] font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#d98555]" />
                  Harmonic Drive FFT Vibration Spectrum
                </h3>
                <div className="space-y-1">
                  {selectedMachine.fftPeaks.map((peak, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-[6px] bg-slate-50 text-[9.5px] font-mono">
                      <span className="text-slate-700 font-medium">{peak.freq}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-bold">{peak.amp}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-[4px] font-semibold ${
                          peak.status === "ALERT" ? "bg-red-100 text-red-700" :
                          peak.status === "CAUTION" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {peak.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thermal Dissipation Curve */}
              <div className="bg-white rounded-[10px] border border-slate-200/80 p-2.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <h3 className="font-mono text-[11px] font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                    <Flame className="w-3.5 h-3.5 text-[#d98555]" />
                    7-Hour Thermal Elevation Profile
                  </h3>
                  <p className="text-[8.5px] font-mono text-slate-400 mb-1">
                    Consecutive hourly thermal logging on harness bus
                  </p>
                </div>
                
                {/* Visual Bar Graph */}
                <div className="h-16 flex items-end justify-between gap-2 px-2 pt-1 border-b border-slate-100">
                  {selectedMachine.hourlyThermalTrend.map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[8px] font-mono font-bold text-slate-600">{val}°</span>
                      <div
                        className={`w-full rounded-t-[3px] transition-all ${
                          val > 70 ? 'bg-gradient-to-t from-amber-500 to-red-500' : 'bg-gradient-to-t from-[#f5b896] to-[#d98555]'
                        }`}
                        style={{ height: `${(val / 90) * 100}%` }}
                      />
                      <span className="text-[7px] font-mono text-slate-400">T-{6 - idx}h</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-500 pt-1">
                  <span>Cycles: <strong>{selectedMachine.cycles}</strong></span>
                  <span>MTBF: <strong>{selectedMachine.mtbf}</strong></span>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* ============================================================ */
        /* 2. SIMPLIFIED VISUAL FLASHCARDS GRID VIEW                    */
        /* ============================================================ */
        <div className="h-full flex flex-col justify-between overflow-hidden gap-2">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-100 gap-1 shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-heading leading-tight">
                Connected Machinery Fleet
              </h2>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Click any machine flashcard to inspect real-time 3D simulation and statistical telemetry
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-[8px] shrink-0">
              {["ALL", "INVESTIGATING", "NOMINAL", "STANDBY"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2 py-0.5 rounded-[6px] text-[9.5px] font-mono font-semibold transition cursor-pointer ${
                    filterStatus === status
                      ? "bg-white text-[#c8764b] shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Flashcards Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {filteredMachinery.map((machine) => (
                <div
                  key={machine.id}
                  onClick={() => setSelectedMachineId(machine.id)}
                  className={`bg-white hover:bg-[#fffcf9] rounded-[10px] border border-slate-200/80 ${machine.statusBorder} p-2.5 shadow-2xs hover:shadow-[0_8px_20px_rgba(217,133,85,0.14)] transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
                >
                  {/* Card Top: Node Badge & Minimalist Color Dot */}
                  <div className="flex items-center justify-between text-[9px] font-mono pb-1">
                    <span className="text-slate-500 font-semibold bg-slate-50 px-1.5 py-0.5 rounded-[4px] border border-slate-100">
                      {machine.nodeId}
                    </span>
                    <div className="flex items-center gap-1.5 pr-0.5">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${machine.statusDotColor}`} />
                    </div>
                  </div>

                  {/* Centered Robot Image Showcase */}
                  <div className="h-28 w-full bg-slate-50/60 rounded-[8px] my-1 flex items-center justify-center p-1 relative overflow-hidden group-hover:bg-[#faeee5]/40 transition">
                    <img
                      src={machine.image}
                      alt={machine.name}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-xs"
                    />
                  </div>

                  {/* Machine Name & Subtext */}
                  <div className="pt-0.5">
                    <h3 className="text-[14.5px] sm:text-[15px] font-bold text-slate-800 group-hover:text-[#d98555] transition leading-tight truncate tracking-tight font-heading">
                      {machine.name}
                    </h3>
                    <p className="text-[9.5px] font-mono text-slate-400 mt-0.5 truncate">
                      {machine.type} • {machine.payloadCapacity}
                    </p>
                  </div>

                  {/* 2 Clean Simplified Quick Metric Badges */}
                  <div className="grid grid-cols-2 gap-1.5 my-1.5 py-1 border-y border-slate-100 text-center">
                    <div className="bg-[#faf5f0] p-1 rounded-[6px]">
                      <span className="text-[8px] font-mono text-slate-400 uppercase block">Temp</span>
                      <strong className={`font-mono text-[11px] ${machine.tempMax.includes('82') ? 'text-amber-600' : 'text-slate-800'}`}>
                        {machine.tempMax}
                      </strong>
                    </div>
                    <div className="bg-[#faf5f0] p-1 rounded-[6px]">
                      <span className="text-[8px] font-mono text-slate-400 uppercase block">Vibration</span>
                      <strong className="font-mono text-[11px] text-slate-800">{machine.vibrationRms}</strong>
                    </div>
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                    <span className="text-[8.5px] text-slate-400">{machine.uptime} Uptime</span>
                    <span className="text-[#d98555] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform text-[10.5px]">
                      3D Twin & Stats <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Footer Status Bar */}
          <div className="shrink-0 flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            <span>ReliAI Hardware Harness Daemon v2.4.1</span>
            <span>Industrial Bus: CANopen / EtherCAT Ring</span>
          </div>

        </div>
      )}

    </div>
  );
}
