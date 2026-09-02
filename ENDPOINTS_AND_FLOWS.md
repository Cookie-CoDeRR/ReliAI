# ReliAI — Endpoints, Call Graphs & System Flow Architecture

## 1. High-Level Service Topology & Communication Graph

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       EXTERNAL CLIENTS / ACTORS                                  │
│                                                                                                  │
│   [ Factory Edge Sensors & PLC ]                [ Plant Reliability Engineer / Supervisor ]      │
│   (Thermal IR, Acoustic FFT, 3-Phase Power)     (Web 3D Command Center React Dashboard)          │
└───────────────────┬──────────────────────────────────────────────┬───────────────────────────────┘
                    │                                              │
                    │ 1. Ingest Incident (POST)                    │ 2. Stream Reasoning (SSE POST)
                    │                                              │ 3. Human Approval Action (POST)
                    ▼                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      UNIFIED WEB PLATFORM & HARNESS SERVICE (FastAPI / Uvicorn :8001)            │
│                                                                                                  │
│  • Scenario Preset Router   • Ingestion Controller       • Multi-Agent Orchestrator Pipeline     │
│  • Incident Life-Cycle API  • Human Approval Audit Gate  • Local Ollama Async Bridge Engine      │
└──────────────┬───────────────────────────────────────────────────────────┬───────────────────────┘
               │                                                           │
               ▼                                                           ▼
┌──────────────────────────────────────────┐            ┌──────────────────────────────────────────┐
│  ASYNC SQLALCHEMY PERSISTENCE LAYER      │            │       LOCAL OLLAMA INFERENCE ENGINE      │
│  • SQLite (Default) / PostgreSQL 16      │            │ • Qwen 2.5 7B (Reasoning / JSON Schemas) │
│  • Incidents Record Store                │            │ • DeepSeek R1 7B (Adversarial Critic)    │
│  • Agent Deliberation Step Traces        │            │ • Qwen2.5-VL / MiniCPM-V (Machine Vision)│
│  • Immutable Human Approval Audit Trails │            │ • Zero Third-Party Cloud Data Leakage    │
└──────────────────────────────────────────┘            └──────────────────────────────────────────┘
```

---

## 2. Comprehensive Endpoint Catalog

### A. Web Platform & Incident Life-Cycle API (`/api/v1/`)

| Method | Endpoint Route | Request Source | Destination / Purpose | Core Business Logic & State Impact |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/scenarios` | Web Dashboard | Returns all pre-configured industrial failure benchmark datasets | Reads scenario definitions from disk storage and returns structured telemetry presets. |
| `POST` | `/api/v1/scenarios/{id}/trigger` | Web Dashboard | Ingests a benchmark scenario and immediately executes full AI investigation | Auto-creates an incident record in the database, runs multi-agent deliberation, and sets status to pending approval or inconclusive. |
| `POST` | `/api/v1/incidents/ingest` | PLC / IoT Edge Nodes | Ingests raw telemetry and registers a new failure incident alert | Validates multimodal sensor schema, generates unique incident ID, and persists record in initial detected state. |
| `GET` | `/api/v1/incidents` | Web Dashboard | Lists historical and active incident records with status filtering | Queries database records ordered by timestamp descending, with pagination parameters. |
| `GET` | `/api/v1/incidents/{id}` | Web Dashboard | Fetches complete incident dossier, intermediate agent traces, and human audit logs | Joins incident records, associated deliberation traces, and approval history for auditability. |
| `POST` | `/api/v1/incidents/{id}/investigate` | Web Dashboard / Automation | Manually dispatches the multi-agent AI harness for a stored incident | Transitions state to investigating, runs full pipeline, and updates final confidence and mitigation fields. |
| `POST` | `/api/v1/incidents/{id}/approve` | Web Dashboard (HITL) | Enforces human engineer sign-off to approve mitigation, override AI, or dispatch technician | Creates an immutable approval audit record and transitions incident status to approved, overridden, or dispatched. |

---

### B. AI Investigation Harness & Streaming API (`/harness/`)

| Method | Endpoint Route | Request Source | Destination / Purpose | Core Business Logic & State Impact |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/harness/investigate` | Internal Service / CLI | Synchronous batch investigation returning the finalized verdict JSON | Runs full multi-agent orchestrator synchronously and returns validated investigation verdict. |
| `POST` | `/harness/investigate/stream` | Web Dashboard / EventSource | Server-Sent Events (SSE) live streaming of real-time agent deliberations | Emits structured JSON events as each agent completes its analysis, ending with final verdict. |
| `GET` | `/harness/health` | Docker / Monitoring | Health check verifying Uvicorn harness and local Ollama daemon connectivity | Probes local Ollama model tags endpoint and reports active connection state. |
| `GET` | `/harness/baselines` | Web Dashboard / Config | Retrieves active Golden Run operating limits and sensor tolerance thresholds | Returns baseline specifications for 6-axis joint kinematics, temperatures, and tolerances. |
| `GET` | `/harness/sops` | Maintenance Engineers | Returns Standard Operating Procedures (SOPs) and historical failure database | Returns indexed SOP knowledge base for harmonic drives, pneumatic lines, and resolvers. |

---

### C. Local Ollama Engine API (`http://localhost:11434`)

