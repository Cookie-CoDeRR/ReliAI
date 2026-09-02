import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from web_backend.database import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_list_scenarios_preset():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/scenarios")
        assert response.status_code == 200
        scenarios = response.json()
        assert len(scenarios) >= 4
        scenario_ids = [s["scenario_id"] for s in scenarios]
        assert "SCENARIO-01-THERMAL-OVERHEAT" in scenario_ids
        assert "SCENARIO-02-PNEUMATIC-DROP" in scenario_ids
        assert "SCENARIO-03-CONTRADICTORY-FAULT" in scenario_ids
        assert "SCENARIO-04-VOLTAGE-SAG" in scenario_ids


@pytest.mark.asyncio
async def test_trigger_scenario_1_and_human_approval_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Trigger Scenario 1 (Thermal Overheat)
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        assert trigger_res.status_code == 200
        data = trigger_res.json()
        incident_id = data["incident_id"]
        assert incident_id.startswith("INC-")
        assert data["verdict"]["status"] == "CONCLUSIVE"

        # 2. Query Incident List
        list_res = await client.get("/api/v1/incidents")
        assert list_res.status_code == 200
        incidents = list_res.json()
        assert any(i["id"] == incident_id for i in incidents)

        # 3. Query Incident Detail (Verify Traces)
        detail_res = await client.get(f"/api/v1/incidents/{incident_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == incident_id
        assert detail["status"] == "PENDING_APPROVAL"
        assert len(detail["agent_traces"]) >= 6
        assert detail["final_confidence_score"] >= 80.0

        # 4. Human Approval Action (APPROVE)
        approve_res = await client.post(
            f"/api/v1/incidents/{incident_id}/approve",
            json={
                "action": "APPROVE",
                "engineer_id": "ENG-RITESH-01",
                "notes": "Verified Joint 3 grease replacement SOP. Maintenance dispatched."
            }
        )
        assert approve_res.status_code == 200
        approve_data = approve_res.json()
        assert approve_data["status"] == "ACTION_RECORDED"
        assert approve_data["action"] == "APPROVE"

        # 5. Check updated status & audit log in detail
        updated_detail = await client.get(f"/api/v1/incidents/{incident_id}")
        assert updated_detail.json()["status"] == "APPROVED"
        assert len(updated_detail.json()["approval_history"]) == 1
        assert updated_detail.json()["approval_history"][0]["engineer_id"] == "ENG-RITESH-01"


@pytest.mark.asyncio
async def test_trigger_scenario_3_contradictory_and_override():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Trigger Contradictory Fault Scenario
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-03-CONTRADICTORY-FAULT/trigger")
        assert trigger_res.status_code == 200
        data = trigger_res.json()
        incident_id = data["incident_id"]

        # Detail should reflect INCONCLUSIVE safeguard
        detail_res = await client.get(f"/api/v1/incidents/{incident_id}")
        detail = detail_res.json()
        assert detail["status"] == "INCONCLUSIVE_CONTRADICTIONS"
        assert detail["contradiction_detected"] is True
        assert detail["requires_human_inspection"] is True
        assert detail["final_confidence_score"] <= 45.0

        # Human Dispatches Physical Technician
        dispatch_res = await client.post(
            f"/api/v1/incidents/{incident_id}/approve",
            json={
                "action": "DISPATCH_TECH",
                "engineer_id": "ENG-SUPERVISOR-09",
                "notes": "Confirmed sensor anomaly. Technician dispatched with multimeter to inspect thermocouple lead."
            }
        )
        assert dispatch_res.status_code == 200
        assert dispatch_res.json()["action"] == "DISPATCH_TECH"
