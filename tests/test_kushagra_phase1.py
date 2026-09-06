import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from web_backend.database import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_system_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/system/status")
        assert res.status_code == 200
        data = res.json()

        assert "status" in data
        assert data["status"] in ["HEALTHY", "DEGRADED", "UNHEALTHY"]
        assert "timestamp" in data

        # Check Component Status Objects
        assert "database" in data
        assert data["database"]["status"] in ["HEALTHY", "DEGRADED", "UNAVAILABLE"]
        assert data["database"]["details"]["connected"] is True
        assert "latency_ms" in data["database"]["details"]

        assert "llm" in data
        assert "storage" in data
        assert "tools" in data
        assert data["tools"]["details"]["registered_tools_count"] == 5


@pytest.mark.asyncio
async def test_list_available_tools():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/tools/available")
        assert res.status_code == 200
        tools = res.json()
        assert "search_logs" in tools
        assert "get_maintenance_history" in tools
        assert "find_similar_incidents" in tools
        assert "get_sensor_data" in tools
        assert "search_documents" in tools
        assert tools["search_logs"]["status"] == "AVAILABLE"


@pytest.mark.asyncio
async def test_tool_search_logs_and_maintenance_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. First trigger a scenario so we have real traces and records in DB
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        assert trigger_res.status_code == 200
        incident_id = trigger_res.json()["incident_id"]

        # 2. Search logs via POST /api/v1/tools/search-logs
        log_res = await client.post(
            "/api/v1/tools/search-logs",
            json={"incident_id": incident_id, "limit": 10}
        )
        assert log_res.status_code == 200
        log_data = log_res.json()
        assert log_data["status"] == "SUCCESS"
        assert log_data["total"] >= 1
        assert any(t["incident_id"] == incident_id for t in log_data["results"])

        # 3. Query maintenance history
        maint_res = await client.get("/api/v1/tools/maintenance-history?component=Harmonic")
        assert maint_res.status_code == 200
        maint_data = maint_res.json()
        assert maint_data["status"] == "SUCCESS"
        assert len(maint_data["sops"]) >= 1


@pytest.mark.asyncio
async def test_tool_similar_incidents_and_sensor_data():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Trigger scenario
        trigger_res = await client.post("/api/v1/scenarios/SCENARIO-01-THERMAL-OVERHEAT/trigger")
        assert trigger_res.status_code == 200
        incident_id = trigger_res.json()["incident_id"]

        # 1. Find similar incidents
        sim_res = await client.get(f"/api/v1/tools/similar-incidents?search={incident_id}")
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert sim_data["status"] == "SUCCESS"
        assert sim_data["total"] >= 1

        # 2. Get sensor data
        sensor_res = await client.get(f"/api/v1/tools/sensor-data?incident_id={incident_id}")
        assert sensor_res.status_code == 200
        sensor_data = sensor_res.json()
        assert sensor_data["status"] == "SUCCESS"
        assert sensor_data["incident_id"] == incident_id
        assert "telemetry" in sensor_data
        assert "joints" in sensor_data["telemetry"]

        # 3. Missing sensor data request
        missing_res = await client.get("/api/v1/tools/sensor-data?incident_id=INC-NON-EXISTENT-999")
        assert missing_res.status_code == 200
        assert missing_res.json()["status"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_tool_search_documents():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        doc_res = await client.get("/api/v1/tools/search-documents?query=Harmonic")
        assert doc_res.status_code == 200
        doc_data = doc_res.json()
        assert doc_data["status"] == "SUCCESS"
        assert doc_data["total"] >= 1
        assert doc_data["documents"][0]["doc_type"] == "SOP"
