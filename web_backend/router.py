import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from web_backend.database import get_db
from web_backend.service import IncidentService
from harness.schemas import MultimodalTelemetrySnapshot, HumanApprovalAction
from harness.orchestrator import InvestigationOrchestrator

router = APIRouter(prefix="/api/v1", tags=["Web Platform & Incidents"])

_shared_orchestrator: Optional[InvestigationOrchestrator] = None


def get_orchestrator(request: Request = None) -> InvestigationOrchestrator:
    """FastAPI dependency to retrieve the singleton InvestigationOrchestrator."""
    global _shared_orchestrator
    if request and hasattr(request.app.state, "orchestrator"):
        return request.app.state.orchestrator
    if _shared_orchestrator is None:
        _shared_orchestrator = InvestigationOrchestrator()
    return _shared_orchestrator


class IngestIncidentRequest(BaseModel):
    title: Optional[str] = None
    severity: str = "HIGH"
    snapshot: MultimodalTelemetrySnapshot


class ApprovalRequest(BaseModel):
    action: str  # APPROVE | OVERRIDE | DISPATCH_TECH
    engineer_id: str
    notes: Optional[str] = None


@router.get("/scenarios")
async def list_scenarios():
    """Returns all available industrial failure scenario presets."""
    return IncidentService.list_preset_scenarios()


@router.post("/scenarios/{scenario_id}/trigger")
async def trigger_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """
    Ingests and runs a full investigation for a pre-configured industrial scenario.
    Validates scenario_id against path traversal attempts.
    """
    if not re.match(r"^[a-zA-Z0-9_\-]+$", scenario_id):
        raise HTTPException(status_code=400, detail="Invalid scenario_id format")

    presets = IncidentService.list_preset_scenarios()
    target = next((s for s in presets if s["scenario_id"] == scenario_id), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    snapshot = MultimodalTelemetrySnapshot.model_validate(target["snapshot"])
    incident = await IncidentService.ingest_incident(
        db=db,
        snapshot=snapshot,
        title=target["title"],
        severity="CRITICAL" if target["expected_outcome"] == "CONCLUSIVE" else "HIGH"
    )

    verdict = await IncidentService.investigate_incident(
        db=db,
        incident_id=incident.id,
        orchestrator=orchestrator
    )

    return {
        "incident_id": incident.id,
        "scenario_title": target["title"],
        "status": incident.status,
        "verdict": verdict.model_dump() if verdict else None
    }


@router.post("/incidents/ingest")
async def ingest_incident(req: IngestIncidentRequest, db: AsyncSession = Depends(get_db)):
    """Ingests a new raw incident from IoT sensors or factory PLC."""
    incident = await IncidentService.ingest_incident(
        db=db,
        snapshot=req.snapshot,
        title=req.title,
        severity=req.severity
    )
    return {
        "status": "INGESTED",
        "incident_id": incident.id,
        "station_id": incident.station_id,
        "created_at": incident.created_at.isoformat()
    }


@router.get("/incidents")
async def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status (e.g. DETECTED, PENDING_APPROVAL, APPROVED)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Lists incidents with optional status filtering."""
    incidents = await IncidentService.list_incidents(db=db, status=status, limit=limit, offset=offset)
    return [
        {
            "id": i.id,
            "station_id": i.station_id,
            "title": i.title,
            "severity": i.severity,
            "status": i.status,
            "final_confidence_score": i.final_confidence_score,
            "root_cause_title": i.root_cause_title,
            "created_at": i.created_at.isoformat() if i.created_at else None
        } for i in incidents
    ]


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches full incident details, agent trace steps, and human authorization logs."""
    detail = await IncidentService.get_incident_detail(db=db, incident_id=incident_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return detail


@router.post("/incidents/{incident_id}/investigate")
async def investigate_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """Triggers the autonomous AI Investigation Harness for a stored incident."""
    try:
        verdict = await IncidentService.investigate_incident(
            db=db,
            incident_id=incident_id,
            orchestrator=orchestrator
        )
        return {
            "status": "INVESTIGATION_COMPLETED",
            "verdict": verdict.model_dump() if verdict else None
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")


@router.post("/incidents/{incident_id}/approve")
async def approve_incident(
    incident_id: str,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Records human-in-the-loop sign-off (APPROVE mitigation, OVERRIDE diagnosis, or DISPATCH_TECH).
    """
    try:
        audit = await IncidentService.record_human_approval(
            db=db,
            incident_id=incident_id,
            action=req.action,
            engineer_id=req.engineer_id,
            notes=req.notes
        )
        return {
            "status": "ACTION_RECORDED",
            "incident_id": incident_id,
            "action": audit.action,
            "engineer_id": audit.engineer_id,
            "timestamp": audit.timestamp.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
