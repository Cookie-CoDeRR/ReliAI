# ReliAI — Development Changelog & Activity History

All major architectural decisions, branch operations, and code updates are documented below in chronological order.

---

## 📅 [2026-09-02] — Ground Zero Setup & Architecture Blueprints

### ⏱️ 16:51:50 IST (+05:30) — Phase 1 & 2 Execution (Data Contracts, Baseline Engine & Ollama Client)
- **Implemented**:
  - `requirements.txt` & `pyproject.toml`: Python 3.10+ package dependencies and test configuration.
  - `harness/schemas.py`: Pydantic v2 data models for Multimodal Telemetry, Evidence Items, Triage, Hypotheses, Critic Evaluations, and Investigation Verdicts.
  - `baselines/golden_run_specs.json`: Reference tolerances and operating envelopes for 6-DOF robotic arm tire-mounting station.
  - `sops/maintenance_sops.json`: Knowledge base of standard operating procedures and historical failure mechanisms.
  - `harness/baseline_engine.py`: Mathematical baseline deviation detector and SOP matching engine.
  - `harness/ollama_client.py`: Async Ollama client with structured JSON enforcement and deterministic offline fallbacks.
  - `tests/`: Complete unit test suite (`test_schemas.py`, `test_baseline_engine.py`, `test_ollama_client.py`) with 100% pass rate across all 8 test cases.

---

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
