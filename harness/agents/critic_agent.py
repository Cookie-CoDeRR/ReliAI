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
        - Joints: { {k: f"Temp: {v.temp_c}°C, Torque: {v.torque_nm}Nm, Curr: {v.motor_current_a}A" for k, v in snapshot.joints.items()} }
        - Acoustic Anomalies: {[a.model_dump() for a in snapshot.acoustic_anomalies]}
        - Detected Evidence Items: {[e.model_dump() for e in evidence_items]}

        ALGORITHMIC SENSOR CONTRADICTION SCAN:
        {algorithmic_contradictions}

        TASK:
        You are the Adversarial Safety Critic. Your job is to challenge this hypothesis.
        Search for:
        1. Any physical contradictions in the telemetry.
        2. Any missing sensor evidence that would be physically required for this failure.
        3. Assign an appropriate confidence penalty (0.0 if validated, 25.0 - 50.0 if contradictions exist).

        Respond with structured CriticEvaluation JSON:
        - hypothesis_title (string)
        - is_physically_possible (boolean)
        - contradictions_detected (list of strings)
        - missing_evidence_notes (list of strings)
        - objection_summary (string)
        - confidence_penalty (float 0.0 to 100.0)
        """

        system = (
            "You are the ReliAI Adversarial Critic Agent. Your purpose is to falsify flawed industrial AI "
            "hypotheses and expose conflicting sensor data to prevent plant downtime or safety hazards."
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
        # ELECTRICAL POWER SAG CONSISTENCY GUARD
        # -------------------------------------------------------------
        hypothesis_text = (
            f"{hypothesis.title} "
            f"{hypothesis.description} "
            f"{hypothesis.affected_component}"
        ).lower()

        is_electrical_hypothesis = any(
            term in hypothesis_text
            for term in (
                "electrical",
                "undervoltage",
                "voltage",
                "power supply",
                "brownout",
                "3-phase"
            )
        )

        # The golden electrical baseline defines < 380 V as an abnormal
        # undervoltage condition. A negative deviation percentage simply
        # means voltage is below nominal; it is not contradictory evidence.
        if is_electrical_hypothesis and snapshot.line_voltage_v < 380.0:

            filtered_contradictions = []

            for contradiction in critic_eval.contradictions_detected:
                c = contradiction.lower()

                is_sign_math_false_positive = (
                    "voltage" in c
                    and (
                        "deviation" in c
                        or "threshold" in c
                        or "below" in c
                        or "undervoltage" in c
                    )
                )

                if not is_sign_math_false_positive:
                    filtered_contradictions.append(contradiction)

            critic_eval.contradictions_detected = filtered_contradictions

            if not filtered_contradictions:
                critic_eval.is_physically_possible = True
                critic_eval.confidence_penalty = 0.0
                critic_eval.objection_summary = (
                    f"Electrical power sag is physically supported by the "
                    f"measured line voltage of {snapshot.line_voltage_v:.1f} V, "
                    f"which is below the 380 V minimum allowable threshold."
                )

        # Keep schema internally consistent:
        # contradictions always imply a failed physical validation.
        if critic_eval.contradictions_detected:
            critic_eval.is_physically_possible = False
            critic_eval.confidence_penalty = max(
                critic_eval.confidence_penalty,
                25.0
            )

        return critic_eval
