import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RobotViewer from './components/RobotViewer';
import ScenarioSelector from './components/ScenarioSelector';
import AgentDeliberationGraph from './components/AgentDeliberationGraph';
import MultimodalInspector from './components/MultimodalInspector';
import CriticDebateView from './components/CriticDebateView';
import HumanApprovalBar from './components/HumanApprovalBar';
import IncidentHistoryDrawer from './components/IncidentHistoryDrawer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import {
  fetchScenarios,
  triggerScenarioInvestigation,
  streamScenarioInvestigation,
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
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const autoTriggeredRef = useRef(false);
  const currentAbortRef = useRef(null);

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
    // Abort any in-flight stream
    if (currentAbortRef.current) {
      currentAbortRef.current.abort();
    }
    const abortController = new AbortController();
    currentAbortRef.current = abortController;

    setActiveScenarioId(scenarioId);
    setIsInvestigating(true);
    setStatus("INVESTIGATING");
    setAgentTraces([]);
    setActiveAgent("TRIAGE_AGENT");
    setVerdict(null);
    setActiveFaultJoint(null);

    try {
      // Pre-populate telemetry from presets
      const allPresets = await fetchScenarios();
      const targetPreset = allPresets.find(s => s.scenario_id === scenarioId);
      if (targetPreset) {
        setTelemetry(targetPreset.snapshot);
      }

      // Stream the multi-agent investigation in real-time
      let streamedIncidentId = null;
      let finalVerdictReceived = null;

      try {
        await streamScenarioInvestigation(scenarioId, {
          signal: abortController.signal,
          onEvent: (event) => {
            if (event.incident_id) {
              streamedIncidentId = event.incident_id;
              setCurrentIncidentId(event.incident_id);
            }

            // Track active agent in pipeline
            if (event.agent) {
              if (event.step === "STARTED") {
                setActiveAgent(event.agent);
              }
            }

            // Progressively accumulate or update agent trace records
            if (event.agent) {
              setAgentTraces((prev) => {
                const existingIdx = prev.findIndex(t => t.agent === event.agent);
                const normalized = {
                  agent: event.agent,
                  step: event.step,
                  message: event.message,
                  payload: event.payload || event.verdict,
                  verdict: event.verdict || event.payload,
                  created_at: event.created_at || new Date().toISOString()
                };

                if (existingIdx >= 0) {
                  // Replace started placeholder with completed payload
                  if (event.step === "COMPLETED" || event.step === "FINAL_VERDICT") {
                    const nextTraces = [...prev];
                    nextTraces[existingIdx] = normalized;
                    return nextTraces;
                  }
                  return prev;
                }
                return [...prev, normalized];
              });
            }

            // Immediate 3D fault joint highlighting on Triage evaluation
            if (event.agent === "TRIAGE_AGENT" && event.step === "COMPLETED") {
              const payload = event.payload || {};
              const containment = (payload.immediate_containment_action || "").toLowerCase();
              const domain = (payload.incident_domain || "").toLowerCase();

              if (containment.includes("joint 3") || containment.includes("joint_3") || domain.includes("thermal") || scenarioId.includes("THERMAL")) {
                setActiveFaultJoint("Joint_3");
              } else if (containment.includes("joint 1") || containment.includes("joint_1")) {
                setActiveFaultJoint("Joint_1");
              } else if (containment.includes("joint 2") || containment.includes("joint_2")) {
                setActiveFaultJoint("Joint_2");
              } else if (containment.includes("joint 4") || containment.includes("joint_4")) {
                setActiveFaultJoint("Joint_4");
              } else if (containment.includes("joint 5") || containment.includes("joint_5")) {
                setActiveFaultJoint("Joint_5");
              } else if (containment.includes("joint 6") || containment.includes("joint_6")) {
                setActiveFaultJoint("Joint_6");
              }
            }

            // Final verdict arrived
            if (event.step === "FINAL_VERDICT" && event.verdict) {
              finalVerdictReceived = event.verdict;
              setVerdict(finalVerdictReceived);
              setStatus(
                finalVerdictReceived.status === "CONCLUSIVE"
                  ? "PENDING_APPROVAL"
                  : finalVerdictReceived.status
              );
              setActiveAgent(null);

              const comp = (finalVerdictReceived.primary_root_cause?.affected_component || "").toLowerCase();
              if (comp.includes("joint 3") || comp.includes("joint_3") || comp.includes("harmonic")) {
                setActiveFaultJoint("Joint_3");
              }
            }
          },
          onError: (err) => {
            console.warn("SSE stream error, falling back to sync endpoint:", err);
          },
          onComplete: () => {
            setIsInvestigating(false);
            setActiveAgent(null);
          }
        });
      } catch (streamErr) {
        if (streamErr.name === "AbortError") return;
        console.warn("Streaming threw error, falling back to sync:", streamErr);

        // Fallback to synchronous endpoint
        const triggerData = await triggerScenarioInvestigation(scenarioId);
        setCurrentIncidentId(triggerData.incident_id);
        setVerdict(triggerData.verdict);
        setStatus(
          triggerData.status ||
          (triggerData.verdict?.status === "CONCLUSIVE" ? "PENDING_APPROVAL" : triggerData.verdict?.status)
        );
        const detail = await fetchIncidentDetails(triggerData.incident_id);
        setAgentTraces(detail.agent_traces || []);
      }

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Investigation execution failed:", err);
        setStatus("FAILED");
      }
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
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
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
          isInvestigating={isInvestigating}
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

      {/* Slide-over Investigation History Drawer */}
      <IncidentHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectIncident={handleSelectIncident}
      />

      {/* Fleet Analytics & Metric Overview Modal */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
}
