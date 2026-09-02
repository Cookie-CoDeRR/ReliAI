import pytest
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    JointTelemetry,
    ThermalHotspot,
    AcousticAnomaly,
    TireFitmentMetrics,
    InvestigationStatus
)
from harness.ollama_client import AsyncOllamaClient
from harness.baseline_engine import BaselineEngine
from harness.orchestrator import InvestigationOrchestrator


@pytest.fixture
def orchestrator():
    client = AsyncOllamaClient(mock_fallback=True)
    engine = BaselineEngine()
    return InvestigationOrchestrator(ollama_client=client, baseline_engine=engine)


@pytest.mark.asyncio
async def test_scenario_1_conclusive_harmonic_drive_overheat(orchestrator):
    """
    Scenario 1: True mechanical friction in Joint 3 harmonic drive.
    High thermal + high current + high torque + 2.8kHz acoustic grind.
    Expected: CONCLUSIVE verdict, confidence > 85%, primary root cause asserted.
    """
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
            ThermalHotspot(location="Joint 3 Harmonic Gearbox", temp_c=88.5, delta_ambient_c=63.5, severity="CRITICAL")
        ],
        acoustic_anomalies=[
            AcousticAnomaly(frequency_hz=2800.0, magnitude_db=86.0, pattern_type="BEARING_GRIND")
        ]
    )

    verdict = await orchestrator.run_investigation(snapshot, incident_id="INC-TEST-001")
    
    assert verdict.status == InvestigationStatus.CONCLUSIVE
    assert verdict.final_confidence_score >= 80.0
    assert verdict.primary_root_cause is not None
    assert "Harmonic Drive" in verdict.primary_root_cause.title or "Joint 3" in verdict.primary_root_cause.title
    assert len(verdict.collected_evidence) >= 3
    assert verdict.critic_report.is_physically_possible is True
    assert len(verdict.critic_report.contradictions_detected) == 0


@pytest.mark.asyncio
async def test_scenario_2_conclusive_pneumatic_pressure_drop(orchestrator):
    """
    Scenario 2: Pneumatic line pressure loss causing incomplete tire bead seating.
    Expected: CONCLUSIVE verdict, correct pneumatic SOP cited.
    """
    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:15:00Z",
        station_id="STATION-TIRE-FITTER-01",
        pneumatic_pressure_bar=4.0, # Below 5.5 min limit
        acoustic_anomalies=[
            AcousticAnomaly(frequency_hz=5200.0, magnitude_db=78.0, pattern_type="VALVE_HISS")
        ],
        tire_fitment=TireFitmentMetrics(
            bead_seating_offset_mm=1.8, # Exceeds 0.8mm limit
            angular_misalignment_deg=0.45,
            torque_at_seating_nm=95.0
        )
    )

    verdict = await orchestrator.run_investigation(snapshot, incident_id="INC-TEST-002")

    assert verdict.status == InvestigationStatus.CONCLUSIVE
    assert verdict.final_confidence_score >= 80.0
    assert verdict.primary_root_cause is not None
    assert "Pneumatic" in verdict.primary_root_cause.title or "Valve" in verdict.primary_root_cause.title
    assert "SOP-PNEUMATIC-002" in verdict.recommended_mitigation


@pytest.mark.asyncio
async def test_scenario_3_contradictory_sensor_data_refusal(orchestrator):
    """
    Scenario 3: Contradictory data — Thermocouple indicates 92°C overheat,
    but motor current is 3.1A (completely nominal), and acoustic noise is 0.
    Expected: Anti-hallucination safeguard triggers INCONCLUSIVE_CONTRADICTIONS,
    confidence capped <= 45%, primary root cause withheld, human inspection enforced.
    """
    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:30:00Z",
        station_id="STATION-TIRE-FITTER-01",
        joints={
            "Joint_3": JointTelemetry(
                joint_name="Elbow Pitch",
                angle_deg=80.0,
                torque_nm=190.0,  # Completely nominal torque (< 320 Nm)
                temp_c=92.0,      # Suspiciously high temp!
                motor_current_a=3.1 # Completely nominal current (< 7.0 A)
            )
        },
        line_voltage_v=400.0,
        pneumatic_pressure_bar=6.2,
        acoustic_anomalies=[] # Zero mechanical grinding noise!
    )

    verdict = await orchestrator.run_investigation(snapshot, incident_id="INC-TEST-003")

    assert verdict.status == InvestigationStatus.INCONCLUSIVE_CONTRADICTIONS
    assert verdict.final_confidence_score <= 45.0
    assert verdict.primary_root_cause is None  # Safeguard: Never assert false hypothesis
    assert verdict.requires_human_inspection is True
    assert len(verdict.critic_report.contradictions_detected) > 0
    assert "CONFLICTING EVIDENCE DETECTED" in verdict.recommended_mitigation


@pytest.mark.asyncio
async def test_orchestrator_streaming_events(orchestrator):
    """
    Tests the async generator streaming method to verify that all agent stages
    (Triage -> Evidence -> Domain Analysis -> Root Cause -> Critic -> Final Verdict)
    emit properly formatted events.
    """
    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:45:00Z",
        station_id="STATION-TIRE-FITTER-01",
        joints={
            "Joint_3": JointTelemetry(joint_name="Elbow Pitch", angle_deg=70.0, torque_nm=330.0, temp_c=86.0, motor_current_a=7.2)
        }
    )

    events = []
    async for event in orchestrator.run_investigation_stream(snapshot, incident_id="INC-STREAM-001"):
        events.append(event)

    agent_names = [e.get("agent") for e in events]
    assert "TRIAGE_AGENT" in agent_names
    assert "EVIDENCE_RAG_AGENT" in agent_names
    assert "DOMAIN_ANALYSIS" in agent_names
    assert "ROOT_CAUSE_AGENT" in agent_names
    assert "CRITIC_AGENT" in agent_names
    assert "CONFIDENCE_ENGINE" in agent_names

    final_event = events[-1]
    assert final_event.get("step") == "FINAL_VERDICT"
    assert "verdict" in final_event
