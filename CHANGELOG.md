# ReliAI — Development Changelog & Activity History

All major architectural decisions, branch operations, and code updates are documented below in chronological order.

---

## 📅 [2026-09-04] — Multi-Branch Harmonization & Integration

### ⏱️ 19:35:00 IST (+05:30) — Multi-Branch Integration & Frontend Service Layer
- **Branch Synchronization & Merge**:
  - Fetched and analyzed all remote branches: `origin/main`, `origin/tarun/final-integration`, `origin/tarun/frontend-docs`, `origin/tarun/integration`, and `origin/example-render`.
  - Merged work from `origin/ai-harness` incorporating pull requests #1 (`tarun/final-integration`) and #2 (`tarun/frontend-docs`).
  - Integrated dedicated `FRONTEND_README.md` containing architectural walkthroughs of the React 19 / Three.js digital twin command center.
  - Upgraded 3D robotic arm rendering in `RobotViewer.jsx` to load `roboticArm.glb` and sanitized temperature readout formatting.
  - Implemented centralized frontend API client service `src/services/api.js` encapsulating scenario fetching, incident triggering, and engineer approval workflows.
  - Maintained domain-consistency safety gates in `RootCauseAgent` and extended Ollama deterministic electrical fallbacks.
  - Verified 100% test suite pass rate (35/35 passing tests) and clean production bundle compilation.

---

## 📅 [2026-09-02] — Ground Zero Setup & Architecture Blueprints

### ⏱️ 18:05:00 IST (+05:30) — Comprehensive Security Hardening & Runtime Fault Tolerance Implemented
- **Critical Vulnerability Remediations**:
  - `main.py`: Fixed broken CORS configuration (`allow_origins` now enforces explicit origin allowlists rather than insecure `*` with credentials). Attached singleton `orchestrator` to `app.state`.
  - `harness/agents/triage_agent.py`: Neutralized LLM prompt injection by encapsulating `operator_shift_notes` within strict untrusted delimiter fences and safety system instructions. Truncated anomaly arrays to top 10 items to prevent Gemma 4096 context window exhaustion.
  - `web_backend/router.py`: Eliminated duplicate `InvestigationOrchestrator` construction by introducing FastAPI dependency injection (`get_orchestrator`). Added regex safety validation on `scenario_id` preventing path traversal.
  - `harness/schemas.py`: Added 10MB payload size validator on `image_base64` to prevent edge memory DoS. Added note sanitizer and normalized `severity` fields to `Literal["CRITICAL", "HIGH", "MODERATE", "NOMINAL"]`.
- **Runtime Fault Tolerance & Upgrades**:
  - `web_backend/service.py`: Wrapped investigation lifecycle in robust `try...except` block, transitioning incidents to `"FAILED"` on fatal engine crash to prevent forever-stuck `"INVESTIGATING"` records.
  - `harness/agents/vision_agent.py`: Added `vision_status` and error tracking to surface camera inspection failures.
  - `harness/orchestrator.py`: Integrated `asyncio.Semaphore(2)` to throttle concurrent LLM executions and prevent edge VRAM over-allocation.
  - `src/App.jsx`: Added a 2-minute `AbortController` timeout on frontend SSE connections.
  - `tests/test_security_fixes.py`: Added 5 unit tests validating security patches (all 32 tests passing 100%).

---

### ⏱️ 17:41:00 IST (+05:30) — Gemma Unified Brain & Qwen2.5-VL Multimodal Vision Agent Implemented
- **Consolidated on Lean RAM-Optimized Architecture**:
  - `harness/ollama_client.py`: Configured Google Gemma (`gemma2:latest` / `gemma2:2b` / `gemma:4b`) as the unified brain for both the Main Reasoning Agents (Triage, Telemetry, Root Cause) AND the Adversarial Critic Agent, drastically cutting edge VRAM usage to < 6GB.
  - `harness/agents/vision_agent.py`: Implemented specialized Multimodal Vision Agent routing camera frames and FLIR IR thermography to `qwen2.5-vl:7b-instruct-q4_K_M`.
  - `harness/schemas.py`: Added `VisualDefectItem` (with normalized bounding boxes `[ymin, xmin, ymax, xmax]`) and `MachineryImageFrame` models.
  - `harness/orchestrator.py`: Integrated `VisionAgent` into parallel Step 3 domain analysis to auto-extract and merge visual empirical evidence.
  - `scripts/init_models.sh`: Updated model initialization script to pre-pull the optimized duo (`gemma2:latest` + `qwen2.5-vl:7b-instruct-q4_K_M`).
- **Test Suite Results**:
  - 27 automated test cases passing in 0.44s (100% pass rate across schemas, agents, vision inspector, orchestrator scenarios, and API endpoints).

---

