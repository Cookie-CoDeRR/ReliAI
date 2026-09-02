import pytest
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    JointTelemetry,
    ThermalHotspot,
    AcousticAnomaly,
    TireFitmentMetrics,
    IncidentDomain,
    IncidentSeverity,
    InvestigationStatus
)
from harness.ollama_client import AsyncOllamaClient
from harness.baseline_engine import BaselineEngine
from harness.agents.triage_agent import TriageAgent
from harness.agents.evidence_rag_agent import EvidenceRAGAgent
from harness.agents.telemetry_agent import TelemetryAgent
from harness.agents.quality_fit_agent import QualityFitAgent
from harness.agents.maintenance_agent import MaintenanceAgent
from harness.agents.root_cause_agent import RootCauseAgent
from harness.agents.critic_agent import CriticAgent
from harness.agents.confidence_engine import ConfidenceEngine


@pytest.fixture
def sample_snapshot():
    return MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:00:00Z",
        station_id="STATION-TIRE-FITTER-01",
        joints={
            "Joint_3": JointTelemetry(
                joint_name="Elbow Pitch",
                angle_deg=85.0,
                torque_nm=340.0,
                temp_c=88.5,
                motor_current_a=7.6
            )
        },
        line_voltage_v=399.0,
        pneumatic_pressure_bar=6.15,
        thermal_hotspots=[
            ThermalHotspot(location="Joint 3 Harmonic Gearbox", temp_c=88.5, delta_ambient_c=63.5, severity="CRITICAL")
        ],
        acoustic_anomalies=[
            AcousticAnomaly(frequency_hz=2800.0, magnitude_db=86.0, pattern_type="BEARING_GRIND")
        ]
    )


@pytest.mark.asyncio
async def test_triage_agent(sample_snapshot):
    client = AsyncOllamaClient(mock_fallback=True)
    agent = TriageAgent(client)

    assessment = await agent.evaluate(sample_snapshot)
    assert assessment.incident_domain in [IncidentDomain.THERMAL_OVERHEAT, IncidentDomain.KINEMATIC_MISALIGNMENT]
    assert assessment.severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]
    assert len(assessment.active_investigation_paths) > 0


@pytest.mark.asyncio
async def test_evidence_rag_agent(sample_snapshot):
    engine = BaselineEngine()
    agent = EvidenceRAGAgent(engine)

    result = await agent.collect_evidence(sample_snapshot)
    assert result["evidence_count"] >= 3
    assert result["critical_count"] >= 1
    assert len(result["matched_sops"]) > 0
    assert result["matched_sops"][0]["sop_id"] == "SOP-HARMONIC-001"


@pytest.mark.asyncio
async def test_telemetry_agent(sample_snapshot):
    agent = TelemetryAgent()
    engine = BaselineEngine()
    evidence = engine.evaluate_telemetry(sample_snapshot)

    result = await agent.analyze(sample_snapshot, evidence)
    assert result["kinematic_anomaly_detected"] is True
    assert len(result["affected_joints"]) == 1
    assert result["affected_joints"][0]["joint"] == "Joint_3"


@pytest.mark.asyncio
async def test_quality_fit_agent():
    agent = QualityFitAgent()
    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:00:00Z",
        station_id="STATION-TIRE-FITTER-01",
        pneumatic_pressure_bar=4.2,
        tire_fitment=TireFitmentMetrics(
            bead_seating_offset_mm=1.9,
            angular_misalignment_deg=0.5,
            torque_at_seating_nm=95.0
        )
    )

    result = await agent.analyze(snapshot)
    assert result["is_defect_present"] is True
    assert "RADIAL_BEAD_ECCENTRICITY" in result["defect_types"]
    assert "INSUFFICIENT_PNEUMATIC_CLAMP_PRESSURE" in result["defect_types"]


@pytest.mark.asyncio
async def test_maintenance_agent(sample_snapshot):
    agent = MaintenanceAgent()
    engine = BaselineEngine()
    evidence = engine.evaluate_telemetry(sample_snapshot)

    result = await agent.correlate(sample_snapshot, evidence)
    assert len(result["high_risk_components"]) >= 1
    assert any("Joint_3" in c["component"] for c in result["high_risk_components"])
