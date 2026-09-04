from typing import Dict, Any, List
from harness.schemas import MultimodalTelemetrySnapshot, EvidenceItem


class TelemetryAgent:
    def __init__(self):
        pass

    async def analyze(
        self,
        snapshot: MultimodalTelemetrySnapshot,
        evidence_items: List[EvidenceItem]
    ) -> Dict[str, Any]:
        """
        Deep kinematic and electrical telemetry analysis.
        Identifies joint-specific mechanical stress, motor saturation, and power grid stability.
        """
        affected_joints = []
        voltage_stable = 380.0 <= snapshot.line_voltage_v <= 420.0
        
        for j_name, j_data in snapshot.joints.items():
            is_overheated = j_data.temp_c > 65.0
            is_overtorqued = j_data.torque_nm > 300.0
            is_high_current = j_data.motor_current_a > 6.0

            if is_overheated or is_overtorqued or is_high_current:
                affected_joints.append({
                    "joint": j_name,
                    "temp_c": j_data.temp_c,
                    "torque_nm": j_data.torque_nm,
                    "current_a": j_data.motor_current_a,
                    "fault_signatures": [
                        sig for sig, cond in [
                            ("THERMAL_OVERHEAT", is_overheated),
                            ("TORQUE_SATURATION", is_overtorqued),
                            ("OVERCURRENT_DRAW", is_high_current)
                        ] if cond
                    ]
                })

        return {
            "agent": "TELEMETRY_KINEMATICS_AGENT",
            "voltage_stable": voltage_stable,
            "line_voltage_v": snapshot.line_voltage_v,
            "total_current_a": snapshot.total_current_a,
            "affected_joints": affected_joints,
            "kinematic_anomaly_detected": len(affected_joints) > 0 or not voltage_stable
        }
