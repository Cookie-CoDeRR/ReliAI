import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from web_backend.database import init_db, AsyncSessionLocal
from web_backend.services.evidence_service import EvidenceService
from web_backend.services.report_service import ReportService


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_evidence_service_unit_methods():
    evidence_service = EvidenceService()
    async with AsyncSessionLocal() as db:
        # 1. Test telemetry evidence calculation
        sample_telemetry = {
            "timestamp": "2026-09-06T10:00:00Z",
            "station_id": "TEST-STATION-01",
            "line_voltage_v": 365.0,  # Below 380V threshold -> undervoltage sag
            "pneumatic_pressure_bar": 6.2,
            "joints": {
                "Joint_3": {
                    "joint_name": "Joint_3",
                    "angle_deg": 45.0,
                    "torque_nm": 345.0,  # Torque spike > 300 Nm limit
                    "temp_c": 88.5,       # Thermal overheat > 65 C limit
                    "motor_current_a": 7.8
                }
            }
        }
        telemetry_items = evidence_service.get_telemetry_evidence(sample_telemetry)
        assert len(telemetry_items) >= 2
        sources = [item["source"] for item in telemetry_items]
        assert any("Thermal Sensor" in s for s in sources)
        assert any("Power Monitor" in s for s in sources)

        # 2. Test document evidence retrieval
        doc_evidence = await evidence_service.get_document_evidence(query="Harmonic")
        assert len(doc_evidence) >= 1
        assert doc_evidence[0]["evidence_type"] in ["SOP", "SPECIFICATION", "DOCUMENT"]


@pytest.mark.asyncio
async def test_evidence_service_with_triggered_incident():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Trigger Scenario 1
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        assert trigger_res.status_code == 200
        incident_id = trigger_res.json()["incident_id"]

        evidence_service = EvidenceService()
        async with AsyncSessionLocal() as db:
            # 1. Retrieve incident evidence directly
            inc_evd = await evidence_service.get_incident_evidence(db=db, incident_id=incident_id)
            assert inc_evd["incident_id"] == incident_id
            assert inc_evd["count"] >= 1

            # 2. Retrieve log evidence
            log_evd = await evidence_service.get_log_evidence(db=db, incident_id=incident_id)
            assert len(log_evd) >= 1
            assert all(item["evidence_type"] == "LOG" for item in log_evd)

            # 3. Retrieve maintenance evidence
            maint_evd = await evidence_service.get_maintenance_evidence(db=db, component="Joint 3", incident_id=incident_id)
            assert len(maint_evd) >= 1

            # 4. Retrieve similar incident evidence
            sim_evd = await evidence_service.get_similar_incident_evidence(db=db, station_id="STATION-TIRE-FITTER-01")
            assert len(sim_evd) >= 1

            # 5. Retrieve all evidence dossier
            all_evd = await evidence_service.get_all_evidence(db=db, incident_id=incident_id)
            assert all_evd["incident_id"] == incident_id
            assert all_evd["total_evidence_count"] >= 2


@pytest.mark.asyncio
async def test_evidence_api_endpoint_and_404():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Trigger scenario
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        incident_id = trigger_res.json()["incident_id"]

        # 2. Query GET /api/v1/incidents/{incident_id}/evidence
        res = await client.get(f"/api/v1/incidents/{incident_id}/evidence")
        assert res.status_code == 200
        data = res.json()
        assert data["incident_id"] == incident_id
        assert data["count"] >= 1
        assert "evidence" in data

        # 3. Query 404 for non-existent incident
        res_404 = await client.get("/api/v1/incidents/INC-NON-EXISTENT-999/evidence")
        assert res_404.status_code == 404
        assert "not found" in res_404.json()["detail"].lower()


@pytest.mark.asyncio
async def test_report_service_generation_and_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Trigger scenario
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        incident_id = trigger_res.json()["incident_id"]

        report_service = ReportService()
        async with AsyncSessionLocal() as db:
            # Generate report programmatically
            report = await report_service.generate_report(db=db, incident_id=incident_id)
            assert report["report_id"] == f"RPT-{incident_id}"
            assert report["incident_summary"]["incident_id"] == incident_id
            assert report["investigation_results"]["final_confidence_score"] >= 80.0
            assert report["root_cause"] is not None
            assert report["root_cause"]["title"] is not None
            assert report["evidence_count"] >= 1
            assert report["agent_traces_count"] >= 1

        # 2. Query GET /api/v1/incidents/{incident_id}/report API endpoint
        api_res = await client.get(f"/api/v1/incidents/{incident_id}/report")
        assert api_res.status_code == 200
        api_report = api_res.json()
        assert api_report["report_id"] == f"RPT-{incident_id}"
        assert api_report["investigation_results"]["status"] in ["PENDING_APPROVAL", "CONCLUSIVE"]

        # 3. Query 404 for non-existent incident report
        report_404 = await client.get("/api/v1/incidents/INC-NON-EXISTENT-999/report")
        assert report_404.status_code == 404
        assert "not found" in report_404.json()["detail"].lower()
