import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RobotViewer from './components/RobotViewer';
import ScenarioSelector from './components/ScenarioSelector';
import AgentDeliberationGraph from './components/AgentDeliberationGraph';
import MultimodalInspector from './components/MultimodalInspector';
import CriticDebateView from './components/CriticDebateView';
import HumanApprovalBar from './components/HumanApprovalBar';
import IncidentHistoryDrawer from './components/IncidentHistoryDrawer';
import { useInvestigationStream } from './hooks/useInvestigationStream';

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
  const isMountedRef = useRef(true);

  const {
    isStreaming,
    agentTraces: streamTraces,
    activeAgent: streamActiveAgent,
    finalVerdict: streamVerdict,
    error: streamError,
    startStream,
    abortStream
  } = useInvestigationStream();

  const finalVerdictRef = useRef(null);
  const streamErrorRef = useRef(null);
  const tracesRef = useRef([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortStream();
    };
  }, [abortStream]);

  useEffect(() => {
    finalVerdictRef.current = streamVerdict;
  }, [streamVerdict]);

  useEffect(() => {
    streamErrorRef.current = streamError;
  }, [streamError]);

  useEffect(() => {
    tracesRef.current = streamTraces;
  }, [streamTraces]);

  useEffect(() => {
    if (isStreaming) {
      if (streamTraces && streamTraces.length > 0) {
        setAgentTraces(streamTraces);
      }
      if (streamActiveAgent) {
        setActiveAgent(streamActiveAgent);
      }
      if (streamVerdict) {
        setVerdict(streamVerdict);
        setStatus(
          streamVerdict.status === "CONCLUSIVE"
            ? "PENDING_APPROVAL"
            : streamVerdict.status
        );
      }
    }
  }, [isStreaming, streamTraces, streamActiveAgent, streamVerdict]);

  // Load scenarios only once and auto-trigger Scenario 1
  useEffect(() => {
    if (autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;

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
    setStatus("INVESTIGATING");
    setAgentTraces([]);
    setActiveAgent("TRIAGE_AGENT");
    setVerdict(null);

    finalVerdictRef.current = null;
    streamErrorRef.current = null;
    tracesRef.current = [];

    if (scenarioId.includes("THERMAL") || scenarioId.includes("CONTRADICTORY")) {
      setActiveFaultJoint("Joint_3");
    } else {
      setActiveFaultJoint(null);
    }

    try {
      // Load scenario telemetry for the dashboard
      const presetRes = await fetch('/api/v1/scenarios');

      if (!presetRes.ok) {
        throw new Error("Could not load scenario presets");
      }

      const allPresets = await presetRes.json();
      const targetPreset = allPresets.find(
        s => s.scenario_id === scenarioId
      );

      if (!targetPreset) {
        throw new Error(`Scenario not found: ${scenarioId}`);
      }

      if (!isMountedRef.current) return;
      setTelemetry(targetPreset.snapshot);

      let sseSuccess = false;
      let incidentId = null;

      // Ingest incident to ensure DB persistence and valid incident_id for sign-offs
      try {
        const ingestRes = await fetch('/api/v1/incidents/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: targetPreset.title,
            severity: targetPreset.expected_outcome === "CONCLUSIVE" ? "CRITICAL" : "HIGH",
            snapshot: targetPreset.snapshot
          })
        });
        if (ingestRes.ok) {
          const ingestData = await ingestRes.json();
          incidentId = ingestData.incident_id;
          if (isMountedRef.current) {
            setCurrentIncidentId(incidentId);
          }
        }
      } catch (ingestErr) {
        console.warn("Pre-ingestion skipped or failed:", ingestErr);
      }

      // Attempt SSE stream investigation first
      try {
        await startStream(targetPreset.snapshot, incidentId);

        if (!streamErrorRef.current && (finalVerdictRef.current || tracesRef.current.length > 0)) {
          sseSuccess = true;
        }
      } catch (streamErr) {
        console.warn("SSE stream execution failed, falling back to /trigger:", streamErr);
        sseSuccess = false;
      }

      // Fall back to existing /trigger flow if SSE failed
      if (!sseSuccess) {
        console.log("Executing fallback to POST /api/v1/scenarios/.../trigger");
        const triggerRes = await fetch(
          `/api/v1/scenarios/${encodeURIComponent(scenarioId)}/trigger`,
          {
            method: 'POST'
          }
        );

        if (!triggerRes.ok) {
          const errorText = await triggerRes.text();
          throw new Error(
            `Scenario investigation failed: ${triggerRes.status} ${errorText}`
          );
        }

        const triggerData = await triggerRes.json();
        if (!isMountedRef.current) return;

        const fallbackIncidentId = triggerData.incident_id;
        const finalVerdict = triggerData.verdict;

        setCurrentIncidentId(fallbackIncidentId);
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
        const detailRes = await fetch(
          `/api/v1/incidents/${fallbackIncidentId}`
        );

        if (detailRes.ok) {
          const detail = await detailRes.json();

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

          if (isMountedRef.current) {
            setAgentTraces(normalizedTraces);
          }
        }
      } else {
        // SSE completed successfully
        if (isMountedRef.current) {
          const derivedIncidentId = incidentId || finalVerdictRef.current?.incident_id || tracesRef.current[0]?.payload?.incident_id || tracesRef.current[0]?.incident_id;
          if (derivedIncidentId) {
            setCurrentIncidentId(derivedIncidentId);
          }
          if (finalVerdictRef.current) {
            setVerdict(finalVerdictRef.current);
            setStatus(
              finalVerdictRef.current.status === "CONCLUSIVE"
                ? "PENDING_APPROVAL"
                : finalVerdictRef.current.status
            );
          }
        }
      }

    } catch (err) {
      if (isMountedRef.current) {
        console.error("Investigation execution failed:", err);
        setStatus("FAILED");
      }
    } finally {
      if (isMountedRef.current) {
        setIsInvestigating(false);
        setActiveAgent(null);
      }
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
        onOpenHistory={() => setIsHistoryOpen(true)}
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

      {/* Slide-over Investigation History Drawer */}
      <IncidentHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectIncident={handleSelectIncident}
      />
    </div>
  );
}
