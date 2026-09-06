import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from web_backend.models import IncidentRecord, AgentTraceRecord, ApprovalAuditRecord
from web_backend.services.evidence_service import EvidenceService


class ReportService:
    def __init__(self, evidence_service: Optional[EvidenceService] = None):
        self.evidence_service = evidence_service or EvidenceService()

    async def generate_report(self, db: AsyncSession, incident_id: str) -> Dict[str, Any]:
        """
        Builds a comprehensive structured investigation report from persisted IncidentRecord,
        verdict JSON payload, approval audits, and normalized evidence references.
        """
        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        # 1. Fetch approval audit logs
        audits_res = await db.execute(
            select(ApprovalAuditRecord)
            .where(ApprovalAuditRecord.incident_id == incident_id)
            .order_by(desc(ApprovalAuditRecord.timestamp))
        )
        audits = list(audits_res.scalars().all())

        # 2. Count agent trace execution steps
        traces_count_res = await db.execute(
            select(AgentTraceRecord)
            .where(AgentTraceRecord.incident_id == incident_id)
        )
        traces_count = len(list(traces_count_res.scalars().all()))

        # 3. Retrieve empirical evidence items via EvidenceService
        evidence_bundle = await self.evidence_service.get_incident_evidence(db=db, incident_id=incident_id)

        # 4. Extract structured verdict payload if available
        verdict = incident.verdict_json or {}
        root_cause_data = None
        if incident.root_cause_title or verdict.get("primary_root_cause"):
            prc = verdict.get("primary_root_cause") or {}
            root_cause_data = {
                "title": incident.root_cause_title or prc.get("title"),
                "description": incident.root_cause_description or prc.get("description"),
                "affected_component": incident.affected_component or prc.get("affected_component"),
                "causal_chain": prc.get("causal_chain", []),
                "cited_evidence_ids": prc.get("cited_evidence_ids", []),
                "preliminary_confidence": prc.get("preliminary_confidence")
            }

        critic_findings = verdict.get("critic_report")

        return {
            "report_id": f"RPT-{incident.id}",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "incident_summary": {
                "incident_id": incident.id,
                "title": incident.title,
                "station_id": incident.station_id,
                "severity": incident.severity,
                "status": incident.status,
                "created_at": incident.created_at.isoformat() if incident.created_at else None,
                "domain": incident.domain
            },
            "investigation_results": {
                "status": incident.status,
                "final_confidence_score": incident.final_confidence_score,
                "contradiction_detected": incident.contradiction_detected,
                "requires_human_inspection": incident.requires_human_inspection,
                "recommended_mitigation": incident.recommended_mitigation,
                "investigation_duration_ms": verdict.get("investigation_duration_ms")
            },
            "root_cause": root_cause_data,
            "critic_findings": critic_findings,
            "evidence": evidence_bundle.get("evidence", []),
            "evidence_count": evidence_bundle.get("count", 0),
            "agent_traces_count": traces_count,
            "approval_history": [
                {
                    "action": a.action,
                    "engineer_id": a.engineer_id,
                    "notes": a.notes,
                    "timestamp": a.timestamp.isoformat() if a.timestamp else None
                }
                for a in audits
            ]
        }
