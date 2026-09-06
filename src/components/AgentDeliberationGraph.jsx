import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Zap,
  Flame,
  Radio,
  Compass,
  Database,
  GitCommit,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Sliders,
  Sparkles,
  Info,
  Layers
} from 'lucide-react';

// Resource Sensing Layer Definitions (Layer 2)
const RESOURCE_NODES = [
  { id: "R_THERMAL", label: "Thermal (°C)", fullLabel: "Thermal & Joint 3 Temperature", y: 38, icon: Flame, defaultVal: "82.4°C", threshold: "70.0°C", unit: "°C" },
  { id: "R_VOLTAGE", label: "Voltage (V)", fullLabel: "Bus Voltage & Current Draw", y: 78, icon: Zap, defaultVal: "48.2 V", threshold: "48.0 V ± 5%", unit: "V" },
  { id: "R_VIBRATION", label: "Vibration (g)", fullLabel: "Vibration FFT Spectral RMS", y: 118, icon: Activity, defaultVal: "0.48 g", threshold: "0.20 g", unit: "g" },
  { id: "R_ORIENTATION", label: "Orientation (rad)", fullLabel: "Kinematic Quaternion & TCP", y: 158, icon: Compass, defaultVal: "0.018 rad", threshold: "0.050 rad", unit: "rad" },
  { id: "R_TORQUE", label: "Torque (%)", fullLabel: "Harmonic Drive Motor Torque", y: 198, icon: Sliders, defaultVal: "88.0%", threshold: "75.0%", unit: "%" },
  { id: "R_PNEUMATIC", label: "Pneumatics (bar)", fullLabel: "Gripper Actuator Pressure", y: 238, icon: Radio, defaultVal: "6.2 bar", threshold: "6.0 bar", unit: "bar" },
  { id: "R_LOTO", label: "Safety (Hz)", fullLabel: "LOTO Safety Interlock Bus", y: 278, icon: ShieldAlert, defaultVal: "1000 Hz", threshold: "1000 Hz", unit: "Hz" }
];

// Deliberation Agents Layer Definitions (Layer 3)
const AGENT_NODES = [
  { id: "A_TRIAGE", label: "Triage Agent", agentKey: "TRIAGE_AGENT", y: 68, role: "Anomaly Detection & Fault Classification" },
  { id: "A_DOMAIN", label: "Domain Analyst", agentKey: "DOMAIN_ANALYSIS", y: 118, role: "Physics-Informed Kinematic Modeling" },
  { id: "A_ROOT_CAUSE", label: "Root Cause Engine", agentKey: "ROOT_CAUSE_AGENT", y: 168, role: "Failure Mode & Effect Analysis (FMEA)" },
  { id: "A_CRITIC", label: "Critic Debate", agentKey: "CRITIC_AGENT", y: 218, role: "Counter-Hypothesis & Falsification" },
  { id: "A_SAFETY", label: "Safety Guard", agentKey: "CONFIDENCE_ENGINE", y: 268, role: "LOTO & ISO 10218 Compliance Guard" }
];

// Presets for different judging focuses
const PRESET_MODES = [
  { id: "THERMAL", label: "🔥 Thermal Overheat", activeResources: ["R_THERMAL", "R_VIBRATION", "R_TORQUE"], activeAgents: ["A_TRIAGE", "A_DOMAIN", "A_ROOT_CAUSE"] },
  { id: "VOLTAGE", label: "⚡ Voltage & Sensors", activeResources: ["R_VOLTAGE", "R_THERMAL", "R_ORIENTATION"], activeAgents: ["A_TRIAGE", "A_ROOT_CAUSE", "A_CRITIC"] },
  { id: "VIBRATION", label: "📊 Vibration FFT", activeResources: ["R_VIBRATION", "R_ORIENTATION", "R_TORQUE"], activeAgents: ["A_DOMAIN", "A_ROOT_CAUSE", "A_SAFETY"] },
  { id: "ORIENTATION", label: "📐 Kinematics & Pose", activeResources: ["R_ORIENTATION", "R_TORQUE", "R_LOTO"], activeAgents: ["A_TRIAGE", "A_DOMAIN", "A_CRITIC"] },
  { id: "PNEUMATIC", label: "💨 Gripper Pressure", activeResources: ["R_PNEUMATIC", "R_TORQUE", "R_LOTO"], activeAgents: ["A_TRIAGE", "A_ROOT_CAUSE", "A_SAFETY"] }
];