| Method | Endpoint Route | Request Source | Destination / Purpose | Model Strategy & Target |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/generate` | Domain & Root Cause Agents | Structured JSON inference with schema enforcement | Utilizes Qwen 2.5 7B with near-zero temperature for deterministic reasoning. |
| `POST` | `/api/generate` | Adversarial Critic Agent | Falsification audit challenging physical plausibility | Utilizes DeepSeek R1 7B to seek sensor contradictions and assign penalties. |
| `GET` | `/api/tags` | System Startup | Verifies pre-loaded models in local GPU/VRAM cache | Verifies local model readiness without triggering external downloads. |

---

## 3. Function-Level Multi-Agent Invocation Tree

Below is the complete execution graph orchestrated during an automated investigation:

```
[ POST /api/v1/incidents/ingest OR /scenarios/{id}/trigger ]
 └── IncidentService.ingest_incident()
      ├── Validate MultimodalTelemetrySnapshot against Golden Baseline Tolerances
      ├── Insert IncidentRecord into Database (Status: DETECTED)
      └── Invoke IncidentService.investigate_incident()
           │
           ▼
[ POST /harness/investigate/stream ]
 └── InvestigationOrchestrator.run_investigation_stream()
      │
      ├── 1. TriageAgent.evaluate()
      │    ├── Multimodal Ingestion (Thermal, Acoustic, Kinematic, Pneumatic)
      │    ├── AsyncOllamaClient.generate_structured(schema=TriageAssessment)
      │    ├── Extract Incident Domain, Urgency Severity & Immediate Containment Action
      │    └── Yield SSE Event (Agent: TRIAGE_AGENT, Step: COMPLETED)
      │
      ├── 2. EvidenceRAGAgent.evaluate()
      │    ├── BaselineEngine.evaluate_telemetry(snapshot)
      │    │    ├── Joint Torque vs Max Limit Comparison
      │    │    ├── Temperature vs 65°C Limit Check
      │    │    ├── 3-Phase Line Voltage Stability Check (380V - 420V)
      │    │    └── Pneumatic Line Pressure Minimum Check (5.5 bar)
      │    ├── BaselineEngine.match_sops(evidence_items)
      │    └── Yield SSE Event (Agent: EVIDENCE_RAG_AGENT, Step: COMPLETED)
      │
      ├── 3. Parallel Specialized Domain Agents
      │    ├── TelemetryAgent.evaluate() ➔ Kinematic Overload & Torque Saturation Analysis
      │    ├── QualityFitAgent.evaluate() ➔ Tire Bead Radial Seating & Clamping Eccentricity
      │    ├── MaintenanceAgent.evaluate() ➔ Operating Hours & Overdue Lubrication Check
      │    └── Yield SSE Event (Agent: DOMAIN_ANALYSIS, Step: COMPLETED)
      │
      ├── 4. RootCauseAgent.formulate_hypothesis()
      │    ├── Synthesize Evidence Dossier & Matched SOPs
      │    ├── AsyncOllamaClient.generate_structured(schema=RootCauseHypothesis)
      │    │    ├── Generate Ranked Physical Causal Failure Chain
      │    │    └── Strictly Cite Grounded Empirical Evidence IDs (EVD-001, etc.)
      │    └── Yield SSE Event (Agent: ROOT_CAUSE_AGENT, Step: COMPLETED)
      │
      ├── 5. CriticAgent.evaluate_hypothesis()
      │    ├── Algorithmic Contradiction Scan (e.g. High Temp vs Low Motor Current)
      │    ├── AsyncOllamaClient.generate_structured(schema=CriticEvaluation)
      │    │    ├── Adversarially Challenge Physical Consistency
      │    │    └── Calculate Confidence Penalty & Identify Missing Proofs
      │    └── Yield SSE Event (Agent: CRITIC_AGENT, Step: COMPLETED)
      │
      ├── 6. ConfidenceEngine.compute_verdict()
      │    ├── Calculate Deterministic Score: (Base 80.0) + (Evidence Boost) - (Critic Penalties)
      │    ├── Anti-Hallucination Gate: If Contradictions Detected ➔ Cap Score <= 45.0%
      │    ├── Assign Status: CONCLUSIVE vs INCONCLUSIVE_CONTRADICTIONS
      │    ├── Determine Human Inspection Requirement
      │    └── Yield SSE Event (Agent: CONFIDENCE_ENGINE, Step: FINAL_VERDICT)
      │
      └── 7. Web Backend Persistence & Audit Update
           ├── Update IncidentRecord (Status: PENDING_APPROVAL / INCONCLUSIVE)
           └── Insert AgentTraceRecord for each intermediate reasoning step
