"""
Phase 4.1 — ToolGateway Integration Test Suite
Verifies ToolGatewayAdapter generic tool dispatching, async execution, JSON serializability,
parameter handling, error isolation, and regression against Phase 1–3 backend APIs.
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
async def test_tool_gateway_search_logs(adapter, async_db_session):
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
    # Check JSON serializability
    json_str = json.dumps(result)
    assert isinstance(json_str, str)


@pytest.mark.asyncio
async def test_tool_gateway_maintenance_history(adapter, async_db_session):
    """Test 3: Invoking get_maintenance_history returns SOPs and dispatches."""
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
async def test_tool_gateway_find_similar_incidents(adapter, async_db_session):
    """Test 4: Invoking find_similar_incidents returns historical matches."""
    result = await adapter.invoke_tool(
        tool_name="find_similar_incidents",
        params={"severity": "CRITICAL", "limit": 5},
        db=async_db_session
    )
    assert result["status"] == "SUCCESS"
    assert "total" in result
    assert "incidents" in result
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_incident_evidence(adapter, async_db_session):
    """Test 5: Invoking get_incident_evidence retrieves evidence for stored incident."""
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
async def test_tool_gateway_search_documents(adapter, async_db_session):
    """Test 6: Invoking search_documents queries SOPs, specs, and uploads."""
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
async def test_tool_gateway_unknown_tool(adapter, async_db_session):
    """Test 7: Invoking invalid/unregistered tool returns controlled error envelope."""
    result = await adapter.invoke_tool(
        tool_name="non_existent_tool_123",
        params={"foo": "bar"},
        db=async_db_session
    )
    assert result["status"] == "ERROR"
    assert "Unknown or unsupported tool" in result["error"]
    assert json.dumps(result)


@pytest.mark.asyncio
async def test_tool_gateway_missing_parameters_handling(adapter, async_db_session):
    """Test 8: Handles missing required parameters gracefully."""
    # Missing incident_id for get_incident_evidence
    res1 = await adapter.invoke_tool("get_incident_evidence", params={}, db=async_db_session)
    assert res1["status"] == "ERROR"
    assert "incident_id" in res1["error"]

    # Missing query for search_documents
    res2 = await adapter.invoke_tool("search_documents", params={}, db=async_db_session)
    assert res2["status"] == "ERROR"
    assert "query" in res2["error"]

    # Non-existent incident_id
    res3 = await adapter.invoke_tool("get_incident_evidence", params={"incident_id": "NON-EXISTENT-999"}, db=async_db_session)
    assert res3["status"] == "NOT_FOUND"
    assert "NON-EXISTENT-999" in res3["error"]


@pytest.mark.asyncio
async def test_tool_gateway_execute_alias(adapter, async_db_session):
    """Test 9: execute_tool alias works identically to invoke_tool."""
    res = await adapter.execute_tool(
        tool_name="search_documents",
        params={"query": "thermal"},
        db=async_db_session
    )
    assert res["status"] == "SUCCESS"
    assert res["query"] == "thermal"


@pytest.mark.asyncio
async def test_tool_gateway_no_regression_phase1_2_3(adapter, async_db_session):
    """Test 10: Asserts no regression in direct underlying service calls."""
    tools = adapter.tool_service.get_available_tools()
    assert "search_logs" in tools
    assert "get_maintenance_history" in tools
    assert "find_similar_incidents" in tools
    assert "get_sensor_data" in tools
    assert "search_documents" in tools
