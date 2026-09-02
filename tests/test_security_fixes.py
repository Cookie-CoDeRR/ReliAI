import pytest
from pydantic import ValidationError
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    MachineryImageFrame,
    ThermalHotspot,
    EvidenceItem
)
from harness.ollama_client import AsyncOllamaClient
from fastapi.testclient import TestClient
from main import app


def test_image_base64_size_cap():
    # Valid small payload
    frame = MachineryImageFrame(
        camera_id="CAM_1",
        image_base64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    assert frame.camera_id == "CAM_1"

    # Oversized payload exceeding 10MB
    huge_base64 = "A" * 10_000_001
    with pytest.raises(ValidationError) as exc:
        MachineryImageFrame(camera_id="CAM_1", image_base64=huge_base64)
    assert "10MB maximum" in str(exc.value)


def test_operator_shift_notes_sanitization():
    raw_notes = "Line 3 anomaly\r\n\tOperator alert: check seals!   "
    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T18:00:00Z",
        station_id="STATION-01",
        operator_shift_notes=raw_notes
    )
    assert "\r\n" not in snapshot.operator_shift_notes
    assert "\t" not in snapshot.operator_shift_notes


def test_scenario_id_path_traversal_rejection():
    client = TestClient(app)
    # Path traversal attempt
    res = client.post("/api/v1/scenarios/..%2F..%2Fetc%2Fpasswd/trigger")
    assert res.status_code in (400, 404)


def test_severity_normalization():
    hotspot = ThermalHotspot(
        location="Joint 3",
        temp_c=85.0,
        delta_ambient_c=45.0,
        severity="critical" # Lowercase should auto-normalize to CRITICAL
    )
    assert hotspot.severity == "CRITICAL"

    evidence = EvidenceItem(
        evidence_id="EVD-999",
        source="Sensor",
        observation="Observation",
        is_abnormal=True,
        severity="medium" # Medium should normalize to MODERATE
    )
    assert evidence.severity == "MODERATE"


def test_ollama_client_fallback_raises_on_unknown():
    client = AsyncOllamaClient(mock_fallback=True)
    with pytest.raises(ValueError) as exc:
        client._synthesize_offline_fallback("test", MachineryImageFrame)
    assert "not implemented" in str(exc.value)