### ⏱️ 17:16:30 IST (+05:30) — Phase 8 Execution: React 19 + Three.js Command Center Completed
- **Implemented Interactive 3D Digital Twin Command Center**:
  - `src/components/RobotViewer.jsx`: 6-axis KUKA KR-210 robotic arm digital twin with dynamic fault joint shaders (glowing red thermal/torque overlays on Joint 3), contact shadows, and orbit controls.
  - `src/components/ScenarioSelector.jsx`: One-click execution bar for the 4 industrial failure scenario presets.
  - `src/components/AgentDeliberationGraph.jsx`: Real-time node graph visualizing multi-agent reasoning (Triage ➔ Evidence RAG ➔ Domain Analysis ➔ Root Cause ➔ Adversarial Critic ➔ Confidence Engine).
  - `src/components/MultimodalInspector.jsx`: FLIR IR thermal matrix heatmap, 48kHz acoustic FFT spectrogram canvas visualizer, and 3-phase power/pneumatic gauges.
  - `src/components/CriticDebateView.jsx`: Side-by-side adversarial comparison between Root Cause hypotheses and Critic falsification objections.
  - `src/components/HumanApprovalBar.jsx`: Human-in-the-loop authorization gateway (`APPROVE`, `OVERRIDE`, `DISPATCH_TECH`) with verified confidence scoring.
  - `src/App.jsx`: Master mission control coordinating live SSE streaming, scenario benchmarks, and 3D twin animations.
- **Build & Test Verification**:
  - Vite production build passing with 0 errors (`dist/` bundle compiled in 3.48s).
  - All 25 backend/agent/orchestrator pytest unit and scenario tests passing 100%.

---

### ⏱️ 17:12:00 IST (+05:30) — Web Platform Backend, Database Persistence & Scenario Presets Completed
- **Implemented Industrial Scenario Presets** (`scenarios/`):
  - `scenario_1_joint3_thermal_overheat.json`: 88.5°C thermal runaway with torque saturation and 2.8kHz acoustic harmonics.
  - `scenario_2_pneumatic_gripper_drop.json`: Gripper pressure drop to 4.0 bar with 1.8mm bead seating offset.
  - `scenario_3_contradictory_sensor_fault.json`: 92°C false thermocouple overheat with nominal current and silent acoustics.
  - `scenario_4_electrical_voltage_sag.json`: 3-Phase line voltage sag to 365V RMS.
- **Implemented Async Database Persistence** (`web_backend/`):
  - `database.py`: Async SQLAlchemy engine with SQLite/PostgreSQL support.
  - `models.py`: `IncidentRecord`, `AgentTraceRecord`, and `ApprovalAuditRecord` models.
  - `service.py`: Incident ingestion, full multi-agent investigation execution with trace recording, and human-in-the-loop authorization logging.
  - `router.py`: REST API router mounted under `/api/v1/` (`/scenarios`, `/scenarios/{id}/trigger`, `/incidents/ingest`, `/incidents`, `/incidents/{id}`, `/incidents/{id}/investigate`, `/incidents/{id}/approve`).
- **Test Suite Results**:
  - 25 automated test cases passing in 0.45s (100% pass rate across schemas, agents, orchestrator scenarios, FastAPI endpoints, database persistence, and human authorization lifecycle).

---

### ⏱️ 17:04:30 IST (+05:30) — Phases 3, 4, 5 & 6 Execution (Agents, Critic Loop, Orchestrator & REST/SSE Service)
- **Implemented Specialized Autonomous Agents**:
  - `harness/agents/triage_agent.py`: Multimodal ingestion, domain categorization, severity calculation.
  - `harness/agents/evidence_rag_agent.py`: Baseline deviation extraction and SOP knowledge retrieval.
  - `harness/agents/telemetry_agent.py`: 6-axis joint kinematics, torque overdraw, and voltage stability analysis.
  - `harness/agents/quality_fit_agent.py`: Tire bead seating radial offset, angular misalignment, and clamping check.
  - `harness/agents/maintenance_agent.py`: Component lifecycle, fatigue cycles, and overdue lubrication monitoring.
- **Implemented Adversarial Reasoning & Anti-Hallucination Engine**:
  - `harness/agents/root_cause_agent.py`: Formulates ranked causal chains with strictly cited evidence IDs.
  - `harness/agents/critic_agent.py`: Falsification auditor detecting contradictory sensor telemetry.
  - `harness/agents/confidence_engine.py`: Deterministic mathematical confidence calculator with explicit `INCONCLUSIVE` safeguards on conflicting data.
- **Implemented Multi-Agent Orchestrator & API Service**:
  - `harness/orchestrator.py`: Async state machine coordinating all agents and streaming real-time deliberation events.
  - `main.py`: FastAPI / Uvicorn server exposing REST (`/harness/investigate`, `/harness/baselines`, `/harness/sops`, `/harness/health`) and Server-Sent Events (`/harness/investigate/stream`).
  - `Dockerfile` & `docker-compose.yml`: Production containerization with local Ollama inference service.
  - `scripts/init_models.sh`: Model pre-pull initialization script.
- **Test Suite Results**:
  - 22 automated test cases passing in 0.25s (100% pass rate across schemas, baseline engine, domain agents, critic contradiction refusal, orchestrator scenarios, and API endpoints).

