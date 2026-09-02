from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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


class InvestigationStatus(str, Enum):
    INVESTIGATING = "INVESTIGATING"
    CONCLUSIVE = "CONCLUSIVE"
    INCONCLUSIVE_CONTRADICTIONS = "INCONCLUSIVE_CONTRADICTIONS"
    INCONCLUSIVE_MISSING_DATA = "INCONCLUSIVE_MISSING_DATA"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    OVERRIDDEN = "OVERRIDDEN"


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
    severity: str = Field(default="MODERATE")


class AcousticAnomaly(BaseModel):
    frequency_hz: float = Field(description="Peak harmonic frequency detected via FFT")
    magnitude_db: float = Field(description="Signal magnitude in decibels")
    pattern_type: str = Field(description="e.g. BEARING_GRIND, VALVE_HISS, RESONANCE_HUM")
    is_abnormal: bool = True


class TireFitmentMetrics(BaseModel):
    bead_seating_offset_mm: float = Field(description="Radial offset from rim center")
    angular_misalignment_deg: float = Field(description="Wheel hub angle deviation")
    torque_at_seating_nm: float = Field(description="Final tightening torque")
    clamp_engaged: bool = True


class MultimodalTelemetrySnapshot(BaseModel):
    timestamp: str = Field(description="ISO 8601 timestamp of sensor capture")
    station_id: str = Field(description="Identifier for robotic station")
    joints: Dict[str, JointTelemetry] = Field(default_factory=dict)
    line_voltage_v: float = Field(default=400.0, description="3-phase root-mean-square voltage")
    total_current_a: float = Field(default=14.5, description="Total station power current draw")
    pneumatic_pressure_bar: float = Field(default=6.2, description="Gripper line pressure")
    thermal_hotspots: List[ThermalHotspot] = Field(default_factory=list)
    acoustic_anomalies: List[AcousticAnomaly] = Field(default_factory=list)
    tire_fitment: Optional[TireFitmentMetrics] = None
    e_stop_triggered: bool = False
    operator_shift_notes: Optional[str] = None


# -----------------------------------------------------------------------------
# Evidence & RAG Data Models
# -----------------------------------------------------------------------------

class EvidenceItem(BaseModel):
    evidence_id: str = Field(description="Unique evidence ID (e.g. EVD-001)")
    source: str = Field(description="Sensor, Log, or SOP identifier")
    observation: str = Field(description="Factual measured deviation or log entry")
    is_abnormal: bool = Field(description="Whether this departs from Golden Run specs")
    severity: str = Field(default="MODERATE", description="CRITICAL | MODERATE | NOMINAL")
    deviation_percent: Optional[float] = Field(default=None, description="Percentage deviation from ideal")
    golden_baseline_reference: Optional[str] = Field(default=None, description="Expected normal range")


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
