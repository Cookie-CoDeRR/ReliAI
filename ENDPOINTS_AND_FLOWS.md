# ReliAI — Endpoints, Call Graphs & System Flow Architecture

## 1. High-Level Service Topology & Communication Graph

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       EXTERNAL CLIENTS / ACTORS                                  │
│                                                                                                  │
│   [ Factory Edge Sensors & PLC ]                [ Plant Reliability Engineer / Supervisor ]      │
│   (Thermal Cam, Audio FFT, 3-Phase Power)       (Web Command Center React Dashboard)             │
└───────────────────┬──────────────────────────────────────────────┬───────────────────────────────┘
                    │                                              │
                    │ 1. Ingest Incident (POST)                    │ 2. Stream Reasoning (SSE GET)
                    │                                              │ 3. Human Approval Action (POST)
                    ▼                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          MAIN WEB PLATFORM BACKEND (FastAPI / Uvicorn :8000)                     │
│                                                                                                  │
│  • Ingestion Router        • Incident Controller        • Approval Audit Logger                  │
│  • SSE Broadcaster         • Baseline Controller        • Report Export Service                  │
└──────────────┬───────────────────────────┬───────────────────────────────┬───────────────────────┘
               │                           │                               │
               ▼                           ▼                               ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌──────────────────────────────────────┐
│  POSTGRESQL 16 + pgvector │ │      REDIS 7 PUB/SUB      │ │ AI INVESTIGATION HARNESS (:8001)     │
│ • Incidents & Audit Logs  │ │ • SSE Live Stream Buffer  │ │ • Multi-Agent Orchestrator           │
│ • Vectorized SOPs         │ │ • Telemetry Ingest Queue  │ │ • Local Ollama LLM Pipelines         │
└───────────────────────────┘ └───────────────────────────┘ └──────────────────┬───────────────────┘
                                                                               │
                                                                               ▼
                                                            ┌──────────────────────────────────────┐
                                                            │     LOCAL OLLAMA ENGINE (:11434)     │
                                                            │ • Qwen 2.5 7B (Reasoning / JSON)     │
                                                            │ • DeepSeek R1 7B (Critic Falsify)    │
                                                            │ • Qwen2-VL (Thermal Vision)          │
                                                            └──────────────────────────────────────┘
```

---

## 2. Comprehensive Endpoint Catalog

### A. Web Platform Backend API (`http://backend:8000`)

| Method | Endpoint Route | Request Source | Destination / Purpose | Associated Internal Function |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/incidents/ingest` | PLC / Edge IoT Sensors | Ingests new failure incident & triggers investigation | `incident_service.ingest_incident()` |
| `GET` | `/api/v1/incidents` | Web Dashboard | Lists active and historical incidents with status filters | `incident_service.list_incidents()` |
| `GET` | `/api/v1/incidents/{id}` | Web Dashboard | Fetches detailed incident data, telemetry, and verdicts | `incident_service.get_incident_detail()` |
| `POST` | `/api/v1/incidents/{id}/investigate` | Web Dashboard / Admin | Manually triggers or re-runs the multi-agent harness | `incident_service.trigger_investigation()` |
| `GET` | `/api/v1/incidents/{id}/stream` | Web Dashboard (SSE) | Long-lived Server-Sent Events stream of live agent thoughts | `stream_broadcaster.subscribe_and_stream()`|
| `POST` | `/api/v1/incidents/{id}/approve` | Web Dashboard (HITL) | Records engineer approval, override, or technician dispatch | `approval_service.record_human_action()` |
| `GET` | `/api/v1/baselines/{station_id}` | Web Dashboard | Retrieves Golden Run specs for a specific robot station | `baseline_service.get_golden_specs()` |
| `POST` | `/api/v1/baselines/{station_id}` | Plant Admin | Updates nominal tolerance limits and torque baselines | `baseline_service.update_golden_specs()` |
| `GET` | `/api/v1/reports/{id}/export` | Web Dashboard | Generates regulatory ISO 9001 compliance audit PDF | `report_generator.generate_pdf_report()` |

---

### B. AI Investigation Harness Service (`http://ai-harness:8001`)

| Method | Endpoint Route | Request Source | Destination / Purpose | Associated Internal Function |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/harness/investigate` | Web Backend Worker | Synchronous batch investigation returning final JSON verdict | `InvestigationOrchestrator.run()` |
| `POST` | `/harness/investigate/stream` | Web Backend SSE Proxy | Real-time generator streaming progress events as agents work | `InvestigationOrchestrator.stream_run()` |
| `GET` | `/harness/health` | Docker / Monitoring | Health check verifying model status and Ollama availability | `health_check_service.check_ollama()` |

---

### C. Local Ollama Inference Engine (`http://ollama:11434`)