---

### ⏱️ 16:51:50 IST (+05:30) — Phase 1 & 2 Execution (Data Contracts, Baseline Engine & Ollama Client)

### ⏱️ 16:48:30 IST (+05:30) — Ground Zero Clean-Up & Planning Phase
- **Action**: Cleaned up the `ai-harness` branch to start from a clean Ground Zero state.
  - Removed frontend prototype files (`src/`, `public/`, `dist/`, `node_modules/`, `vite.config.js`, `package.json`).
  - The 3D Digital Twin frontend prototype remains fully preserved on the [`example-render`](https://github.com/Cookie-CoDeRR/ReliAI/tree/example-render) branch.
- **Created**:
  - `DEVELOPMENT_PLAN.md`: Comprehensive 8-phase implementation roadmap for the AI Investigation Harness.
  - `CHANGELOG.md`: Chronological changelog with precise timestamps.
  - `ENDPOINTS_AND_FLOWS.md`: Complete API, SSE, and internal agent call graphs and sequence flows.
- **Updated**: `.gitignore` optimized for Python virtual environments, PyTorch/NumPy cache, and local Ollama model files.

---

### ⏱️ 16:45:50 IST (+05:30) — Branch Creation: `ai-harness`
- **Action**: Created and published new active development branch `ai-harness`.
- **Git Tracking**: Branch set up to track `origin/ai-harness` on GitHub.
- **Repository URL**: [Cookie-CoDeRR/ReliAI (tree/ai-harness)](https://github.com/Cookie-CoDeRR/ReliAI/tree/ai-harness)

---

### ⏱️ 16:45:40 IST (+05:30) — Main Branch Update & Documentation Release
- **Action**: Committed and pushed core architecture blueprints and updated root `README.md` to `main`.
- **Commit Hash**: `17e9ad4`
- **Pushed Files**:
  - `README.md`: Project introduction, problem statement, and multi-agent pipeline overview.
  - `FRONTEND_UI.md`: Pure UI architectural specification with Next.js vs. Vite analysis.
  - `BACKEND_WEBSITE.md`: Web platform architecture with PostgreSQL, Redis, and SSE streaming.
  - `INVESTIGATION_HARNESS_AI.md`: Self-hosted AI harness design, Ollama model strategy, and anti-hallucination critic loop.

---

### ⏱️ 16:43:50 IST (+05:30) — Blueprint Refactoring (Pure Architectural Guides)
- **Action**: Refactored all three markdown documents to remove code blocks and provide deep conceptual and engineering explanations.
- **Key Clarifications Added**:
  - **Why React + Vite SPA over Next.js**: Detailed comparison highlighting WebGL/Three.js client-side rendering, < 10MB Nginx edge memory footprint, and direct communication with the Python AI backend.
  - **Self-Hosted AI ("AI on Our Side")**: Clarified on-premises privacy, air-gapped factory reliability, and local Ollama model selection (`qwen2.5:7b` + `deepseek-r1:7b`).

---

### ⏱️ 16:40:40 IST (+05:30) — Initial Architecture Blueprints Authored
- **Action**: Authored initial comprehensive design specifications across frontend, website backend, and AI harness.
- **Analysis Provided**: Benchmarked small server hardware feasibility, memory footprints (< 400MB backend baseline), and local GPU vs. CPU inference latencies.

---

### ⏱️ 16:36:45 IST (+05:30) — Project Inception: Industrial AI Investigation Harness
- **Action**: Formulated the core ReliAI problem statement and multi-agent architecture for automated robotic arm tire-fitting cells.
- **Defined Core Workflow**:
  - `Incident ➔ Triage Agent ➔ Evidence RAG ➔ Domain Agents (Telemetry, Quality, Maintenance) ➔ Root Cause Agent ➔ Adversarial Critic Agent ➔ Deterministic Risk & Confidence Engine ➔ Human Approval Gate ➔ Investigation Report`.

---

### ⏱️ 16:05:20 IST (+05:30) — 3D Digital Twin Prototype Pushed to `example-render`
- **Action**: Configured Git LFS (`.gitattributes`) to track large 3D models (`roboticArm.glb`, 112MB).
- **Branch Created**: `example-render`
- **Commit Hash**: `b910e0e`
- **GitHub Target**: [Cookie-CoDeRR/ReliAI (tree/example-render)](https://github.com/Cookie-CoDeRR/ReliAI/tree/example-render)
- **Summary**: Uploaded complete working React Three Fiber 3D robotic arm prototype to serve as the visual digital twin reference.

---

## 📌 Repository Branch Directory Summary

| Branch | Purpose | Status |
| :--- | :--- | :--- |
| **`main`** | Official repository documentation and system blueprints | Up-to-date with remote |
| **`example-render`** | 3D Robotic Arm digital twin rendering prototype | Pushed and preserved on remote |
| **`ai-harness`** | Active Ground Zero development branch for the Python AI engine | Active working branch |
