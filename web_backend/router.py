import re
import time
import json
import logging
from typing import List, Optional, Dict, Any
<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
=======
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
>>>>>>> main
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from web_backend.database import get_db
from web_backend.service import IncidentService
from web_backend.services.tool_service import ToolAccessService
from web_backend.services.system_service import SystemService, SystemStatusResponse
from web_backend.services.evidence_service import EvidenceService
from web_backend.services.report_service import ReportService
from web_backend.services.upload_service import UploadService
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


class SearchLogsRequest(BaseModel):
    query: Optional[str] = None
    incident_id: Optional[str] = None
    agent_name: Optional[str] = None
    limit: int = 50
    offset: int = 0


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


@router.post("/scenarios/{scenario_id}/stream")
async def stream_scenario(
    scenario_id: str,
    request: Request,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """
    Ingests and streams real-time multi-agent deliberation events for an industrial scenario via SSE.
    Rate-limited to 1 trigger per 15 seconds per client IP.
    """
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

    async def event_generator():
        from web_backend.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            try:
                incident = await IncidentService.ingest_incident(
                    db=session,
                    snapshot=snapshot,
                    title=target["title"],
                    severity="CRITICAL" if target["expected_outcome"] == "CONCLUSIVE" else "HIGH"
                )
                async for event in IncidentService.stream_investigate_incident(
                    db=session,
                    incident_id=incident.id,
                    orchestrator=orchestrator
                ):
                    yield f"data: {json.dumps(event)}\n\n"
                yield "event: complete\ndata: {}\n\n"
            except Exception as err:
                logging.getLogger("reliai-harness").error(f"Error in scenario SSE stream: {err}", exc_info=True)
                yield f"event: error\ndata: {json.dumps({'error': str(err)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )



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


@router.post("/incidents/{incident_id}/investigate/stream")
async def stream_investigate_stored_incident(
    incident_id: str,
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """
    Streams multi-agent deliberation events for an existing stored incident via SSE.
    """
    async def event_generator():
        from web_backend.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            try:
                async for event in IncidentService.stream_investigate_incident(
                    db=session,
                    incident_id=incident_id,
                    orchestrator=orchestrator
                ):
                    yield f"data: {json.dumps(event)}\n\n"
                yield "event: complete\ndata: {}\n\n"
            except Exception as err:
                logging.getLogger("reliai-harness").error(f"Error in incident SSE stream: {err}", exc_info=True)
                yield f"event: error\ndata: {json.dumps({'error': str(err)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )



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


<<<<<<< HEAD
# =============================================================================
# KUSHAGRA BACKEND VERTICAL — PHASE 1: SYSTEM STATUS & TOOL ACCESS APIs
# =============================================================================

_tool_access_service = ToolAccessService()


@router.get("/system/status", response_model=SystemStatusResponse, tags=["System Services"])
async def get_system_status(
    request: Request,
=======
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
>>>>>>> main
    db: AsyncSession = Depends(get_db),
    orchestrator: InvestigationOrchestrator = Depends(get_orchestrator)
):
    """
<<<<<<< HEAD
    Returns live operational status across Database, Ollama LLM, Storage, and Tool Access Layer.
    Exposes zero secrets, credentials, or internal filesystem paths.
    """
    return await SystemService.get_system_status(db=db, ollama_client=orchestrator.client)


@router.get("/tools/available", tags=["Tool Access Layer"])
async def list_available_tools():
    """Returns directory of registered data retrieval and analysis tools."""
    return _tool_access_service.get_available_tools()


@router.post("/tools/search-logs", tags=["Tool Access Layer"])
async def search_logs(
    req: SearchLogsRequest,
    db: AsyncSession = Depends(get_db)
):
    """Searches agent traces and system log entries in DB."""
    return await _tool_access_service.search_logs(
        db=db,
        query=req.query,
        incident_id=req.incident_id,
        agent_name=req.agent_name,
        limit=req.limit,
        offset=req.offset
    )


@router.get("/tools/maintenance-history", tags=["Tool Access Layer"])
async def get_maintenance_history(
    component: Optional[str] = Query(None, description="Filter SOPs by component name"),
    incident_id: Optional[str] = Query(None, description="Filter audit logs by incident ID"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves maintenance SOP procedures and human dispatch audit records."""
    return await _tool_access_service.get_maintenance_history(
        db=db,
        component=component,
        incident_id=incident_id,
        limit=limit
    )


@router.get("/tools/similar-incidents", tags=["Tool Access Layer"])
async def find_similar_incidents(
    station_id: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Queries historical failure incidents by station, domain, severity, or keyword."""
    return await _tool_access_service.find_similar_incidents(
        db=db,
        station_id=station_id,
        domain=domain,
        severity=severity,
        search=search,
        limit=limit
    )


@router.get("/tools/sensor-data", tags=["Tool Access Layer"])
async def get_sensor_data(
    incident_id: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves raw sensor telemetry snapshot for an incident or station."""
    return await _tool_access_service.get_sensor_data(
        db=db,
        incident_id=incident_id,
        station_id=station_id
    )


@router.get("/tools/search-documents", tags=["Tool Access Layer"])
async def search_documents(
    query: str = Query(..., min_length=1, description="Keyword query to search across industrial SOPs and specs"),
    limit: int = Query(10, ge=1, le=50)
):
    """Searches industrial SOPs, golden specs, and scenario benchmark files."""
    return await _tool_access_service.search_documents(query=query, limit=limit)


# =============================================================================
# KUSHAGRA BACKEND VERTICAL — PHASE 2: EVIDENCE & REPORT APIs
# =============================================================================

_evidence_service = EvidenceService()
_report_service = ReportService(evidence_service=_evidence_service)


@router.get("/incidents/{incident_id}/evidence", tags=["Evidence Service"])
async def get_incident_evidence(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves empirical normalized evidence items collected for an incident."""
    try:
        return await _evidence_service.get_incident_evidence(db=db, incident_id=incident_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/incidents/{incident_id}/report", tags=["Report Service"])
async def get_incident_report(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves/compiles the structured investigation report for an existing incident."""
    try:
        return await _report_service.generate_report(db=db, incident_id=incident_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# =============================================================================
# KUSHAGRA BACKEND VERTICAL — PHASE 3: UPLOAD & INGESTION APIs
# =============================================================================

_upload_service = UploadService()


@router.post("/uploads", tags=["Upload & Ingestion Subsystem"])
async def upload_file(
    file: UploadFile = File(...),
    incident_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests and parses uploaded PDF, CSV, TXT, LOG, PNG, or JPEG files.
    Enforces maximum size limit (10MB), filename sanitization, and path containment.
    """
    try:
        content = await file.read()
        record = await _upload_service.create_upload(
            db=db,
            file_bytes=content,
            original_filename=file.filename or "upload.bin",
            mime_type=file.content_type or "application/octet-stream",
            incident_id=incident_id
        )
        return {
            "status": "UPLOADED",
            "upload_id": record.id,
            "original_filename": record.original_filename,
            "file_type": record.file_type,
            "file_size_bytes": record.file_size_bytes,
            "incident_id": record.incident_id,
            "ingestion_status": record.ingestion_status,
            "created_at": record.created_at.isoformat() if record.created_at else None
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")


@router.get("/uploads", tags=["Upload & Ingestion Subsystem"])
async def list_uploads(
    incident_id: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Lists stored file uploads with optional filtering by incident ID or file type."""
    records = await _upload_service.list_uploads(
        db=db,
        incident_id=incident_id,
        file_type=file_type,
        limit=limit,
        offset=offset
    )
    return [
        {
            "id": r.id,
            "original_filename": r.original_filename,
            "file_type": r.file_type,
            "mime_type": r.mime_type,
            "file_size_bytes": r.file_size_bytes,
            "incident_id": r.incident_id,
            "ingestion_status": r.ingestion_status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]


@router.get("/uploads/{upload_id}", tags=["Upload & Ingestion Subsystem"])
async def get_upload_metadata(
    upload_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves full upload record dossier including extracted text and parsed metadata."""
    record = await _upload_service.get_upload_record(db=db, upload_id=upload_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Upload '{upload_id}' not found")

    return {
        "id": record.id,
        "original_filename": record.original_filename,
        "file_type": record.file_type,
        "mime_type": record.mime_type,
        "file_size_bytes": record.file_size_bytes,
        "incident_id": record.incident_id,
        "ingestion_status": record.ingestion_status,
        "extracted_text": record.extracted_text,
        "parsed_metadata": record.parsed_metadata_json,
        "error_message": record.error_message,
        "created_at": record.created_at.isoformat() if record.created_at else None
    }


@router.get("/uploads/{upload_id}/file", tags=["Upload & Ingestion Subsystem"])
async def download_upload_file(
    upload_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Serves the raw physical file safely after asserting path containment."""
    record = await _upload_service.get_upload_record(db=db, upload_id=upload_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Upload '{upload_id}' not found")

    try:
        physical_path = _upload_service.get_physical_file_path(record)
        if not physical_path.exists():
            raise HTTPException(status_code=404, detail="Stored file missing from disk storage")
        return FileResponse(
            path=str(physical_path),
            filename=record.original_filename,
            media_type=record.mime_type
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/uploads/{upload_id}", tags=["Upload & Ingestion Subsystem"])
async def delete_upload(
    upload_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Deletes uploaded file from storage directory and removes UploadRecord from DB."""
    success = await _upload_service.delete_upload(db=db, upload_id=upload_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Upload '{upload_id}' not found")

    return {
        "status": "DELETED",
        "upload_id": upload_id
    }
=======
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


@router.get("/analytics/summary")
async def get_analytics_summary(db: AsyncSession = Depends(get_db)):
    """Returns aggregated executive KPI metrics across all incidents."""
    return await IncidentService.get_analytics_summary(db)


@router.get("/analytics/domain-breakdown")
async def get_domain_breakdown(db: AsyncSession = Depends(get_db)):
    """Returns incident counts and percentages grouped by failure domain."""
    return await IncidentService.get_domain_breakdown(db)


@router.get("/analytics/confidence-distribution")
async def get_confidence_distribution(db: AsyncSession = Depends(get_db)):
    """Returns binned histogram of final confidence scores."""
    return await IncidentService.get_confidence_distribution(db)


@router.get("/analytics/approval-breakdown")
async def get_approval_breakdown(db: AsyncSession = Depends(get_db)):
    """Returns human engineer sign-off audit statistics."""
    return await IncidentService.get_approval_breakdown(db)

>>>>>>> main
