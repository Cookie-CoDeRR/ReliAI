from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator


class IncidentSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentDomain(str, Enum):
    THERMAL_OVERHEAT = "THERMAL_OVERHEAT"
    KINEMATIC_MISALIGNMENT = "KINEMATIC_MISALIGNMENT"
    ELECTRICAL_POWER_SAG = "ELECTRICAL_POWER_SAG"
    ACOUSTIC_BEARING_FAULT = "ACOUSTIC_BEARING_FAULT"
    PNEUMATIC_PRESSURE_DROP = "PNEUMATIC_PRESSURE_DROP"
    QUALITY_BEAD_DEFECT = "QUALITY_BEAD_DEFECT"
    CONVEYOR_BELT_SLIP = "CONVEYOR_BELT_SLIP"
    BEAD_LUBRICATION_FAILURE = "BEAD_LUBRICATION_FAILURE"


class InvestigationStatus(str, Enum):
    INVESTIGATING = "INVESTIGATING"
    CONCLUSIVE = "CONCLUSIVE"
    INCONCLUSIVE_CONTRADICTIONS = "INCONCLUSIVE_CONTRADICTIONS"
    INCONCLUSIVE_MISSING_DATA = "INCONCLUSIVE_MISSING_DATA"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    OVERRIDDEN = "OVERRIDDEN"
    FAILED = "FAILED"


# -----------------------------------------------------------------------------
# Multimodal Sensor & Telemetry Data Models
# -----------------------------------------------------------------------------

class JointTelemetry(BaseModel):
    joint_name: str = Field(description="e.g. Joint_1 (Base), Joint_2 (Shoulder), Joint_3 (Elbow)")
    angle_deg: float = Field(description="Actual position in degrees")
    velocity_deg_s: float = Field(default=0.0, description="Angular velocity")
    torque_nm: float = Field(description="Torque exerted in Newton-meters")
    temp_c: float = Field(description="Motor casing temperature in Celsius")
    motor_current_a: float = Field(description="Phase current draw in Amperes")


class ThermalHotspot(BaseModel):
    location: str = Field(description="Identified hot region (e.g. Joint 3 Harmonic Gearbox)")
    temp_c: float = Field(description="Peak thermal reading in Celsius")
    delta_ambient_c: float = Field(description="Temperature delta above ambient")
    severity: Literal["CRITICAL", "HIGH", "MODERATE", "NOMINAL"] = Field(default="MODERATE")

    @field_validator("severity", mode="before")
    @classmethod
    def normalize_severity(cls, v: Any) -> str:
        if isinstance(v, str):
            val = v.upper()
            if val in ("CRITICAL", "HIGH", "MODERATE", "NOMINAL"):
                return val
            if val == "MEDIUM":
                return "MODERATE"
            if val == "LOW":
                return "NOMINAL"
        return "MODERATE"


class AcousticAnomaly(BaseModel):
    frequency_hz: float = Field(description="Peak harmonic frequency detected via FFT")
    magnitude_db: float = Field(description="Signal magnitude in decibels")
    pattern_type: str = Field(description="e.g. BEARING_GRIND, VALVE_HISS, RESONANCE_HUM, BEAD_SEAT_SNAP")
    is_abnormal: bool = True


class TireMetadata(BaseModel):
    tire_rfid_epc: Optional[str] = Field(default=None, description="ISO 20910 RFID EPC (e.g. urn:epc:id:sgtin:0086691.012345.10001)")
    tire_sku: str = Field(default="Michelin Pilot Sport 5 225/45 R17 91W", description="Tire model and dimension")
    rim_spec: str = Field(default="17x7.5J ET45 5x112", description="Wheel rim geometry")
    dot_code: Optional[str] = Field(default="DOT 6X 7Y 0126", description="Tire DOT manufacturing serial number")


