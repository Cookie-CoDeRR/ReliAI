import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import IncidentSummary from './components/IncidentSummary';
import RobotViewer from './components/RobotViewer';
import ScenarioSelector from './components/ScenarioSelector';
import AgentDeliberationGraph from './components/AgentDeliberationGraph';
import MultimodalInspector from './components/MultimodalInspector';
import CriticDebateView from './components/CriticDebateView';
import HumanApprovalBar from './components/HumanApprovalBar';
import IncidentHistoryDrawer from './components/IncidentHistoryDrawer';
import {
  fetchScenarios,
  triggerScenarioInvestigation,
  fetchIncidentDetails,
  submitHumanApproval
} from './services/api';

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const autoTriggeredRef = useRef(false);

  // Load scenarios only once and auto-trigger Scenario 1
  useEffect(() => {
    if (autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;

    fetchScenarios()
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
    setStatus("INVESTIGATING");
    setAgentTraces([]);
    setActiveAgent("TRIAGE_AGENT");
    setVerdict(null);

    if (scenarioId.includes("THERMAL") || scenarioId.includes("CONTRADICTORY")) {
      setActiveFaultJoint("Joint_3");
    } else {
      setActiveFaultJoint(null);
    }

    try {
      // Load scenario telemetry for the dashboard
      const allPresets = await fetchScenarios();
      const targetPreset = allPresets.find(
        s => s.scenario_id === scenarioId
      );

      if (!targetPreset) {
        throw new Error(`Scenario not found: ${scenarioId}`);
      }

      setTelemetry(targetPreset.snapshot);

      // Run investigation through the DB-persisting backend flow
      const triggerData = await triggerScenarioInvestigation(scenarioId);
      const incidentId = triggerData.incident_id;
      const finalVerdict = triggerData.verdict;

      setCurrentIncidentId(incidentId);
      setVerdict(finalVerdict);

      setStatus(
        triggerData.status ||
        (
          finalVerdict?.status === "CONCLUSIVE"
            ? "PENDING_APPROVAL"
            : finalVerdict?.status
        )
      );

      // Reload the persisted investigation traces from DB
      try {
        const detail = await fetchIncidentDetails(incidentId);
        const normalizedTraces = (
          detail.agent_traces || []
        ).map(trace => {
          if (trace.step === "FINAL_VERDICT") {
            return {
              ...trace,
              verdict: trace.payload
            };
          }
          return trace;
        });

        setAgentTraces(normalizedTraces);
      } catch (e) {
        console.warn("Could not fetch detailed traces:", e);
      }

    } catch (err) {
      console.error("Investigation execution failed:", err);
      setStatus("FAILED");
    } finally {
      setIsInvestigating(false);
      setActiveAgent(null);
    }
  };

  const handleSelectIncident = (detail) => {
    if (!detail) return;
    setCurrentIncidentId(detail.id);
    setStatus(detail.status);
    setTelemetry(detail.telemetry || {});
    setVerdict(detail.verdict);

    const normalizedTraces = (detail.agent_traces || []).map(trace => {
      if (trace.step === "FINAL_VERDICT") {
        return {
          ...trace,
          verdict: trace.payload
        };
      }
      return trace;
    });
    setAgentTraces(normalizedTraces);

    const rootCauseTitle = detail.root_cause_title || detail.verdict?.primary_root_cause?.title || "";
    const incTitle = detail.title || "";
    if (rootCauseTitle.includes("Joint 3") || incTitle.includes("Thermal") || incTitle.includes("Contradictory")) {
      setActiveFaultJoint("Joint_3");
    } else {
      setActiveFaultJoint(null);
    }
  };

  const handleHumanAction = async ({ action, engineer_id, notes }) => {
    if (!currentIncidentId) return;

    try {
      const data = await submitHumanApproval(currentIncidentId, { action, engineer_id, notes });
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
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Command Center Layout */}
      <main className="grow p-4 md:p-5 space-y-4 max-w-[1650px] w-full mx-auto">
        <IncidentSummary
          scenarioId={activeScenarioId}
          incidentId={currentIncidentId}
          status={status}
          verdict={verdict}
          isInvestigating={isInvestigating}
        />

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
          confidenceScore={verdict?.final_confidence_score ?? 0}
          recommendedMitigation={verdict?.recommended_mitigation}
          onAction={handleHumanAction}
          isProcessing={isInvestigating}
        />
      </main>

      {/* Slide-over Investigation History Drawer */}
      <IncidentHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectIncident={handleSelectIncident}
      />
    </div>
  );
}
