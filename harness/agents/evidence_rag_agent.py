from typing import List, Dict, Any
from harness.schemas import MultimodalTelemetrySnapshot, EvidenceItem
from harness.baseline_engine import BaselineEngine


class EvidenceRAGAgent:
    def __init__(self, baseline_engine: BaselineEngine):
        self.engine = baseline_engine

    async def collect_evidence(self, snapshot: MultimodalTelemetrySnapshot) -> Dict[str, Any]:
        """
        Calculates mathematical deviations from golden run baselines
        and retrieves matching Standard Operating Procedures (SOPs).
        """
        # 1. Compute empirical evidence items
        evidence_items: List[EvidenceItem] = self.engine.evaluate_telemetry(snapshot)

        # 2. Correlate with SOP knowledge base
        matched_sops: List[Dict[str, Any]] = self.engine.match_sops(evidence_items)

        return {
            "evidence_items": evidence_items,
            "evidence_count": len(evidence_items),
            "critical_count": sum(1 for e in evidence_items if e.severity == "CRITICAL"),
            "matched_sops": matched_sops
        }
