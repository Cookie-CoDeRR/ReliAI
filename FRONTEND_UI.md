# ReliAI — Frontend UI Architecture & System Design

## 1. Executive Summary & Design Vision

ReliAI's frontend serves as an **Industrial Incident Command & Investigation Dashboard**. It is designed specifically for plant managers, reliability engineers, and factory technicians operating high-stakes automated manufacturing lines (such as 6-axis robotic arm tire-fitting cells).

Unlike conventional analytics dashboards, this interface is built around **real-time multimodal situational awareness**, **adversarial AI deliberation transparency**, and **fail-safe human authorization**.

---

## 2. Framework Evaluation: React (Vite SPA) vs. Next.js

A critical architectural decision for this industrial platform is choosing between a **Pure Client-Side SPA (Vite + React)** and a **Full-Stack Server-Rendered Framework (Next.js)**.

### Why Vite + React SPA is Optimal for Industrial Digital Twins

1. **Heavy WebGL & 3D Hardware Acceleration**:
   - The core visual element is a 3D digital twin of a 6-DOF robotic arm utilizing WebGL, Three.js, and Canvas-based audio waveform visualizers.
   - These graphics rendering engines are strictly browser-bound. In Next.js, every 3D component requires `'use client'` directives and dynamic client-side imports to avoid server-side rendering (SSR) hydration crashes (`window is not defined`).
   - A Vite SPA runs natively in the browser without SSR overhead or hydration complexity.

2. **Ultra-Lightweight Edge & Factory Intranet Deployment**:
   - In industrial manufacturing, dashboards often run on local factory servers, air-gapped networks, or edge industrial PCs with no reliable internet connection.
   - Vite produces pure static files (HTML, JS, CSS, and 3D `.glb` assets). These can be hosted on a tiny Nginx or Caddy container consuming less than **10MB of RAM** with zero compute cost.
   - Next.js requires a persistent Node.js runtime server in production (unless statically exported, which strips away Next.js server features), consuming **150MB to 300MB of RAM** per instance.

3. **Decoupled Architecture with Heavy Python AI Backend**:
   - The core computational logic of ReliAI is an asynchronous Python/FastAPI harness with local Ollama LLMs and scientific libraries (NumPy, SciPy for FFT audio analysis, OpenCV for thermal imaging).
   - Using Next.js API routes would create an unnecessary Node.js proxy layer between the browser and the Python backend. Direct communication between the Vite SPA and the Python backend simplifies debugging, reduces network hops, and keeps streaming latency at a minimum.

### When Next.js Would Be Justified
Next.js becomes advantageous if the application evolves into a multi-tenant enterprise SaaS platform that requires:
- Public-facing marketing pages and search engine indexing (SEO).
- Complex server-side authentication flows (e.g., NextAuth with enterprise SAML/SSO).
- Server-rendered administrative tables for historical incidents across dozens of worldwide plants.

---

## 3. UI Component Architecture & Layout System

The dashboard layout is divided into four synchronized operational zones:

### Zone A: Real-Time Incident Status & Line Overview (Top Header)
- Displays current assembly line operational status (Normal, Degraded, Emergency Stop).
- Active incident ticker with severity badges (Critical, High, Medium, Low).
- Station identifier and timestamp of the latest trigger.

### Zone B: 3D Digital Twin & Spatial Telemetry (Left / Central Viewport)
- **Interactive 6-DOF Kinematic Visualization**: Displays the physical posture of the robotic arm at the exact moment of failure.
- **Dynamic Thermal & Stress Highlights**: Automatically colors specific joints (e.g., Joint 3 harmonic drive) in glowing red or amber when telemetry indicates thermal overheat or torque overload.
- **End-Effector Status**: Shows gripper orientation, pneumatic clamp engagement, and tire bead seating alignment relative to target tolerances.

### Zone C: Multimodal Sensor Inspector (Bottom Panel)
- **Thermal Vision Feed**: Side-by-side display of the baseline thermal profile versus the incident thermal capture, highlighting anomalous heat spots.
- **Acoustic FFT Spectrogram**: Audio waveform and frequency spectrum visualizer comparing healthy machine harmonics against acoustic grinding or pneumatic hiss anomalies.
- **3-Phase Power & Bus Telemetry**: Time-series charts showing voltage sag, current spikes, and CAN-bus communication jitter leading up to the stoppage.

### Zone D: Multi-Agent Deliberation & Human Gatekeeper (Right Panel)
- **Live Agent Reasoning Feed**: Real-time step-by-step progress tracking the Triage Agent, Evidence RAG Agent, Quality Agent, and Maintenance Agent.
- **Adversarial Debate View**: Side-by-side comparison of the Root Cause Agent's top hypothesis against the Critic Agent's counter-arguments.
- **Deterministic Confidence Indicator**: Dynamic score reflecting evidence completeness and contradiction penalties.
- **Human Approval Action Bar**: Unconditional safety gate providing one-click actions: Approve Mitigation, Dispatch Field Technician, or Override AI Recommendation.

---

## 4. State Management & Real-Time Communication

### State Architecture
- **Zustand Store**: Manages global UI state including selected incidents, active 3D fault highlights, streaming agent trace buffers, and human authorization statuses.
- **Decoupled Rendering**: Keeps high-frequency sensor chart updates isolated from the 3D scene rendering loop to maintain a steady 60 frames per second.

### Streaming Protocol (Server-Sent Events vs WebSockets)
- **Server-Sent Events (SSE)** is used for the real-time AI reasoning feed. Because agent outputs are unidirectional streams from server to client, SSE provides automatic reconnection, native browser support, and lightweight transport without the complexity of bidirectional WebSockets.
- **REST Endpoints** handle idempotent actions such as incident filtering, baseline updates, and human approval submissions.

---

## 5. Performance Optimization & Production Standards

1. **3D Asset Optimization**:
   - The robotic arm 3D model (`.glb`) is loaded once into browser cache and preloaded on initial application mount.
   - Geometry meshes share unified PBR materials to minimize draw calls and maximize GPU batching.

2. **Zero-Jank Charting**:
   - Sensor time-series data is downsampled using linear decimation before passing to chart components, preventing DOM bloat during high-frequency telemetry replay.

3. **Accessibility & Industrial UI Ergonomics**:
   - High-contrast dark theme optimized for factory floor lighting and control room monitors.
   - Clear color-coded status conventions (Emerald for Healthy, Amber for Warning, Rose for Critical, Cyan for Telemetry, Indigo for AI Agents).
   - Full keyboard navigation for emergency approval actions.
