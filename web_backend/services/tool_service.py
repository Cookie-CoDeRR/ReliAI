import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from web_backend.models import IncidentRecord, AgentTraceRecord, ApprovalAuditRecord
from harness.baseline_engine import BaselineEngine


class ToolAccessService:
    def __init__(self, baseline_engine: Optional[BaselineEngine] = None):
        self.baseline_engine = baseline_engine or BaselineEngine()

    def get_available_tools(self) -> Dict[str, Dict[str, Any]]:
        """
        Returns a directory of all available data and analysis tools in Kushagra's backend vertical.
        """
        return {
            "search_logs": {
                "name": "System & Agent Log Search",
                "description": "Searches stored agent deliberation traces and execution logs",
                "status": "AVAILABLE",
                "backed_by": "agent_traces database table"
            },
            "get_maintenance_history": {
                "name": "Maintenance Records & SOP Store",
                "description": "Retrieves maintenance SOPs and historical technician dispatch records",
                "status": "AVAILABLE",
                "backed_by": "maintenance_sops.json & approval_audits database table"
            },
            "find_similar_incidents": {
                "name": "Incident History & Similarity Search",
                "description": "Queries historical failure incidents filtered by station, domain, severity, or keyword",
                "status": "AVAILABLE",
                "backed_by": "incidents database table"
            },
            "get_sensor_data": {
                "name": "Multimodal Telemetry & Sensor Data Retrieval",
                "description": "Fetches raw sensor telemetry snapshots for specific incidents or stations",
                "status": "AVAILABLE",
                "backed_by": "incidents telemetry_json & scenario presets"
            },
            "search_documents": {
                "name": "Industrial SOP & Document Search",
                "description": "Searches maintenance procedures, golden run engineering specs, and preset benchmarks",
                "status": "AVAILABLE",
                "backed_by": "sops & scenarios disk storage"
            }
        }

    async def search_logs(
        self,
        db: AsyncSession,
        query: Optional[str] = None,
        incident_id: Optional[str] = None,
        agent_name: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Searches agent deliberation step logs and trace messages.
        """
        stmt = select(AgentTraceRecord).order_by(desc(AgentTraceRecord.id))
        
        if incident_id:
            stmt = stmt.where(AgentTraceRecord.incident_id == incident_id)
        if agent_name:
            stmt = stmt.where(AgentTraceRecord.agent_name.ilike(f"%{agent_name}%"))
        if query:
            search_pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    AgentTraceRecord.message.ilike(search_pattern),
                    AgentTraceRecord.step_type.ilike(search_pattern),
                    AgentTraceRecord.agent_name.ilike(search_pattern)
                )
            )

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        traces = list(result.scalars().all())

        return {
            "status": "SUCCESS",
            "total": len(traces),
            "results": [
                {
                    "id": t.id,
                    "incident_id": t.incident_id,
                    "agent_name": t.agent_name,
                    "step_type": t.step_type,
                    "message": t.message,
                    "payload": t.payload_json,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                }
                for t in traces
            ]
        }

    async def get_maintenance_history(
        self,
        db: AsyncSession,
        component: Optional[str] = None,
        incident_id: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Retrieves maintenance SOPs and historical technician approval/dispatch records.
        """
        # 1. Match SOPs from BaselineEngine
        matched_sops = []
        for sop in self.baseline_engine.sops:
            if not component or component.lower() in sop.get("component", "").lower() or component.lower() in sop.get("title", "").lower():
                matched_sops.append({
                    "id": sop.get("id"),
                    "title": sop.get("title"),
                    "component": sop.get("component"),
                    "causal_mechanism": sop.get("causal_mechanism"),
                    "corrective_actions": sop.get("corrective_actions")
                })

        # 2. Query technician dispatch audit history from database
        stmt = select(ApprovalAuditRecord).order_by(desc(ApprovalAuditRecord.timestamp))
        if incident_id:
            stmt = stmt.where(ApprovalAuditRecord.incident_id == incident_id)

        stmt = stmt.limit(limit)
        result = await db.execute(stmt)
        audits = list(result.scalars().all())

        return {
            "status": "SUCCESS",
            "sops": matched_sops[:limit],
            "technician_dispatches": [
                {
                    "id": a.id,
                    "incident_id": a.incident_id,
                    "action": a.action,
                    "engineer_id": a.engineer_id,
                    "notes": a.notes,
                    "timestamp": a.timestamp.isoformat() if a.timestamp else None
                }
                for a in audits
            ]
        }

    async def find_similar_incidents(
        self,
        db: AsyncSession,
        station_id: Optional[str] = None,
        domain: Optional[str] = None,
        severity: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Finds past similar failure incidents based on station, domain, severity, or keyword search.
        """
        stmt = select(IncidentRecord).order_by(desc(IncidentRecord.created_at))

        if station_id:
            stmt = stmt.where(IncidentRecord.station_id == station_id)
        if domain:
            stmt = stmt.where(IncidentRecord.domain == domain)
        if severity:
            stmt = stmt.where(IncidentRecord.severity == severity)
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    IncidentRecord.id.ilike(pattern),
                    IncidentRecord.title.ilike(pattern),
                    IncidentRecord.root_cause_title.ilike(pattern),
                    IncidentRecord.affected_component.ilike(pattern)
                )
            )

        stmt = stmt.limit(limit)
        result = await db.execute(stmt)
        incidents = list(result.scalars().all())

        return {
            "status": "SUCCESS",
            "total": len(incidents),
            "incidents": [
                {
                    "id": i.id,
                    "station_id": i.station_id,
                    "title": i.title,
                    "severity": i.severity,
                    "status": i.status,
                    "domain": i.domain,
                    "root_cause_title": i.root_cause_title,
                    "affected_component": i.affected_component,
                    "final_confidence_score": i.final_confidence_score,
                    "created_at": i.created_at.isoformat() if i.created_at else None
                }
                for i in incidents
            ]
        }

    async def get_sensor_data(
        self,
        db: AsyncSession,
        incident_id: Optional[str] = None,
        station_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves raw telemetry sensor data for a specific incident or station.
        """
        incident = None
        if incident_id:
            result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
            incident = result.scalar_one_or_none()
        elif station_id:
            result = await db.execute(
                select(IncidentRecord)
                .where(IncidentRecord.station_id == station_id)
                .order_by(desc(IncidentRecord.created_at))
                .limit(1)
            )
            incident = result.scalar_one_or_none()

        if not incident:
            return {
                "status": "NOT_FOUND",
                "message": f"No telemetry sensor record found for incident_id='{incident_id}' / station_id='{station_id}'",
                "telemetry": None
            }

        return {
            "status": "SUCCESS",
            "incident_id": incident.id,
            "station_id": incident.station_id,
            "created_at": incident.created_at.isoformat() if incident.created_at else None,
            "telemetry": incident.telemetry_json
        }

    async def search_documents(
        self,
        query: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Searches available SOPs, baseline specs, and scenario documents.
        """
        results = []
        q_lower = query.lower()

        # 1. Search Maintenance SOPs
        for sop in self.baseline_engine.sops:
            blob = f"{sop.get('title', '')} {sop.get('component', '')} {sop.get('causal_mechanism', '')} {' '.join(sop.get('symptoms', []))}".lower()
            if q_lower in blob:
                results.append({
                    "doc_type": "SOP",
                    "id": sop.get("id"),
                    "title": sop.get("title"),
                    "component": sop.get("component"),
                    "content_snippet": sop.get("causal_mechanism")
                })

        # 2. Search Golden Run Specs
        specs_blob = json.dumps(self.baseline_engine.golden_specs).lower()
        if q_lower in specs_blob:
            results.append({
                "doc_type": "SPECIFICATION",
                "id": "GOLDEN-RUN-SPECS",
                "title": "Golden Run Engineering Limits & Specifications",
                "component": "STATION_GLOBAL",
                "content_snippet": "Active engineering limits for thermal, kinematic, pneumatic, and acoustic sensors."
            })

        return {
            "status": "SUCCESS",
            "query": query,
            "total": len(results),
            "documents": results[:limit]
        }
