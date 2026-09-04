import json
import uuid
import asyncio
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from web_backend.models import IncidentRecord, AgentTraceRecord, ApprovalAuditRecord
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    InvestigationVerdict,
    InvestigationStatus
)
from harness.orchestrator import InvestigationOrchestrator


# Active investigation task registry for on-demand query cancellation
_active_investigations: Dict[str, asyncio.Task] = {}


class IncidentService:
    @staticmethod
    async def ingest_incident(
        db: AsyncSession,
        snapshot: MultimodalTelemetrySnapshot,
        title: Optional[str] = None,
        severity: str = "HIGH",
        incident_id: Optional[str] = None
    ) -> IncidentRecord:
        """
        Persists a new failure incident alert from IoT sensors / PLC.
        """
        inc_id = incident_id or f"INC-{uuid.uuid4().hex[:8].upper()}"
        inc_title = title or f"Telemetry Anomaly Trigger at {snapshot.station_id}"

        record = IncidentRecord(
            id=inc_id,
            station_id=snapshot.station_id,
            title=inc_title,
            severity=severity,
            status="DETECTED",
            telemetry_json=snapshot.model_dump(),
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def cancel_investigation(
        db: AsyncSession,
        incident_id: str
    ) -> Dict[str, Any]:
        """
        Cancels an in-flight investigation query and updates database state.
        """
        task = _active_investigations.get(incident_id)
        task_cancelled = False
        if task and not task.done():
            task.cancel()
            task_cancelled = True

        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()
        if incident:
            if incident.status in ("INVESTIGATING", "DETECTED"):
                incident.status = "CANCELLED"
                cancel_trace = AgentTraceRecord(
                    incident_id=incident_id,
                    agent_name="ORCHESTRATOR",
                    step_type="CANCELLED",
                    message="Investigation query was explicitly cancelled by operator.",
                    payload_json={"reason": "Operator / Client Abort"},
                    created_at=datetime.datetime.now(datetime.timezone.utc)
                )
                db.add(cancel_trace)
                await db.commit()
                await db.refresh(incident)
            return {
                "incident_id": incident_id,
                "status": incident.status,
                "task_cancelled": task_cancelled
            }
        return {"incident_id": incident_id, "status": "NOT_FOUND", "task_cancelled": task_cancelled}

    @staticmethod
    async def investigate_incident(
        db: AsyncSession,
        incident_id: str,
        orchestrator: InvestigationOrchestrator
    ) -> InvestigationVerdict:
        """
        Executes the autonomous AI investigation harness for an incident,
        records all intermediate agent traces, and updates the incident record.
        Wraps execution in robust try-except with cancellation recovery.
        """
        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        snapshot = MultimodalTelemetrySnapshot.model_validate(incident.telemetry_json)
        incident.status = "INVESTIGATING"
        await db.commit()

        curr_task = asyncio.current_task()
        if curr_task:
            _active_investigations[incident_id] = curr_task

        final_verdict: Optional[InvestigationVerdict] = None

        try:
            # Execute streaming run and record traces
            async for event in orchestrator.run_investigation_stream(snapshot, incident_id=incident_id):
                trace = AgentTraceRecord(
                    incident_id=incident_id,
                    agent_name=event.get("agent", "UNKNOWN"),
                    step_type=event.get("step", "TRACE"),
                    message=event.get("message"),
                    payload_json=event.get("payload") or event.get("verdict"),
                    created_at=datetime.datetime.now(datetime.timezone.utc)
                )
                db.add(trace)

                if event.get("step") == "FINAL_VERDICT" and "verdict" in event:
                    final_verdict = InvestigationVerdict.model_validate(event["verdict"])

            if final_verdict:
                incident.status = "PENDING_APPROVAL" if final_verdict.status == InvestigationStatus.CONCLUSIVE else final_verdict.status.value
                incident.final_confidence_score = final_verdict.final_confidence_score
                incident.contradiction_detected = len(final_verdict.critic_report.contradictions_detected) > 0
                incident.recommended_mitigation = final_verdict.recommended_mitigation
                incident.requires_human_inspection = final_verdict.requires_human_inspection
                incident.verdict_json = final_verdict.model_dump()

                if final_verdict.primary_root_cause:
                    incident.root_cause_title = final_verdict.primary_root_cause.title
                    incident.root_cause_description = final_verdict.primary_root_cause.description
                    incident.affected_component = final_verdict.primary_root_cause.affected_component
            else:
                incident.status = "FAILED"

            await db.commit()
            await db.refresh(incident)
            return final_verdict

        except (Exception, asyncio.CancelledError) as e:
            is_cancelled = isinstance(e, asyncio.CancelledError)
            incident.status = "CANCELLED" if is_cancelled else "FAILED"
            msg = "Investigation query was cancelled by client/system." if is_cancelled else f"Investigation pipeline aborted due to runtime error: {str(e)}"
            fail_trace = AgentTraceRecord(
                incident_id=incident_id,
                agent_name="ORCHESTRATOR",
                step_type="CANCELLED" if is_cancelled else "ERROR",
                message=msg,
                payload_json={"error": "Cancelled" if is_cancelled else str(e)},
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(fail_trace)
            await db.commit()
            await db.refresh(incident)
            if is_cancelled:
                raise
            raise e
        finally:
            _active_investigations.pop(incident_id, None)

    @staticmethod
    async def reinvestigate_with_followup(
        db: AsyncSession,
        incident_id: str,
        orchestrator: InvestigationOrchestrator,
        operator_notes: Optional[str] = None,
        telemetry_override: Optional[Dict[str, Any]] = None
    ) -> InvestigationVerdict:
        """
        Initiates a follow-up investigation on an existing incident, incorporating
        updated operator shift notes and optional sensor readings.
        """
        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        current_telemetry = dict(incident.telemetry_json or {})
        if operator_notes:
            existing_notes = current_telemetry.get("operator_shift_notes") or ""
            current_telemetry["operator_shift_notes"] = f"{existing_notes} [FOLLOW-UP]: {operator_notes}".strip()
        if telemetry_override:
            current_telemetry.update(telemetry_override)

        incident.telemetry_json = current_telemetry
        followup_trace = AgentTraceRecord(
            incident_id=incident_id,
            agent_name="ENGINEER",
            step_type="FOLLOW_UP_INITIATED",
            message=f"Follow-up investigation initiated: {operator_notes or 'Re-evaluating with updated telemetry'}",
            payload_json={"operator_notes": operator_notes, "updates": telemetry_override},
            created_at=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(followup_trace)
        await db.commit()

        return await IncidentService.investigate_incident(
            db=db,
            incident_id=incident_id,
            orchestrator=orchestrator
        )

    @staticmethod
    async def record_human_approval(
        db: AsyncSession,
        incident_id: str,
        action: str,
        engineer_id: str,
        notes: Optional[str] = None
    ) -> ApprovalAuditRecord:
        """
        Records human-in-the-loop sign-off (APPROVE, OVERRIDE, DISPATCH_TECH).
        """
        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        audit = ApprovalAuditRecord(
            incident_id=incident_id,
            action=action.upper(),
            engineer_id=engineer_id,
            notes=notes,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(audit)

        if action.upper() == "APPROVE":
            incident.status = "APPROVED"
        elif action.upper() == "OVERRIDE":
            incident.status = "OVERRIDDEN"
        elif action.upper() == "DISPATCH_TECH":
            incident.status = "DISPATCHED_TECH"

        await db.commit()
        await db.refresh(audit)
        return audit

    @staticmethod
    async def list_incidents(
        db: AsyncSession,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[IncidentRecord]:
        """Lists incidents sorted by newest first."""
        query = select(IncidentRecord).order_by(desc(IncidentRecord.created_at)).offset(offset).limit(limit)
        if status:
            query = query.where(IncidentRecord.status == status)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_incident_detail(db: AsyncSession, incident_id: str) -> Optional[Dict[str, Any]]:
        """Fetches full incident details with traces and audits."""
        result = await db.execute(select(IncidentRecord).where(IncidentRecord.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            return None

        # Fetch traces
        traces_result = await db.execute(
            select(AgentTraceRecord)
            .where(AgentTraceRecord.incident_id == incident_id)
            .order_by(AgentTraceRecord.id)
        )
        traces = list(traces_result.scalars().all())

        # Fetch audits
        audits_result = await db.execute(
            select(ApprovalAuditRecord)
            .where(ApprovalAuditRecord.incident_id == incident_id)
            .order_by(desc(ApprovalAuditRecord.timestamp))
        )
        audits = list(audits_result.scalars().all())

        return {
            "id": incident.id,
            "station_id": incident.station_id,
            "title": incident.title,
            "severity": incident.severity,
            "status": incident.status,
            "created_at": incident.created_at.isoformat() if incident.created_at else None,
            "telemetry": incident.telemetry_json,
            "root_cause_title": incident.root_cause_title,
            "root_cause_description": incident.root_cause_description,
            "affected_component": incident.affected_component,
            "final_confidence_score": incident.final_confidence_score,
            "contradiction_detected": incident.contradiction_detected,
            "recommended_mitigation": incident.recommended_mitigation,
            "requires_human_inspection": incident.requires_human_inspection,
            "verdict": incident.verdict_json,
            "agent_traces": [
                {
                    "agent": t.agent_name,
                    "step": t.step_type,
                    "message": t.message,
                    "payload": t.payload_json,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                } for t in traces
            ],
            "approval_history": [
                {
                    "action": a.action,
                    "engineer_id": a.engineer_id,
                    "notes": a.notes,
                    "timestamp": a.timestamp.isoformat() if a.timestamp else None
                } for a in audits
            ]
        }

    @staticmethod
    def list_preset_scenarios() -> List[Dict[str, Any]]:
        """Loads and returns all preset scenarios from scenarios/ directory."""
        scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
        presets = []
        if scenarios_dir.exists():
            for file in sorted(scenarios_dir.glob("*.json")):
                with open(file, "r", encoding="utf-8") as f:
                    presets.append(json.load(f))
        return presets
