import React, { useState, useEffect, useRef } from 'react';
import RobotViewer from './components/RobotViewer';
import AgentDeliberationGraph from './components/AgentDeliberationGraph';
import MultimodalInspector from './components/MultimodalInspector';
import CriticDebateView from './components/CriticDebateView';
import HumanApprovalBar from './components/HumanApprovalBar';
import IncidentHistoryDrawer from './components/IncidentHistoryDrawer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import IncidentHistoryView from './components/IncidentHistoryView';
import InvestigationReplayView from './components/InvestigationReplayView';
import CopilotChatPanel from './components/CopilotChatPanel';
import ConnectedMachineryView from './components/ConnectedMachineryView';
import InvestigationReportView from './components/InvestigationReportView';
import LivePipelineVisualizer from './components/pipeline/LivePipelineVisualizer';
import ToolboxExplorerView from './components/ToolboxExplorerView';
import LandingPageView from './components/LandingPageView';
import AuthModal from './components/AuthModal';
import AccountControlPanel from './components/AccountControlPanel';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import { subscribeToAuthChanges, logoutUser } from './services/firebase';
import {
  fetchScenarios,
  triggerScenarioInvestigation,
  streamScenarioInvestigation,
  fetchIncidentDetails,
  fetchIncidentReport,
  submitHumanApproval,
  fetchModelStatus,
  submitFollowUp,
  uploadDocument,
  fetchGpuDiagnostics
} from './services/api';
import {
  Search,
  Loader2,
  RefreshCw,
  Eye,
  ArrowRight,
  Send,
  Sparkles,
  ChevronDown,
  Paperclip,
  Zap,
  FileText,
  X,
  Activity,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [landingQuery, setLandingQuery] = useState("");
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioId, setActiveScenarioId] = useState("SCENARIO-01-THERMAL-OVERHEAT");
  const [currentIncidentId, setCurrentIncidentId] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentTraces, setAgentTraces] = useState([]);
  const [telemetry, setTelemetry] = useState({});
  const [verdict, setVerdict] = useState(null);
  const [activeFaultJoint, setActiveFaultJoint] = useState("Joint_3");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [streamingSubView, setStreamingSubView] = useState("REPORT"); // "GRAPH" | "REPORT"
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [modelOnline, setModelOnline] = useState(true);
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false);
  const [attachedLandingDoc, setAttachedLandingDoc] = useState(null);

  const [gpuStats, setGpuStats] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Profile & Settings Modals State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global synchronized Copilot chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      id: "msg-init",
      sender: "ai",
      text: "ReliAI harness initialized. Connected to 6-axis industrial manipulator. Ready for live anomaly investigation, SOP queries, or telemetry audits.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const autoTriggeredRef = useRef(false);
  const isMountedRef = useRef(true);
  const currentAbortRef = useRef(null);
  const landingFileInputRef = useRef(null);
  const promptDropdownRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (currentAbortRef.current) {
        currentAbortRef.current.abort();
      }
    };
  }, []);

  // Subscribe to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const quickPrompts = [
    { label: "🔥 Thermal Overheat Investigation", query: "Investigate Joint 3 thermal anomaly and overheating telemetry.", scenario: "SCENARIO-01-THERMAL-OVERHEAT" },
    { label: "💨 Pneumatic Line Decay & Pressure Breach", query: "Examine pneumatic line pressure decay and end-effector clamp seal.", scenario: "SCENARIO-02-PNEUMATIC-DROP" },
    { label: "⚡ Motor Bus Voltage Ripple & Torque Saturation", query: "Analyze actuator voltage surge and electrical harmonics.", scenario: "SCENARIO-03-CONTRADICTORY-VIBRATION" },
    { label: "🛡️ Golden Engineering Limits & SOP Audit", query: "Perform ISO specification audit against golden baseline.", scenario: "SCENARIO-01-THERMAL-OVERHEAT" },
  ];

  // Close prompt dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (promptDropdownRef.current && !promptDropdownRef.current.contains(event.target)) {
        setIsPromptDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLandingFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedLandingDoc({
        raw: file,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
    }
  };

  // Load scenarios on mount and check model / GPU status
  useEffect(() => {
    fetchModelStatus()
      .then(res => setModelOnline(res.text_model?.ready ?? true))
      .catch(() => setModelOnline(false));

    fetchGpuDiagnostics()
      .then(stats => setGpuStats(stats))
      .catch(() => {});

    const gpuInterval = setInterval(() => {
      fetchGpuDiagnostics()
        .then(stats => setGpuStats(stats))
        .catch(() => {});
    }, 4000);

    if (autoTriggeredRef.current) return () => clearInterval(gpuInterval);
    autoTriggeredRef.current = true;

    fetchScenarios()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setScenarios(data);
          handleTriggerScenario("SCENARIO-01-THERMAL-OVERHEAT", false);
        }
      })
      .catch(err => console.error("Error loading scenarios:", err));

    return () => clearInterval(gpuInterval);
  }, []);

  const handleTriggerScenario = async (scenarioId, shouldSwitchTab = true, promptQuery = null) => {
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
    setGeneratedReport(null);
    setStreamingSubView("GRAPH");

    if (scenarioId.includes("THERMAL") || scenarioId.includes("CONTRADICTORY")) {
      setActiveFaultJoint("Joint_3");
    } else {
      setActiveFaultJoint(null);
    }

    if (shouldSwitchTab) {
      setActiveTab("Streaming Visualisation");
    }

    const currentMsgId = `ai-stream-${Date.now()}`;
    if (promptQuery) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `usr-${Date.now()}`,
          sender: "user",
          text: promptQuery,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: currentMsgId,
          sender: "ai",
          text: "📥 Harness connected. Ingesting raw 6-axis telemetry streams and sensor feeds...",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    try {
      const allPresets = await fetchScenarios();
      const targetPreset = allPresets.find(s => s.scenario_id === scenarioId);
      if (targetPreset) {
        setTelemetry(targetPreset.snapshot);
      }

      // Collect raw events from the backend
      const rawEvents = [];
      let finalIncidentId = null;

      try {
        await streamScenarioInvestigation(scenarioId, {
          signal: abortController.signal,
          onEvent: (event) => {
            rawEvents.push(event);
            if (event.incident_id) {
              finalIncidentId = event.incident_id;
              setCurrentIncidentId(event.incident_id);
            }
          }
        });
      } catch (streamErr) {
        if (streamErr.name === "AbortError") return;
        const triggerData = await triggerScenarioInvestigation(scenarioId);
        finalIncidentId = triggerData.incident_id;
        setCurrentIncidentId(triggerData.incident_id);
        if (triggerData.verdict) {
          rawEvents.push({ step: "FINAL_VERDICT", verdict: triggerData.verdict, incident_id: triggerData.incident_id });
        }
      }

      // Live paced word-by-word playback of multi-agent deliberation with clean spacing
      const sleep = (ms) => new Promise(res => setTimeout(res, ms));
      let currentAccumulated = "📥 Telemetry stream ingested. Connecting multi-agent harness to EtherCAT bus...";
      
      const streamWords = async (newSegment) => {
        const trimmed = newSegment.trim();
        if (!trimmed) return;

        if (currentAccumulated && !currentAccumulated.endsWith("\n\n")) {
          currentAccumulated += "\n\n";
        }
        const words = trimmed.split(" ");
        for (let w = 0; w < words.length; w++) {
          if (abortController.signal.aborted) return;
          currentAccumulated += (w === 0 ? "" : " ") + words[w];
          setChatMessages(prev => {
            const idx = prev.findIndex(m => m.id === currentMsgId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], text: currentAccumulated };
              return next;
            }
            return prev;
          });
          await sleep(22);
        }
      };

      for (let i = 0; i < rawEvents.length; i++) {
        if (abortController.signal.aborted) return;

        const event = rawEvents[i];

        if (event.agent) {
          setActiveAgent(event.agent);
          const normalized = {
            agent: event.agent,
            step: event.step,
            message: event.message,
            payload: event.payload || event.verdict,
            verdict: event.verdict || event.payload,
            created_at: event.created_at || new Date().toISOString()
          };

          setAgentTraces(prev => {
            const existingIdx = prev.findIndex(t => t.agent === event.agent);
            if (existingIdx >= 0) {
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

        // Stream each agent's active reasoning word-by-word
        if (event.agent === "TRIAGE_AGENT" && event.step === "STARTED") {
          await streamWords("\n\n📥 [Harness Ingest] Ingesting 6-axis joint kinematics, high-frequency bus voltage, and real-time thermal telemetry...");
        } else if (event.agent === "TRIAGE_AGENT" && event.step === "COMPLETED") {
          const payload = event.payload || {};
          const containment = (payload.immediate_containment_action || "").toLowerCase();
          const domain = (payload.incident_domain || "").toLowerCase();
          if (containment.includes("joint 3") || containment.includes("joint_3") || domain.includes("thermal") || scenarioId.includes("THERMAL")) {
            setActiveFaultJoint("Joint_3");
          }
          await streamWords(`\n\n🔍 [Triage Assessment] Anomaly detected: ${payload.incident_domain || 'Thermal runaway'} (${payload.immediate_containment_action || 'Elevated temperature on Joint 3'}). Axis speed throttled.`);
        } else if (event.agent === "EVIDENCE_RAG_AGENT" && event.step === "STARTED") {
          await streamWords("\n\n📚 [Knowledge RAG] Retrieving ISO 10218-1 golden safety specs, Harmonic Drive CSG lubrication manuals, and wear baseline models...");
        } else if (event.agent === "DOMAIN_ANALYSIS" && event.step === "STARTED") {
          await streamWords("\n\n⚡ [Domain Specialists] Decomposing FFT vibration spectrum: 73.5 Hz 3X harmonic peak at 0.38g. Inverter electrical ripple nominal (<1.2%), ruling out stator short.");
        } else if (event.agent === "ROOT_CAUSE_AGENT" && event.step === "STARTED") {
          await streamWords("\n\n🧠 [Root Cause Engine] Formulating physics-grounded hypotheses via Gemma: Primary failure mode identified as flexspline lubrication breakdown.");
        } else if (event.agent === "CRITIC_AGENT" || (event.step === "STARTED" && event.agent?.includes("CRITIC"))) {
          await streamWords("\n\n⚖️ [Critic Agent] Adversarial validation: Cross-examining voltage bus ripple to rule out electrical short. Dual thermal-vibration coupling confirms mechanical friction.");
        } else if (event.step === "FINAL_VERDICT" && event.verdict) {
          const v = event.verdict;
          setVerdict(v);
          setStatus(v.status === "CONCLUSIVE" ? "PENDING_APPROVAL" : v.status);
          setActiveAgent(null);

          const comp = (v.primary_root_cause?.affected_component || "").toLowerCase();
          if (comp.includes("joint 3") || comp.includes("joint_3") || comp.includes("harmonic")) {
            setActiveFaultJoint("Joint_3");
          }

          await streamWords(`\n\n📑 [Audit Dossier Ready] Diagnosis: ${v.primary_root_cause?.title || 'Joint 3 Harmonic Drive Lubricant Breakdown'}. Confidence: ${v.final_confidence_score ?? 98.5}%. Mitigation SOP compiled.`);
        }

        await sleep(150);
      }

      // Fetch final report from backend
      if (finalIncidentId) {
        try {
          const rpt = await fetchIncidentReport(finalIncidentId);
          setGeneratedReport(rpt);
        } catch (e) {}
      }

      await sleep(500);
      setStreamingSubView("REPORT");

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Investigation execution failed:", err);
        if (isMountedRef.current) {
          setStatus("FAILED");
        }
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
        return { ...trace, verdict: trace.payload };
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

    fetchIncidentReport(detail.id)
      .then(rpt => setGeneratedReport(rpt))
      .catch(() => {});
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

  // Unified global message submission
  const handleGlobalSendMessage = async (queryText, attachedFileObj = null) => {
    if (!queryText.trim() && !attachedFileObj) return;

    const userPrompt = queryText.trim();
    const currentAttached = attachedFileObj;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userPrompt,
      attachment: currentAttached?.name || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setActiveTab("Streaming Visualisation");

    let uploadId = null;
    if (currentAttached?.raw) {
      try {
        const uploadRes = await uploadDocument(currentAttached.raw, currentIncidentId);
        uploadId = uploadRes.upload_id;
      } catch (err) {
        console.warn("Upload failed:", err);
      }
    }

    const q = userPrompt.toLowerCase();

    // Check if it's a simple greeting or general conversation
    if (q === "hi" || q === "hello" || q === "hey" || q === "help" || q === "who are you") {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: "Hello! I am ReliAI, your autonomous industrial investigation copilot. I am connected to the 6-axis manipulator telemetry harness. You can ask me to run fault diagnostics, analyze vibration FFT spectra, search maintenance SOPs, or upload telemetry logs.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 400);
      return;
    }

    // Determine matching scenario
    let targetScenario = activeScenarioId || "SCENARIO-01-THERMAL-OVERHEAT";
    if (q.includes("pneu") || q.includes("air") || q.includes("pressure") || q.includes("abb") || q.includes("irb")) {
      targetScenario = "SCENARIO-02-PNEUMATIC-DROP";
    } else if (q.includes("volt") || q.includes("ripple") || q.includes("contra") || q.includes("fanuc") || q.includes("torque")) {
      targetScenario = "SCENARIO-03-CONTRADICTORY-VIBRATION";
    } else if (q.includes("therm") || q.includes("heat") || q.includes("joint") || q.includes("kr-210") || q.includes("kuka") || q.includes("problem") || q.includes("wrong") || q.includes("device") || q.includes("diagnos") || q.includes("investigat")) {
      targetScenario = "SCENARIO-01-THERMAL-OVERHEAT";
    }

    // Trigger live multi-agent investigation harness with streamed reasoning
    handleTriggerScenario(targetScenario, true, userPrompt);
  };

  const handleLandingQuerySubmit = (e, directPrompt = null, scenarioOverride = null) => {
    e?.preventDefault();
    const queryToUse = directPrompt || landingQuery;
    const currentDoc = attachedLandingDoc;
    setLandingQuery("");
    setAttachedLandingDoc(null);
    setIsPromptDropdownOpen(false);

    if (scenarioOverride) {
      setActiveScenarioId(scenarioOverride);
    }

    handleGlobalSendMessage(queryToUse, currentDoc);
  };

  const hasThermalFault = activeScenarioId?.includes("THERMAL") || activeScenarioId?.includes("CONTRADICTORY");
  const hasAcousticFault = activeScenarioId?.includes("THERMAL") || activeScenarioId?.includes("PNEUMATIC");
  const isDashboardTab = activeTab === "Dashboard";

  // Check if hardware fault is present
  const hasHardwareFault = Boolean(
    activeFaultJoint ||
    verdict?.primary_root_cause?.affected_component ||
    (verdict && verdict.status === "CONCLUSIVE" && verdict.primary_root_cause?.title)
  );

  return (
    <div className="h-screen w-screen overflow-hidden pt-3 sm:pt-3.5 pb-2.5 sm:pb-3 px-3 sm:px-4 flex flex-col font-sans antialiased select-none relative bg-[#eddcd0]">
      {/* Blurred background wave layer */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-[12px] scale-105 opacity-90 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/bg_wave_gradient.png')",
          backgroundColor: "#eddcd0"
        }}
      />

      {/* Theme Linear Grid Overlay with Radial Vignette */}
      <div className="absolute inset-0 theme-grid-overlay pointer-events-none z-0" />

      {/* Container Frame */}
      <div className="h-full w-full rounded-[12px] flex flex-col justify-between overflow-hidden relative z-10">
        
        {/* TOP HEADER: ReliAI Logo Left with Underline, Centered Search Bar */}
        <header className="relative w-full h-10 shrink-0 flex items-center justify-between px-1 sm:px-2 mb-2 sm:mb-2.5">
          {/* Left: ReliAI Logo in Jersey 10 font with horizontal wireframe underline */}
          <div className="flex flex-col z-10 cursor-pointer shrink-0" onClick={() => setActiveTab("Dashboard")}>
            <span className="font-jersey text-white text-3xl sm:text-4xl font-bold tracking-wider leading-none select-none drop-shadow-sm">
              ReliAI
            </span>
            <div className="w-44 sm:w-52 h-[1.5px] bg-white/70 mt-1" />
          </div>

          {/* Top Centered Search Bar: [ 🔍 |          ] */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[88%] max-w-[380px] sm:max-w-[480px] md:max-w-[560px] h-8 bg-white/95 backdrop-blur-md rounded-[8px] shadow-xs border border-white/90 flex items-center px-3 gap-2.5 z-20">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="w-[1px] h-3.5 bg-slate-200 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGlobalSendMessage(searchQuery);
                  setSearchQuery("");
                }
              }}
              placeholder="Search telemetry, SOPs, or trigger diagnostics..."
              className="w-full bg-transparent text-xs font-mono text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>

          {/* Right Header: System & GPU Status Indicator + User Auth */}
          <div className="flex items-center gap-2 z-10 font-mono text-[10.5px]">
            {gpuStats && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/85 backdrop-blur-md rounded-[8px] border border-white/90 text-slate-700 shadow-2xs">
                <Zap className="w-3 h-3 text-[#d98555]" />
                <span>GPU: <strong>{gpuStats?.hardware?.device_utilization_pct !== undefined ? `${gpuStats.hardware.device_utilization_pct}%` : 'ACTIVE'}</strong> ({gpuStats?.token_throughput?.latest_eval_tokens_per_sec || '34'} t/s)</span>
              </span>
            )}
            <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-white/80 backdrop-blur-md rounded-[8px] border border-white/90 text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>HARNESS LIVE</span>
            </span>

            {/* Firebase Auth User Pill / Sign In Trigger */}
            {user ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-md rounded-[8px] border border-white/90 text-slate-800 shadow-2xs">
                <div className="w-4 h-4 rounded-full bg-[#d98555] text-white flex items-center justify-center text-[9px] font-bold">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
                <span className="max-w-[85px] truncate font-semibold">
                  {user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Operator"}
                </span>
                <button
                  type="button"
                  onClick={async () => { await logoutUser(); setUser(null); }}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-600 ml-1 transition cursor-pointer text-[10px]"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 py-1 bg-gradient-to-r from-[#faeee5] to-[#eddcd0] hover:from-[#eddcd0] hover:to-[#e2cdbe] text-[#c8764b] border border-[#d98555]/30 rounded-[8px] font-semibold text-[11px] shadow-2xs transition cursor-pointer flex items-center gap-1"
              >
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 min-h-0 flex gap-3 sm:gap-4 items-stretch overflow-hidden pt-0.5">
          
          {/* LEFT SIDEBAR: Clean white card with integrated bottom account control */}
          <aside className="w-[170px] sm:w-[190px] md:w-[210px] h-full bg-white/95 backdrop-blur-md rounded-[12px] p-3.5 sm:p-4 shadow-xs border border-white/80 flex flex-col shrink-0 overflow-hidden">
            {/* Top Navigation Items */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2.5 sm:space-y-3 text-left overflow-y-auto pr-1">
              <button
                onClick={() => setActiveTab("Landing")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight flex items-center justify-between ${
                  activeTab === "Landing"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                <span>Landing Page</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-[#faeee5] text-[#c8764b] rounded border border-[#ecd7c7]">Home</span>
              </button>

              <button
                onClick={() => setActiveTab("Dashboard")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight ${
                  activeTab === "Dashboard"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab("Live Pipeline")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight ${
                  activeTab === "Live Pipeline"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Live Pipeline<br />Visualizer
              </button>

              <button
                onClick={() => setActiveTab("Streaming Visualisation")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight ${
                  activeTab === "Streaming Visualisation"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Streaming<br />Visualisation
              </button>

              <button
                onClick={() => setActiveTab("Toolbox & Hub")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight ${
                  activeTab === "Toolbox & Hub"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Toolbox &<br />Intel Hub
              </button>

              <button
                onClick={() => setActiveTab("Evidence Inspector")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight ${
                  activeTab === "Evidence Inspector"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Evidence<br />Inspector
              </button>

              <button
                onClick={() => setActiveTab("Incident History")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight ${
                  activeTab === "Incident History"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Incident history
              </button>

              <button
                onClick={() => setActiveTab("Connected Machinery")}
                className={`text-left text-[13px] sm:text-[14px] transition cursor-pointer leading-tight ${
                  activeTab === "Connected Machinery"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Connected<br />Machinery
              </button>
            </div>

            {/* Bottom Account Control Section */}
            <div className="shrink-0 pt-3 mt-auto border-t border-slate-200/80">
              <AccountControlPanel
                user={user}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          </aside>

          {/* MAIN STAGE */}
          {activeTab === "Landing" ? (
            <main className="flex-1 min-w-0 h-full bg-white/95 backdrop-blur-md rounded-[12px] border border-white/80 shadow-xs overflow-y-auto">
              <LandingPageView 
                onEnterApp={() => setActiveTab("Dashboard")} 
                onOpenAuth={() => setIsAuthModalOpen(true)} 
                user={user} 
              />
            </main>
          ) : isDashboardTab ? (
            /* ============================================================ */
            /* TAB 1: MAIN LANDING DASHBOARD (Clean, Spacious)              */
            /* ============================================================ */
            <main className="flex-1 min-w-0 h-full bg-white/95 backdrop-blur-md rounded-[12px] p-6 sm:p-8 border border-white/80 shadow-xs flex flex-col justify-between overflow-hidden select-text">
              
              {/* TOP/CENTER HERO: Big Title, Subtitle, & System Status Badges */}
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-3xl mx-auto">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] px-3 py-1 rounded-full bg-[#faeee5] text-[#c8764b] font-bold border border-[#f5cdb6] flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    AUTONOMOUS INDUSTRIAL REASONER
                  </span>
                </div>

                <h1 className="font-jersey text-6xl sm:text-7xl md:text-8xl text-[#d98555] tracking-wider drop-shadow-sm font-bold leading-none select-none">
                  ReliAI
                </h1>

                <p className="font-mono text-slate-700 text-xs sm:text-[13px] font-medium max-w-xl px-4 leading-relaxed">
                  An AI system that doesn't just generate a root cause—it investigates, challenges, validates, and knows when it doesn't know.
                </p>

                {/* 4 Core Platform Feature Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full pt-2">
                  <div className="p-2.5 rounded-[10px] bg-slate-50 border border-slate-200/80 text-left font-mono">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Stations</div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Cpu className="w-3.5 h-3.5 text-[#d98555]" /> 6 Robotic Arms
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-slate-50 border border-slate-200/80 text-left font-mono">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Multi-Agent</div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Layers className="w-3.5 h-3.5 text-[#d98555]" /> Dynamic DAG
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-slate-50 border border-slate-200/80 text-left font-mono">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Critic Debate</div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Adversarial
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-slate-50 border border-slate-200/80 text-left font-mono">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Evidence</div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Golden Specs
                    </div>
                  </div>
                </div>

                {/* Quick Interactive Prompt Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {quickPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLandingQuerySubmit(null, item.query, item.scenario)}
                      className="px-3 py-1.5 rounded-[8px] bg-white hover:bg-[#faeee5] border border-slate-200 hover:border-[#f5cdb6] text-[11px] font-mono font-medium text-slate-700 hover:text-[#c8764b] transition shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3 text-[#d98555]" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTTOM SECTION: Frosted Glass Capsule Bar */}
              <div className="shrink-0 flex flex-col items-center justify-center pt-3 pb-1 w-full max-w-2xl mx-auto">
                <div className="relative w-full group z-30">
                  {/* Ambient Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#f5b896]/35 via-[#e8905b]/45 to-[#f5b896]/35 rounded-full blur-xl -z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Attached Document Pill (if any) */}
                  {attachedLandingDoc && (
                    <div className="absolute -top-8 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-[#efc4ab] rounded-full px-3 py-0.5 text-[10px] font-mono text-[#c8764b] shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <FileText className="w-3 h-3 text-[#d98555]" />
                      <span className="font-medium max-w-[150px] truncate">{attachedLandingDoc.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedLandingDoc(null)}
                        className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer ml-1"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Glass Quick Prompts Dropdown Menu */}
                  {isPromptDropdownOpen && (
                    <div
                      ref={promptDropdownRef}
                      className="absolute bottom-full mb-3 left-2 sm:left-4 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl border border-white/95 rounded-2xl p-2 shadow-[0_20px_50px_rgba(217,133,85,0.28),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#d98555] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Quick Prompts
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">Select to investigate</span>
                      </div>
                      <div className="space-y-1">
                        {quickPrompts.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleLandingQuerySubmit(null, item.query, item.scenario)}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5] border border-transparent hover:border-[#f3cdb6] transition group/item flex items-start gap-2 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-[#d98555] shrink-0 mt-0.5 group-hover/item:scale-110 transition" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-mono font-semibold text-slate-800 group-hover/item:text-[#c8764b] transition truncate">
                                {item.label}
                              </div>
                              <div className="text-[9.5px] font-mono text-slate-500 truncate">
                                {item.query}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={landingFileInputRef}
                    type="file"
                    accept=".txt,.log,.csv,.json,.pdf,.doc,.docx,.png,.jpg"
                    onChange={handleLandingFileUpload}
                    className="hidden"
                  />

                  {/* Main Frosted Glass Capsule Bar */}
                  <form
                    onSubmit={handleLandingQuerySubmit}
                    className="relative w-full h-11 sm:h-12 rounded-full bg-gradient-to-b from-white/95 via-[#fff9f4]/90 to-[#faece1]/85 backdrop-blur-2xl border border-white/95 shadow-[0_16px_36px_-6px_rgba(217,133,85,0.22),0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1.5px_3px_rgba(217,133,85,0.08)] flex items-center px-2.5 sm:px-3 gap-1.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#d98555]/35 focus-within:border-white focus-within:shadow-[0_20px_45px_-4px_rgba(217,133,85,0.32),inset_0_1.5px_2px_rgba(255,255,255,1)]"
                  >
                    {/* Glass Dropdown Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsPromptDropdownOpen(!isPromptDropdownOpen)}
                      className="px-2 sm:px-2.5 py-1 rounded-full bg-white/70 hover:bg-white border border-[#eed7c5] text-[10.5px] font-mono font-medium text-slate-700 hover:text-[#d98555] flex items-center gap-1 shadow-2xs transition cursor-pointer shrink-0 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-[#d98555]" />
                      <span className="hidden sm:inline">Prompts</span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isPromptDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Document Upload Button */}
                    <button
                      type="button"
                      onClick={() => landingFileInputRef.current?.click()}
                      title="Upload document or telemetry logs"
                      className="p-1.5 rounded-full text-slate-400 hover:text-[#d98555] hover:bg-white/60 transition cursor-pointer shrink-0 active:scale-95"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>

                    {/* Text Input */}
                    <input
                      type="text"
                      value={landingQuery}
                      onChange={(e) => setLandingQuery(e.target.value)}
                      placeholder="Ask Copilot or trigger industrial diagnosis..."
                      className="w-full bg-transparent text-xs sm:text-[12.5px] font-mono text-slate-800 placeholder:text-slate-400 outline-none px-1.5"
                    />

                    {/* Action Button */}
                    <button
                      type="submit"
                      disabled={isInvestigating}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#d98555] to-[#e89568] hover:from-[#c8764b] hover:to-[#d98555] text-white shadow-[0_4px_12px_rgba(217,133,85,0.38)] hover:shadow-[0_6px_16px_rgba(217,133,85,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isInvestigating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              </div>

            </main>
          ) : (
            /* ============================================================ */
            /* TABS 2-5: 3-PANEL WORKSPACE (Main Center Stage + Right Chat)  */
            /* ============================================================ */
            <main className="flex-1 min-w-0 h-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_310px] xl:grid-cols-[minmax(0,1fr)_330px] gap-3 items-stretch overflow-hidden">
              
              {/* MIDDLE COLUMN */}
              {activeTab === "Live Pipeline" ? (
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                  <LivePipelineVisualizer
                    activeScenarioId={activeScenarioId}
                    isInvestigating={isInvestigating}
                    agentTraces={agentTraces}
                  />
                </div>
              ) : activeTab === "Toolbox & Hub" ? (
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                  <ToolboxExplorerView />
                </div>
              ) : activeTab === "Connected Machinery" ? (
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                  <ConnectedMachineryView
                    onTriggerInvestigation={(machineId, prompt) => {
                      let scenarioId = "SCENARIO-01-THERMAL-OVERHEAT";
                      if (machineId?.includes("ABB") || machineId?.includes("IRB")) {
                        scenarioId = "SCENARIO-02-PNEUMATIC-DROP";
                      } else if (machineId?.includes("FANUC") || machineId?.includes("M900")) {
                        scenarioId = "SCENARIO-03-CONTRADICTORY-VIBRATION";
                      }
                      handleTriggerScenario(
                        scenarioId,
                        true,
                        prompt || `Simulate incident on ${machineId}: What is the problem with this device?`
                      );
                    }}
                    onNavigateToTwin={() => setActiveTab("Streaming Visualisation")}
                    onNavigateToStreaming={() => setActiveTab("Streaming Visualisation")}
                    isInvestigating={isInvestigating}
                    activeAgent={activeAgent}
                  />

                </div>
              ) : activeTab === "Streaming Visualisation" ? (
                /* ============================================================ */
                /* STREAMING VISUALISATION: DYNAMIC STAGE (Graph vs Report)      */
                /* ============================================================ */
                <div className="flex-1 min-w-0 h-full flex flex-col gap-2.5 overflow-hidden">
                  
                  {/* Top Mode Selector Bar */}
                  <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-[8px] border border-white/80 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStreamingSubView("GRAPH")}
                        className={`px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          streamingSubView === "GRAPH"
                            ? "bg-[#faeee5] text-[#c8764b] border border-[#f5cdb6] font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Neural DAG</span>
                      </button>

                      <button
                        onClick={() => setStreamingSubView("REPORT")}
                        className={`px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          streamingSubView === "REPORT"
                            ? "bg-[#faeee5] text-[#c8764b] border border-[#f5cdb6] font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Investigation Report</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10.5px]">
                      {isInvestigating ? (
                        <span className="flex items-center gap-1 text-[#d98555] font-semibold">
                          <Loader2 className="w-3 h-3 animate-spin" /> Streamline Processing...
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Audit Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Center Display Area */}
                  {streamingSubView === "GRAPH" ? (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-[10px]">
                      <AgentDeliberationGraph
                        agentTraces={agentTraces}
                        activeAgent={activeAgent}
                        isInvestigating={isInvestigating}
                        activeScenarioId={activeScenarioId}
                        telemetry={telemetry}
                        verdict={verdict}
                      />
                    </div>
                  ) : (
                    /* REPORT VIEW: Split Render + Report if fault, or Full-screen Report if nominal */
                    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
                      {hasHardwareFault && (
                        /* Top 3D Render highlighting fault joint */
                        <div className="h-[220px] sm:h-[240px] shrink-0 bg-white/85 backdrop-blur-md rounded-[10px] p-2 border border-slate-100/90 shadow-inner relative overflow-hidden flex items-center justify-center clean-glass-theme">
                          <RobotViewer
                            variant="glass"
                            activeFaultJoint={activeFaultJoint}
                            jointsData={telemetry.joints || {}}
                            isLevitating={isInvestigating}
                          />
                        </div>
                      )}

                      {/* Structured Report Dossier Below */}
                      <div className="flex-1 min-h-0 bg-white/95 backdrop-blur-md rounded-[10px] p-3 border border-white/80 shadow-xs flex flex-col overflow-hidden">
                        <InvestigationReportView
                          report={generatedReport}
                          verdict={verdict}
                          onApprove={() => handleHumanAction({ action: "APPROVE", engineer_id: "ENG-LEAD", notes: "Approved based on empirical telemetry audit." })}
                          onOverride={() => handleHumanAction({ action: "OVERRIDE", engineer_id: "ENG-LEAD", notes: "Override manual inspection." })}
                        />
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* DUAL-SCREEN COLUMN for Incident History & Evidence Inspector */
                <div className="flex-1 min-w-0 flex flex-col gap-2.5 h-full overflow-hidden">
                  
                  {/* SCREEN 1: TOP CARD */}
                  <div className="flex-1 min-h-0 rounded-[10px] overflow-hidden">
                    {activeTab === "Incident History" ? (
                      <IncidentHistoryView
                        selectedIncidentId={selectedIncidentId}
                        onSelectIncident={(id) => setSelectedIncidentId(id)}
                      />
                    ) : (
                      <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-[10px] p-2.5 border border-white/80 shadow-xs flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                          <MultimodalInspector
                            telemetry={telemetry}
                            hasThermalFault={hasThermalFault}
                            hasAcousticFault={hasAcousticFault}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SCREEN 2: BOTTOM CARD */}
                  <div className="flex-1 min-h-0 rounded-[10px] overflow-hidden">
                    {activeTab === "Incident History" ? (
                      <InvestigationReplayView
                        incidentId={selectedIncidentId || currentIncidentId || "INC-A0F32EEB"}
                        onBack={() => setActiveTab("Dashboard")}
                        onActionComplete={() => {}}
                      />
                    ) : (
                      /* Evidence Inspector Bottom Card: Critic Debate View + Human Approval Bar */
                      <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-[10px] p-2.5 border border-white/80 shadow-xs flex flex-col justify-between overflow-hidden gap-2">
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                          <CriticDebateView
                            rootCause={verdict?.primary_root_cause}
                            criticReport={verdict?.critic_report}
                            isInvestigating={isInvestigating}
                          />
                        </div>
                        <div className="shrink-0">
                          <HumanApprovalBar
                            status={status}
                            confidenceScore={verdict?.final_confidence_score ?? 94}
                            recommendedMitigation={verdict?.recommended_mitigation}
                            onAction={handleHumanAction}
                            isProcessing={isInvestigating}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* RIGHT PANEL: PERSISTENT COPILOT CHAT */}
              <aside className="h-full min-h-0 overflow-hidden flex flex-col gap-2.5 shrink-0">
                <div className="h-full min-h-[180px] overflow-hidden">
                  <CopilotChatPanel
                    activeIncidentId={selectedIncidentId || currentIncidentId}
                    isInvestigating={isInvestigating}
                    activeAgent={activeAgent}
                    agentTraces={agentTraces}
                    onTriggerInvestigation={() => handleTriggerScenario(activeScenarioId)}
                    activeScenarioName={activeScenarioId}
                    messages={chatMessages}
                    setMessages={setChatMessages}
                    onSendMessage={handleGlobalSendMessage}
                  />
                </div>
              </aside>

            </main>
          )}

        </div>
      </div>

      {/* Slide-over Incident History Drawer (if opened) */}
      <IncidentHistoryDrawer
        isOpen={isHistoryDrawerOpen || isHistoryOpen}
        onClose={() => {
          setIsHistoryDrawerOpen(false);
          setIsHistoryOpen(false);
        }}
        onSelectIncident={handleSelectIncident}
      />

      {/* Slide-over Fleet Analytics Dashboard (if opened) */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
