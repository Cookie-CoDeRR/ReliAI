import pytest
import json
from httpx import AsyncClient, ASGITransport
from main import app
from web_backend.database import AsyncSessionLocal
from web_backend.models import IncidentRecord, AgentTraceRecord, ApprovalAuditRecord
from web_backend.service import IncidentService
from harness.schemas import MultimodalTelemetrySnapshot, JointTelemetry


@pytest.mark.asyncio
async def test_scenario_sse_streaming_endpoint():
    """
    Tests POST /api/v1/scenarios/{scenario_id}/stream.
    Verifies that SSE streaming emits real-time events for all agents
    and persists the incident in the database.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/stream"
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

        body = response.text
        assert "TRIAGE_AGENT" in body
        assert "EVIDENCE_RAG_AGENT" in body
        assert "DOMAIN_ANALYSIS" in body
        assert "ROOT_CAUSE_AGENT" in body
        assert "CRITIC_AGENT" in body
        assert "CONFIDENCE_ENGINE" in body
        assert "event: complete" in body

        # Extract incident_id from the first event line
        lines = body.split("\n")
        incident_id = None
        for line in lines:
            if line.startswith("data: "):
                data = json.loads(line[6:])
                if "incident_id" in data:
                    incident_id = data["incident_id"]
                    break

        assert incident_id is not None

        # Verify record exists in database
        async with AsyncSessionLocal() as session:
            detail = await IncidentService.get_incident_detail(session, incident_id)
            assert detail is not None
            assert detail["id"] == incident_id
            assert len(detail["agent_traces"]) > 0
            assert detail["domain"] is not None


@pytest.mark.asyncio
async def test_analytics_summary_endpoint():
    """
    Tests GET /api/v1/analytics/summary.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_incidents" in data
        assert "conclusive_rate" in data
        assert "average_confidence" in data
        assert "status_breakdown" in data
        assert "contradictions_detected" in data
        assert data["total_incidents"] > 0


@pytest.mark.asyncio
async def test_analytics_domain_breakdown_endpoint():
    """
    Tests GET /api/v1/analytics/domain-breakdown.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/analytics/domain-breakdown")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        first = data[0]
        assert "domain" in first
        assert "count" in first
        assert "percentage" in first


@pytest.mark.asyncio
async def test_analytics_confidence_distribution_endpoint():
    """
    Tests GET /api/v1/analytics/confidence-distribution.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/analytics/confidence-distribution")
        assert response.status_code == 200
        data = response.json()
        assert "90-100%" in data
        assert "80-89%" in data
        assert "70-79%" in data
        assert "60-69%" in data
        assert "<60%" in data


@pytest.mark.asyncio
async def test_analytics_approval_breakdown_endpoint():
    """
    Tests GET /api/v1/analytics/approval-breakdown.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/analytics/approval-breakdown")
        assert response.status_code == 200
        data = response.json()
        assert "total_actions" in data
        assert "actions" in data
        assert "approval_rate" in data


@pytest.mark.asyncio
async def test_stored_incident_streaming_endpoint():
    """
    Tests POST /api/v1/incidents/{incident_id}/investigate/stream.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First ingest an incident
        snapshot = MultimodalTelemetrySnapshot(
            timestamp="2026-09-04T12:00:00Z",
            station_id="STATION-TEST-STREAM",
            joints={"Joint_3": JointTelemetry(joint_name="Elbow", angle_deg=45.0, torque_nm=250.0, temp_c=82.0, motor_current_a=6.5)}
        )
        ingest_res = await client.post(
            "/api/v1/incidents/ingest",
            json={"title": "Test Stream Ingest", "severity": "HIGH", "snapshot": snapshot.model_dump()}
        )
        assert ingest_res.status_code == 200
        inc_id = ingest_res.json()["incident_id"]

        # Now stream investigation for that stored incident
        stream_res = await client.post(f"/api/v1/incidents/{inc_id}/investigate/stream")
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers["content-type"]
        body = stream_res.text
        assert "TRIAGE_AGENT" in body
        assert "CONFIDENCE_ENGINE" in body
