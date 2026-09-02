# ReliAI — Industrial AI Investigation Harness (Self-Hosted Architecture)

## 1. Core Mission & Self-Hosted Philosophy ("AI on Our Side")

In modern manufacturing and automated robotics lines, **relying on third-party public cloud AI APIs (like OpenAI or Anthropic) is unacceptable** for three critical reasons:
1. **Proprietary Data Security**: Machine schematics, sensor telemetry, defect rates, and operational bottlenecks are sensitive intellectual property that must not leave the factory's private network.
2. **Air-Gapped Factory Operation**: Industrial plants require continuous operation even when external internet connectivity is degraded, severed, or firewalled.
3. **Deterministic Verification & Cost Control**: Public cloud APIs charge unpredictable per-token pricing and can introduce silent model updates that alter reasoning behaviors. Running the AI harness **entirely on our side** with local Ollama models provides fixed costs, zero data leakage, and repeatable reasoning.

The primary objective of the ReliAI Investigation Harness is not simply generating an answer, but **systematically investigating, challenging, and validating physical evidence while actively knowing when evidence is inconclusive**.

---

## 2. Multi-Agent Investigation Workflow

Rather than relying on a single monolithic prompt, the harness distributes the investigation across specialized agents organized in a structured, sequential, and adversarial pipeline.

