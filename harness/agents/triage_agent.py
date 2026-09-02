from typing import Dict, Any, List
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    TriageAssessment,
    IncidentDomain,
    IncidentSeverity
)
from harness.ollama_client import AsyncOllamaClient


class TriageAgent:
    def __init__(self, ollama_client: AsyncOllamaClient):
        self.client = ollama_client

    async def evaluate(self, snapshot: MultimodalTelemetrySnapshot) -> TriageAssessment:
        """
        Triages multimodal incident data to determine the incident domain,
        severity level, containment procedures, and required agent investigation paths.
        """
        # 1. Quick deterministic heuristic checks
        has_critical_thermal = any(h.temp_c >= 80.0 for h in snapshot.thermal_hotspots) or any(
            j.temp_c >= 70.0 for j in snapshot.joints.values()
        )
        has_pressure_drop = snapshot.pneumatic_pressure_bar < 5.0
        has_voltage_sag = snapshot.line_voltage_v < 380.0
        has_acoustic_fault = any(a.magnitude_db > 80.0 for a in snapshot.acoustic_anomalies)

        prompt = f"""
        Factory Incident Telemetry Snapshot:
        - Station ID: {snapshot.station_id}
        - Timestamp: {snapshot.timestamp}
        - Line Voltage: {snapshot.line_voltage_v} V (Nominal: 400V)
        - Total Current: {snapshot.total_current_a} A (Nominal: 14.5A)
        - Pneumatic Gripper Pressure: {snapshot.pneumatic_pressure_bar} bar (Nominal: 6.2 bar)
        - Thermal Hotspots: {[h.model_dump() for h in snapshot.thermal_hotspots]}
        - Acoustic Anomalies: {[a.model_dump() for a in snapshot.acoustic_anomalies]}
        - Joint Temperatures & Torques: { {k: f"Temp: {v.temp_c}°C, Torque: {v.torque_nm}Nm, Curr: {v.motor_current_a}A" for k, v in snapshot.joints.items()} }
        - Tire Fitment: {snapshot.tire_fitment.model_dump() if snapshot.tire_fitment else 'None'}
        - E-Stop Triggered: {snapshot.e_stop_triggered}
        - Operator Notes: {snapshot.operator_shift_notes or 'None'}

        Task:
        Provide a structured TriageAssessment with fields:
        - incident_domain (THERMAL_OVERHEAT | KINEMATIC_MISALIGNMENT | ELECTRICAL_POWER_SAG | ACOUSTIC_BEARING_FAULT | PNEUMATIC_PRESSURE_DROP | QUALITY_BEAD_DEFECT)
        - severity (CRITICAL | HIGH | MEDIUM | LOW)
        - summary (Concise explanation of the alert)
        - immediate_containment_action (e.g. LOTO Station, Clear cell, Check manifold)
        - active_investigation_paths (List of specific areas downstream agents must investigate)
        """

        system = (
            "You are the ReliAI Industrial Triage Agent. You quickly classify factory robotic cell "
            "failures, determine safety containment, and route the investigation to specialized agents. "
            "Always return valid JSON adhering strictly to the schema."
        )

        return await self.client.generate_structured(prompt, system, TriageAssessment)
