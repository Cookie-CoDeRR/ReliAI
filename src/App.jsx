import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RobotViewer from './components/RobotViewer';
import ScenarioSelector from './components/ScenarioSelector';
import AgentDeliberationGraph from './components/AgentDeliberationGraph';
import MultimodalInspector from './components/MultimodalInspector';
import CriticDebateView from './components/CriticDebateView';
import HumanApprovalBar from './components/HumanApprovalBar';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioId, setActiveScenarioId] = useState("SCENARIO-01-THERMAL-OVERHEAT");
  const [currentIncidentId, setCurrentIncidentId] = useState(null);
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentTraces, setAgentTraces] = useState([]);
  const [telemetry, setTelemetry] = useState({});
  const [verdict, setVerdict] = useState(null);
  const [activeFaultJoint, setActiveFaultJoint] = useState("Joint_3");

  // Load preset scenarios on mount and auto-trigger Scenario 1
  useEffect(() => {
    fetch('/api/v1/scenarios')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setScenarios(data);
          handleTriggerScenario("SCENARIO-01-THERMAL-OVERHEAT");
        }
      })
      .catch(err => console.error("Error loading scenarios:", err));
  }, []);

  const handleTriggerScenario = async (scenarioId) => {
    setActiveScenarioId(scenarioId);
    setIsInvestigating(true);
    setAgentTraces([]);
    setActiveAgent("TRIAGE_AGENT");
    setVerdict(null);

    // Identify fault joint for 3D visualizer
    if (scenarioId.includes("THERMAL") || scenarioId.includes("CONTRADICTORY")) {
      setActiveFaultJoint("Joint_3");
    } else {
      setActiveFaultJoint(null);
    }

    try {
      // 1. Fetch scenario JSON preset
      const presetRes = await fetch('/api/v1/scenarios');
      const allPresets = await presetRes.json();
      const targetPreset = allPresets.find(s => s.scenario_id === scenarioId);

      if (targetPreset) {
        setTelemetry(targetPreset.snapshot);
      }

      // 2. Ingest incident in database
      const ingestRes = await fetch('/api/v1/incidents/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetPreset?.title || `Incident from ${scenarioId}`,
          severity: targetPreset?.expected_outcome === "CONCLUSIVE" ? "CRITICAL" : "HIGH",
          snapshot: targetPreset?.snapshot
        })
      });
      const ingestData = await ingestRes.json();
      const incId = ingestData.incident_id;
      setCurrentIncidentId(incId);

      // 3. Connect to live SSE investigation stream
      const response = await fetch(`/harness/investigate/stream?incident_id=${incId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetPreset?.snapshot)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep incomplete chunk

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawJson = line.replace('data: ', '').trim();
            if (rawJson && rawJson !== '{}') {
              try {
                const event = JSON.parse(rawJson);
                setActiveAgent(event.agent);
                setAgentTraces(prev => [...prev, event]);

                if (event.step === 'FINAL_VERDICT' && event.verdict) {
                  setVerdict(event.verdict);
                  setStatus(event.verdict.status === 'CONCLUSIVE' ? 'PENDING_APPROVAL' : event.verdict.status);
                }
              } catch (e) {
                console.error("Error parsing event stream JSON:", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Investigation execution failed:", err);
    } finally {
      setIsInvestigating(false);
      setActiveAgent(null);
    }
  };

  const handleHumanAction = async ({ action, engineer_id, notes }) => {
    if (!currentIncidentId) return;

    try {
      const res = await fetch(`/api/v1/incidents/${currentIncidentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, engineer_id, notes })
      });
      const data = await res.json();
      if (data.status === "ACTION_RECORDED") {
        if (action === "APPROVE") setStatus("APPROVED");
        if (action === "OVERRIDE") setStatus("OVERRIDDEN");
        if (action === "DISPATCH_TECH") setStatus("DISPATCHED_TECH");
      }
    } catch (e) {
      console.error("Error recording human approval:", e);
    }
  };

  const hasThermalFault = activeScenarioId?.includes("THERMAL") || activeScenarioId?.includes("CONTRADICTORY");
  const hasAcousticFault = activeScenarioId?.includes("THERMAL") || activeScenarioId?.includes("PNEUMATIC");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Header Bar */}
      <Header
        status={status}
        isInvestigating={isInvestigating}
        onReset={() => handleTriggerScenario(activeScenarioId)}
      />

      {/* Main Command Center Layout */}
      <main className="grow p-4 md:p-6 space-y-5 max-w-[1700px] w-full mx-auto">
        {/* Scenario Benchmark Bar */}
        <ScenarioSelector
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleTriggerScenario}
          isInvestigating={isInvestigating}
        />

        {/* Primary Workspace: 3D Twin (Left) + Multi-Agent Reasoning Graph (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: 3D Robotic Arm Twin & Multimodal Inspector */}
          <div className="lg:col-span-7 space-y-5 flex flex-col">
            <RobotViewer
              activeFaultJoint={activeFaultJoint}
              jointsData={telemetry.joints || {}}
              isLevitating={isInvestigating}
            />

            <MultimodalInspector
              telemetry={telemetry}
              hasThermalFault={hasThermalFault}
              hasAcousticFault={hasAcousticFault}
            />
          </div>

          {/* Right Column: Multi-Agent Deliberation Graph */}
          <div className="lg:col-span-5 flex flex-col">
            <AgentDeliberationGraph
              agentTraces={agentTraces}
              activeAgent={activeAgent}
              isInvestigating={isInvestigating}
            />
          </div>
        </div>

        {/* Secondary Row: Adversarial Debate Breakdown */}
        <CriticDebateView
          rootCause={verdict?.primary_root_cause}
          criticReport={verdict?.critic_report}
        />

        {/* Bottom Sticky Action Gateway: Human-in-the-Loop Sign-off */}
        <HumanApprovalBar
          status={status}
          confidenceScore={verdict?.final_confidence_score || 88.5}
          recommendedMitigation={verdict?.recommended_mitigation}
          onAction={handleHumanAction}
          isProcessing={isInvestigating}
        />
      </main>
    </div>
  );
}
