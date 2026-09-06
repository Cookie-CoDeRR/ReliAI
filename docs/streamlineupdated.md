# ReliAI Project Context & Streamlined Architecture

This document provides a consolidated context, architectural overview, phase implementation history, and development guidelines for the ReliAI Backend (Kushagra Vertical).

---

## 1. Developer Responsibilities & Ownership Boundaries

### Kushagra (Backend Vertical)
- **Tool Access Layer**: Log search, maintenance history, historical incidents, sensor telemetry retrieval, SOP & document search.
- **Evidence Service**: Evidence collection, multi-source evidence synthesis, normalized `EvidenceItem` generation.
- **Report Service**: Automated Markdown & JSON incident investigation report compilation.
- **Upload / Ingestion Subsystem**: PDF, CSV, TXT, LOG, PNG, JPEG file upload, parsing, text extraction, project-relative storage, and document evidence integration.
- **System Services & Status**: Live zero-secret health monitor across database, LLM client, disk storage, and tool registry.
- **ToolGateway Adapter**: Unified async string-dispatch bridge connecting Tarun's multi-agent orchestrator to Kushagra's backend services.

### Tarun (AI Harness & Frontend Vertical)
- **Investigation Control Layer**: `POST /api/v1/investigations/start`, investigation run management, deterministic plan generation.
- **Multi-Agent Orchestrator**: `harness/orchestrator.py`, agent deliberation pipelines, Gemma + Qwen2.5-VL vision agent execution.
- **SSE Event Streaming**: Server-Sent Events for real-time deliberation graph streaming.
- **Frontend Command Center**: React 19 + Three.js 3D Digital Twin Command Center (`src/*`).

---

## 2. Phase Implementation History

### Phase 1: Tool Access Service & System Status API
- **Commit**: `b3b1d71 feat(backend): implement Kushagra Phase 1 - Tool Access Service & System Status API`
- **Key Modules**:
  - `web_backend/services/tool_service.py`: `ToolAccessService` providing `search_logs()`, `get_maintenance_history()`, `find_similar_incidents()`, `get_sensor_data()`, `search_documents()`.
  - `web_backend/services/system_service.py`: `SystemService` exposing zero-secret operational status across DB, Ollama LLM, storage, and tool registry.
  - `web_backend/router.py`: REST routes `/api/v1/system/status`, `/api/v1/tools/available`, `/api/v1/tools/search-logs`, `/api/v1/tools/maintenance-history`, `/api/v1/tools/similar-incidents`, `/api/v1/tools/sensor-data`, `/api/v1/tools/search-documents`.
  - `tests/test_kushagra_phase1.py`: Unit and integration test suite.

### Phase 2: Evidence Service & Report Service
- **Commit**: `96b560e feat(backend): implement Evidence and Report Services`
- **Key Modules**:
  - `web_backend/services/evidence_service.py`: `EvidenceService` for extracting and normalizing evidence across telemetry (`get_telemetry_evidence`), log traces (`get_log_evidence`), maintenance SOPs/audits (`get_maintenance_evidence`), historical precedents (`get_similar_incident_evidence`), document searches (`get_document_evidence`), and full incident dossiers (`get_all_evidence`).
  - `web_backend/services/report_service.py`: `ReportService` generating structured investigation reports with executive summaries, empirical evidence tables, causal chains, and mitigation plans.
  - `web_backend/router.py`: Added `GET /api/v1/incidents/{incident_id}/evidence` and `GET /api/v1/incidents/{incident_id}/report`.
  - `tests/test_kushagra_phase2.py`: Verification test suite.

### Phase 3: Upload & Ingestion Subsystem
- **Commit**: `45c19a7 feat(backend): implement file upload and ingestion`
- **Key Modules**:
  - `web_backend/models.py`: `UploadRecord` SQLAlchemy model with `FK("incidents.id", ondelete="SET NULL")`.
  - `web_backend/services/ingestion_service.py`: `IngestionService` parsing PDF (`pypdf`), CSV (`csv`), TXT/LOG (log level scanning), PNG, and JPEG (magic byte validation) into normalized text & metadata.
  - `web_backend/services/upload_service.py`: `UploadService` enforcing 10MB payload limits, filename sanitization, UUID paths under project-relative `uploads/`, record persistence, raw download, and deletion.
  - `web_backend/router.py`: REST endpoints `POST /uploads`, `GET /uploads`, `GET /uploads/{id}`, `GET /uploads/{id}/file`, `DELETE /uploads/{id}`.
  - `tests/test_kushagra_phase3.py`: 10 test functions covering all 20 ingestion scenarios.

