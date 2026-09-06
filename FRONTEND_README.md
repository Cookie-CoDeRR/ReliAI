@'
# ReliAI Frontend

Frontend documentation for the ReliAI Industrial AI Investigation Harness.

ReliAI's frontend is an industrial incident investigation dashboard that combines a 3D robotic digital twin, multimodal telemetry, multi-agent AI investigation results, adversarial critic validation, confidence scoring, and a human approval workflow in one interface.

---

## Frontend Stack

- React 19
- Vite 8
- Tailwind CSS 4
- Three.js
- React Three Fiber
- React Three Drei
- Lucide React

The frontend is implemented as a Vite + React single-page application and communicates directly with the FastAPI backend.

---

## Main Frontend Features

### 1. Industrial Scenario Selector

The dashboard provides preset benchmark incident scenarios including:

- Joint 3 Thermal Overheat
- Pneumatic Pressure Drop
- Contradictory Sensor Anomaly
- 3-Phase Power Sag

Selecting a scenario triggers the investigation pipeline and updates the dashboard with the corresponding telemetry.

---

### 2. 3D Robotic Digital Twin

The frontend renders a 6-DOF industrial robotic arm using:

- Three.js
- React Three Fiber
- React Three Drei
- GLB robotic arm asset

The current model is loaded from:

```text
/public/roboticArm.glb