class ConveyorTelemetry(BaseModel):
    belt_speed_mps: float = Field(default=0.5, description="Conveyor belt linear speed in meters/second")
    belt_tension_n: float = Field(default=320.0, description="Conveyor load cell tension in Newtons")
    vfd_frequency_hz: float = Field(default=50.0, description="VFD inverter frequency")
    vfd_current_a: float = Field(default=3.2, description="Conveyor motor current draw")
    infeed_photoeye_blocked: bool = Field(default=True, description="Tire present at infeed station")
    outfeed_photoeye_blocked: bool = Field(default=False, description="Tire reached outfeed station")


class BeadLubricationTelemetry(BaseModel):
    nozzle_pressure_bar: float = Field(default=3.5, description="Soap/lubricant spray atomization pressure in bar")
    lube_flow_rate_lpm: float = Field(default=0.45, description="Flow rate in Liters per minute")
    lube_tank_level_pct: float = Field(default=85.0, description="Lubricant reservoir fluid level percentage")
    nozzle_clog_detected: bool = Field(default=False, description="Whether spray backpressure indicates nozzle clogging")


class TireFitmentMetrics(BaseModel):
    bead_seating_offset_mm: float = Field(description="Radial offset from rim center")
    angular_misalignment_deg: float = Field(description="Wheel hub angle deviation")
    torque_at_seating_nm: float = Field(description="Final tightening torque")
    clamp_engaged: bool = True
    inflation_burst_pressure_bar: Optional[float] = Field(default=4.8, description="Burst pressure applied in bead seating cage")
    bead_pop_detected: Optional[bool] = Field(default=True, description="Acoustic/pressure verification of bead seat pop")
    radial_runout_mm: Optional[float] = Field(default=0.45, description="Radial tire uniformity runout in mm")
    lateral_runout_mm: Optional[float] = Field(default=0.35, description="Lateral tire uniformity runout in mm")


class VisualDefectItem(BaseModel):
    defect_id: str = Field(description="Unique visual defect identifier (e.g. VIS-001)")
    location: str = Field(description="Physical machinery location in frame")
    defect_type: str = Field(description="SURFACE_PITTING | FATIGUE_CRACK | SEAL_EXTRUSION | THERMAL_HOTSPOT | LUBRICANT_DEGRADATION | BEAD_CHAFE")
    bounding_box: List[int] = Field(default_factory=list, description="[ymin, xmin, ymax, xmax] normalized coordinates 0-1000")
    confidence: float = Field(default=85.0, description="Visual defect confidence percentage")
    description: str = Field(description="Visual observation from Vision-Language Model")


