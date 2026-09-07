from typing import Dict, Any, List
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    EvidenceItem,
    RootCauseHypothesis,
    CriticEvaluation
)
from harness.ollama_client import AsyncOllamaClient


class CriticAgent:
    def __init__(self, ollama_client: AsyncOllamaClient):
        self.client = ollama_client

    async def evaluate_hypothesis(
        self,
        hypothesis: RootCauseHypothesis,
        snapshot: MultimodalTelemetrySnapshot,
        evidence_items: List[EvidenceItem]
    ) -> CriticEvaluation:
        """
        Adversarial falsification auditor.
        Actively seeks contradictory sensor readings, missing physical prerequisites,
        and invalid assumptions.
        """
        # 1. Deterministic contradiction scanning
        algorithmic_contradictions = []

        # Contradiction Pattern 1: False Overheat (Sensor readout high, but electrical power & acoustics completely normal)
        if "overheat" in hypothesis.title.lower() or "thermal" in hypothesis.title.lower():
            for j_name, j_data in snapshot.joints.items():
                if j_data.temp_c > 85.0 and j_data.motor_current_a <= 3.5 and not snapshot.acoustic_anomalies:
                    algorithmic_contradictions.append(
                        f"Contradiction: {j_name} indicates severe thermal reading ({j_data.temp_c}°C), "
                        f"yet motor current is completely normal ({j_data.motor_current_a}A) and acoustic "
                        f"vibration baseline shows zero mechanical friction (< 70 dB). Probable thermocouple wire short."
                    )

        # Contradiction Pattern 2: Pneumatic failure claimed without pressure deviation
        if "pneumatic" in hypothesis.title.lower() and snapshot.pneumatic_pressure_bar >= 5.8:
            algorithmic_contradictions.append(
                f"Contradiction: Pneumatic failure hypothesized, but measured line pressure is nominal "
                f"at {snapshot.pneumatic_pressure_bar} bar (Nominal range: 5.5 - 7.0 bar)."
            )

        prompt = f"""
        PROPOSED ROOT CAUSE HYPOTHESIS:
        - Title: {hypothesis.title}
        - Description: {hypothesis.description}
        - Affected Component: {hypothesis.affected_component}
        - Causal Chain: {hypothesis.causal_chain}
        - Cited Evidence: {hypothesis.cited_evidence_ids}
        - Proposed Confidence: {hypothesis.preliminary_confidence}%

        RAW SENSOR TELEMETRY:
        - Line Voltage: {snapshot.line_voltage_v} V
        - Total Current: {snapshot.total_current_a} A
        - Pneumatic Pressure: {snapshot.pneumatic_pressure_bar} bar
        - Conveyor: {snapshot.conveyor.model_dump() if snapshot.conveyor else 'N/A'}
        - Bead Lubrication: {snapshot.bead_lubrication.model_dump() if snapshot.bead_lubrication else 'N/A'}
        - Tire Fitment: {snapshot.tire_fitment.model_dump() if snapshot.tire_fitment else 'N/A'}
        - Joints: { {k: f"Temp: {v.temp_c}°C, Torque: {v.torque_nm}Nm, Curr: {v.motor_current_a}A" for k, v in snapshot.joints.items()} }
        - Acoustic Anomalies: {[a.model_dump() for a in snapshot.acoustic_anomalies]}
        - Detected Evidence Items: {[e.model_dump() for e in evidence_items]}

        ALGORITHMIC SENSOR CONTRADICTION SCAN:
        {algorithmic_contradictions}

        CRITICAL EVALUATION RULES:
        1. Telemetry that deviates in the direction of the failure mode (e.g. high heat for thermal failure, low voltage for voltage sag, low pressure/flow for lube or pneumatic failure) is CORROBORATING evidence, NOT a contradiction.
        2. Only flag contradictions if telemetry physically REFUTES the hypothesis (e.g., claiming 90°C overheat when sensors measure 25°C, or claiming pneumatic pressure loss when line pressure is 6.2 bar).
        3. If evidence is consistent and corroborates the failure mode:
           - is_physically_possible: true
           - contradictions_detected: []
           - missing_evidence_notes: []
           - confidence_penalty: 0.0
           - objection_summary: "Physical telemetry corroborates the proposed root cause."
        """

        system = (
            "You are the ReliAI Adversarial Critic Agent. Your purpose is to falsify flawed industrial AI "
            "hypotheses and expose conflicting sensor data. Do NOT flag corroborating sensor evidence as contradictions."
        )

        critic_eval = await self.client.generate_structured(prompt, system, CriticEvaluation)

        # Merge deterministic contradictions if the model missed any
        if algorithmic_contradictions and not critic_eval.contradictions_detected:
            critic_eval.contradictions_detected = algorithmic_contradictions
            critic_eval.is_physically_possible = False
            critic_eval.confidence_penalty = max(
                critic_eval.confidence_penalty,
                40.0
            )

        # -------------------------------------------------------------
        # TELEMETRY CORROBORATION GUARDS (Eliminate LLM False-Positive Objections)
        # -------------------------------------------------------------
        hypothesis_text = (
            f"{hypothesis.title} "
            f"{hypothesis.description} "
            f"{hypothesis.affected_component}"
        ).lower()

        # Guard 1: Electrical Voltage Sag
        is_electrical = any(t in hypothesis_text for t in ("electrical", "undervoltage", "voltage", "power supply", "brownout", "3-phase"))
        if is_electrical and snapshot.line_voltage_v < 380.0:
            critic_eval.contradictions_detected = [
                c for c in critic_eval.contradictions_detected
                if not any(k in c.lower() for k in ("voltage", "current", "threshold", "deviation", "below", "exceeding", "load"))
            ]

        # Guard 2: Joint / Mechanical Thermal Overheat (Only when corroborated by elevated current or acoustic vibration)
        is_thermal = any(t in hypothesis_text for t in ("thermal", "overheat", "harmonic", "bearing", "friction", "seizure"))
        has_corroborated_overheat = any(
            (j.temp_c > 75.0 and (j.motor_current_a > 4.0 or len(snapshot.acoustic_anomalies) > 0))
            for j in snapshot.joints.values()
        )
        if is_thermal and has_corroborated_overheat:
            critic_eval.contradictions_detected = [
                c for c in critic_eval.contradictions_detected
                if not any(k in c.lower() for k in ("temperature", "heat", "hotspot", "grind", "thermal", "exceeding"))
            ]

        # Guard 3: Lubrication & Conveyor Faults
        is_lube_conveyor = any(t in hypothesis_text for t in ("lubricat", "nozzle", "clog", "conveyor", "belt", "slip", "seating"))
        has_lube_or_conveyor_fault = (
            (snapshot.bead_lubrication and (snapshot.bead_lubrication.nozzle_clog_detected or snapshot.bead_lubrication.nozzle_pressure_bar < 2.5))
            or (snapshot.conveyor and (snapshot.conveyor.belt_speed_mps < 0.4 or snapshot.conveyor.belt_tension_n < 250.0))
        )
        if is_lube_conveyor and has_lube_or_conveyor_fault:
            critic_eval.contradictions_detected = [
                c for c in critic_eval.contradictions_detected
                if not any(k in c.lower() for k in ("lube", "nozzle", "clog", "pressure", "conveyor", "slip", "tension", "speed"))
            ]

        # Guard 4: Pneumatic Gripper Faults
        is_pneumatic = any(t in hypothesis_text for t in ("pneumatic", "gripper", "solenoid", "air pressure", "blow-by"))
        if is_pneumatic and snapshot.pneumatic_pressure_bar < 5.5:
            critic_eval.contradictions_detected = [
                c for c in critic_eval.contradictions_detected
                if not any(k in c.lower() for k in ("pneumatic", "pressure", "gripper", "solenoid", "bar"))
            ]

        if not critic_eval.contradictions_detected:
            critic_eval.is_physically_possible = True
            critic_eval.confidence_penalty = 0.0
            if not critic_eval.objection_summary or "contradiction" in critic_eval.objection_summary.lower():
                critic_eval.objection_summary = "Telemetry consistency physically corroborated."
        else:
            critic_eval.is_physically_possible = False
            critic_eval.confidence_penalty = max(critic_eval.confidence_penalty, 25.0)

        return critic_eval
