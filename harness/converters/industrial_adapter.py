import datetime
from typing import Dict, Any, List, Optional
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    JointTelemetry,
    ConveyorTelemetry,
    BeadLubricationTelemetry,
    TireFitmentMetrics,
    TireMetadata,
    AcousticAnomaly,
    ThermalHotspot
)


class IndustrialTelemetryAdapter:
    """
    Industrial Protocol Adapter converting OPC UA Node Tags and MQTT Sparkplug B metric
    structures (used in Michelin & Tier-1 tire plants) into ReliAI MultimodalTelemetrySnapshots.
    """

    @staticmethod
    def _find_val(tag_map: Dict[str, Any], *candidates: str, default: Any = None) -> Any:
        for k, v in tag_map.items():
            for c in candidates:
                if k == c or k.endswith(f".{c}") or k.endswith(f"/{c}") or c in k:
                    return v
        return default

    @staticmethod
    def from_opcua_tags(
        tags: List[Dict[str, Any]],
        station_id: str = "MICHELIN-CLERMONT-FITTER-01",
        timestamp: Optional[str] = None
    ) -> MultimodalTelemetrySnapshot:
        """
        Parses a list of OPC UA NodeId-Value dictionaries.
        Supports standard OPC UA 40082 (Tire Building) and VDMA Robotics namespaces.
        Example item: {"nodeId": "ns=2;s=Line03.Conveyor.BeltSpeed_mps", "value": 0.32}
        """
        tag_map: Dict[str, Any] = {}
        for item in tags:
            raw_id = item.get("nodeId") or item.get("name") or ""
            val = item.get("value")
            # Normalize nodeId: strip "ns=2;s=", lowercase
            clean_key = raw_id.split("=")[-1].strip().lower()
            tag_map[clean_key] = val

        ts = timestamp or datetime.datetime.now(datetime.timezone.utc).isoformat()
        find = IndustrialTelemetryAdapter._find_val

        # Conveyor Subsystem
        conveyor = ConveyorTelemetry(
            belt_speed_mps=float(find(tag_map, "beltspeed_mps", "beltspeed", default=0.5)),
            belt_tension_n=float(find(tag_map, "belttension_n", "belttension", default=320.0)),
            vfd_frequency_hz=float(find(tag_map, "vfdfrequency_hz", "vfdfrequency", default=50.0)),
            vfd_current_a=float(find(tag_map, "vfdcurrent_a", "vfdcurrent", default=3.2)),
            infeed_photoeye_blocked=bool(find(tag_map, "infeed_photoeye", "infeedphotoeye", default=True)),
            outfeed_photoeye_blocked=bool(find(tag_map, "outfeed_photoeye", "outfeedphotoeye", default=False))
        )

        # Bead Lubrication Subsystem
        bead_lube = BeadLubricationTelemetry(
            nozzle_pressure_bar=float(find(tag_map, "nozzlepressure_bar", "nozzlepressure", default=3.5)),
            lube_flow_rate_lpm=float(find(tag_map, "flowrate_lpm", "lubeflow", default=0.45)),
            lube_tank_level_pct=float(find(tag_map, "tanklevel_pct", "tanklevel", default=85.0)),
            nozzle_clog_detected=bool(find(tag_map, "nozzleclog", "nozzle_clog", default=False))
        )

        # Tire Fitment Metrics
        tire_fitment = TireFitmentMetrics(
            bead_seating_offset_mm=float(find(tag_map, "beadoffset_mm", "beadoffset", default=0.4)),
            angular_misalignment_deg=float(find(tag_map, "angularmisalignment_deg", "angularmisalignment", default=0.15)),
            torque_at_seating_nm=float(find(tag_map, "seatingtorque_nm", "seatingtorque", default=125.0)),
            clamp_engaged=bool(find(tag_map, "clampengaged", default=True)),
            inflation_burst_pressure_bar=float(find(tag_map, "inflationpressure_bar", "inflationpressure", default=4.8)),
            bead_pop_detected=bool(find(tag_map, "beadpopdetected", default=True)),
            radial_runout_mm=float(find(tag_map, "radialrunout_mm", default=0.45)),
            lateral_runout_mm=float(find(tag_map, "lateralrunout_mm", default=0.35))
        )

        # Tire Metadata
        tire_metadata = TireMetadata(
            tire_rfid_epc=find(tag_map, "rfid_epc", "rfid", default="urn:epc:id:sgtin:0086691.012345.10001"),
            tire_sku=find(tag_map, "tire.sku", "sku", default="Michelin Pilot Sport 5 225/45 R17 91W"),
            rim_spec=find(tag_map, "rim_spec", "rim", default="17x7.5J ET45 5x112"),
            dot_code=find(tag_map, "dot_code", "dot", default="DOT 6X 7Y 0126")
        )

        # Robot Joints
        joints: Dict[str, JointTelemetry] = {}
        for j_idx in range(1, 7):
            j_name = f"Joint_{j_idx}"
            j_num = f"joint{j_idx}"
            joints[j_name] = JointTelemetry(
                joint_name=j_name,
                angle_deg=float(find(tag_map, f"{j_num}.angle_deg", f"{j_num}_angle", default=0.0)),
                torque_nm=float(find(tag_map, f"{j_num}.torque_nm", f"{j_num}_torque", default=50.0)),
                temp_c=float(find(tag_map, f"{j_num}.temp_c", f"{j_num}_temp", default=45.0)),
                motor_current_a=float(find(tag_map, f"{j_num}.current_a", f"{j_num}_current", default=2.5))
            )

        return MultimodalTelemetrySnapshot(
            timestamp=ts,
            station_id=station_id,
            tire_metadata=tire_metadata,
            conveyor=conveyor,
            bead_lubrication=bead_lube,
            joints=joints,
            line_voltage_v=float(find(tag_map, "linevoltage_v", "linevoltage", default=400.0)),
            total_current_a=float(find(tag_map, "totalcurrent_a", "totalcurrent", default=14.5)),
            pneumatic_pressure_bar=float(find(tag_map, "pressure_bar", "pneumaticpressure", default=6.2)),
            tire_fitment=tire_fitment,
            e_stop_triggered=bool(find(tag_map, "estop", "e_stop", default=False))
        )

    @staticmethod
    def from_sparkplug_b(payload: Dict[str, Any]) -> MultimodalTelemetrySnapshot:
        """
        Parses MQTT Sparkplug B JSON metric payload.
        """
        metrics = payload.get("metrics", [])
        tags = []
        for m in metrics:
            tags.append({
                "nodeId": m.get("name", "").replace("/", "."),
                "value": m.get("value")
            })

        station_id = payload.get("station_id", "MICHELIN-CONVEYOR-FITTER-01")
        return IndustrialTelemetryAdapter.from_opcua_tags(tags, station_id=station_id)