```

---

## 4. End-to-End Sequence Flow

```
Edge Sensor / PLC         FastAPI Backend            AI Orchestrator           Local Ollama           React 3D Dashboard
      │                          │                          │                        │                        │
      │── 1. Telemetry Alert ───>│                          │                        │                        │
      │   (Thermal/Torque Spike) │── 2. Save DB Record ────>│                        │                        │
      │                          │                          │── 3. Start Stream ────>│                        │
      │                          │                          │                        │── 4. Triage Prompt ───>│
      │                          │                          │                        │<── 5. Triage JSON ─────│
      │                          │<── 6. Yield SSE Event ───│                        │                        │
      │                          │──────────────────────────┼────────────────────────┼───────────────────────>│
      │                          │                          │                        │        (Render Node 1) │
      │                          │                          │── 7. Evidence Diffs ──>│                        │
      │                          │                          │── 8. Domain Agents ───>│                        │
      │                          │                          │                        │── 9. Root Cause ──────>│
      │                          │                          │                        │<── 10. Hypothesis ─────│
      │                          │                          │                        │── 11. Critic Audit ───>│
      │                          │                          │                        │<── 12. Objections ─────│
      │                          │<── 13. Final Verdict ────│                        │                        │
      │                          │──────────────────────────┼────────────────────────┼───────────────────────>│
      │                          │                          │                        │     (3D Joint Glow +   │
      │                          │                          │                        │      Verdict Dialog)   │
      │                          │                          │                        │                        │
      │                          │<── 14. POST /approve (Human Engineer Approves / Dispatches Tech) ──────────│
      │                          │── 15. Record Immutable Audit Log & Update Station State ──────────────────>│
```

---

## 5. Industrial Failure Scenarios & State Execution Matrix

| Scenario Identifier | Injected Physical Anomaly | Active Domain | Critic Cross-Check Result | Final System Status & Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **SCENARIO-01-THERMAL-OVERHEAT** | Joint 3 thermal runaway (88.5°C), 345 Nm torque saturation, 2.8kHz bearing grind. | `THERMAL_OVERHEAT` | Validated physically plausible. High current (7.8A) and acoustic harmonic confirm true friction. | `CONCLUSIVE` (94% confidence). Recommends immediate lubricant flush per SOP-HARMONIC-001. |
| **SCENARIO-02-PNEUMATIC-DROP** | Gripper manifold pressure drop to 4.0 bar, 1.8mm tire bead offset, 5.2kHz valve hiss. | `PNEUMATIC_PRESSURE_DROP` | Validated physically plausible. Pressure drop directly correlates with incomplete seating. | `CONCLUSIVE` (89% confidence). Recommends solenoid valve O-ring seal replacement per SOP-PNEUMATIC-002. |
| **SCENARIO-03-CONTRADICTORY-FAULT** | Thermocouple reads 92°C, but motor current is idle (3.1A) and acoustic noise is 0 dB. | `THERMAL_OVERHEAT` | **Contradiction Flagged**. Physical impossibility between temperature and electrical current. | `INCONCLUSIVE_CONTRADICTIONS` (Score capped at 39%). AI refuses root cause and mandates technician multimeter inspection. |
| **SCENARIO-04-VOLTAGE-SAG** | Plant transformer brownout dropping line voltage to 365V RMS under heavy load. | `ELECTRICAL_POWER_SAG` | Validated physically plausible. Multi-axis current surge matches undervoltage physics. | `CONCLUSIVE` (91% confidence). Recommends power line voltage stabilization per SOP-ELECTRICAL-003. |

---

## 6. Future Multimodal Machinery Vision Pipeline Architecture

```
[ Factory High-Resolution Camera / FLIR Thermal Imager ]
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: EDGE PREPROCESSING & REGION-OF-INTEREST (ROI) EXTRACTION │
│ • Local OpenCV segmentation / Canny edge / Thermal isotherm mask │
│ • Crop high-stress mechanical region (Gear teeth / Seal / Joint) │
│ • Downscale ambient context (512x512) + Keep 1:1 ROI patch       │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: MULTIMODAL INGESTION SCHEMA & ENCODING                   │
│ • Convert ROI crops to Base64 JPEG (Quality 85%)                 │
│ • Attach Radiometric Metadata (Min/Max Temp, Colormap Legend)    │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: LOCAL VISION-LANGUAGE MODEL (Ollama Qwen2.5-VL / MiniCPM)│
│ • System Prompt: Focus on surface micro-pitting, fatigue cracks, │
│   thermal hot spots, and seal extrusion defects.                 │
│ • Grounding: Emit normalized bounding boxes [ymin, xmin, ymax, xmax]│
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: ADVERSARIAL CRITIC VISUAL CROSS-VALIDATION               │
│ • Cross-examine visual wear findings against vibration FFT data  │
│ • Falsify optical illusions (e.g. surface grease vs true crack)  │
└──────────────────────────────────────────────────────────────────┘
```