export default function AgentDeliberationGraph({
  agentTraces = [],
  activeAgent = null,
  isInvestigating = false,
  activeScenarioId = "SCENARIO-01-THERMAL-OVERHEAT",
  telemetry = {},
  verdict = null
}) {
  const [activePreset, setActivePreset] = useState("THERMAL");
  const [selectedNode, setSelectedNode] = useState(null);

  // Sync preset when active scenario changes
  useEffect(() => {
    if (activeScenarioId?.includes("VOLT") || activeScenarioId?.includes("CONTRADICTORY")) {
      setActivePreset("VOLTAGE");
    } else if (activeScenarioId?.includes("PNEUMATIC")) {
      setActivePreset("PNEUMATIC");
    } else if (activeScenarioId?.includes("VIBRATION")) {
      setActivePreset("VIBRATION");
    } else {
      setActivePreset("THERMAL");
    }
  }, [activeScenarioId]);

  const currentPreset = PRESET_MODES.find(p => p.id === activePreset) || PRESET_MODES[0];

  // AI is active only during active investigation or when trace logs exist
  const isAiActive = isInvestigating || agentTraces.length > 0;
  
  // Track multiple flow depth (e.g. if multiple traces/questions have been processed)
  const questionDepth = Math.max(1, Math.min(3, agentTraces.length > 0 ? Math.ceil(agentTraces.length / 2) : 1));

  // Node coordinates matching reference layout
  const INGEST_NODE = { x: 90, y: 158, label: "Harness Ingest" };
  const VERDICT_NODE = { x: 580, y: 168, label: "Verdict" };

  // Cubic Bezier curve path generator
  const getCurvePath = (x1, y1, x2, y2, offset = 0) => {
    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.42;
    const cx2 = x2 - dx * 0.42;
    return `M ${x1} ${y1 + offset} C ${cx1} ${y1 + offset}, ${cx2} ${y2 + offset}, ${x2} ${y2 + offset}`;
  };

  // Generate dynamic connections when AI is active
  const activeConnections = useMemo(() => {
    if (!isAiActive) return [];

    const connections = [];

    // Layer 1 (Ingest) -> Layer 2 (Resources)
    currentPreset.activeResources.forEach((resId) => {
      const res = RESOURCE_NODES.find(r => r.id === resId);
      if (res) {
        connections.push({
          id: `ingest-${res.id}`,
          from: INGEST_NODE,
          to: { x: 250, y: res.y },
          color: "#d98555",
          targetNode: res
        });
      }
    });

    // Layer 2 (Resources) -> Layer 3 (Agents)
    currentPreset.activeResources.forEach((resId, idx) => {
      const res = RESOURCE_NODES.find(r => r.id === resId);
      const agentId = currentPreset.activeAgents[idx % currentPreset.activeAgents.length];
      const agent = AGENT_NODES.find(a => a.id === agentId);
      if (res && agent) {
        connections.push({
          id: `${res.id}-${agent.id}`,
          from: { x: 260, y: res.y },
          to: { x: 425, y: agent.y },
          color: "#d98555",
          targetNode: agent
        });
      }
    });

    // Cross Links for multi-agent correlation
    if (currentPreset.activeAgents.length >= 2) {
      const a2 = AGENT_NODES.find(a => a.id === currentPreset.activeAgents[1]);
      const rMiddle = RESOURCE_NODES.find(r => r.id === currentPreset.activeResources[1] || r.id === currentPreset.activeResources[0]);
      if (rMiddle && a2) {
        connections.push({
          id: `${rMiddle.id}-${a2.id}-cross`,
          from: { x: 260, y: rMiddle.y },
          to: { x: 425, y: a2.y },
          color: "#e6986c",
          targetNode: a2
        });
      }
    }

    // Layer 3 (Agents) -> Layer 4 (Verdict)
    currentPreset.activeAgents.forEach((agentId) => {
      const agent = AGENT_NODES.find(a => a.id === agentId);
      if (agent) {
        connections.push({
          id: `${agent.id}-verdict`,
          from: { x: 435, y: agent.y },
          to: VERDICT_NODE,
          color: "#d98555",
          targetNode: VERDICT_NODE
        });
      }
    });

    return connections;
  }, [isAiActive, currentPreset]);

  return (
    <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-[10px] sm:rounded-[12px] p-3 sm:p-3.5 border border-white/80 shadow-xs flex flex-col justify-between overflow-hidden text-slate-800">
      
      {/* Header Bar with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-sm text-slate-800 flex items-center gap-1.5 tracking-tight">
            <Activity className="w-3.5 h-3.5 text-[#d98555]" />
            Harness Neural DAG Visualisation
          </span>
          {isInvestigating ? (
            <span className="text-[9px] font-mono font-bold text-[#c8764b] bg-[#faeee5] px-2 py-0.5 rounded-[6px] border border-[#efc4ab] flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              EVALUATING RESOURCES
            </span>
          ) : isAiActive ? (
            <span className="text-[9px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200">
              CONVERGED
            </span>
          ) : (
            <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[6px]">
              IDLE • WAITING FOR PROMPT
            </span>
          )}
        </div>

        {/* Dynamic Resource Judging Mode Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {PRESET_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => {
                setActivePreset(mode.id);
                setSelectedNode(null);
              }}
              className={`px-2 py-0.5 rounded-[6px] text-[9.5px] font-mono font-semibold transition cursor-pointer shrink-0 ${
                activePreset === mode.id
                  ? "bg-[#d98555] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dotted Canvas with SVG Neural DAG */}
      <div className="flex-1 min-h-0 w-full relative rounded-[8px] overflow-hidden border border-slate-200/70 dotted-grid-canvas my-1.5 shadow-inner flex items-center justify-center">
        <svg
          viewBox="0 0 660 320"
          className="w-full h-full max-h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Crisp Arrowhead Marker */}
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d98555" />
            </marker>

            {/* Subtle Static Drop Shadow Filter (No Blinking) */}
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#d98555" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* 1. DYNAMIC FLOWING CONNECTIONS (ONLY ACTIVE WHEN AI IS ACTIVATED) */}
          {isAiActive && activeConnections.map((conn) => {
            const basePath = getCurvePath(conn.from.x, conn.from.y, conn.to.x, conn.to.y, 0);
            
            return (
              <g key={conn.id} className="transition-all duration-300">
                {/* Underglow Path */}
                <path
                  d={basePath}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="2.5"
                  strokeOpacity="0.3"
                />

                {/* Primary Flow Path */}
                <path
                  d={basePath}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="1.6"
                  className="animate-dash-flow"
                  markerEnd="url(#arrow-active)"
                />

                {/* Layered Multi-question flow paths (if multiple questions processed in a row) */}
                {questionDepth >= 2 && (
                  <path
                    d={getCurvePath(conn.from.x, conn.from.y, conn.to.x, conn.to.y, 1.5)}
                    fill="none"
                    stroke="#e89568"
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                    className="animate-dash-flow"
                    style={{ animationDuration: '1.8s' }}
                  />
                )}

                {questionDepth >= 3 && (
                  <path
                    d={getCurvePath(conn.from.x, conn.from.y, conn.to.x, conn.to.y, -1.5)}
                    fill="none"
                    stroke="#f5b896"
                    strokeWidth="1.0"
                    strokeOpacity="0.5"
                    className="animate-dash-flow"
                    style={{ animationDuration: '2.2s' }}
                  />
                )}
              </g>
            );
          })}

          {/* 2. LAYER 1: HARNESS INGEST NODE (Left Solid Yellow Circle) */}
          <g
            className="cursor-pointer group"
            onClick={() => setSelectedNode({ type: "INPUT", title: "Harness Ingest Stream", desc: "Hardware bus telemetry stream across all 6 kinematic axes sampled at 1000 Hz." })}
          >
            <circle
              cx={INGEST_NODE.x}
              cy={INGEST_NODE.y}
              r="13"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
              filter="url(#soft-shadow)"
              className="group-hover:scale-105 transition-transform"
            />
            <text
              x={INGEST_NODE.x}
              y={INGEST_NODE.y + 22}
              textAnchor="middle"
              className="text-[9px] font-mono fill-slate-700 font-bold"
            >
              Harness Ingest
            </text>
          </g>

          {/* 3. LAYER 2: 7 RESOURCE SENSING NODES (Middle-Left Solid Yellow Circles) */}
          {RESOURCE_NODES.map((res) => {
            const isJudging = isAiActive && currentPreset.activeResources.includes(res.id);

            return (
              <g
                key={res.id}
                className="cursor-pointer group transition-all duration-200"
                onClick={() => setSelectedNode({ ...res, type: "RESOURCE" })}
              >
                {/* Solid Yellow Node Circle (No Blinking) */}
                <circle
                  cx={255}
                  cy={res.y}
                  r="11"
                  fill="#f59e0b"
                  opacity={isJudging || !isAiActive ? 1 : 0.4}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#soft-shadow)"
                  className="group-hover:scale-110 transition-transform"
                />

                {/* Resource Text Label */}
                <text
                  x={236}
                  y={res.y + 3.5}
                  textAnchor="end"
                  className={`text-[8.5px] font-mono transition ${
                    isJudging ? "fill-amber-900 font-bold" : "fill-slate-500"
                  }`}
                >
                  {res.label}
                </text>
              </g>
            );
          })}

          {/* 4. LAYER 3: 5 DELIBERATION AGENT NODES (Middle-Right Solid Orange Circles) */}
          {AGENT_NODES.map((agent) => {
            const isDeliberating = isAiActive && currentPreset.activeAgents.includes(agent.id);

            return (
              <g
                key={agent.id}
                className="cursor-pointer group transition-all duration-200"
                onClick={() => setSelectedNode({ ...agent, type: "AGENT" })}
              >
                {/* Solid Orange Node Circle (No Blinking) */}
                <circle
                  cx={430}
                  cy={agent.y}
                  r="11"
                  fill="#ea580c"
                  opacity={isDeliberating || !isAiActive ? 1 : 0.4}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#soft-shadow)"
                  className="group-hover:scale-110 transition-transform"
                />

                {/* Agent Text Label */}
                <text
                  x={449}
                  y={agent.y + 3.5}
                  textAnchor="start"
                  className={`text-[8.5px] font-mono transition ${
                    isDeliberating ? "fill-orange-950 font-bold" : "fill-slate-500"
                  }`}
                >
                  {agent.label}
                </text>
              </g>
            );
          })}

          {/* 5. LAYER 4: VERDICT SYNTHESIS NODE (Right Solid Red Circle) */}
          <g
            className="cursor-pointer group"
            onClick={() => setSelectedNode({ type: "VERDICT", title: "Consensus Root Cause Verdict", desc: verdict?.primary_root_cause?.title || "Harmonic Drive Bearing Degradation with Joint 3 Overheat" })}
          >
            <circle
              cx={VERDICT_NODE.x}
              cy={VERDICT_NODE.y}
              r="13"
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="2"
              filter="url(#soft-shadow)"
              className="group-hover:scale-105 transition-transform"
            />
            <text
              x={VERDICT_NODE.x}
              y={VERDICT_NODE.y + 22}
              textAnchor="middle"
              className="text-[9px] font-mono fill-red-800 font-bold"
            >
              Verdict
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Inspection Bar */}
      <div className="shrink-0 bg-[#faf5f0] border border-[#f0ded2] rounded-[8px] px-3 py-1.5 flex items-center justify-between text-[10px] font-mono">
        {selectedNode ? (
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-3.5 h-3.5 text-[#d98555] shrink-0" />
            <span className="font-bold text-[#c8764b] uppercase shrink-0">
              {selectedNode.type}:
            </span>
            <span className="text-slate-800 font-semibold truncate">
              {selectedNode.fullLabel || selectedNode.label || selectedNode.title}
            </span>
            {selectedNode.defaultVal && (
              <span className="bg-white px-2 py-0.5 rounded-[4px] border border-[#ecd5c5] font-bold text-amber-700 shrink-0">
                Reading: {selectedNode.defaultVal} (Limit: {selectedNode.threshold})
              </span>
            )}
            {selectedNode.role && (
              <span className="text-slate-500 truncate">
                • {selectedNode.role}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#d98555]" />
              {isAiActive
                ? `Harness Active: ${questionDepth} concurrent flow ${questionDepth > 1 ? 'threads' : 'thread'} evaluated across DAG`
                : "Harness Standing By: Ask a question in Copilot to activate dynamic DAG resource routing"}
            </span>
            <span className="text-[#d98555] font-semibold">
              Mode: {currentPreset.label}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
