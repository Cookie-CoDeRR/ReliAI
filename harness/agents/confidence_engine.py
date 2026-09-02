from typing import List, Optional, Dict, Any
from harness.schemas import (
    InvestigationVerdict,
    InvestigationStatus,
    RootCauseHypothesis,
    CriticEvaluation,
    EvidenceItem
)


class ConfidenceEngine:
    def __init__(self, contradiction_cap: float = 45.0, conclusive_threshold: float = 75.0):
        self.contradiction_cap = contradiction_cap
        self.conclusive_threshold = conclusive_threshold

    def calculate_verdict(
        self,
        incident_id: str,
        station_id: str,
        hypothesis: Optional[RootCauseHypothesis],
        critic_report: CriticEvaluation,
        evidence_items: List[EvidenceItem],
        matched_sops: List[Dict[str, Any]],
        duration_ms: Optional[float] = None
    ) -> InvestigationVerdict:
        """
        Applies deterministic mathematical scoring to determine investigation conclusiveness.
        """
        contradictions_present = len(critic_report.contradictions_detected) > 0
        evidence_count = len(evidence_items)
        critical_evidence_count = sum(1 for e in evidence_items if e.severity == "CRITICAL")

        # -------------------------------------------------------------
        # CASE 1: CONFLICTING SENSOR EVIDENCE (ANTI-HALLUCINATION GUARD)
        # -------------------------------------------------------------
        if contradictions_present or not critic_report.is_physically_possible:
            final_confidence = min(
                self.contradiction_cap,
                max(15.0, (hypothesis.preliminary_confidence if hypothesis else 60.0) - critic_report.confidence_penalty)
            )

            mitigation = (
                "⚠️ INVESTIGATION INCONCLUSIVE — CONFLICTING EVIDENCE DETECTED: "
                f"{critic_report.contradictions_detected[0] if critic_report.contradictions_detected else 'Physical telemetry mismatch'}. "
                "STATION LOCKED OUT. Dispatch electrical/mechanical technician for physical multimeter verification."
            )

            return InvestigationVerdict(
                incident_id=incident_id,
                station_id=station_id,
                status=InvestigationStatus.INCONCLUSIVE_CONTRADICTIONS,
                final_confidence_score=round(final_confidence, 1),
                primary_root_cause=None, # Refuse to assert a flawed primary cause
                alternative_causes=[hypothesis] if hypothesis else [],
                critic_report=critic_report,
                collected_evidence=evidence_items,
                recommended_mitigation=mitigation,
                requires_human_inspection=True,
                investigation_duration_ms=duration_ms
            )

        # -------------------------------------------------------------
        # CASE 2: MISSING / INSUFFICIENT EVIDENCE
        # -------------------------------------------------------------
        if evidence_count == 0:
            return InvestigationVerdict(
                incident_id=incident_id,
                station_id=station_id,
                status=InvestigationStatus.INCONCLUSIVE_MISSING_DATA,
                final_confidence_score=25.0,
                primary_root_cause=None,
                alternative_causes=[],
                critic_report=critic_report,
                collected_evidence=[],
                recommended_mitigation="Insufficient sensor deviations detected. Verify telemetry connection and sensor health.",
                requires_human_inspection=True,
                investigation_duration_ms=duration_ms
            )

        # -------------------------------------------------------------
        # CASE 3: VALIDATED & CONCLUSIVE ROOT CAUSE
        # -------------------------------------------------------------
        base_confidence = hypothesis.preliminary_confidence if hypothesis else 75.0
        evidence_boost = min(12.0, critical_evidence_count * 4.0 + (evidence_count - critical_evidence_count) * 1.5)
        sop_boost = 5.0 if matched_sops else 0.0
        penalty = critic_report.confidence_penalty

        computed_confidence = base_confidence + evidence_boost + sop_boost - penalty
        final_confidence = max(60.0, min(98.5, computed_confidence))

        status = InvestigationStatus.CONCLUSIVE if final_confidence >= self.conclusive_threshold else InvestigationStatus.INVESTIGATING

        # Recommend corrective action from top matched SOP if available
        if matched_sops and "corrective_actions" in matched_sops[0]:
            mitigation_actions = "; ".join(matched_sops[0]["corrective_actions"])
            mitigation = f"Approved SOP ({matched_sops[0]['sop_id']}): {mitigation_actions}"
        else:
            mitigation = f"Inspect and service {hypothesis.affected_component if hypothesis else 'station'}. Verify sensor calibration."

        return InvestigationVerdict(
            incident_id=incident_id,
            station_id=station_id,
            status=status,
            final_confidence_score=round(final_confidence, 1),
            primary_root_cause=hypothesis,
            alternative_causes=[],
            critic_report=critic_report,
            collected_evidence=evidence_items,
            recommended_mitigation=mitigation,
            requires_human_inspection=final_confidence < 80.0,
            investigation_duration_ms=duration_ms
        )
