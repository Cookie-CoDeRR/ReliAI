import pytest
import pytest_asyncio
import asyncio
from unittest.mock import patch, AsyncMock
from httpx import HTTPStatusError, Request, Response, AsyncClient, ASGITransport
from main import app
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    TriageAssessment,
    IncidentDomain
)
from harness.ollama_client import AsyncOllamaClient
from harness.orchestrator import InvestigationOrchestrator
from web_backend.service import IncidentService
from web_backend.database import init_db, AsyncSessionLocal


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_ollama_fallback_on_http_error():
    """Verify that HTTP 404/500/503 from Ollama smoothly activates deterministic rule fallback."""
    client = AsyncOllamaClient(mock_fallback=True)
    
    mock_request = Request("POST", "http://localhost:11434/api/generate")
    mock_response = Response(status_code=404, request=mock_request)
    http_error = HTTPStatusError("Model 'gemma2:latest' not found", request=mock_request, response=mock_response)
    
    with patch("httpx.AsyncClient.post", side_effect=http_error):
        assessment = await client.generate_structured(
            prompt="Alert: Joint 3 temperature 88.5°C with acoustic grind.",
            system_instruction="You are an industrial triage AI.",
            schema_class=TriageAssessment
        )
        assert isinstance(assessment, TriageAssessment)
        assert assessment.incident_domain == IncidentDomain.THERMAL_OVERHEAT


@pytest.mark.asyncio
async def test_ollama_model_readiness_check():
    """Verify check_model_readiness reports model status correctly."""
    client = AsyncOllamaClient()
    
    # When Ollama is offline
    with patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):
        status = await client.check_model_readiness()
        assert status["available"] is False
        assert status["model_ready"] is False

    # When Ollama is online and models list is returned
    mock_resp = AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json = lambda: {"models": [{"name": "gemma2:latest"}, {"name": "qwen2.5-vl:latest"}]}
    
    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        status = await client.check_model_readiness("gemma2:latest")
        assert status["available"] is True
        assert status["model_ready"] is True


@pytest.mark.asyncio
async def test_investigation_query_cancellation():
    """Verify in-flight query cancellation updates status to CANCELLED without corrupting DB."""
    async with AsyncSessionLocal() as session:
        snapshot = MultimodalTelemetrySnapshot(
            station_id="STATION-CANCEL-TEST",
            timestamp="2026-09-04T18:00:00Z",
            joint_telemetry={}
        )
        
        incident = await IncidentService.ingest_incident(
            db=session,
            snapshot=snapshot,
            title="Test In-Flight Cancellation"
        )
        
        # Execute cancellation
        cancel_result = await IncidentService.cancel_investigation(
            db=session,
            incident_id=incident.id
        )
        assert cancel_result["status"] == "CANCELLED"
        
        detail = await IncidentService.get_incident_detail(session, incident.id)
        assert detail["status"] == "CANCELLED"
        assert any(t["step"] == "CANCELLED" for t in detail["agent_traces"])


@pytest.mark.asyncio
async def test_follow_up_reinvestigation():
    """Verify follow-up investigation updates notes, records trace, and produces verdict."""
    orchestrator = InvestigationOrchestrator()
    async with AsyncSessionLocal() as session:
        snapshot = MultimodalTelemetrySnapshot(
            station_id="STATION-FOLLOWUP-TEST",
            timestamp="2026-09-04T18:00:00Z",
            joint_telemetry={
                "Joint_3": {"temp_c": 88.5, "torque_nm": 165.0, "vibration_rms": 4.5, "current_a": 12.8}
            }
        )
        
        incident = await IncidentService.ingest_incident(
            db=session,
            snapshot=snapshot,
            title="Test Initial Failure"
        )
        
        # Initial investigation
        verdict_1 = await IncidentService.investigate_incident(
            db=session,
            incident_id=incident.id,
            orchestrator=orchestrator
        )
        assert verdict_1 is not None
        
        # Follow-up investigation with engineer shift observations
        verdict_2 = await IncidentService.reinvestigate_with_followup(
            db=session,
            incident_id=incident.id,
            orchestrator=orchestrator,
            operator_notes="Re-inspected Joint 3 seal and found metal debris in oil reservoir.",
            telemetry_override={"line_voltage_v": 401.0}
        )
        assert verdict_2 is not None
        
        detail = await IncidentService.get_incident_detail(session, incident.id)
        assert "[FOLLOW-UP]" in detail["telemetry"]["operator_shift_notes"]
        assert any(t["step"] == "FOLLOW_UP_INITIATED" for t in detail["agent_traces"])


@pytest.mark.asyncio
async def test_cancel_endpoint_via_api():
    """Test POST /api/v1/incidents/{incident_id}/cancel endpoint via FastAPI."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Ingest incident
        ingest_res = await client.post("/api/v1/incidents/ingest", json={
            "title": "API Cancellation Test",
            "severity": "HIGH",
            "snapshot": {
                "station_id": "STATION-API-CANCEL",
                "timestamp": "2026-09-04T18:00:00Z",
                "joint_telemetry": {}
            }
        })
        assert ingest_res.status_code == 200
        incident_id = ingest_res.json()["incident_id"]

        # Cancel incident
        cancel_res = await client.post(f"/api/v1/incidents/{incident_id}/cancel")
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "CANCELLED"
