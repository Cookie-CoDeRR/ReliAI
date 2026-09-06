"""
Phase 4.2 — Comprehensive ToolGateway Verification Test Suite
Verifies ToolGatewayAdapter generic tool dispatching, async execution, JSON serializability,
parameter coercion, error isolation, database requirements, and non-regression against Phase 1–3 backend APIs.
"""

import json
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from web_backend.models import Base
from web_backend.services.tool_service import ToolAccessService
from web_backend.services.evidence_service import EvidenceService
from web_backend.services.tool_gateway_adapter import ToolGatewayAdapter
from web_backend.service import IncidentService
from harness.schemas import MultimodalTelemetrySnapshot
from harness.baseline_engine import BaselineEngine


@pytest_asyncio.fixture
async def async_db_session():
    """Provides an isolated in-memory SQLite database session for unit testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_factory() as session:
        yield session

    await engine.dispose()


@pytest.fixture
def adapter():
    """Provides a fresh instance of ToolGatewayAdapter with baseline engine."""
    baseline = BaselineEngine()
    tool_service = ToolAccessService(baseline_engine=baseline)
    evidence_service = EvidenceService(baseline_engine=baseline, tool_service=tool_service)
    return ToolGatewayAdapter(tool_service=tool_service, evidence_service=evidence_service)


@pytest.mark.asyncio
async def test_tool_gateway_registered_tools(adapter):
    """Test 1: Exposes list of registered tool names."""
    tools = adapter.get_registered_tools()
    assert isinstance(tools, list)
    assert "search_logs" in tools
    assert "get_maintenance_history" in tools
    assert "find_similar_incidents" in tools
    assert "get_incident_evidence" in tools
    assert "search_documents" in tools


@pytest.mark.asyncio
async def test_tool_gateway_search_logs_success(adapter, async_db_session):
    """Test 2: Invoking search_logs returns valid structured trace results."""
    result = await adapter.invoke_tool(
        tool_name="search_logs",
        params={"query": "TRIAGE", "limit": 10},
        db=async_db_session
    )
    assert result["status"] == "SUCCESS"
    assert "total" in result
    assert "results" in result
    assert isinstance(result["results"], list)
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_search_logs_filters(adapter, async_db_session):
    """Test 3: search_logs with agent_name, limit, and offset optional filters."""
    result = await adapter.invoke_tool(
        tool_name="search_logs",
        params={"agent_name": "TRIAGE_AGENT", "limit": 5, "offset": 0},
        db=async_db_session
    )
    assert result["status"] == "SUCCESS"
    assert isinstance(result["results"], list)


@pytest.mark.asyncio
async def test_tool_gateway_search_logs_missing_db(adapter):
    """Test 4: search_logs without database session returns controlled error."""
    result = await adapter.invoke_tool(tool_name="search_logs", params={"query": "test"}, db=None)
    assert result["status"] == "ERROR"
    assert "Database session required" in result["error"]


@pytest.mark.asyncio
async def test_tool_gateway_maintenance_history_success(adapter, async_db_session):
    """Test 5: Invoking get_maintenance_history returns SOPs and dispatches."""
    result = await adapter.invoke_tool(
        tool_name="get_maintenance_history",
        params={"component": "Joint_3", "limit": 5},
        db=async_db_session
    )
    assert result["status"] == "SUCCESS"
    assert "sops" in result
    assert "technician_dispatches" in result
    assert any("Joint_3" in sop.get("component", "") for sop in result["sops"])
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_maintenance_history_missing_db(adapter):
    """Test 6: get_maintenance_history without database session returns controlled error."""
    result = await adapter.invoke_tool(tool_name="get_maintenance_history", params={}, db=None)
    assert result["status"] == "ERROR"
    assert "Database session required" in result["error"]


@pytest.mark.asyncio
async def test_tool_gateway_find_similar_incidents_success(adapter, async_db_session):
    """Test 7: Invoking find_similar_incidents returns historical matches."""
    result = await adapter.invoke_tool(
        tool_name="find_similar_incidents",
        params={"severity": "CRITICAL", "domain": "THERMAL_OVERHEAT", "limit": 5},
        db=async_db_session
    )
    assert result["status"] == "SUCCESS"
    assert "total" in result
    assert "incidents" in result
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_find_similar_incidents_missing_db(adapter):
    """Test 8: find_similar_incidents without database session returns controlled error."""
    result = await adapter.invoke_tool(tool_name="find_similar_incidents", params={}, db=None)
    assert result["status"] == "ERROR"
    assert "Database session required" in result["error"]


@pytest.mark.asyncio
async def test_tool_gateway_incident_evidence_success(adapter, async_db_session):
    """Test 9: Invoking get_incident_evidence retrieves evidence for stored incident."""
    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-06T12:00:00Z",
        station_id="TEST-CELL-01",
        line_voltage_v=340.0  # Undervoltage deviation
    )
    incident = await IncidentService.ingest_incident(
        db=async_db_session,
        snapshot=snapshot,
        title="Test Voltage Sag Failure",
        severity="HIGH"
    )

    result = await adapter.invoke_tool(
        tool_name="get_incident_evidence",
        params={"incident_id": incident.id},
        db=async_db_session
    )
    assert result["incident_id"] == incident.id
    assert result["station_id"] == "TEST-CELL-01"
    assert "count" in result
    assert "evidence" in result
    assert result["count"] >= 1
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_incident_evidence_missing_params(adapter, async_db_session):
    """Test 10: get_incident_evidence missing incident_id parameter returns error."""
    result = await adapter.invoke_tool(tool_name="get_incident_evidence", params={}, db=async_db_session)
    assert result["status"] == "ERROR"
    assert "incident_id" in result["error"]


@pytest.mark.asyncio
async def test_tool_gateway_incident_evidence_nonexistent(adapter, async_db_session):
    """Test 11: get_incident_evidence with nonexistent incident returns NOT_FOUND status."""
    result = await adapter.invoke_tool(
        tool_name="get_incident_evidence",
        params={"incident_id": "NON-EXISTENT-INCIDENT-999"},
        db=async_db_session
    )
    assert result["status"] == "NOT_FOUND"
    assert "NON-EXISTENT-INCIDENT-999" in result["error"]


@pytest.mark.asyncio
async def test_tool_gateway_incident_evidence_missing_db(adapter):
    """Test 12: get_incident_evidence without database session returns error."""
    result = await adapter.invoke_tool(
        tool_name="get_incident_evidence",
        params={"incident_id": "INC-001"},
        db=None
    )
    assert result["status"] == "ERROR"
    assert "Database session required" in result["error"]


@pytest.mark.asyncio
async def test_tool_gateway_search_documents_success(adapter, async_db_session):
    """Test 13: Invoking search_documents queries SOPs, specs, and uploads."""
    result = await adapter.invoke_tool(
        tool_name="search_documents",
        params={"query": "gearbox", "limit": 5},
        db=async_db_session
    )
    assert result["status"] == "SUCCESS"
    assert result["query"] == "gearbox"
    assert "documents" in result
    assert len(result["documents"]) >= 1
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_search_documents_without_db(adapter):
    """Test 14: search_documents works even without a database session (static SOP/spec search)."""
    result = await adapter.invoke_tool(
        tool_name="search_documents",
        params={"query": "gearbox"},
        db=None
    )
    assert result["status"] == "SUCCESS"
    assert len(result["documents"]) >= 1


@pytest.mark.asyncio
async def test_tool_gateway_search_documents_empty_query(adapter, async_db_session):
    """Test 15: search_documents with empty or whitespace query returns error."""
    res1 = await adapter.invoke_tool("search_documents", params={}, db=async_db_session)
    assert res1["status"] == "ERROR"

    res2 = await adapter.invoke_tool("search_documents", params={"query": "   "}, db=async_db_session)
    assert res2["status"] == "ERROR"


@pytest.mark.asyncio
async def test_tool_gateway_parameter_type_coercion(adapter, async_db_session):
    """Test 16: Safely coerces string representations of limits/offsets to integers."""
    result = await adapter.invoke_tool(
        tool_name="search_documents",
        params={"query": "thermal", "limit": "3"},
        db=async_db_session
    )
    assert result["status"] == "SUCCESS"
    assert len(result["documents"]) <= 3


@pytest.mark.asyncio
async def test_tool_gateway_unknown_tool(adapter, async_db_session):
    """Test 17: Invoking invalid/unregistered tool returns controlled error envelope."""
    result = await adapter.invoke_tool(
        tool_name="non_existent_tool_123",
        params={"foo": "bar"},
        db=async_db_session
    )
    assert result["status"] == "ERROR"
    assert "Unknown or unsupported tool" in result["error"]
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_execute_alias(adapter, async_db_session):
    """Test 18: execute_tool alias works identically to invoke_tool."""
    res = await adapter.execute_tool(
        tool_name="search_documents",
        params={"query": "thermal"},
        db=async_db_session
    )
    assert res["status"] == "SUCCESS"
    assert res["query"] == "thermal"


@pytest.mark.asyncio
async def test_tool_gateway_whitespace_tool_name(adapter, async_db_session):
    """Test 19: Handles whitespace in tool name strings gracefully."""
    res = await adapter.invoke_tool(
        tool_name="  search_documents  ",
        params={"query": "harmonic"},
        db=async_db_session
    )
    assert res["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_tool_gateway_none_params(adapter, async_db_session):
    """Test 20: Handles None params dictionary gracefully."""
    res = await adapter.invoke_tool("get_maintenance_history", params=None, db=async_db_session)
    assert res["status"] == "SUCCESS"


@pytest.mark.asyncio
async def test_tool_gateway_no_regression_phase1_2_3(adapter, async_db_session):
    """Test 21: Asserts no regression in direct underlying service calls."""
    tools = adapter.tool_service.get_available_tools()
    assert "search_logs" in tools
    assert "get_maintenance_history" in tools
    assert "find_similar_incidents" in tools
    assert "get_sensor_data" in tools
    assert "search_documents" in tools
