import pytest
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    JointTelemetry,
    ThermalHotspot,
    AcousticAnomaly,
    TireFitmentMetrics,
    EvidenceItem,
    TriageAssessment,
    RootCauseHypothesis,
    CriticEvaluation,
    InvestigationVerdict,
    IncidentDomain,
    IncidentSeverity,
    InvestigationStatus
)


def test_multimodal_snapshot_validation():
    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:00:00Z",
        station_id="STATION-TIRE-FITTER-01",
        joints={
            "Joint_1": JointTelemetry(
                joint_name="Base Turntable",
                angle_deg=45.2,
                velocity_deg_s=12.0,
                torque_nm=180.0,
                temp_c=48.5,
                motor_current_a=3.1
            ),
            "Joint_3": JointTelemetry(
                joint_name="Elbow Pitch",
                angle_deg=88.4,
                velocity_deg_s=5.2,
                torque_nm=345.0,
                temp_c=89.2,
                motor_current_a=7.8
            )
        },
        line_voltage_v=398.5,
        total_current_a=16.2,
        pneumatic_pressure_bar=6.1,
        thermal_hotspots=[
            ThermalHotspot(location="Joint 3 Harmonic Gearbox", temp_c=89.2, delta_ambient_c=64.2, severity="CRITICAL")
        ],
        acoustic_anomalies=[
            AcousticAnomaly(frequency_hz=2850.0, magnitude_db=84.5, pattern_type="BEARING_GRIND")
        ],
        tire_fitment=TireFitmentMetrics(
            bead_seating_offset_mm=0.45,
            angular_misalignment_deg=0.12,
            torque_at_seating_nm=124.5,
            clamp_engaged=True
        ),
        e_stop_triggered=False
    )

    data = snapshot.model_dump()
    assert data["station_id"] == "STATION-TIRE-FITTER-01"
    assert data["joints"]["Joint_3"]["temp_c"] == 89.2
    assert len(data["acoustic_anomalies"]) == 1

    # Round-trip deserialization
    reconstructed = MultimodalTelemetrySnapshot.model_validate(data)
    assert reconstructed.station_id == snapshot.station_id
    assert reconstructed.joints["Joint_3"].torque_nm == 345.0


def test_investigation_verdict_schema():
    verdict = InvestigationVerdict(
        incident_id="INC-20260902-001",
        station_id="STATION-TIRE-FITTER-01",
        status=InvestigationStatus.CONCLUSIVE,
        final_confidence_score=92.5,
        primary_root_cause=RootCauseHypothesis(
            rank=1,
            title="Joint 3 Harmonic Drive Lubrication Breakdown",
            description="Severe gear friction leading to thermal seizure.",
            affected_component="Joint_3_Elbow",
            causal_chain=["Lubricant depletion", "Friction overheat", "Torque trip"],
            cited_evidence_ids=["EVD-001", "EVD-002"],
            preliminary_confidence=95.0
        ),
        critic_report=CriticEvaluation(
            hypothesis_title="Joint 3 Harmonic Drive Lubrication Breakdown",
            is_physically_possible=True,
            contradictions_detected=[],
            missing_evidence_notes=[],
            objection_summary="Validated by thermal camera hotspot and 2.85kHz acoustic grind.",
            confidence_penalty=2.5
        ),
        collected_evidence=[
            EvidenceItem(
                evidence_id="EVD-001",
                source="Joint 3 Thermal Sensor",
                observation="Temp 89.2°C exceeds 68°C max limit",
                is_abnormal=True,
                severity="CRITICAL"
            )
        ],
        recommended_mitigation="Perform LOTO and inspect Joint 3 harmonic drive gear teeth and grease.",
        requires_human_inspection=False
    )

    dumped = verdict.model_dump()
    assert dumped["status"] == "CONCLUSIVE"
    assert dumped["final_confidence_score"] == 92.5
    assert dumped["primary_root_cause"]["title"] == "Joint 3 Harmonic Drive Lubrication Breakdown"
