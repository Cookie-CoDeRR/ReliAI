from typing import Dict, Any, List
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    EvidenceItem,
    TriageAssessment,
    RootCauseHypothesis,
    IncidentDomain
)
from harness.ollama_client import AsyncOllamaClient


class RootCauseAgent:
    def __init__(self, ollama_client: AsyncOllamaClient):
        self.client = ollama_client

    def _electrical_domain_fallback(
        self,
        snapshot: MultimodalTelemetrySnapshot,
        evidence_items: List[EvidenceItem]
    ) -> RootCauseHypothesis:
        """
        Deterministic safety fallback used only when the AI hypothesis conflicts
        with an ELECTRICAL_POWER_SAG triage classification.
        Uses observed evidence rather than scenario names.
        """

        electrical_evidence = next(
            (
                e for e in evidence_items
                if "voltage" in e.observation.lower()
                or "power monitor" in e.source.lower()
                or "undervoltage" in e.observation.lower()
            ),
            None
        )

        if electrical_evidence:
            evidence_ids = [electrical_evidence.evidence_id]
            observation = electrical_evidence.observation
            confidence = 94.0
        else:
            evidence_ids = []
            observation = (
                f"Measured line voltage is {snapshot.line_voltage_v:.1f} V."
            )
            confidence = 78.0

        return RootCauseHypothesis(
            rank=1,
            title="3-Phase Supply Undervoltage Sag",
            description=(
                f"{observation} "
                "The measured supply condition is inconsistent with nominal "
                "400 V operation and indicates an upstream electrical supply sag."
            ),
            affected_component="Main_3_Phase_Power_Supply",
            causal_chain=[
                "Incoming three-phase supply drops below allowable voltage threshold",
                "Electrical bus stability to the robotic cell is degraded",
                "Machine protection/control system restricts normal operation"
            ],
            cited_evidence_ids=evidence_ids,
            preliminary_confidence=confidence
        )

    def _electrical_hypothesis_is_consistent(
        self,
        hypothesis: RootCauseHypothesis
    ) -> bool:
        text = (
            f"{hypothesis.title} "
            f"{hypothesis.description} "
            f"{hypothesis.affected_component}"
        ).lower()

        electrical_terms = (
            "electrical",
            "voltage",
            "undervoltage",
            "power",
            "supply",
            "brownout",
            "drive",
            "bus"
        )

        conflicting_terms = (
            "pneumatic",
            "gripper pressure",
            "solenoid seal",
            "air leak"
        )

        has_electrical_signal = any(term in text for term in electrical_terms)
        has_conflicting_signal = any(term in text for term in conflicting_terms)

        return has_electrical_signal and not has_conflicting_signal

    async def formulate_hypothesis(
        self,
        snapshot: MultimodalTelemetrySnapshot,
        triage: TriageAssessment,
        evidence_data: Dict[str, Any],
        telemetry_data: Dict[str, Any],
        quality_data: Dict[str, Any],
        maintenance_data: Dict[str, Any]
    ) -> RootCauseHypothesis:

        evidence_items: List[EvidenceItem] = evidence_data.get(
            "evidence_items", []
        )
        matched_sops = evidence_data.get("matched_sops", [])

        prompt = f"""
        INVESTIGATION EVIDENCE DOSSIER:

        - Incident Domain: {triage.incident_domain.value}
        - Severity: {triage.severity.value}
        - Triage Summary: {triage.summary}

        RAW POWER TELEMETRY:
        - Line Voltage: {snapshot.line_voltage_v} V
        - Total Current: {snapshot.total_current_a} A
        - Pneumatic Pressure: {snapshot.pneumatic_pressure_bar} bar

        EMPIRICAL EVIDENCE ITEMS:
        {[e.model_dump() for e in evidence_items]}

        MATCHED MAINTENANCE SOPS:
        {matched_sops}

        DOMAIN AGENT FINDINGS:
        - Telemetry Findings: {telemetry_data}
        - Quality/Fitment Findings: {quality_data}
        - Maintenance Lifecycle Findings: {maintenance_data}

        TASK:
        Formulate the primary Root Cause Hypothesis in valid JSON with fields:
        - rank
        - title
        - description
        - affected_component
        - causal_chain
        - cited_evidence_ids
        - preliminary_confidence

        CRITICAL SAFETY RULES:

        1. Ground the root cause ONLY in supplied evidence.
        2. Cite exact evidence IDs.
        3. The hypothesis MUST be consistent with the classified Incident Domain.
        4. If Incident Domain is ELECTRICAL_POWER_SAG, prioritize measured
           voltage/power evidence. Do NOT propose pneumatic, thermal or mechanical
           failures unless independent abnormal evidence explicitly supports them.
        5. A subsystem whose measurements remain within its nominal range must
           not be identified as the primary failure source.
        """

        system = (
            "You are the ReliAI Root Cause Reasoning Agent. "
            "Generate physically rigorous industrial hypotheses grounded strictly "
            "in measured evidence. Cross-check every proposed root cause against "
            "the triage domain and reject explanations contradicted by normal "
            "subsystem telemetry."
        )

        hypothesis = await self.client.generate_structured(
            prompt,
            system,
            RootCauseHypothesis
        )

        # Deterministic domain-consistency safety gate.
        # The LLM cannot override measured electrical evidence with an
        # unrelated pneumatic diagnosis.
        if triage.incident_domain == IncidentDomain.ELECTRICAL_POWER_SAG:
            if not self._electrical_hypothesis_is_consistent(hypothesis):
                hypothesis = self._electrical_domain_fallback(
                    snapshot,
                    evidence_items
                )

        return hypothesis
