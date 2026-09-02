# ReliAI — Main Web Platform Backend & Production Architecture

## 1. System Role & Architecture Overview

The ReliAI Web Platform Backend is the **mission control orchestrator and data gateway**. It connects factory floor IoT edge devices, PLC controllers, and human reliability engineers with the autonomous AI investigation harness.

### Key Responsibilities:
1. **Incident Ingestion & Pre-processing**: Captures telemetry snapshots, thermal imagery, and acoustic recordings when a machine trip or defect occurs.
2. **Investigation Orchestration**: Coordinates asynchronous multi-agent investigation jobs and streams live thought processes to web clients.
3. **Evidence & Baseline Storage**: Maintains golden operating specifications, historical failure records, and standard operating procedures (SOPs).
4. **Human-in-the-Loop Audit Trail**: Persists all human approvals, overrides, and technician dispatch actions for strict industrial compliance.
5. **Real-Time Event Broadcasting**: Uses high-throughput Pub/Sub to push streaming agent deliberations to connected command center dashboards.

---

## 2. Technology Stack & Architectural Justifications

### Core Backend Engine: FastAPI & Uvicorn (ASGI)
- **Asynchronous Concurrency**: Built on Python's native async event loop, capable of managing thousands of concurrent sensor connections and live SSE data streams simultaneously.
- **Zero-Copy Data Validation**: Enforces rigorous type safety and structured serialization at the API boundary, preventing malformed telemetry from corrupting the database.
- **Unified Python Ecosystem**: Shares data models, types, and mathematical utilities directly with the AI investigation harness, avoiding multi-language translation bugs.

### Primary Database: PostgreSQL with `pgvector`
- **ACID Reliability for Mission-Critical Logs**: Industrial incident reports, maintenance history, and human sign-offs require strict relational guarantees and audit permanence.
- **Integrated Vector Search for SOPs**: The `pgvector` extension allows the system to perform high-speed cosine similarity searches over maintenance manuals and historical incidents directly within PostgreSQL. This eliminates the operational overhead, cost, and synchronization issues of maintaining a separate third-party vector database (such as Pinecone or Milvus).

### In-Memory Cache & Message Broker: Redis
- **Low-Latency Streaming Buffer**: Acts as the real-time event bus that decouples the AI reasoning engine from the web gateway, ensuring that streaming agent tokens are delivered to the frontend without blocking API threads.
- **Telemetry Snapshot Caching**: Temporarily holds high-frequency sensor time-series buffers until an incident trigger commits them to persistent storage.

---

## 3. Data Model & Storage Design

The backend data architecture is structured around four primary domains:

### 1. Incident Domain
- Tracks individual failure events across factory stations.
- Records station IDs, severity levels, failure timestamps, and links to raw sensor snapshots (thermal frames, audio clips, voltage logs).
- Stores final investigation outcomes, including the primary validated root cause, calculated confidence scores, contradiction flags, and recommended mitigation procedures.

### 2. Evidence & Baseline Domain
- Stores "Golden Run" specifications (ideal joint angles, nominal torque ranges, standard operating temperatures, and baseline audio harmonic profiles).
- Stores vectorized Standard Operating Procedures (SOPs), machine schematics, and previous maintenance records used for contextual retrieval.

### 3. Agent Deliberation Domain
- Captures chronological execution traces for every agent in the pipeline (Triage, Telemetry, Quality, Maintenance, Root Cause, Critic).
- Records specific hypotheses, counter-arguments, cited evidence links, and confidence adjustments generated during an investigation run.

### 4. Human Authorization & Governance Domain
- Maintains immutable audit logs of all human actions (Approval, Override, Field Dispatch).
- Records engineer identity, timestamp, decision rationale, and post-action verification status for regulatory compliance (e.g., ISO 9001 and OSHA safety audits).

---

## 4. Real-Time Streaming & Communication Pipeline

1. **Trigger Ingestion**: A PLC trip, sensor threshold breach, or operator report posts an incident payload to the ingestion gateway.
2. **Background Job Dispatch**: The backend registers the incident, saves raw assets, and dispatches an asynchronous job to the AI Investigation Harness.
3. **Pub/Sub Event Fanout**: As the AI agents execute, intermediate progress events (hypotheses, evidence retrieval, critic challenges) are published to a dedicated Redis channel.
4. **Server-Sent Events (SSE) Delivery**: The web gateway reads from the Redis channel and streams JSON-formatted events down to active browser sessions via long-lived HTTP connections.
5. **Completion & Final State Commit**: Once the Critic loop completes and the confidence engine generates the final verdict, the incident transitions to a pending-approval state, and the connection is gracefully finalized.

---

## 5. Performance-to-Cost Analysis on Small Edge Servers

### Resource Footprint Analysis:
- **FastAPI / Uvicorn**: Consumes approximately **60MB to 90MB of RAM** under normal operation and can handle over **4,500 asynchronous requests per second per CPU core**.
- **PostgreSQL with pgvector**: Operates smoothly within **150MB to 250MB of RAM** for typical factory installation databases.
- **Redis (Alpine)**: Requires only **20MB to 30MB of RAM**.
- **Total Web Backend Footprint**: **Under 400MB of RAM total**, leaving virtually all system memory and compute resources available for on-premise AI model execution.

### Deployment Viability:
- **Factory Floor Industrial PC**: Easily deploys on standard fanless IPC hardware (e.g., quad-core Intel i5/i7 with 8GB-16GB RAM) with **zero recurring cloud software expenses**.
- **Private Cloud Infrastructure**: Can be hosted on a basic **$10 to $20/month** virtual private server (VPS) with 2 vCPUs and 4GB RAM to monitor multiple distributed plant lines.

---

## 6. Security, Isolation & Production Readiness

1. **Air-Gapped Operation**: The entire backend stack can operate without external internet connectivity, ensuring proprietary manufacturing telemetry and design files never leave the plant network.
2. **Role-Based Access Control (RBAC)**: Enforces permission boundaries between Line Operators (view-only), Reliability Engineers (investigate and propose), and Plant Supervisors (approve mitigations and clear safety locks).
3. **Containerized Architecture**: Packaged into isolated Docker containers with health checks, automatic restarts, and volume mounts for persistent database storage.
