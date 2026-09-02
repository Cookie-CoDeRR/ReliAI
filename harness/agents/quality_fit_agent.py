from typing import Dict, Any, Optional
from harness.schemas import MultimodalTelemetrySnapshot, TireFitmentMetrics


class QualityFitAgent:
    def __init__(self):
        pass

    async def analyze(self, snapshot: MultimodalTelemetrySnapshot) -> Dict[str, Any]:
        """
        Evaluates tire bead seating tolerances, mounting concentricity, and pneumatic clamping force.
        """
        tf: Optional[TireFitmentMetrics] = snapshot.tire_fitment
        pressure = snapshot.pneumatic_pressure_bar

        if not tf:
            return {
                "agent": "QUALITY_FIT_AGENT",
                "quality_status": "NO_FITMENT_DATA",
                "is_defect_present": False,
                "notes": "Incident occurred outside active bead seating phase."
            }

        radial_offset_exceeded = tf.bead_seating_offset_mm > 0.8
        angular_offset_exceeded = tf.angular_misalignment_deg > 0.35
        low_clamping_force = pressure < 5.5 or not tf.clamp_engaged

        is_defect = radial_offset_exceeded or angular_offset_exceeded or low_clamping_force

        defect_types = []
        if radial_offset_exceeded:
            defect_types.append("RADIAL_BEAD_ECCENTRICITY")
        if angular_offset_exceeded:
            defect_types.append("WHEEL_HUB_ANGULAR_MISALIGNMENT")
        if low_clamping_force:
            defect_types.append("INSUFFICIENT_PNEUMATIC_CLAMP_PRESSURE")

        return {
            "agent": "QUALITY_FIT_AGENT",
            "quality_status": "DEFECT_DETECTED" if is_defect else "WITHIN_TOLERANCES",
            "is_defect_present": is_defect,
            "radial_offset_mm": tf.bead_seating_offset_mm,
            "angular_misalignment_deg": tf.angular_misalignment_deg,
            "seating_torque_nm": tf.torque_at_seating_nm,
            "defect_types": defect_types
        }
