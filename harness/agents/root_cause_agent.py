from typing import Dict, Any, List
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    EvidenceItem,
    TriageAssessment,
    RootCauseHypothesis
)
from harness.ollama_client import AsyncOllamaClient


class RootCauseAgent:
    def __init__(self, ollama_client: AsyncOllamaClient):
        self.client = ollama_client

    async def formulate_hypothesis(
        self,
        snapshot: MultimodalTelemetrySnapshot,
        triage: TriageAssessment,
        evidence_data: Dict[str, Any],
        telemetry_data: Dict[str, Any],
        quality_data: Dict[str, Any],
        maintenance_data: Dict[str, Any]
    ) -> RootCauseHypothesis:
        """
        Synthesizes multimodal evidence, telemetry deviations, and maintenance history
        to generate the top evidence-grounded root cause hypothesis.
        """
        evidence_items: List[EvidenceItem] = evidence_data.get("evidence_items", [])
        matched_sops = evidence_data.get("matched_sops", [])

        prompt = f"""
        INVESTIGATION EVIDENCE DOSSIER:
        - Incident Domain: {triage.incident_domain.value} (Severity: {triage.severity.value})
        - Triage Summary: {triage.summary}
        
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
        - rank (integer: 1)
        - title (Concise technical name of failure mode)
        - description (Detailed mechanical and physical explanation)
        - affected_component (Specific assembly, e.g. Joint 3 Harmonic Drive)
        - causal_chain (List of strings explaining the step-by-step physical progression)
        - cited_evidence_ids (List of strings citing EXACT evidence_ids like 'EVD-001', 'EVD-002')
        - preliminary_confidence (float 0.0 to 100.0)

        CRITICAL RULE:
        You MUST ground your reasoning ONLY in the evidence provided. Cite the exact evidence IDs.
        """

        system = (
            "You are the ReliAI Root Cause Reasoning Agent. You formulate physically rigorous, "
            "mechanically sound industrial incident hypotheses grounded strictly in cited evidence. "
            "Never speculate on facts not present in the dossier."
        )

        return await self.client.generate_structured(prompt, system, RootCauseHypothesis)
