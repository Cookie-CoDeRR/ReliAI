from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from web_backend.models import IncidentRecord, UploadRecord
from harness.schemas import MultimodalTelemetrySnapshot, EvidenceItem
from harness.baseline_engine import BaselineEngine
from web_backend.services.tool_service import ToolAccessService


class EvidenceService:
    def __init__(
        self,
        baseline_engine: Optional[BaselineEngine] = None,
        tool_service: Optional[ToolAccessService] = None
    ):
        self.baseline_engine = baseline_engine or BaselineEngine()
        self.tool_service = tool_service or ToolAccessService(self.baseline_engine)

    async def get_incident_evidence(self, db: AsyncSession, incident_id: str) -> Dict[str, Any]:
        """
        Retrieves empirical evidence collected during investigation or computed from raw telemetry.
        """
        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        evidence_items: List[Dict[str, Any]] = []

        # 1. Check if verdict_json already contains collected_evidence
        verdict = incident.verdict_json or {}
        if isinstance(verdict, dict) and "collected_evidence" in verdict and verdict["collected_evidence"]:
            evidence_items = verdict["collected_evidence"]
        elif incident.telemetry_json:
            # 2. Fallback: Re-evaluate telemetry against Golden Run baselines
            snapshot = MultimodalTelemetrySnapshot.model_validate(incident.telemetry_json)
            evaluated = self.baseline_engine.evaluate_telemetry(snapshot)
            evidence_items = [e.model_dump() for e in evaluated]

        return {
            "incident_id": incident.id,
            "station_id": incident.station_id,
            "count": len(evidence_items),
            "evidence": evidence_items
        }

    def get_telemetry_evidence(self, telemetry: Any) -> List[Dict[str, Any]]:
        """
        Calculates normalized EvidenceItem list directly from a raw telemetry payload or snapshot.
        """
        if isinstance(telemetry, dict):
            snapshot = MultimodalTelemetrySnapshot.model_validate(telemetry)
        elif isinstance(telemetry, MultimodalTelemetrySnapshot):
            snapshot = telemetry
        else:
            raise ValueError("Invalid telemetry format")

        items = self.baseline_engine.evaluate_telemetry(snapshot)
        return [item.model_dump() for item in items]

    async def get_log_evidence(
        self,
        db: AsyncSession,
        incident_id: Optional[str] = None,
        query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves log trace evidence converted into structured evidence items.
        """
        raw_logs = await self.tool_service.search_logs(
            db=db,
            query=query,
            incident_id=incident_id,
            limit=50
        )
        log_evidence = []
        for i, trace in enumerate(raw_logs.get("results", [])):
            log_evidence.append({
                "evidence_id": f"EVD-LOG-{i+1:03d}",
                "evidence_type": "LOG",
                "source": f"AgentTrace:{trace.get('agent_name')}",
                "observation": trace.get("message") or f"Step {trace.get('step_type')} recorded",
                "is_abnormal": trace.get("step_type") in ["ERROR", "CONTRADICTION"],
                "severity": "CRITICAL" if trace.get("step_type") == "ERROR" else "MODERATE",
                "incident_id": trace.get("incident_id"),
                "payload": trace.get("payload")
            })
        return log_evidence

    async def get_maintenance_evidence(
        self,
        db: AsyncSession,
        component: Optional[str] = None,
        incident_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves maintenance SOPs and technician approval logs as structured evidence.
        """
        maint_data = await self.tool_service.get_maintenance_history(
            db=db,
            component=component,
            incident_id=incident_id,
            limit=20
        )
        items = []
        for i, sop in enumerate(maint_data.get("sops", [])):
            items.append({
                "evidence_id": f"EVD-SOP-{i+1:03d}",
                "evidence_type": "MAINTENANCE_SOP",
                "source": f"SOP:{sop.get('id')}",
                "observation": f"SOP '{sop.get('title')}' applicable to {sop.get('component')}: {sop.get('causal_mechanism')}",
                "is_abnormal": False,
                "severity": "NOMINAL",
                "corrective_actions": sop.get("corrective_actions")
            })

        for j, audit in enumerate(maint_data.get("technician_dispatches", [])):
            items.append({
                "evidence_id": f"EVD-AUDIT-{j+1:03d}",
                "evidence_type": "TECHNICIAN_DISPATCH",
                "source": f"Engineer:{audit.get('engineer_id')}",
                "observation": f"Action '{audit.get('action')}' recorded for incident {audit.get('incident_id')}: {audit.get('notes') or 'No notes'}",
                "is_abnormal": audit.get("action") == "OVERRIDE",
                "severity": "HIGH" if audit.get("action") == "OVERRIDE" else "MODERATE",
                "timestamp": audit.get("timestamp")
            })

        return items

    async def get_similar_incident_evidence(
        self,
        db: AsyncSession,
        station_id: Optional[str] = None,
        domain: Optional[str] = None,
        severity: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves historical similar incidents formatted as evidence references.
        """
        sim_data = await self.tool_service.find_similar_incidents(
            db=db,
            station_id=station_id,
            domain=domain,
            severity=severity,
            search=search,
            limit=10
        )
        evidence = []
        for i, inc in enumerate(sim_data.get("incidents", [])):
            evidence.append({
                "evidence_id": f"EVD-HIST-{i+1:03d}",
                "evidence_type": "HISTORICAL_INCIDENT",
                "source": f"IncidentRecord:{inc.get('id')}",
                "observation": f"Past incident '{inc.get('title')}' at station {inc.get('station_id')} diagnosed as '{inc.get('root_cause_title')}' (Status: {inc.get('status')})",
                "is_abnormal": True,
                "severity": inc.get("severity") or "MODERATE",
                "confidence_score": inc.get("final_confidence_score")
            })
        return evidence

    async def get_document_evidence(self, query: str, db: Optional[AsyncSession] = None) -> List[Dict[str, Any]]:
        """
        Retrieves industrial document search results formatted as evidence references.
        """
        doc_data = await self.tool_service.search_documents(query=query, limit=10, db=db)
        docs = []
        for i, doc in enumerate(doc_data.get("documents", [])):
            docs.append({
                "evidence_id": f"EVD-DOC-{i+1:03d}",
                "evidence_type": doc.get("doc_type", "DOCUMENT"),
                "source": f"{doc.get('doc_type')}:{doc.get('id')}",
                "observation": f"Document '{doc.get('title')}': {doc.get('content_snippet')}",
                "is_abnormal": False,
                "severity": "NOMINAL"
            })
        return docs

    async def get_all_evidence(self, db: AsyncSession, incident_id: str) -> Dict[str, Any]:
        """
        Compiles a comprehensive multi-source evidence dossier for an incident.
        """
        inc_evd = await self.get_incident_evidence(db=db, incident_id=incident_id)
        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()

        log_evd = await self.get_log_evidence(db=db, incident_id=incident_id)
        maint_evd = await self.get_maintenance_evidence(
            db=db,
            component=incident.affected_component if incident else None,
            incident_id=incident_id
        )
        sim_evd = await self.get_similar_incident_evidence(
            db=db,
            station_id=incident.station_id if incident else None,
            domain=incident.domain if incident else None
        )

        # Uploaded document/file evidence for this incident
        upl_res = await db.execute(select(UploadRecord).where(UploadRecord.incident_id == incident_id))
        uploaded_files = list(upl_res.scalars().all())
        uploaded_evd = [
            {
                "evidence_id": f"EVD-UPL-{u.id}",
                "evidence_type": f"UPLOADED_{u.file_type}",
                "source": f"UploadRecord:{u.id}:{u.original_filename}",
                "observation": f"Uploaded {u.file_type} '{u.original_filename}' ({u.file_size_bytes} bytes): {(u.extracted_text[:150] + '...') if u.extracted_text else 'Parsed metadata available'}",
                "is_abnormal": u.ingestion_status == "FAILED",
                "severity": "CRITICAL" if u.ingestion_status == "FAILED" else "NOMINAL",
                "incident_id": u.incident_id
            }
            for u in uploaded_files
        ]

        return {
            "incident_id": incident_id,
            "station_id": incident.station_id if incident else None,
            "telemetry_evidence": inc_evd.get("evidence", []),
            "log_evidence": log_evd,
            "maintenance_evidence": maint_evd,
            "similar_incident_evidence": sim_evd,
            "uploaded_file_evidence": uploaded_evd,
            "total_evidence_count": len(inc_evd.get("evidence", [])) + len(log_evd) + len(maint_evd) + len(sim_evd) + len(uploaded_evd)
        }