### Phase 4.1: ToolGateway Adapter Integration
- **Commit**: `5828acc feat(backend): add ToolGateway adapter`
- **Key Modules**:
  - `web_backend/services/tool_gateway_adapter.py`: `ToolGatewayAdapter` bridging string tool calls (`"search_logs"`, `"get_maintenance_history"`, `"find_similar_incidents"`, `"get_incident_evidence"`, `"search_documents"`) to backend services via `invoke_tool(tool_name, params, db)`.
  - `web_backend/services/__init__.py`: Exported `ToolGatewayAdapter`.
  - `tests/test_kushagra_tool_gateway.py`: Initial integration test suite.

### Phase 4.2: Comprehensive ToolGateway Verification & Hardening
- **Commit**: `0b3f62b feat(backend): harden ToolGateway adapter`
- **Key Modules**:
  - `web_backend/services/tool_gateway_adapter.py`: Added safe integer coercion (`_safe_int`) for `limit` and `offset`, explicit `db` session requirement checks for database-dependent tools, and whitespace trimming for tool names.
  - `tests/test_kushagra_tool_gateway.py`: Expanded to 21 targeted unit and integration tests covering parameter coercion, error isolation, async execution, JSON serializability, missing params, invalid tools, and non-regression.
- **Verification Summary**:
  - Targeted Gateway tests: **21 passed in 0.62s**
  - Complete repository test suite: **76 passed in 159.30s (0:02:39)**
  - Syntax & whitespace check (`git diff --check`): **Clean (0 errors)**

---

## 3. Git Workflow & Safety Rules

1. **Current Working Branch**: `feature/db-history`
2. **Base Integration Branch**: `tarun/final-integration` (PR #4)
3. **Database File Exclusion (`reliai.db`)**:
   - `reliai.db` is runtime-generated during test execution.
   - **MUST NEVER BE STAGED OR COMMITTED.**
   - Never run `git add .` or `git commit -a`. Always stage specific target files explicitly (e.g. `git add docs/streamlineupdated.md`).
4. **No Direct Merges**: Push only to `origin/feature/db-history`. Merging PR #4 into `tarun/final-integration` or `main` is strictly reserved for Tarun/maintainers.
5. **Protect Tarun-Owned Code**: Never modify `harness/orchestrator.py`, `harness/agents/*`, `src/*`, or live SSE streaming implementation.

---

## 4. Testing & Verification Checklist

Before completing any backend task, execute:

```bash
# 1. Run targeted phase test suite
py -3.13 -m pytest tests/test_kushagra_tool_gateway.py

# 2. Run complete repository test suite
py -3.13 -m pytest tests/

# 3. Check for whitespace/syntax warnings
git diff --check

# 4. Assert staging area cleanliness
git status
```

---

## 5. Summary of Registered Backend Gateway Tools

| Tool Identifier | Service Method | Description |
| :--- | :--- | :--- |
| **`search_logs`** | `ToolAccessService.search_logs` | Searches stored agent traces and system log entries. |
| **`get_maintenance_history`** | `ToolAccessService.get_maintenance_history` | Retrieves maintenance SOP procedures and technician dispatch audits. |
| **`find_similar_incidents`** | `ToolAccessService.find_similar_incidents` | Queries historical failure incidents by station, domain, severity, or keyword. |
| **`get_incident_evidence`** | `EvidenceService.get_incident_evidence` | Retrieves normalized empirical evidence items for an incident. |
| **`search_documents`** | `ToolAccessService.search_documents` | Searches industrial SOPs, golden specs, scenario benchmarks, and uploaded files. |
