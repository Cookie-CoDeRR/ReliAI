import pytest
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    MachineryImageFrame,
    VisualDefectItem
)
from harness.agents.vision_agent import VisionAgent
from harness.ollama_client import AsyncOllamaClient


@pytest.mark.asyncio
async def test_vision_agent_with_explicit_defects():
    client = AsyncOllamaClient(mock_fallback=True)
    agent = VisionAgent(client)

    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:00:00Z",
        station_id="STATION-TIRE-FITTER-01",
        visual_defects=[
            VisualDefectItem(
                defect_id="VIS-101",
                location="Joint_3_Wave_Generator",
                defect_type="SURFACE_PITTING",
                bounding_box=[400, 500, 650, 750],
                confidence=91.0,
                description="Heavy gear tooth micro-spalling observed on inner ring."
            )
        ]
    )

    result = await agent.evaluate(snapshot)
    assert result["agent"] == "VISION_AGENT"
    assert result["total_defects_found"] >= 1
    assert len(result["visual_evidence"]) >= 1
    assert "EVD-VISUAL-001" in result["visual_evidence"][0]["evidence_id"]
    assert "SURFACE_PITTING" in result["visual_evidence"][0]["observation"]


@pytest.mark.asyncio
async def test_vision_agent_with_image_frames():
    client = AsyncOllamaClient(mock_fallback=True)
    agent = VisionAgent(client)

    snapshot = MultimodalTelemetrySnapshot(
        timestamp="2026-09-02T16:00:00Z",
        station_id="STATION-TIRE-FITTER-01",
        image_frames=[
            MachineryImageFrame(
                camera_id="CAM_FLIR_THERMAL_01",
                image_type="THERMAL_IR",
                image_base64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                min_temp_c=22.0,
                max_temp_c=95.0
            )
        ]
    )

    result = await agent.evaluate(snapshot)
    assert result["agent"] == "VISION_AGENT"
    assert result["total_defects_found"] >= 1
    assert len(result["visual_evidence"]) >= 1