| Method | Endpoint Route | Request Source | Destination / Purpose | Associated Model |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/generate` | AI Harness Agents | Generates structured JSON responses for reasoning & critic | `qwen2.5:7b` / `deepseek-r1:7b` |
| `POST` | `/api/embeddings` | Evidence RAG Agent | Generates vector embeddings for SOPs and maintenance logs | `nomic-embed-text` |
| `GET` | `/api/tags` | AI Harness Startup | Verifies pre-pulled models exist in local cache | System |

---

## 3. Function-Level Invocation Tree

Below is the complete function call graph executed when an incident is triaged and investigated:

```
[ POST /api/v1/incidents/ingest ]
 └── incident_service.ingest_incident()
      ├── telemetry_preprocessor.normalize()
      ├── db.save_incident_record()
      └── task_queue.enqueue(trigger_investigation)
           │
           ▼
[ POST /harness/investigate/stream ]
 └── InvestigationOrchestrator.run_investigation()
      │
      ├── 1. TriageAgent.execute()
      │    ├── ThermalAnalyzer.detect_hotspots(thermal_frame)
      │    ├── AudioAcousticAnalyzer.compute_fft(audio_clip)
      │    └── OllamaClient.generate_structured() ➔ [Incident Domain & Urgency]
      │
      ├── 2. EvidenceRAGAgent.execute()
      │    ├── GoldenBaselineService.calculate_deviations(live_data, golden_specs)
      │    ├── VectorStore.search_sops(query, top_k=3)
      │    └── [Aggregated Verified Evidence List]
      │
      ├── 3. Parallel Domain Analysis
      │    ├── TelemetryAgent.analyze_kinematics(joint_angles, torques, voltage)
      │    ├── QualityFitAgent.analyze_tire_seating(bead_pressure, alignment)
      │    └── MaintenanceAgent.evaluate_lifecycles(operating_hours, last_service)
      │
      ├── 4. RootCauseAgent.execute()
      │    ├── Synthesizes findings from Domain Agents
      │    └── OllamaClient.generate_structured(model="qwen2.5:7b")
      │         └── [Ranked Root Cause Hypotheses + Cited Evidence]
      │
      ├── 5. AdversarialCriticAgent.execute()
      │    ├── ContradictionChecker.scan_conflicting_telemetry(hypothesis, raw_data)
      │    └── OllamaClient.generate_structured(model="deepseek-r1:7b")
      │         └── [Critic Evaluation: Objections, Invalidations, Adjustments]
      │
      ├── 6. DeterministicConfidenceEngine.calculate()
      │    ├── Formula: (Evidence Weight) - (Contradiction Penalty) + (RAG Match)
      │    ├── Check: If Contradictions > Threshold ➔ Status = "INCONCLUSIVE"
      │    └── [Final Investigation Verdict Object]
      │
      └── 7. RedisBroadcaster.publish(channel="incident_stream:{id}", payload=event)
```

---

## 4. End-to-End Sequence Diagram (Incident to Human Authorization)

```
Factory Sensor       Web Backend          Redis Pub/Sub       AI Harness        Ollama Engine       Web Dashboard
      │                   │                    │                  │                   │                   │
      │── 1. Ingest Data ─>│                    │                  │                   │                   │
      │   (Incident Alert)│── 2. Enqueue Job ──>│                  │                   │                   │
      │                   │                    │── 3. Start Run ─>│                   │                   │
      │                   │                    │                  │── 4. Triage Prompt>│                   │
      │                   │                    │                  │<─ 5. Domain JSON ─│                   │
      │                   │                    │<─ 6. SSE Event ──│                   │                   │
      │                   │<─ 7. Read Stream ──│                  │                   │                   │
      │                   │── 8. SSE Push ───────────────────────────────────────────────────────────────>│
      │                   │                    │                  │                   │   (Render Node 1) │
      │                   │                    │                  │── 9. Root Cause ──>│                   │
      │                   │                    │                  │<─ 10. Hypotheses ─│                   │
      │                   │                    │                  │── 11. Critic Test >│                   │
      │                   │                    │                  │<─ 12. Objections ─│                   │
      │                   │                    │<─ 13. Verdict ───│                   │                   │
      │                   │── 14. Final SSE Event ───────────────────────────────────────────────────────>│
      │                   │                    │                  │                   │   (Verdict Ready) │
      │                   │                    │                  │                   │                   │
      │                   │<── 15. POST /approve (Human Signs Off) ───────────────────────────────────────│
      │                   │── 16. Save Audit Log & Unlock Station ────────────────────────────────────────>│
```

---

## 5. Error Handling & Inconclusive Safeguards

| Failure Condition | Detection Point | System Response & Safeguard |
| :--- | :--- | :--- |
| **Conflicting Sensor Readings** | `AdversarialCriticAgent` / `ContradictionChecker` | Sets status to `INCONCLUSIVE_CONTRADICTIONS`, caps confidence at 45%, and locks auto-restart until a human engineer performs a physical multimeter check. |
| **Missing Telemetry Channel** | `TriageAgent` | Flags missing data in evidence list and applies an explicit penalty to the confidence score. |
| **Local Model Timeout / Crash** | `AsyncOllamaClient` | Automatically retries up to 2 times with backoff, then falls back to pure deterministic baseline rule-checking. |
| **Malformed Model Output** | Pydantic Schema Validation | Intercepts invalid JSON structure, requests instant re-generation with error feedback, or surfaces raw validation state to the critic. |
