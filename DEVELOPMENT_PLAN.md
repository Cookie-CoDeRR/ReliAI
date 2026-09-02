# ReliAI — Comprehensive Development & Implementation Plan

## 1. Project Mission & Ground Zero Scope

ReliAI is an autonomous **Multi-Agent Industrial AI Investigation Harness** designed to eliminate hallucinations in automated manufacturing failure investigations (specifically for 6-axis robotic arm tire-fitting cells).

This plan outlines the end-to-end engineering roadmap starting from **Ground Zero** on the `ai-harness` branch.

---

## 2. Core Engineering Principles

1. **Self-Hosted "AI on Our Side"**: All inference is powered by local open-weights LLMs via Ollama (`qwen2.5:7b` for structured reasoning, `deepseek-r1:7b` for adversarial criticism) with zero third-party cloud API dependencies.
2. **Evidence-Strict Falsification**: An agent cannot hypothesize without citing sensor timestamps or golden baseline deviations. The Critic Agent actively attempts to disprove all hypotheses before a verdict is reached.
3. **Deterministic Mathematical Confidence**: Confidence is calculated using an objective formula rather than LLM intuition. Contradictions trigger an explicit `"INVESTIGATION INCONCLUSIVE — CONFLICTING EVIDENCE DETECTED"` safeguard.
4. **Human-in-the-Loop Gate**: The harness serves as a decision-support harness. All safety-critical physical mitigations require human sign-off.

---

## 3. Phased Implementation Roadmap

```
Phase 1: Foundation & Data Contracts
   │ (Pydantic v2 schemas, golden baseline specs, SOP vector store)
   ▼
Phase 2: Local Ollama Client & JSON Validation Engine
   │ (Async HTTP client, near-zero temperature, retry & fallback mechanics)
   ▼
Phase 3: Specialized Domain Analysis Agents
   │ (Triage Agent, Baseline RAG Agent, Telemetry Agent, Quality Agent, Maintenance Agent)
   ▼
Phase 4: Adversarial Reasoning Engine
   │ (Root Cause Generator ↔ Critic Falsification Loop)
   ▼
Phase 5: Deterministic Risk & Confidence Calculator
   │ (Contradiction scoring, penalty matrix, inconclusive trigger)
   ▼
Phase 6: Uvicorn Async API Gateway & SSE Broadcaster
   │ (REST endpoints, Server-Sent Events live reasoning feed)
   ▼
Phase 7: Industrial Scenario Test Suite & Benchmarking
   │ (Synthetic datasets: Bearing Failure, Pneumatic Drop, Contradictory Telemetry)
   ▼
Phase 8: Docker Containerization & Web Dashboard Integration
```

---

## 4. Detailed Phase Breakdown

### Phase 1: Foundation & Data Contracts
- **Objective**: Establish strict type safety and baseline comparison standards.
- **Deliverables**:
  - `harness/schemas.py`: Pydantic models for Incident Inputs, Multimodal Telemetry, Evidence Items, Hypotheses, Critic Evaluations, and Final Verdicts.
  - `baselines/golden_run_specs.json`: Reference operating parameters for 6-DOF robotic arm (joint torques, current draw, nominal temperatures, cycle times, tire seating tolerances).
  - `sops/`: Standard Operating Procedures and historical maintenance knowledge base for retrieval.

### Phase 2: Local Ollama Client & Structured JSON Engine
- **Objective**: Build high-speed async communication with local Ollama models.
- **Deliverables**:
  - `harness/ollama_client.py`: Asynchronous HTTP wrapper with connection pooling, timeout handling, and automatic Pydantic schema validation.
  - Prompt templates with strict industrial safety system instructions.

### Phase 3: Specialized Domain Analysis Agents
- **Objective**: Build autonomous agents responsible for investigating individual evidence streams.
- **Deliverables**:
  - `harness/agents/triage_agent.py`: Parses multimodal alerts (thermal, acoustic, power, kinematics) and determines the investigation domain.
  - `harness/agents/evidence_rag_agent.py`: Computes mathematical delta against golden baselines and retrieves relevant SOPs.
  - `harness/agents/telemetry_agent.py`: Detects 6-axis joint torque spikes, encoder jitter, and voltage sag.
  - `harness/agents/quality_fit_agent.py`: Evaluates tire bead seating angles and dimensional tolerances.
  - `harness/agents/maintenance_agent.py`: Calculates component lifecycle wear and flags recent part changes.

### Phase 4: Adversarial Reasoning Engine
- **Objective**: Formulate evidence-backed root causes and challenge them through a critic loop.
- **Deliverables**:
  - `harness/agents/root_cause_agent.py`: Synthesizes domain agent findings into ranked, cited causal chains.
  - `harness/agents/critic_agent.py`: Adversarially audits hypotheses for physical impossibilities, missing proofs, or conflicting sensor data.

### Phase 5: Deterministic Risk & Confidence Calculator
- **Objective**: Eliminate LLM hallucinated confidence scores with a verifiable formula.
- **Deliverables**:
  - `harness/agents/confidence_engine.py`: Computes confidence based on evidence count, historical precedents, and contradiction penalties. Flags investigations as inconclusive when contradictions exceed thresholds.

### Phase 6: Uvicorn Async API Gateway & SSE Broadcaster
- **Objective**: Expose high-performance REST and real-time streaming endpoints.
- **Deliverables**:
  - `main.py`: FastAPI application serving REST endpoints and Server-Sent Events (SSE) streams for live agent deliberation.

### Phase 7: Industrial Scenario Test Suite & Benchmarking
- **Objective**: Validate harness reliability across 4 realistic manufacturing failure scenarios.
- **Deliverables**:
  - `tests/scenarios/bearing_degradation.json` (Acoustic + Thermal anomalies).
  - `tests/scenarios/pneumatic_pressure_drop.json` (Quality alignment fault).
  - `tests/scenarios/conflicting_sensor_data.json` (Tests anti-hallucination refusal).
  - `tests/scenarios/voltage_brownout.json` (Electrical power sag).

### Phase 8: Docker Containerization & Web Dashboard Integration
- **Objective**: Package the entire system for one-command deployment on factory edge PCs.
- **Deliverables**:
  - `Dockerfile` & `docker-compose.yml` orchestrating Uvicorn, Redis, and Ollama.
  - Integration with the React Three Fiber 3D Digital Twin Command Center.

---

## 5. Success Criteria & KPIs

| Metric | Target Goal | Verification Method |
| :--- | :--- | :--- |
| **Investigation Latency** | < 7.0 seconds on budget GPU | End-to-end timing benchmark |
| **Schema Adherence** | 100% valid Pydantic JSON output | Automated schema test runner |
| **Contradiction Detection Rate** | 100% detection on conflicting test cases | Adversarial test suite |
| **False Positive Root Causes** | 0% (Refuses when data is conflicting) | "Inconclusive" state verification |
| **Memory Footprint** | < 6GB VRAM (Ollama) + < 150MB RAM (API) | Docker resource monitoring |
