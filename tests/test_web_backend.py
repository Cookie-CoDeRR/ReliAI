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


@pytest.mark.asyncio
async def test_incident_list_filtering_and_search():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Trigger Scenario 1 (CRITICAL severity, title "Thermal Overheat")
        res1 = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        assert res1.status_code == 200
        inc1_id = res1.json()["incident_id"]

        # Trigger Scenario 4 (CRITICAL severity, title "Voltage Sag")
        res2 = await client.post("/api/v1/scenarios/SCENARIO-04-VOLTAGE-SAG/trigger")
        assert res2.status_code == 200
        inc2_id = res2.json()["incident_id"]

        # 1. Test Severity Filtering
        crit_res = await client.get("/api/v1/incidents?severity=CRITICAL")
        assert crit_res.status_code == 200
        crit_list = crit_res.json()
        assert len(crit_list) >= 2
        assert all(item["severity"] == "CRITICAL" for item in crit_list)

        # 2. Test Station ID Filtering
        station_res = await client.get("/api/v1/incidents?station_id=STATION-TIRE-FITTER-01")
        assert station_res.status_code == 200
        station_list = station_res.json()
        assert len(station_list) >= 2
        assert all(item["station_id"] == "STATION-TIRE-FITTER-01" for item in station_list)

        # 3. Test Search matching title
        search_title_res = await client.get("/api/v1/incidents?search=Thermal")
        assert search_title_res.status_code == 200
        search_title_list = search_title_res.json()
        assert any("Thermal" in item["title"] for item in search_title_list)

        # 4. Test Search matching incident ID
        search_id_res = await client.get(f"/api/v1/incidents?search={inc1_id}")
        assert search_id_res.status_code == 200
        search_id_list = search_id_res.json()
        assert len(search_id_list) >= 1
        assert any(item["id"] == inc1_id for item in search_id_list)

        # 5. Test Combined Filters (status + severity + search)
        combined_res = await client.get(f"/api/v1/incidents?severity=CRITICAL&status=PENDING_APPROVAL&search=Thermal")
        assert combined_res.status_code == 200
        combined_list = combined_res.json()
        assert len(combined_list) >= 1
        assert combined_list[0]["id"] == inc1_id

        # 6. Test Pagination (limit & offset)
        page1_res = await client.get("/api/v1/incidents?limit=1&offset=0")
        assert page1_res.status_code == 200
        page1_list = page1_res.json()
        assert len(page1_list) == 1

        page2_res = await client.get("/api/v1/incidents?limit=1&offset=1")
        assert page2_res.status_code == 200
        page2_list = page2_res.json()
        assert len(page2_list) == 1
        assert page1_list[0]["id"] != page2_list[0]["id"]