class MachineryImageFrame(BaseModel):
    camera_id: str = Field(description="e.g. CAM_FLIR_IR_01, CAM_MACRO_OPTICAL_02, CAM_BEAD_PROFILE_03")
    image_type: str = Field(default="OPTICAL_MACRO", description="THERMAL_IR | OPTICAL_MACRO | RGB_CONTEXT | LASER_PROFILOMETRY")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded JPEG payload")
    image_url: Optional[str] = Field(default=None, description="Relative file path or URI")
    min_temp_c: Optional[float] = Field(default=None, description="Radiometric thermal minimum scale")
    max_temp_c: Optional[float] = Field(default=None, description="Radiometric thermal maximum scale")

    @field_validator("image_base64")
    @classmethod
    def validate_image_base64_size(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 10_000_000:
            raise ValueError("image_base64 payload exceeds the 10MB maximum edge buffer limit")
        return v


class MultimodalTelemetrySnapshot(BaseModel):
    timestamp: str = Field(description="ISO 8601 timestamp of sensor capture")
    station_id: str = Field(description="Identifier for robotic station (e.g. MICHELIN-LINE03-FITTER01)")
    tire_metadata: Optional[TireMetadata] = None
    conveyor: Optional[ConveyorTelemetry] = None
    bead_lubrication: Optional[BeadLubricationTelemetry] = None
    joints: Dict[str, JointTelemetry] = Field(default_factory=dict)
    line_voltage_v: float = Field(default=400.0, description="3-phase root-mean-square voltage")
    total_current_a: float = Field(default=14.5, description="Total station power current draw")
    pneumatic_pressure_bar: float = Field(default=6.2, description="Gripper line pressure")
    thermal_hotspots: List[ThermalHotspot] = Field(default_factory=list)
    acoustic_anomalies: List[AcousticAnomaly] = Field(default_factory=list)
    visual_defects: List[VisualDefectItem] = Field(default_factory=list)
    image_frames: List[MachineryImageFrame] = Field(default_factory=list)
    tire_fitment: Optional[TireFitmentMetrics] = None
    e_stop_triggered: bool = False
    operator_shift_notes: Optional[str] = Field(default=None, max_length=500, description="Operator shift notes")

    @field_validator("operator_shift_notes")
    @classmethod
    def sanitize_operator_notes(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        cleaned = v.strip().replace("\r\n", " ").replace("\n", " ").replace("\t", " ")
        return cleaned[:500]


# -----------------------------------------------------------------------------
# Evidence & RAG Data Models
# -----------------------------------------------------------------------------

class EvidenceItem(BaseModel):
    evidence_id: str = Field(description="Unique evidence ID (e.g. EVD-001)")
    source: str = Field(description="Sensor, Log, or SOP identifier")
    observation: str = Field(description="Factual measured deviation or log entry")
    is_abnormal: bool = Field(description="Whether this departs from Golden Run specs")
    severity: Literal["CRITICAL", "HIGH", "MODERATE", "NOMINAL"] = Field(default="MODERATE", description="CRITICAL | HIGH | MODERATE | NOMINAL")
    deviation_percent: Optional[float] = Field(default=None, description="Percentage deviation from ideal")
    golden_baseline_reference: Optional[str] = Field(default=None, description="Expected normal range")

    @field_validator("severity", mode="before")
    @classmethod
    def normalize_evidence_severity(cls, v: Any) -> str:
        if isinstance(v, str):
            val = v.upper()
            if val in ("CRITICAL", "HIGH", "MODERATE", "NOMINAL"):
                return val
            if val == "MEDIUM":
                return "MODERATE"
            if val == "LOW":
                return "NOMINAL"
        return "MODERATE"


# -----------------------------------------------------------------------------
# Multi-Agent State & Deliberation Models
# -----------------------------------------------------------------------------

class TriageAssessment(BaseModel):
    incident_domain: IncidentDomain
    severity: IncidentSeverity
    summary: str
    immediate_containment_action: str
    active_investigation_paths: List[str]


class RootCauseHypothesis(BaseModel):
    rank: int = Field(default=1, description="Ranking priority (1 = most probable)")
    title: str = Field(description="Concise technical name of failure mode")
    description: str = Field(description="Physical and mechanical causal explanation")
    affected_component: str = Field(description="Specific assembly (e.g. Joint 3 Harmonic Drive)")
    causal_chain: List[str] = Field(description="Step-by-step physical failure progression")
    cited_evidence_ids: List[str] = Field(description="Evidence IDs strictly proving this hypothesis")
    preliminary_confidence: float = Field(description="Initial confidence score 0.0 to 100.0")


class CriticEvaluation(BaseModel):
    hypothesis_title: str
    is_physically_possible: bool = True
    contradictions_detected: List[str] = Field(default_factory=list, description="Explicit sensor conflicts")
    missing_evidence_notes: List[str] = Field(default_factory=list, description="Missing telemetry requirements")
    objection_summary: str = Field(description="Adversarial evaluation summary")
    confidence_penalty: float = Field(default=0.0, description="Deduction applied for contradictions or gaps")


class InvestigationVerdict(BaseModel):
    incident_id: str
    station_id: str
    status: InvestigationStatus
    final_confidence_score: float = Field(description="Deterministic verified confidence score (0-100)")
    primary_root_cause: Optional[RootCauseHypothesis] = None
    alternative_causes: List[RootCauseHypothesis] = Field(default_factory=list)
    critic_report: CriticEvaluation
    collected_evidence: List[EvidenceItem] = Field(default_factory=list)
    recommended_mitigation: str
    requires_human_inspection: bool
    investigation_duration_ms: Optional[float] = None


class HumanApprovalAction(BaseModel):
    incident_id: str
    action: str = Field(description="APPROVE | OVERRIDE | DISPATCH_TECH")
    engineer_id: str
    notes: Optional[str] = None
    timestamp: str