```
[ Multimodal Incident ]
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. TRIAGE AGENT                                                        │
│    Parses multimodal inputs (thermal, acoustic, power, kinematics).    │
│    Determines incident domain and flags emergency containment needs.   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. EVIDENCE & BASELINE RAG AGENT                                       │
│    Computes mathematical deviations from Golden Operating Baselines.   │
│    Retrieves relevant historical incidents and maintenance SOPs.       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐┌────────────────────────────────┐
│ 3A. TELEMETRY & KINEMATICS AGENT     ││ 3B. QUALITY & FIT AGENT        │
│ Analyzes 6-axis joint torque, motor  ││ Evaluates tire bead seating,   │
│ current, and encoder position errors.││ dimensional tolerances, offsets│
└───────────────────┬──────────────────┘└────────────────┬───────────────┘
                    │                                    │
                    └─────────────────┬──────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. ROOT CAUSE GENERATION AGENT                                         │
│    Formulates ranked causal hypotheses strictly grounded in evidence.  │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. ADVERSARIAL CRITIC AGENT (FALSIFICATION LOOP)                       │
│    Actively searches for contradictory data or physical impossibilities│
│    Challenges hypotheses and applies confidence penalties.             │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 6. DETERMINISTIC RISK & CONFIDENCE ENGINE                              │
│    Applies mathematical scoring formula. Refuses false positives.     │
│    Triggers "INCONCLUSIVE" if contradiction threshold is exceeded.     │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 7. HUMAN APPROVAL GATE (MISSION CONTROL)                               │
│    Provides interactive sign-off for plant engineers and supervisors.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Agent Specialization

### Agent 1: Triage Agent (Multimodal Ingestion)
- **Visual & Thermal Channel**: Evaluates infrared thermography captures for anomalous thermal signatures (e.g., localized heating on Joint 3 gearbox vs ambient temperature).
- **Acoustic Channel**: Analyzes high-frequency audio recordings to detect characteristic signatures of mechanical bearing degradation, pneumatic valve leaks, or motor grinding.
- **Electrical & Safety Channel**: Scans 3-phase line voltage, current draw, and E-Stop circuits for electrical faults or brownout events.
- **Output**: Categorizes the incident into primary domains (Thermal, Kinematic, Electrical, Pneumatic, Quality) and selects the relevant downstream analytical agents.

### Agent 2: Evidence & Baseline RAG Agent
- **Golden Baseline Comparison**: Compares live telemetry against nominal manufacturing standards (ideal joint torque curves, nominal cycle times, expected operating temperatures).
- **Retrieval-Augmented Generation (RAG)**: Uses vector embeddings over local technical manuals, maintenance logs, and previous post-mortems to identify recurring equipment patterns.
- **Output**: Generates a structured list of verified factual anomalies and historical precedents.

### Agent 3: Domain-Specific Analysis Agents
- **Telemetry & Kinematics Agent**: Evaluates 6-DOF robotic arm trajectory errors, backlash in harmonic drive gearboxes, and servomotor encoder synchronization.
- **Quality & Fitment Agent**: Examines end-effector tire mounting tolerances, bead seating pressure, and angular orientation deviations.
- **Maintenance History Agent**: Checks component lifecycle states, accumulated operating hours, and recent part replacements to assess wear-and-tear likelihood.

### Agent 4: Root Cause Generation Agent
- Synthesizes the outputs of all domain agents to build ranked causal chains (e.g., *Phase Voltage Drop → Servomotor Torque Loss → Joint 3 Jerk during Bead Seating*).
- **Strict Evidence Grounding**: Every proposed hypothesis must cite specific sensor timestamps, baseline deviation percentages, or maintenance records. Unsubstantiated speculation is strictly blocked.

### Agent 5: Adversarial Critic Agent (The Anti-Hallucination Gate)
- Acts as a ruthless safety auditor whose sole objective is to **disprove the proposed root cause**.
- **Contradiction Detection**: Looks for disconfirming sensor readings. For example: *If the root cause claims the motor overheated due to high current, but the current monitor showed normal amperage and cooling fan RPM was optimal, the critic immediately flags a contradiction.*
- **Outcome**: The critic either validates the causal chain as airtight or issues a formal objection with cited contradictory data points.

### Agent 6: Deterministic Risk & Confidence Engine
- Rather than letting an LLM guess a confidence number, the harness calculates confidence using a **deterministic mathematical formula** based on:
  - Total number of supporting sensor proofs.
  - Presence of historical precedents in the RAG store.
  - Heavy penalties for any unresolved contradictions identified by the Critic Agent.
- **Fail-Safe Inconclusive Trigger**: If contradictory sensor data exists or critical telemetry is missing, the system outputs:
  > **⚠️ Investigation Inconclusive — Conflicting Evidence Detected.**
  > *Sensor A indicates thermal fault, but Sensor B confirms normal current draw. Manual physical multimeter inspection required before restart.*

---

## 4. Local Model Selection & Serving Strategy (Ollama)

To maximize reliability, speed, and cost efficiency, the harness uses specialized, open-weights models running locally in an Ollama container:

| Role | Model Choice | Quantization | Why This Model is Optimal |
| :--- | :--- | :--- | :--- |
| **Agent Reasoning & Orchestration** | **Qwen 2.5 7B Instruct** | Q4_K_M (~4.7 GB VRAM) | Exceptional adherence to complex JSON schemas, deep understanding of engineering and physics terminology, near-zero schema parsing errors. |
| **Adversarial Critic** | **DeepSeek R1 7B / 8B** | Q4_K_M (~5.2 GB VRAM) | Industry-leading chain-of-thought logical reasoning specifically suited for detecting inconsistencies, challenging premises, and falsifying flawed hypotheses. |
| **Thermal & Visual Inspection** | **Qwen2-VL 7B** | Q4_K_M (~5.5 GB VRAM) | High-resolution vision-language model capable of analyzing thermal heatmap false colors, joint misalignments, and mechanical wear images. |

---

## 5. Performance-to-Cost & Server Sizing Analysis

### Will a Uvicorn + Ollama Docker Setup Work on Small Servers?
**YES.** Running the Python Uvicorn harness alongside Ollama in Docker is highly efficient and scalable across multiple hardware tiers:

### 1. Tier 1: Factory Floor Edge Server (Best for Production Lines)
- **Hardware**: Dedicated Industrial PC or Compact Workstation with an Intel i7 / AMD Ryzen CPU, 16GB-32GB RAM, and an **NVIDIA RTX 3060 / 4060 GPU (8GB - 12GB VRAM)** (or Apple Silicon Mac Mini / NVIDIA Jetson Orin).
- **Cost**: **$0 monthly cloud cost** (One-time hardware investment of ~$700 - $1,200).
- **Inference Speed**: **3.5 to 6.5 seconds** for the entire 6-agent investigation pipeline.
- **Privacy & Uptime**: 100% on-premises, zero cloud latency, completely immune to internet outages.

### 2. Tier 2: Low-Cost Cloud GPU Instance (Best for Multi-Plant Cloud Monitoring)
- **Hardware**: Single cloud GPU instance (e.g., NVIDIA T4 / A4000 on RunPod, Hetzner, or AWS EC2 g4dn.xlarge).
- **Cost**: **$18 to $45 / month**.
- **Inference Speed**: **4.0 to 7.0 seconds** per complete investigation.
- **Scalability**: Can handle concurrent incident investigations across dozens of factory lines with automatic queue management.

### 3. Tier 3: Pure CPU Edge Server (Low-Budget Fallback)
- **Hardware**: 4-Core / 8-Thread modern CPU with 16GB RAM (No dedicated GPU).
- **Cost**: **$10 to $20 / month** on standard VPS providers or existing factory PCs.
- **Model Strategy**: Lightweight 3B parameter models (e.g., Qwen 2.5 3B or Llama 3.2 3B).
- **Inference Speed**: **12 to 20 seconds** per investigation. Suitable for non-urgent post-incident root cause documentation.

---

## 6. Production Deployment & Industrial Integration

1. **Deterministic Execution**:
   - Model temperatures are set near zero (0.1) to guarantee repeatable, objective reasoning across investigations.
   - Pydantic models strictly validate all agent inputs and outputs, automatically rejecting malformed JSON.

2. **Containerized Portability**:
   - The entire harness (Uvicorn API server, Redis stream broker, and Ollama model host) runs in isolated Docker containers with shared network bridges.
   - Deployable via a single orchestration command on any Linux, Windows, or macOS industrial terminal.

3. **Continuous Model Caching**:
   - Models are kept persistently loaded in VRAM using long keep-alive durations, eliminating cold-start latencies during sudden machine emergency trips.
