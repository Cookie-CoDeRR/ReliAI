import re
import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from web_backend.database import get_db
from web_backend.service import IncidentService
from harness.schemas import MultimodalTelemetrySnapshot, HumanApprovalAction
from harness.orchestrator import InvestigationOrchestrator

router = APIRouter(prefix="/api/v1", tags=["Web Platform & Incidents"])

# Simple in-memory rate limiter for GPU-intensive endpoints
# Maps client IP -> last trigger timestamp
_trigger_cooldowns: Dict[str, float] = {}
_TRIGGER_COOLDOWN_SEC = 15.0  # Minimum seconds between scenario triggers per client

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
    request: Request,
    db: AsyncSession = Depends(get_db),
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """
    Ingests and runs a full investigation for a pre-configured industrial scenario.
    Validates scenario_id against path traversal attempts.
    Rate-limited to 1 trigger per 15 seconds per client IP.
    """
    # --- Rate Limit Check (skip for loopback/test clients) ---
    client_ip = request.client.host if request.client else "unknown"
    is_local = client_ip in ("127.0.0.1", "::1", "testclient", "localhost")
    if not is_local:
        now = time.monotonic()
        last_trigger = _trigger_cooldowns.get(client_ip, 0.0)
        if now - last_trigger < _TRIGGER_COOLDOWN_SEC:
            remaining = round(_TRIGGER_COOLDOWN_SEC - (now - last_trigger), 1)
            raise HTTPException(
                status_code=429,
                detail=f"Rate limited: please wait {remaining}s before triggering another scenario."
            )
        _trigger_cooldowns[client_ip] = now

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
    station_id: Optional[str] = Query(None, description="Filter by station ID"),
    severity: Optional[str] = Query(None, description="Filter by severity (e.g. CRITICAL, HIGH, MEDIUM, LOW)"),
    search: Optional[str] = Query(None, description="Case-insensitive search matching incident ID, title, root cause, or affected component"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Lists incidents with optional status, station_id, severity, and search filtering."""
    incidents = await IncidentService.list_incidents(
        db=db,
        status=status,
        station_id=station_id,
        severity=severity,
        search=search,
        limit=limit,
        offset=offset
    )
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


@router.post("/incidents/{incident_id}/cancel")
async def cancel_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancels an in-flight investigation query or aborts stuck incident processing.
    """
    result = await IncidentService.cancel_investigation(db=db, incident_id=incident_id)
    if result.get("status") == "NOT_FOUND":
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return result


class FollowUpRequest(BaseModel):
    operator_notes: Optional[str] = None
    telemetry_override: Optional[Dict[str, Any]] = None


@router.post("/incidents/{incident_id}/follow-up")
async def follow_up_investigation(
    incident_id: str,
    req: FollowUpRequest,
    db: AsyncSession = Depends(get_db),
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """
    Executes a follow-up investigation on an existing incident with additional notes or sensor overrides.
    """
    try:
        verdict = await IncidentService.reinvestigate_with_followup(
            db=db,
            incident_id=incident_id,
            orchestrator=orchestrator,
            operator_notes=req.operator_notes,
            telemetry_override=req.telemetry_override
        )
        return {
            "status": "FOLLOW_UP_COMPLETED",
            "incident_id": incident_id,
            "verdict": verdict.model_dump() if verdict else None
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Follow-up investigation failed: {str(e)}")


@router.get("/system/model-status")
async def check_models(
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """
    Returns the fail-safe readiness status of Ollama, Gemma reasoner, and Qwen2.5-VL vision specialist.
    """
    text_status = await orchestrator.client.check_model_readiness()
    vision_status = await orchestrator.client.check_model_readiness(orchestrator.client.vision_model)
    return {
        "text_model": text_status,
        "vision_model": vision_status,
        "mock_fallback_enabled": orchestrator.client.mock_fallback
    }
