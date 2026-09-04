import pytest
import json
from httpx import AsyncClient, ASGITransport
from main import app
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    JointTelemetry,
    ThermalHotspot,
    AcousticAnomaly,
    TireFitmentMetrics,
    InvestigationStatus
)


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/harness/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert "ollama_connected" in data


@pytest.mark.asyncio
async def test_baselines_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/harness/baselines")
        assert response.status_code == 200
        data = response.json()
        assert "joints" in data
        assert "Joint_1" in data["joints"]


@pytest.mark.asyncio
async def test_sops_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/harness/sops")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5
        assert data[0]["id"] == "SOP-HARMONIC-001"


@pytest.mark.asyncio
async def test_investigate_post_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        snapshot = MultimodalTelemetrySnapshot(
            timestamp="2026-09-02T16:00:00Z",
            station_id="STATION-TIRE-FITTER-01",
            joints={
                "Joint_3": JointTelemetry(
                    joint_name="Elbow Pitch",
                    angle_deg=85.0,
                    torque_nm=345.0,
                    temp_c=88.5,
                    motor_current_a=7.8
                )
            },
            line_voltage_v=399.5,
            total_current_a=18.5,
            pneumatic_pressure_bar=6.2,
            thermal_hotspots=[
                ThermalHotspot(location="Joint 3", temp_c=88.5, delta_ambient_c=63.5, severity="CRITICAL")
            ],
            acoustic_anomalies=[
                AcousticAnomaly(frequency_hz=2800.0, magnitude_db=86.0, pattern_type="BEARING_GRIND")
            ]
        )

        response = await client.post(
            "/harness/investigate?incident_id=INC-API-TEST-001",
            json=snapshot.model_dump()
        )
        assert response.status_code == 200
        verdict = response.json()
        assert verdict["incident_id"] == "INC-API-TEST-001"
        assert verdict["status"] == "CONCLUSIVE"
        assert verdict["final_confidence_score"] >= 80.0
        assert verdict["primary_root_cause"] is not None


@pytest.mark.asyncio
async def test_investigate_stream_sse_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        snapshot = MultimodalTelemetrySnapshot(
            timestamp="2026-09-02T16:00:00Z",
            station_id="STATION-TIRE-FITTER-01",
            pneumatic_pressure_bar=4.0,
            acoustic_anomalies=[
                AcousticAnomaly(frequency_hz=5200.0, magnitude_db=78.0, pattern_type="VALVE_HISS")
            ],
            tire_fitment=TireFitmentMetrics(
                bead_seating_offset_mm=1.8,
                angular_misalignment_deg=0.45,
                torque_at_seating_nm=95.0
            )
        )

        response = await client.post(
            "/harness/investigate/stream?incident_id=INC-API-STREAM-001",
            json=snapshot.model_dump()
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        body = response.text
        assert "TRIAGE_AGENT" in body
        assert "EVIDENCE_RAG_AGENT" in body
        assert "ROOT_CAUSE_AGENT" in body
        assert "CRITIC_AGENT" in body
        assert "FINAL_VERDICT" in body
