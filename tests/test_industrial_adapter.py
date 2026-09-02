import pytest
from harness.converters.industrial_adapter import IndustrialTelemetryAdapter
from harness.schemas import MultimodalTelemetrySnapshot


def test_opcua_tag_parsing():
    opcua_tags = [
        {"nodeId": "ns=2;s=Michelin.Conveyor.BeltSpeed_mps", "value": 0.28},
        {"nodeId": "ns=2;s=Michelin.Conveyor.BeltTension_N", "value": 210.0},
        {"nodeId": "ns=2;s=Michelin.Lube.NozzlePressure_bar", "value": 1.75},
        {"nodeId": "ns=2;s=Michelin.Lube.NozzleClog", "value": True},
        {"nodeId": "ns=2;s=Michelin.Tire.BeadOffset_mm", "value": 1.62},
        {"nodeId": "ns=2;s=Michelin.Tire.SKU", "value": "Michelin Pilot Sport 5 245/40 R18 97Y"}
    ]

    snapshot = IndustrialTelemetryAdapter.from_opcua_tags(
        tags=opcua_tags,
        station_id="MICHELIN-PLANT-LINE03"
    )

    assert isinstance(snapshot, MultimodalTelemetrySnapshot)
    assert snapshot.station_id == "MICHELIN-PLANT-LINE03"
    assert snapshot.conveyor.belt_speed_mps == 0.28
    assert snapshot.conveyor.belt_tension_n == 210.0
    assert snapshot.bead_lubrication.nozzle_pressure_bar == 1.75
    assert snapshot.bead_lubrication.nozzle_clog_detected is True
    assert snapshot.tire_fitment.bead_seating_offset_mm == 1.62
    assert "Pilot Sport 5" in snapshot.tire_metadata.tire_sku


def test_sparkplug_b_parsing():
    payload = {
        "timestamp": 1725281400000,
        "station_id": "MICHELIN-SPARKPLUG-LINE04",
        "metrics": [
            {"name": "Conveyor/BeltSpeed_mps", "value": 0.52},
            {"name": "Lube/NozzlePressure_bar", "value": 3.4},
            {"name": "Tire/BeadOffset_mm", "value": 0.35}
        ]
    }

    snapshot = IndustrialTelemetryAdapter.from_sparkplug_b(payload)
    assert snapshot.station_id == "MICHELIN-SPARKPLUG-LINE04"
    assert snapshot.conveyor.belt_speed_mps == 0.52
    assert snapshot.bead_lubrication.nozzle_pressure_bar == 3.4
    assert snapshot.tire_fitment.bead_seating_offset_mm == 0.35
