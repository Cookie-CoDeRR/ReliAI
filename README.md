# 🏭 ReliAI — Industrial AI Investigation Harness

> **“An AI system that doesn't just generate a root cause—it investigates, challenges, validates, and knows when it doesn't know.”**

ReliAI is a mission-critical **Multi-Agent Industrial Incident Investigation Harness** designed for modern automated manufacturing, assembly lines, and robotics stations (e.g. 6-DOF robotic arm tire-fitting cells).

---

## ⚡ The Problem: Hallucinations in Industrial Operations
When an industrial incident occurs (machine stall, sensor anomaly, quality defect, thermal spike, or acoustic grinding), engineers must cross-examine data across multiple disparate systems:
- Real-time PLC & sensor telemetry
- Thermal imaging cameras & acoustic audio recordings
- Maintenance logs & component lifecycle history
- Standard Operating Procedures (SOPs) & Golden Run specifications

Conventional single-prompt AI systems hallucinate plausible-sounding root causes without validating physical evidence. In manufacturing, premature conclusions or false positives lead to catastrophic downtime, equipment damage, and severe safety hazards.

---

## 🛡️ The Solution: Multi-Agent Adversarial Investigation
ReliAI decomposes root cause investigation into specialized, evidence-grounded agents with strict adversarial validation:

```
[ Multimodal Incident ] ➔ [ Triage Agent ] ➔ [ Evidence & RAG Agent ]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [ Telemetry & Kinematics Agent ]                              [ Quality & Fitment Agent ]
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                                                      ▼
                                         [ Root Cause Generation ]
                                                      │
                                                      ▼
                                       [ Adversarial Critic Agent ]
                                        (Falsification & Contradiction)
                                                      │
                                                      ▼
                                    [ Deterministic Confidence Engine ]
                                                      │
                                                      ▼
                                      [ Human Approval Gate (HITL) ]
```

- **Evidence-Grounded Reasoning**: An agent cannot propose a cause without citing specific sensor timestamps or baseline deviations.
- **Adversarial Critic Loop**: A dedicated Critic Agent actively attempts to disprove the proposed hypothesis by searching for contradictory sensor data.
- **Deterministic Confidence**: If evidence is missing or contradictory, the system refuses to speculate and outputs:  
  `"INVESTIGATION INCONCLUSIVE — CONFLICTING EVIDENCE DETECTED (HUMAN INSPECTION REQUIRED)"`.
- **Human-in-the-Loop Gate**: All high-impact mitigations require explicit human authorization before execution.

---

## 📚 Architectural Blueprints & Documentation

Explore the detailed system architecture in our dedicated documentation guides:

| Document | Focus Area | Description |
| :--- | :--- | :--- |
| 📱 **[FRONTEND_UI.md](./FRONTEND_UI.md)** | **Mission Control UI** | React 19 + Vite SPA, 3D Robotic Arm Digital Twin (Three.js/R3F), Multimodal Inspector (Thermal, FFT Audio, Power), SSE Streaming, and Next.js vs. Vite analysis. |
| 🌐 **[BACKEND_WEBSITE.md](./BACKEND_WEBSITE.md)** | **Web Platform Backend** | FastAPI + Uvicorn API gateway, PostgreSQL 16 + `pgvector` schema, Redis Pub/Sub event bus, human approval audit logs, and edge server resource analysis. |
| 🤖 **[INVESTIGATION_HARNESS_AI.md](./INVESTIGATION_HARNESS_AI.md)** | **Self-Hosted AI Harness** | Multi-agent orchestrator, local Ollama model serving (`qwen2.5:7b` & `deepseek-r1:7b`), anti-hallucination critic loop, and hardware performance-to-cost analysis. |

---

## 🌿 Repository Branches

- **`main`**: System architecture, core design specifications, and central documentation.
- **`example-render`**: Interactive 3D robotic arm digital twin rendering prototype.
- **`ai-harness`**: Active development branch for the Python multi-agent investigation harness, Ollama integration, and validation engine.
