import pytest
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    JointTelemetry,
    ThermalHotspot,
    AcousticAnomaly,
    TireFitmentMetrics
)
from harness.baseline_engine import BaselineEngine


@pytest.fixture
def baseline_engine():
    return BaselineEngine()


def test_baseline_evaluation_nominal(baseline_engine):
    """A completely normal run should return 0 abnormal evidence items."""
    nominal_snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:00:00Z",
        station_id="STATION-TIRE-FITTER-01",
        joints={
            "Joint_1": JointTelemetry(joint_name="Base Turntable", angle_deg=0.0, torque_nm=120.0, temp_c=42.0, motor_current_a=2.8),
            "Joint_2": JointTelemetry(joint_name="Shoulder Pitch", angle_deg=30.0, torque_nm=240.0, temp_c=48.0, motor_current_a=3.9),
            "Joint_3": JointTelemetry(joint_name="Elbow Pitch", angle_deg=60.0, torque_nm=180.0, temp_c=45.0, motor_current_a=3.1),
        },
        line_voltage_v=401.2,
        total_current_a=14.1,
        pneumatic_pressure_bar=6.25,
        thermal_hotspots=[],
        acoustic_anomalies=[],
        tire_fitment=TireFitmentMetrics(
            bead_seating_offset_mm=0.25,
            angular_misalignment_deg=0.08,
            torque_at_seating_nm=125.0
        )
    )

    evidence = baseline_engine.evaluate_telemetry(nominal_snapshot)
    assert len(evidence) == 0


def test_baseline_evaluation_joint3_thermal_fault(baseline_engine):
    """An overheat on Joint 3 with acoustic grind should be flagged as abnormal critical evidence."""
    faulty_snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:05:00Z",
        station_id="STATION-TIRE-FITTER-01",
        joints={
            "Joint_3": JointTelemetry(
                joint_name="Elbow Pitch",
                angle_deg=75.0,
                torque_nm=335.0, # Max is 320 Nm
                temp_c=88.5,     # Max is 68°C
                motor_current_a=7.5 # Max is 7.0 A
            )
        },
        line_voltage_v=399.0,
        pneumatic_pressure_bar=6.2,
        acoustic_anomalies=[
            AcousticAnomaly(frequency_hz=2800.0, magnitude_db=85.0, pattern_type="BEARING_GRIND")
        ]
    )

    evidence = baseline_engine.evaluate_telemetry(faulty_snapshot)
    assert len(evidence) >= 4  # Temp, Torque, Current, Acoustic

    sources = [e.source for e in evidence]
    assert any("Thermal Sensor" in s for s in sources)
    assert any("Torque Transducer" in s for s in sources)
    assert any("Acoustic FFT" in s for s in sources)

    # Test SOP matching
    matched_sops = baseline_engine.match_sops(evidence)
    assert len(matched_sops) > 0
    assert matched_sops[0]["sop_id"] == "SOP-HARMONIC-001"


def test_baseline_evaluation_pneumatic_pressure_drop(baseline_engine):
    """A pneumatic drop below 5.5 bar and tire bead offset should trigger pneumatic SOP."""
    pneumatic_drop_snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:10:00Z",
        station_id="STATION-TIRE-FITTER-01",
        pneumatic_pressure_bar=4.1, # Min is 5.5 bar
        acoustic_anomalies=[
            AcousticAnomaly(frequency_hz=5500.0, magnitude_db=76.0, pattern_type="VALVE_HISS")
        ],
        tire_fitment=TireFitmentMetrics(
            bead_seating_offset_mm=1.85, # Max is 0.8 mm
            angular_misalignment_deg=0.45,
            torque_at_seating_nm=98.0
        )
    )

    evidence = baseline_engine.evaluate_telemetry(pneumatic_drop_snapshot)
    assert len(evidence) >= 3

    # Test SOP matching
    matched_sops = baseline_engine.match_sops(evidence)
    assert len(matched_sops) > 0
    assert matched_sops[0]["sop_id"] == "SOP-PNEUMATIC-002"
