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
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import AccountControlPanel from './components/AccountControlPanel';
import SettingsPage from './components/SettingsPage';
import { MACHINERY_PROJECTS } from './data/machineryProjects';
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
  FileCheck2,
  ExternalLink,
  Bot,
  Bell,
  SlidersHorizontal,
  Download,
  BarChart3,
  History,
  Filter,
  ArrowUpDown,
  BookOpen,
  Radio,
  User,
  Settings
} from 'lucide-react';

const SEARCH_DATABASE = [
  // Machinery Projects
  {
    id: "proj-kr210",
    title: "KUKA KR-210 R2700",
    category: "MACHINERY",
    categoryLabel: "Robot Cell",
    subtitle: "Cell 04 • Heavy Handling • HARNESS-A4",
    description: "6-Axis Heavy Articulated. Joint 3 Harmonic Drive Lubricant Breakdown & 88.5°C Overheat.",
    severity: "CRITICAL",
    severityColor: "bg-rose-50 text-rose-700 border-rose-200",
    projectId: "KR-210-R2700",
    tab: "Streaming Visualisation"
  },
  {
    id: "proj-fanuc-m900",
    title: "FANUC M-900iB/700 Ultra",
    category: "MACHINERY",
    categoryLabel: "Robot Cell",
    subtitle: "Cell 02 • High-Precision Spot Welding • HARNESS-D2",
    description: "Heavy Spot Welding. Thermocouple Signal Lead Ground Short (False 92°C Overheat).",
    severity: "ALERT",
    severityColor: "bg-amber-50 text-amber-700 border-amber-300",
    projectId: "FANUC-M900iB",
    tab: "Evidence Inspector"
  },
  {
    id: "proj-abb-irb6700",
    title: "ABB IRB 6700 PowerSpot",
    category: "MACHINERY",
    categoryLabel: "Robot Cell",
    subtitle: "Cell 01 • Press Shop & Material Transfer • HARNESS-C1",
    description: "Press Automation. End-Effector Pneumatic Pressure Drop (3.1 bar Low Sag).",
    severity: "WARNING",
    severityColor: "bg-amber-50 text-amber-600 border-amber-200",
    projectId: "ABB-IRB-6700",
    tab: "Connected Machinery"
  },
  {
    id: "proj-kuka-quantum",
    title: "KUKA KR-QUANTUM 300",
    category: "MACHINERY",
    categoryLabel: "Robot Cell",
    subtitle: "Cell 05 • Precision Machining & Milling • HARNESS-B3",
    description: "High-Payload Milling. Stator High-Frequency Inverter Harmonics & Axis 2 Backlash.",
    severity: "WARNING",
    severityColor: "bg-amber-50 text-amber-600 border-amber-200",
    projectId: "KUKA-QUANTUM-300",
    tab: "Streaming Visualisation"
  },
  {
    id: "proj-michelin-conveyor",
    title: "Michelin Tire Conveyor Line 3",
    category: "MACHINERY",
    categoryLabel: "Conveyor Line",
    subtitle: "Station 06 • Tire Transfer & Bead Lube • HARNESS-E5",
    description: "Automated Belt Line. Drive Motor Belt Micro-Slippage & Lube Pressure Sag.",
    severity: "WARNING",
    severityColor: "bg-amber-50 text-amber-600 border-amber-200",
    projectId: "CONVEYOR-LINE-3",
    tab: "Evidence Inspector"
  },

  // SOPs & Engineering Standards
  {
    id: "sop-iso10218",
    title: "ISO 10218-1 Industrial Robot Operating Limits",
    category: "SOPS",
    categoryLabel: "Engineering SOP",
    subtitle: "Standard Specification • Golden Bounds",
    description: "Defines maximum continuous operating joint temperature (<55°C) and torque limits.",
    severity: "INFO",
    severityColor: "bg-blue-50 text-blue-700 border-blue-200",
    actionQuery: "Audit ISO 10218-1 compliance for active robot cell",
    tab: "Toolbox & Hub"
  },
  {
    id: "sop-csg-lube",
    title: "CSG-25-100 Harmonic Drive Lubrication Protocol",
    category: "SOPS",
    categoryLabel: "Maintenance SOP",
    subtitle: "Mobilgrease 28 • Elastohydrodynamic Film Specs",
    description: "Purge and grease replenishment procedures for Harmonic Drive flexspline gear teeth.",
    severity: "INFO",
    severityColor: "bg-blue-50 text-blue-700 border-blue-200",
    actionQuery: "Retrieve CSG-25-100 lubrication maintenance procedure",
    tab: "Toolbox & Hub"
  },
  {
    id: "sop-pneu-manifold",
    title: "SOP-PNEU-702 Pneumatic Manifold & Vacuum Gripper",
    category: "SOPS",
    categoryLabel: "Maintenance SOP",
    subtitle: "Air Supply 6.0 Bar • Valve & Seal Leak Audit",
    description: "Troubleshooting vacuum seal wear, pneumatic line pressure drops, and regulator leaks.",
    severity: "INFO",
    severityColor: "bg-blue-50 text-blue-700 border-blue-200",
    actionQuery: "Check SOP-PNEU-702 pneumatic seal inspection steps",
    tab: "Toolbox & Hub"
  },
  {
    id: "sop-thermocouple",
    title: "SOP-THERM-401 K-Type Thermocouple Calibration",
    category: "SOPS",
    categoryLabel: "Diagnostics SOP",
    subtitle: "Cable Carrier Flex Fatigue • Ground Short Isolation",
    description: "Procedure for isolating intermittent ground shorts vs actual stator heating.",
    severity: "INFO",
    severityColor: "bg-blue-50 text-blue-700 border-blue-200",
    actionQuery: "Inspect thermocouple harness ground short per SOP-THERM-401",
    tab: "Evidence Inspector"
  },

  // Telemetry Signals & Alarms
  {
    id: "telem-therm-j3",
    title: "Joint 3 Thermal Infrared Hotspot Telemetry",
    category: "TELEMETRY",
    categoryLabel: "Live Telemetry Bus",
    subtitle: "88.5°C Breach • Optris Xi-400 Radiometric Stream",
    description: "Live infrared thermography sensor reading on elbow articulation axis.",
    severity: "CRITICAL",
    severityColor: "bg-rose-50 text-rose-700 border-rose-200",
    actionQuery: "Inspect Joint 3 thermal infrared telemetry and delta",
    tab: "Evidence Inspector"
  },
  {
    id: "telem-fft-vibe",
    title: "Acoustic FFT Vibration Harmonic (73.5 Hz 3X)",
    category: "TELEMETRY",
    categoryLabel: "Sensor Bus",
    subtitle: "0.38g Peak • PCB Piezotronics Accelerometer",
    description: "Contact microphone frequency spectrum indicating metal-on-metal micro-friction.",
    severity: "ALERT",
    severityColor: "bg-amber-50 text-amber-700 border-amber-300",
    actionQuery: "Analyze 73.5 Hz 3X FFT acoustic vibration peak",
    tab: "Evidence Inspector"
  },
  {
    id: "telem-air-pressure",
    title: "End-Effector Pneumatic Pressure Bus (3.1 bar)",
    category: "TELEMETRY",
    categoryLabel: "Pneumatic Sensor",
    subtitle: "Air Supply Sag • Nominal: 6.0 bar",
    description: "Real-time pneumatic line pressure reading from Festo pressure transmitter.",
    severity: "WARNING",
    severityColor: "bg-amber-50 text-amber-600 border-amber-200",
    actionQuery: "Check pneumatic pressure telemetry drop to 3.1 bar",
    tab: "Evidence Inspector"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [landingQuery, setLandingQuery] = useState("");
  const [scenarios, setScenarios] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("KR-210-R2700");
  const activeProject = MACHINERY_PROJECTS.find(p => p.id === selectedProjectId) || MACHINERY_PROJECTS[0];

  const [activeScenarioId, setActiveScenarioId] = useState(MACHINERY_PROJECTS[0].scenarioId);
  const [currentIncidentId, setCurrentIncidentId] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentTraces, setAgentTraces] = useState([]);
  const [telemetry, setTelemetry] = useState(MACHINERY_PROJECTS[0].snapshot || {});
  const [verdict, setVerdict] = useState({
    status: MACHINERY_PROJECTS[0].verifiedReport.investigation_results.status,
    final_confidence_score: MACHINERY_PROJECTS[0].verifiedReport.investigation_results.final_confidence_score,
    primary_root_cause: MACHINERY_PROJECTS[0].verifiedReport.root_cause,
    critic_report: MACHINERY_PROJECTS[0].verifiedReport.critic_findings
  });
  const [activeFaultJoint, setActiveFaultJoint] = useState(MACHINERY_PROJECTS[0].faultJoint);
  const [generatedReport, setGeneratedReport] = useState(MACHINERY_PROJECTS[0].verifiedReport);
  const [streamingSubView, setStreamingSubView] = useState("REPORT"); // "GRAPH" | "REPORT"

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    const proj = MACHINERY_PROJECTS.find(p => p.id === projectId);
    if (!proj) return;
    setActiveScenarioId(proj.scenarioId);
    setActiveFaultJoint(proj.faultJoint);
    if (proj.snapshot) {
      setTelemetry(proj.snapshot);
    }
    if (proj.verifiedReport) {
      setGeneratedReport(proj.verifiedReport);
      setVerdict({
        status: proj.verifiedReport.investigation_results.status,
        final_confidence_score: proj.verifiedReport.investigation_results.final_confidence_score,
        primary_root_cause: proj.verifiedReport.root_cause,
        critic_report: proj.verifiedReport.critic_findings
      });
    }
  };
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [modelOnline, setModelOnline] = useState(true);
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false);
  const [attachedLandingDoc, setAttachedLandingDoc] = useState(null);

  // Top Bar Notifications & Options States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const moreOptionsRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "FANUC M-900iB: Anomaly Contradiction Flagged",
      message: "Thermocouple spiked to 92°C with 0ms ramp. Critic vetoed false thermal shutdown.",
      timestamp: "2m ago",
      type: "ALERT",
      unread: true,
      projectId: "FANUC-M900iB"
    },
    {
      id: "notif-2",
      title: "KUKA KR-210 R2700: 73.5 Hz Vibration Resonance",
      message: "Operating temperature reached 88.5°C with 3X harmonic vibration. Lubricant shear breakdown.",
      timestamp: "14m ago",
      type: "CRITICAL",
      unread: true,
      projectId: "KR-210-R2700"
    },
    {
      id: "notif-3",
      title: "ABB IRB 6700: Pneumatic Line Pressure Sag",
      message: "Pneumatic bus pressure dropped to 3.1 bar (nominal 6.0 bar). End-effector clamp seal wear.",
      timestamp: "32m ago",
      type: "WARNING",
      unread: false,
      projectId: "ABB-IRB-6700"
    },
    {
      id: "notif-4",
      title: "Autonomous Critic Audit Passed",
      message: "Plant-wide golden engineering bounds verified for Station 01-06 under ISO-10218-1.",
      timestamp: "1h ago",
      type: "SUCCESS",
      unread: false
    }
  ]);

  const [gpuStats, setGpuStats] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // 'landing' | 'auth' | 'app'
  const [appView, setAppView] = useState('landing');

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
  const currentAbortRef = useRef(null);
  const landingFileInputRef = useRef(null);
  const promptDropdownRef = useRef(null);

  // Search Bar Dropdown & Sorting States
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("ALL"); // "ALL" | "MACHINERY" | "SOPS" | "TELEMETRY"
  const [searchSortBy, setSearchSortBy] = useState("RELEVANCE"); // "RELEVANCE" | "SEVERITY" | "ALPHABETICAL"
  const searchContainerRef = useRef(null);

  // Filtered & Sorted Search Results
  const filteredSearchResults = SEARCH_DATABASE.filter(item => {
    if (searchCategory !== "ALL" && item.category !== searchCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (searchSortBy === "SEVERITY") {
      const rank = { CRITICAL: 4, ALERT: 3, WARNING: 2, INFO: 1 };
      return (rank[b.severity] || 0) - (rank[a.severity] || 0);
    }
    if (searchSortBy === "ALPHABETICAL") {
      return a.title.localeCompare(b.title);
    }
    // Default RELEVANCE
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const aTitle = a.title.toLowerCase().includes(q);
      const bTitle = b.title.toLowerCase().includes(q);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
    }
    return 0;
  });

  const handleSelectSearchResult = (item) => {
    if (item.projectId) {
      handleSelectProject(item.projectId);
    }
    if (item.tab) {
      setActiveTab(item.tab);
    }
    if (item.actionQuery) {
      handleGlobalSendMessage(item.actionQuery);
    }
    setSearchQuery("");
    setIsSearchDropdownOpen(false);
  };

  // Close notifications, more options, and search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(e.target)) {
        setIsMoreOptionsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportTelemetry = () => {
    const exportData = {
      project: activeProject,
      telemetry,
      verdict,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ReliAI_${activeProject.id}_Telemetry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsMoreOptionsOpen(false);
  };

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

    const targetProj = MACHINERY_PROJECTS.find(p => p.scenarioId === scenarioId) || activeProject;

    setActiveScenarioId(scenarioId);
    setIsInvestigating(true);
    setStatus("INVESTIGATING");
    setAgentTraces([]);
    setActiveAgent("TRIAGE_AGENT");
    setVerdict(null);
    setActiveFaultJoint(null);
    setGeneratedReport(null);
    setStreamingSubView("GRAPH");

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
      // Collect raw events from the backend or prebuilt demo orchestration engine
      const rawEvents = [];
      let finalIncidentId = null;

      try {
        const streamPromise = streamScenarioInvestigation(scenarioId, {
          signal: abortController.signal,
          onEvent: (event) => {
            rawEvents.push(event);
            if (event.incident_id) {
              finalIncidentId = event.incident_id;
              setCurrentIncidentId(event.incident_id);
            }
          }
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500));
        await Promise.race([streamPromise, timeoutPromise]);
      } catch (streamErr) {
        if (streamErr.name === "AbortError") return;
        try {
          const triggerData = await triggerScenarioInvestigation(scenarioId);
          finalIncidentId = triggerData.incident_id;
          setCurrentIncidentId(triggerData.incident_id);
          if (triggerData.verdict) {
            rawEvents.push({ step: "FINAL_VERDICT", verdict: triggerData.verdict, incident_id: triggerData.incident_id });
          }
        } catch (e) {
          // Backend offline or timeout -> use high-fidelity demo orchestration below
        }
      }

      // Prebuilt Multi-Agent Demo Deliberation Engine (Guarantees immediate rich report for ANY selected robot)
      if (rawEvents.length === 0) {
        const vReport = targetProj.verifiedReport;
        finalIncidentId = vReport?.incident_summary?.incident_id || `INC-${targetProj.id}-${Date.now().toString().slice(-4)}`;
        setCurrentIncidentId(finalIncidentId);

        rawEvents.push(
          {
            agent: "TRIAGE_AGENT",
            step: "STARTED",
            message: `Harness connected to ${targetProj.name} (${targetProj.nodeId}). Ingesting 6-axis kinematics and CAN bus sensor stream.`
          },
          {
            agent: "TRIAGE_AGENT",
            step: "COMPLETED",
            message: `Kinematic & thermal anomaly isolated on ${targetProj.faultJoint}. Throttling axis velocity per ISO safety envelope.`,
            payload: {
              incident_domain: targetProj.domain,
              immediate_containment_action: `Elevated telemetry variance detected on ${targetProj.faultJoint}`
            }
          },
          {
            agent: "EVIDENCE_RAG_AGENT",
            step: "STARTED",
            message: `Querying golden physics baselines: ${targetProj.isoStandard} and OEM maintenance specifications.`
          },
          {
            agent: "EVIDENCE_RAG_AGENT",
            step: "COMPLETED",
            message: `Retrieved golden tolerances for ${targetProj.name}. 4 sensor bounds cited.`,
            payload: { cited_evidence: vReport?.evidence || [] }
          },
          {
            agent: "DOMAIN_ANALYSIS",
            step: "STARTED",
            message: `Specialist analysis active: ${targetProj.description.slice(0, 95)}...`
          },
          {
            agent: "DOMAIN_ANALYSIS",
            step: "COMPLETED",
            message: `Spectral signature confirmed against baseline model. Sensor discrepancy isolated.`,
            payload: { evidence: vReport?.evidence || [] }
          },
          {
            agent: "ROOT_CAUSE_AGENT",
            step: "STARTED",
            message: `Formulating causal hypotheses via Gemma-2 9B reasoning DAG.`
          },
          {
            agent: "ROOT_CAUSE_AGENT",
            step: "COMPLETED",
            message: `Root cause identified: ${vReport?.root_cause?.title || targetProj.incidentTitle}`,
            payload: vReport?.root_cause
          },
          {
            agent: "CRITIC_AGENT",
            step: "STARTED",
            message: `Adversarial Critic executing counterfactual validation.`
          },
          {
            agent: "CRITIC_AGENT",
            step: "COMPLETED",
            message: vReport?.critic_findings?.summary || `Cross-validation passed. Root cause corroborated by multi-sensor physics chain.`,
            payload: vReport?.critic_findings
          },
          {
            agent: "SUPERVISORY_AGENT",
            step: "FINAL_VERDICT",
            message: `Conclusive investigation verdict established. Ready for engineer sign-off.`,
            incident_id: finalIncidentId,
            verdict: {
              status: vReport?.investigation_results?.status || "CONCLUSIVE",
              final_confidence_score: vReport?.investigation_results?.final_confidence_score || 98.6,
              primary_root_cause: vReport?.root_cause,
              critic_report: vReport?.critic_findings,
              recommended_mitigation: vReport?.remediation?.procedure || "Inspect joint wire harness and purge lubricant per ISO-10218"
            }
          }
        );
      }

      // Live paced word-by-word playback of multi-agent deliberation
      const sleep = (ms) => new Promise(res => setTimeout(res, ms));

      let currentAccumulated = `📥 Telemetry stream ingested for ${targetProj.name}. Connecting multi-agent harness to EtherCAT bus...`;
      
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
          await sleep(18);
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
          await streamWords(`\n\n📥 [Harness Ingest] Ingesting 6-axis joint kinematics and sensor telemetry for ${targetProj.name}...`);
        } else if (event.agent === "TRIAGE_AGENT" && event.step === "COMPLETED") {
          setActiveFaultJoint(targetProj.faultJoint || "Joint_3");
          await streamWords(`\n\n🔍 [Triage Assessment] Anomaly detected: ${event.payload?.incident_domain || targetProj.domain} on ${targetProj.faultJoint}. Motion throttled.`);
        } else if (event.agent === "EVIDENCE_RAG_AGENT" && event.step === "STARTED") {
          await streamWords(`\n\n📚 [Knowledge RAG] Retrieving ${targetProj.isoStandard} golden safety specs and OEM manuals...`);
        } else if (event.agent === "DOMAIN_ANALYSIS" && event.step === "STARTED") {
          await streamWords(`\n\n⚡ [Domain Specialists] Decomposing telemetry spectrum and kinematic profiles: ${targetProj.description.slice(0, 90)}...`);
        } else if (event.agent === "ROOT_CAUSE_AGENT" && event.step === "STARTED") {
          await streamWords(`\n\n🧠 [Root Cause Engine] Formulating physics-grounded hypotheses via Gemma DAG...`);
        } else if (event.agent === "CRITIC_AGENT" || (event.step === "STARTED" && event.agent?.includes("CRITIC"))) {
          await streamWords(`\n\n⚖️ [Critic Agent] Adversarial validation: Cross-examining counterfactuals and validating physics constraints.`);
        } else if (event.step === "FINAL_VERDICT" && event.verdict) {
          const v = event.verdict;
          setVerdict(v);
          setStatus(v.status === "CONCLUSIVE" ? "PENDING_APPROVAL" : v.status);
          setActiveAgent(null);
          setActiveFaultJoint(targetProj.faultJoint);

          await streamWords(`\n\n📑 [Audit Dossier Ready] Diagnosis: ${v.primary_root_cause?.title || targetProj.incidentTitle}. Confidence: ${v.final_confidence_score ?? 98.6}%. Mitigation procedure ready.`);
        }

        await sleep(120);
      }

      // Fetch or assign verified report
      if (finalIncidentId) {
        try {
          const rpt = await fetchIncidentReport(finalIncidentId);
          if (rpt) setGeneratedReport(rpt);
        } catch (e) {}
      }

      if (targetProj?.verifiedReport) {
        setGeneratedReport(targetProj.verifiedReport);
      }

      await sleep(350);
      setStreamingSubView("REPORT");

    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Live streaming encountered issue, using prebuilt report:", err);
        if (targetProj?.verifiedReport) {
          setGeneratedReport(targetProj.verifiedReport);
          setVerdict({
            status: targetProj.verifiedReport.investigation_results.status,
            final_confidence_score: targetProj.verifiedReport.investigation_results.final_confidence_score,
            primary_root_cause: targetProj.verifiedReport.root_cause,
            critic_report: targetProj.verifiedReport.critic_findings,
            recommended_mitigation: targetProj.verifiedReport.remediation?.procedure || "Inspect joint wire harness and purge lubricant per ISO-10218"
          });
          setStatus(targetProj.verifiedReport.investigation_results.status === "CONCLUSIVE" ? "PENDING_APPROVAL" : targetProj.verifiedReport.investigation_results.status);
          setActiveFaultJoint(targetProj.faultJoint);
          setStreamingSubView("REPORT");
        }
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
    if (activeTab !== "Connected Machinery") {
      setActiveTab("Streaming Visualisation");
    }

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
    handleTriggerScenario(targetScenario, activeTab !== "Connected Machinery", userPrompt);
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

  // ── Public landing page (pre-auth) ──────────────────────────────────────
  if (appView === 'landing') {
    return (
      <LandingPage
        user={user}
        onEnterApp={() => setAppView('app')}
        onOpenAuth={() => setAppView('auth')}
      />
    );
  }

  // ── Authentication page ──────────────────────────────────────────────────
  if (appView === 'auth') {
    return (
      <AuthPage
        onSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          setAppView('app');
        }}
        onBack={() => setAppView('landing')}
      />
    );
  }

  // ── Main app shell ───────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen overflow-hidden pt-6 sm:pt-7 lg:pt-8 pb-3 sm:pb-4 lg:pb-5 px-3.5 sm:px-5 lg:px-6 flex flex-col font-sans antialiased select-none relative bg-[#eddcd0]">
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
        <header className="relative w-full h-10 sm:h-11 shrink-0 flex items-center justify-between px-1 sm:px-2 mb-3 sm:mb-3.5 lg:mb-4">
          {/* Left: ReliAI Logo in Jersey 10 font with horizontal wireframe underline */}
          <div className="flex flex-col z-10 cursor-pointer shrink-0" onClick={() => setActiveTab("Dashboard")}>
            <span className="font-jersey text-white text-3xl sm:text-4xl font-bold tracking-wider leading-none select-none drop-shadow-sm">
              ReliAI
            </span>
            <div className="w-44 sm:w-52 h-[1.5px] bg-white/70 mt-1" />
          </div>

          {/* Top Centered Search Bar & Quick Actions: [ 🔍 | Search...  ⌘K ] [ 🔔 ] [ ⚙️ ] */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
            
            {/* Search Input Bar with Live Options Dropdown & Sorting */}
            <div className="relative" ref={searchContainerRef}>
              <div 
                onClick={() => setIsSearchDropdownOpen(true)}
                className="w-[240px] sm:w-[320px] md:w-[400px] lg:w-[440px] h-8 sm:h-8.5 bg-white/95 backdrop-blur-md rounded-[8px] shadow-xs border border-white/90 flex items-center px-3 gap-2 transition-all focus-within:ring-2 focus-within:ring-[#d98555]/30 focus-within:border-white"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="w-[1px] h-3.5 bg-slate-200 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isSearchDropdownOpen) setIsSearchDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (filteredSearchResults.length > 0) {
                        handleSelectSearchResult(filteredSearchResults[0]);
                      } else {
                        handleGlobalSendMessage(searchQuery);
                        setSearchQuery("");
                        setIsSearchDropdownOpen(false);
                      }
                    } else if (e.key === "Escape") {
                      setIsSearchDropdownOpen(false);
                    }
                  }}
                  placeholder="Search telemetry, SOPs, or trigger diagnostics..."
                  className="w-full bg-transparent text-xs font-mono text-slate-800 placeholder:text-slate-400 outline-none"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <kbd className="hidden md:inline-block text-[9px] font-mono text-slate-400 bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200 shrink-0 select-none">
                    ⌘K
                  </kbd>
                )}
              </div>

              {/* Floating Search Results & Sorting Dropdown */}
              {isSearchDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-[290px] sm:w-[380px] md:w-[480px] lg:w-[520px] bg-white/95 backdrop-blur-2xl border border-white/95 rounded-2xl p-3 shadow-[0_20px_50px_rgba(217,133,85,0.25),0_4px_16px_rgba(0,0,0,0.06)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {/* Category Filter Chips & Sort Selector Header */}
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-1.5 mb-2">
                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-[6px] text-[10px] font-mono">
                      {[
                        { id: "ALL", label: "All" },
                        { id: "MACHINERY", label: "Machinery" },
                        { id: "SOPS", label: "SOPs & Specs" },
                        { id: "TELEMETRY", label: "Telemetry" }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchCategory(cat.id);
                          }}
                          className={`px-2 py-0.5 rounded-[4px] font-medium transition cursor-pointer ${
                            searchCategory === cat.id
                              ? "bg-white text-[#c8764b] font-bold shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Sorting Dropdown */}
                    <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                      <ArrowUpDown className="w-3 h-3 text-[#d98555]" />
                      <span className="hidden sm:inline">Sort:</span>
                      <select
                        value={searchSortBy}
                        onChange={(e) => setSearchSortBy(e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="RELEVANCE">Relevance</option>
                        <option value="SEVERITY">Severity</option>
                        <option value="ALPHABETICAL">A-Z</option>
                      </select>
                    </div>
                  </div>

                  {/* Results Count & Quick Status */}
                  <div className="flex items-center justify-between px-1 mb-1.5 text-[9.5px] font-mono text-slate-400">
                    <span>{filteredSearchResults.length} Results found</span>
                    <span>Press Enter to select</span>
                  </div>

                  {/* Search Results List */}
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {filteredSearchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs font-mono text-slate-400">
                        No telemetry or SOPs match "{searchQuery}"
                      </div>
                    ) : (
                      filteredSearchResults.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSearchResult(item)}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5]/80 border border-transparent hover:border-[#f3cdb6] transition group/item flex items-start gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:border-[#d98555] transition shadow-2xs">
                            {item.category === "MACHINERY" ? (
                              <Bot className="w-3.5 h-3.5 text-[#d98555]" />
                            ) : item.category === "SOPS" ? (
                              <BookOpen className="w-3.5 h-3.5 text-[#c8764b]" />
                            ) : (
                              <Radio className="w-3.5 h-3.5 text-amber-600" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <div className="text-[11.5px] font-mono font-bold text-slate-900 group-hover/item:text-[#c8764b] transition truncate">
                                {item.title}
                              </div>
                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${item.severityColor}`}>
                                {item.categoryLabel}
                              </span>
                            </div>
                            <div className="text-[9.5px] font-mono text-slate-500 truncate">
                              {item.subtitle}
                            </div>
                            <div className="text-[9px] text-slate-600 line-clamp-1 mt-0.5">
                              {item.description}
                            </div>
                          </div>

                          <div className="shrink-0 self-center opacity-0 group-hover/item:opacity-100 transition text-[#d98555]">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Notifications Bell with Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-[8px] bg-white/95 hover:bg-white border border-white/90 shadow-xs transition cursor-pointer flex items-center justify-center text-slate-600 hover:text-[#c8764b] ${
                  isNotificationsOpen ? 'ring-2 ring-[#d98555]/30' : ''
                }`}
                title="Industrial Alerts & Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {isNotificationsOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl border border-white/95 rounded-2xl p-3 shadow-[0_20px_50px_rgba(217,133,85,0.22),0_4px_16px_rgba(0,0,0,0.06)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                      <Bell className="w-3.5 h-3.5 text-[#d98555]" />
                      <span>Industrial Alerts</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-bold">
                        {notifications.filter(n => n.unread).length} Unread
                      </span>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                      className="text-[10px] font-mono text-slate-400 hover:text-[#c8764b] transition cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (notif.projectId) handleSelectProject(notif.projectId);
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                          setIsNotificationsOpen(false);
                        }}
                        className={`p-2 rounded-[10px] border transition cursor-pointer text-left ${
                          notif.unread
                            ? 'bg-[#fffbf8] border-[#f3cdb6] hover:bg-[#faeee5]'
                            : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            notif.type === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : notif.type === 'ALERT'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : notif.type === 'WARNING'
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {notif.type}
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-400">{notif.timestamp}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-900 leading-tight font-mono">
                          {notif.title}
                        </div>
                        <div className="text-[9.5px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed font-mono">
                          {notif.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* More Options Menu with Dropdown */}
            <div className="relative" ref={moreOptionsRef}>
              <button
                type="button"
                onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                className={`p-2 rounded-[8px] bg-white/95 hover:bg-white border border-white/90 shadow-xs transition cursor-pointer flex items-center justify-center text-slate-600 hover:text-[#c8764b] ${
                  isMoreOptionsOpen ? 'ring-2 ring-[#d98555]/30' : ''
                }`}
                title="System Tools & Options"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* More Options Dropdown Menu */}
              {isMoreOptionsOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white/95 backdrop-blur-2xl border border-white/95 rounded-2xl p-2 shadow-[0_20px_50px_rgba(217,133,85,0.22),0_4px_16px_rgba(0,0,0,0.06)] z-50 animate-in fade-in slide-in-from-top-2 duration-200 font-mono text-[11px]">
                  <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">System Actions</span>
                    <span className="text-[9px] text-[#c8764b]">v2.4 Live</span>
                  </div>

                  <button
                    onClick={() => { setActiveTab("Settings"); setIsMoreOptionsOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5] text-slate-700 hover:text-[#c8764b] flex items-center gap-2 transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Operator Profile</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("Settings"); setIsMoreOptionsOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5] text-slate-700 hover:text-[#c8764b] flex items-center gap-2 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>System Settings</span>
                  </button>

                  <button
                    onClick={() => { setIsAnalyticsOpen(true); setIsMoreOptionsOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5] text-slate-700 hover:text-[#c8764b] flex items-center gap-2 transition cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Fleet Health Analytics</span>
                  </button>

                  <button
                    onClick={() => { setIsHistoryDrawerOpen(true); setIsMoreOptionsOpen(false); }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5] text-slate-700 hover:text-[#c8764b] flex items-center gap-2 transition cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Incident History Ledger</span>
                  </button>

                  <button
                    onClick={() => {
                      handleTriggerScenario(activeProject.scenarioId, false, `System diagnostic probe for ${activeProject.name}`);
                      setIsMoreOptionsOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5] text-slate-700 hover:text-[#c8764b] flex items-center gap-2 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Trigger Anomaly Probe</span>
                  </button>

                  <button
                    onClick={handleExportTelemetry}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#faeee5] text-slate-700 hover:text-[#c8764b] flex items-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d98555]" />
                    <span>Export Telemetry (JSON)</span>
                  </button>
                </div>
              )}
            </div>

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

            {/* Return to Public Landing Page */}
            <button
              type="button"
              onClick={() => setAppView('landing')}
              title="Return to Public Site"
              className="hidden lg:flex items-center gap-1 text-slate-600 hover:text-[#c8764b] px-2.5 py-1 bg-white/80 hover:bg-white rounded-[8px] border border-white/90 shadow-2xs transition cursor-pointer text-[11px]"
            >
              <ExternalLink className="w-3 h-3 text-[#d98555]" />
              <span>Public Site</span>
            </button>

            {/* Firebase Auth User Pill / Sign In Trigger */}
            {user ? (
              <div
                onClick={() => setActiveTab("Settings")}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-[8px] border border-white/90 text-slate-800 shadow-2xs cursor-pointer group transition"
                title="View Profile & Settings"
              >
                <div className="w-4 h-4 rounded-full bg-[#d98555] text-white flex items-center justify-center text-[9px] font-bold">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
                <span className="max-w-[85px] truncate font-semibold group-hover:text-[#c8764b] transition">
                  {user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Operator"}
                </span>
                <button
                  type="button"
                  onClick={async (e) => { e.stopPropagation(); await logoutUser(); setUser(null); }}
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
        <div className="flex-1 min-h-0 flex gap-3 sm:gap-4 items-stretch overflow-hidden pt-1 sm:pt-1.5">
          
          {/* LEFT SIDEBAR: Clean white card */}
          <aside className="w-[165px] sm:w-[185px] md:w-[200px] h-full bg-white/95 backdrop-blur-md rounded-[12px] p-4 sm:p-5 shadow-xs border border-white/80 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="flex flex-col space-y-3 sm:space-y-4 text-left">
              <button
                onClick={() => setActiveTab("Dashboard")}
                className={`text-left text-[13.5px] sm:text-[14.5px] transition cursor-pointer leading-tight ${
                  activeTab === "Dashboard"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab("Live Pipeline")}
                className={`text-left text-[13.5px] sm:text-[14.5px] transition cursor-pointer leading-tight ${
                  activeTab === "Live Pipeline"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Live Pipeline<br />Visualizer
              </button>

              <button
                onClick={() => setActiveTab("Streaming Visualisation")}
                className={`text-left text-[13.5px] sm:text-[14.5px] transition cursor-pointer leading-tight ${
                  activeTab === "Streaming Visualisation"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Streaming<br />Visualisation
              </button>

              <button
                onClick={() => setActiveTab("Toolbox & Hub")}
                className={`text-left text-[13.5px] sm:text-[14.5px] transition cursor-pointer leading-tight ${
                  activeTab === "Toolbox & Hub"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Toolbox &<br />Intel Hub
              </button>

              <button
                onClick={() => setActiveTab("Evidence Inspector")}
                className={`text-left text-[13.5px] sm:text-[14.5px] transition cursor-pointer leading-tight ${
                  activeTab === "Evidence Inspector"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Evidence<br />Inspector
              </button>

              <button
                onClick={() => setActiveTab("Incident History")}
                className={`text-left text-[13.5px] sm:text-[14.5px] transition cursor-pointer leading-tight ${
                  activeTab === "Incident History"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Incident history
              </button>

              <button
                onClick={() => setActiveTab("Connected Machinery")}
                className={`text-left text-[13.5px] sm:text-[14.5px] transition cursor-pointer leading-tight ${
                  activeTab === "Connected Machinery"
                    ? "text-[#c8764b] font-semibold"
                    : "text-slate-800 hover:text-[#c8764b]"
                }`}
              >
                Connected<br />Machinery
              </button>
            </div>

            {/* Bottom Account Control Section */}
            <div className="shrink-0 pt-3 mt-4 border-t border-slate-200/80">
              <AccountControlPanel
                user={user}
                activeTab={activeTab}
                onOpenProfile={() => setActiveTab("Settings")}
                onOpenSettings={() => setActiveTab("Settings")}
              />
            </div>
          </aside>

          {/* MAIN STAGE */}
          {activeTab === "Settings" ? (
            /* ============================================================ */
            /* TAB: SETTINGS & OPERATOR PROFILE (Center-Aligned Page)       */
            /* ============================================================ */
            <main className="flex-1 min-w-0 h-full bg-white/95 backdrop-blur-md rounded-[12px] border border-white/80 shadow-xs flex flex-col overflow-hidden">
              <SettingsPage
                user={user}
                onBack={() => setActiveTab("Dashboard")}
                onSignOutSuccess={() => setUser(null)}
              />
            </main>
          ) : isDashboardTab ? (
            /* ============================================================ */
            /* TAB 1: MAIN LANDING DASHBOARD (Clean, Spacious, No 3D Box)  */
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
              <div className="shrink-0 flex flex-col items-center justify-center pt-3 pb-1 w-full">
                <div className="relative w-full max-w-2xl mx-auto group z-30">
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
                <div className="flex-1 min-w-0 h-full overflow-hidden rounded-[10px] sm:rounded-[12px] border border-white/80 shadow-xs">
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
                        false,
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
                /* When report is generated:                                    */
                /* - If hardware fault detected: Render on top + Report below   */
                /* - If nominal / no fault: Full-screen Report                  */
                /* ============================================================ */
                <div className="flex-1 min-w-0 h-full flex flex-col gap-2.5 overflow-hidden">
                  
                  {/* Top Mode Selector & Project Bar */}
                  <div className="shrink-0 flex flex-wrap items-center justify-between px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-[8px] border border-white/80 shadow-2xs gap-2">
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

                    {/* Grounded Machinery Project Selector */}
                    <div className="flex items-center gap-1.5 bg-[#faf5f0] border border-[#ecd7c7] rounded-[8px] px-2.5 py-1 shadow-2xs">
                      <Bot className="w-3.5 h-3.5 text-[#d98555] shrink-0" />
                      <span className="text-[10.5px] font-mono text-slate-500 font-bold hidden sm:inline">Project:</span>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => handleSelectProject(e.target.value)}
                        className="bg-transparent text-[11.5px] font-mono font-bold text-[#c8764b] focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[290px] truncate"
                      >
                        {MACHINERY_PROJECTS.map(proj => (
                          <option key={proj.id} value={proj.id} className="bg-white text-slate-800 font-mono text-xs">
                            {proj.name} ({proj.cellLocation.split('•')[0].trim()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10.5px]">
                      {isInvestigating ? (
                        <span className="flex items-center gap-1 text-[#d98555] font-semibold">
                          <Loader2 className="w-3 h-3 animate-spin" /> Investigating {activeProject?.nodeId}...
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
                          report={generatedReport || activeProject?.verifiedReport}
                          verdict={verdict || {
                            status: activeProject?.verifiedReport?.investigation_results?.status || "CONCLUSIVE",
                            final_confidence_score: activeProject?.verifiedReport?.investigation_results?.final_confidence_score || 98.6,
                            primary_root_cause: activeProject?.verifiedReport?.root_cause,
                            critic_report: activeProject?.verifiedReport?.critic_findings
                          }}
                          selectedProject={activeProject}
                          isInvestigating={isInvestigating}
                          onTriggerInvestigation={() => {
                            handleTriggerScenario(
                              activeProject.scenarioId,
                              false,
                              `Investigate ${activeProject.name} (${activeProject.nodeId}): ${activeProject.incidentTitle}`
                            );
                          }}
                          onLoadVerifiedReport={() => {
                            if (activeProject.verifiedReport) {
                              setGeneratedReport(activeProject.verifiedReport);
                              setVerdict({
                                status: activeProject.verifiedReport.investigation_results.status,
                                final_confidence_score: activeProject.verifiedReport.investigation_results.final_confidence_score,
                                primary_root_cause: activeProject.verifiedReport.root_cause,
                                critic_report: activeProject.verifiedReport.critic_findings
                              });
                            }
                          }}
                          onApprove={() => handleHumanAction({ action: "APPROVE", engineer_id: "ENG-LEAD", notes: `Approved grounded empirical audit for ${activeProject.name}.` })}
                          onOverride={() => handleHumanAction({ action: "OVERRIDE", engineer_id: "ENG-LEAD", notes: `Override manual inspection for ${activeProject.name}.` })}
                        />
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* DUAL-SCREEN COLUMN for Incident History & Evidence Inspector */
                <div className="flex-1 min-w-0 flex flex-col gap-2.5 h-full overflow-hidden">
                  
                  {/* Evidence Inspector Top Command & Machine Project Bar */}
                  {activeTab === "Evidence Inspector" && (
                    <div className="shrink-0 flex flex-wrap items-center justify-between px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-[8px] border border-white/80 shadow-2xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-[6px] bg-[#faeee5] text-[#c8764b] border border-[#f5cdb6] text-xs font-mono font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#d98555]" />
                          <span>EVIDENCE & CRITIC AUDIT</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 hidden xl:inline">
                          Raw sensor proof & adversarial physics cross-examination
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Machine Project Selector */}
                        <div className="flex items-center gap-1.5 bg-[#faf5f0] border border-[#ecd7c7] rounded-[8px] px-2.5 py-1 shadow-2xs">
                          <Bot className="w-3.5 h-3.5 text-[#d98555] shrink-0" />
                          <span className="text-[10.5px] font-mono text-slate-500 font-bold hidden sm:inline">Machine:</span>
                          <select
                            value={selectedProjectId}
                            onChange={(e) => handleSelectProject(e.target.value)}
                            className="bg-transparent text-[11.5px] font-mono font-bold text-[#c8764b] focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
                          >
                            {MACHINERY_PROJECTS.map(proj => (
                              <option key={proj.id} value={proj.id} className="bg-white text-slate-800 font-mono text-xs">
                                {proj.name} ({proj.cellLocation.split('•')[0].trim()})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Audit Sensor Proof Action */}
                        <button
                          onClick={() => {
                            handleTriggerScenario(
                              activeProject.scenarioId,
                              false,
                              `Audit physical evidence and sensor telemetry for ${activeProject.name} (${activeProject.nodeId}): ${activeProject.incidentTitle}`
                            );
                          }}
                          disabled={isInvestigating}
                          className="px-3 py-1 bg-gradient-to-r from-[#d98555] to-[#e89568] hover:from-[#c8764b] hover:to-[#d98555] text-white rounded-[8px] text-[11px] font-mono font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isInvestigating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>{isInvestigating ? "Auditing..." : "Audit Sensor Proof"}</span>
                        </button>

                        {/* Load Golden Proof Button */}
                        {activeProject?.verifiedReport && (
                          <button
                            onClick={() => {
                              setGeneratedReport(activeProject.verifiedReport);
                              setVerdict({
                                status: activeProject.verifiedReport.investigation_results.status,
                                final_confidence_score: activeProject.verifiedReport.investigation_results.final_confidence_score,
                                primary_root_cause: activeProject.verifiedReport.root_cause,
                                critic_report: activeProject.verifiedReport.critic_findings,
                                recommended_mitigation: activeProject.verifiedReport.remediation?.procedure
                              });
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#c8764b] rounded-[8px] text-[11px] font-mono font-medium shadow-2xs transition flex items-center gap-1 cursor-pointer hidden md:flex"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Load Golden Proof</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* SCREEN 1: TOP CARD (Multimodal Telemetry Inspector) */}
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
                            selectedProject={activeProject}
                            isInvestigating={isInvestigating}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SCREEN 2: BOTTOM CARD (Critic Cross-Examination & Human Approval) */}
                  <div className="flex-1 min-h-0 rounded-[10px] overflow-hidden">
                    {activeTab === "Incident History" ? (
                      <InvestigationReplayView
                        incidentId={selectedIncidentId || currentIncidentId || "INC-A0F32EEB"}
                        onBack={() => setActiveTab("Dashboard")}
                        onActionComplete={() => {}}
                      />
                    ) : (
                      <div className="h-full w-full bg-white/95 backdrop-blur-md rounded-[10px] p-2.5 border border-white/80 shadow-xs flex flex-col justify-between overflow-hidden gap-2">
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                          <CriticDebateView
                            rootCause={verdict?.primary_root_cause}
                            criticReport={verdict?.critic_report}
                            isInvestigating={isInvestigating}
                            selectedProject={activeProject}
                            onTriggerAudit={() => handleTriggerScenario(activeProject.scenarioId, false)}
                          />
                        </div>
                        <div className="shrink-0">
                          <HumanApprovalBar
                            status={status}
                            confidenceScore={verdict?.final_confidence_score ?? (activeProject?.verifiedReport?.investigation_results?.final_confidence_score || 94.2)}
                            recommendedMitigation={verdict?.recommended_mitigation || activeProject?.verifiedReport?.remediation?.procedure || "Inspect joint wire harness and purge lubricant per ISO-10218"}
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
              <aside className="h-full min-h-0 overflow-hidden">
                <CopilotChatPanel
                  activeIncidentId={selectedIncidentId || currentIncidentId}
                  isInvestigating={isInvestigating}
                  activeAgent={activeAgent}
                  agentTraces={agentTraces}
                  onTriggerInvestigation={() => handleTriggerScenario(activeScenarioId, activeTab !== "Connected Machinery")}
                  activeScenarioName={activeScenarioId}
                  messages={chatMessages}
                  setMessages={setChatMessages}
                  onSendMessage={handleGlobalSendMessage}
                />
              </aside>

            </main>
          )}

        </div>
      </div>

      {/* Slide-over Incident History Drawer (if opened) */}
      <IncidentHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
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
    </div>
  );
}
