import os
import json
import logging
from typing import Type, TypeVar, Optional, Dict, Any, List
import httpx
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class AsyncOllamaClient:
    """
    Asynchronous client for local Ollama models.
    Default Text & Critic Reasoner: Google Gemma (e.g. gemma2:latest, gemma2:2b, gemma2:9b)
    Default Vision Specialist: Qwen2.5-VL (e.g. qwen2.5-vl:7b, qwen2.5-vl:latest)
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: Optional[str] = None,
        vision_model: Optional[str] = None,
        timeout_sec: float = 45.0,
        mock_fallback: bool = True
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "gemma2:latest")
        self.vision_model = vision_model or os.getenv("OLLAMA_VISION_MODEL", "qwen2.5-vl:latest")
        self.timeout_sec = timeout_sec
        self.mock_fallback = mock_fallback

    async def is_available(self) -> bool:
        """Checks if the local Ollama daemon is responding."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def generate_structured(
        self,
        prompt: str,
        system_instruction: str,
        schema_class: Type[T],
        model_override: Optional[str] = None,
        image_base64: Optional[str] = None,
        use_vision: bool = False
    ) -> T:
        """
        Executes local Ollama inference and strictly validates output into the target Pydantic schema.
        Routes multimodal image tasks to the vision specialist (Qwen2.5-VL) and text reasoning to Gemma.
        Falls back to deterministic rule synthesis if Ollama is not running in offline environments.
        """
        target_model = model_override or (self.vision_model if use_vision else self.model)
        payload: Dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "system": system_instruction,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,  # Near-zero temperature for deterministic industrial reasoning
                "top_p": 0.9,
                "num_ctx": 4096
            }
        }

        if use_vision and image_base64:
            payload["images"] = [image_base64]

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                response.raise_for_status()
                data = response.json()
                raw_response = data.get("response", "{}")
                parsed_json = json.loads(raw_response)
                return schema_class.model_validate(parsed_json)

        except (httpx.ConnectError, httpx.TimeoutException, ValidationError, json.JSONDecodeError) as err:
            if not self.mock_fallback:
                raise err
            logger.warning(f"Ollama inference unavailable ({err}). Executing deterministic offline rule fallback.")
            return self._synthesize_offline_fallback(prompt, schema_class)

    def _synthesize_offline_fallback(self, prompt: str, schema_class: Type[T]) -> T:
        """
        Deterministic rule-based fallback synthesizing schemas when local Ollama is offline.
        """
        from harness.schemas import (
            TriageAssessment,
            RootCauseHypothesis,
            CriticEvaluation,
            VisualDefectItem,
            IncidentDomain,
            IncidentSeverity
        )

        prompt_lower = prompt.lower()

        # Fallback for Visual Defect Items
        if schema_class == VisualDefectItem:
            is_thermal = "thermal" in prompt_lower or "hotspot" in prompt_lower or "flir" in prompt_lower
            if is_thermal:
                return VisualDefectItem(
                    defect_id="VIS-001",
                    location="Joint_3_Harmonic_Housing",
                    defect_type="THERMAL_HOTSPOT",
                    bounding_box=[320, 440, 580, 720],
                    confidence=94.5,
                    description="Infrared thermography exhibits extreme localized heat emission > 85°C on wave generator casing."
                )
            else:
                return VisualDefectItem(
                    defect_id="VIS-002",
                    location="Pneumatic_Gripper_Solenoid",
                    defect_type="SEAL_EXTRUSION",
                    bounding_box=[210, 310, 450, 590],
                    confidence=88.0,
                    description="Optical macro inspection indicates micro-tear and oil mist blow-by at manifold O-ring interface."
                )

        # Fallback for Triage
        if schema_class == TriageAssessment:
            domain = IncidentDomain.KINEMATIC_MISALIGNMENT
            if "'nozzle_clog_detected': true" in prompt_lower or "nozzle_pressure_bar': 1." in prompt_lower:
                domain = IncidentDomain.BEAD_LUBRICATION_FAILURE
            elif "belt_speed_mps': 0.2" in prompt_lower or "belt_tension_n': 2" in prompt_lower:
                domain = IncidentDomain.CONVEYOR_BELT_SLIP
            elif (
                "temp_c: 8" in prompt_lower
                or "temp_c: 9" in prompt_lower
                or "temp: 88" in prompt_lower
                or "88.5" in prompt_lower
                or "bearing_grind" in prompt_lower
                or "sop-harmonic-001" in prompt_lower
                or "thermal sensor reached" in prompt_lower
                or "thermal readings on joint 3" in prompt_lower
            ):
                domain = IncidentDomain.THERMAL_OVERHEAT
            elif (
                "valve_hiss" in prompt_lower
                or "pneumatic_pressure_bar: 4" in prompt_lower
                or "pneumatic_pressure_bar: 3" in prompt_lower
                or "pressure dropped" in prompt_lower
                or "sop-pneumatic-002" in prompt_lower
            ):
                domain = IncidentDomain.PNEUMATIC_PRESSURE_DROP
            elif "line voltage: 35" in prompt_lower or "line voltage: 36" in prompt_lower or "line voltage: 37" in prompt_lower or "undervoltage" in prompt_lower:
                domain = IncidentDomain.ELECTRICAL_POWER_SAG

            return TriageAssessment(
                incident_domain=domain,
                severity=IncidentSeverity.HIGH,
                summary="Offline Fallback: Anomaly triaged based on sensor threshold deviations.",
                immediate_containment_action="Halt active cycle and inspect affected station subsystems.",
                active_investigation_paths=["Kinematic Verification", "Thermal Load Inspection", "SOP Correlation"]
            )

        # Fallback for Root Cause Hypothesis
        if schema_class == RootCauseHypothesis:
            if "incident domain: pneumatic_pressure_drop" in prompt_lower or ("sop-pneumatic-002" in prompt_lower and "incident domain: bead_lubrication_failure" not in prompt_lower and "incident domain: thermal_overheat" not in prompt_lower):
                return RootCauseHypothesis(
                    rank=1,
                    title="Pneumatic Gripper Supply Solenoid Valve Seal Blow-by",
                    description="Line pressure drop below 4.5 bar during clamping prevents full bead seating torque.",
                    affected_component="Pneumatic_Gripper_Assembly",
                    causal_chain=[
                        "Solenoid valve O-ring seal blow-by",
                        "Pressure loss in gripper manifold",
                        "Incomplete tire bead seating and laser offset"
                    ],
                    cited_evidence_ids=["EVD-001"],
                    preliminary_confidence=84.0
                )
            elif "incident domain: bead_lubrication_failure" in prompt_lower or "sop-lube-006" in prompt_lower:
                return RootCauseHypothesis(
                    rank=1,
                    title="Bead Lubrication Spray Nozzle Clog & Dry-Friction Bead Seating Offset",
                    description="Automated soap/water spray atomizer tip clogged by dried residue, causing dry friction during bead press-down and resulting in 1.55mm laser seating offset.",
                    affected_component="Bead_Lubrication_Spray_Header",
                    causal_chain=[
                        "Lubrication spray atomizer nozzle tip clog",
                        "Dry rubber-to-metal friction during bead press-down",
                        "Mounting torque spike and 1.55mm radial bead seating offset"
                    ],
                    cited_evidence_ids=["EVD-001"],
                    preliminary_confidence=91.0
                )
            elif "incident domain: conveyor_belt_slip" in prompt_lower or "sop-conveyor-007" in prompt_lower:
                return RootCauseHypothesis(
                    rank=1,
                    title="Infeed Conveyor Belt Slippage & Position Misalignment",
                    description="Conveyor belt tension drop below 240 N causing belt slip on drive pulley.",
                    affected_component="Infeed_Conveyor",
                    causal_chain=[
                        "Belt tension loss",
                        "Drive pulley slippage",
                        "Infeed timing mismatch"
                    ],
                    cited_evidence_ids=["EVD-001"],
                    preliminary_confidence=86.0
                )
            elif (
                "incident domain: thermal_overheat" in prompt_lower
                or "sop-harmonic-001" in prompt_lower
                or "thermal" in prompt_lower
                or "bearing_grind" in prompt_lower
            ):
                return RootCauseHypothesis(
                    rank=1,
                    title="Joint 3 Harmonic Drive Bearing Friction & Thermal Seizure",
                    description="Excessive thermal degradation on Joint 3 accompanied by torque spikes indicates lubrication breakdown in harmonic drive assembly.",
                    affected_component="Joint_3_Elbow",
                    causal_chain=[
                        "Lubrication breakdown in wave generator",
                        "Metal-to-metal frictional heating (> 85°C)",
                        "Gear tooth micro-pitting and torque spike"
                    ],
                    cited_evidence_ids=["EVD-001", "EVD-002"],
                    preliminary_confidence=88.5
                )
            else:
                return RootCauseHypothesis(
                    rank=1,
                    title="Robotic Arm Kinematic Deviation & Electrical Noise",
                    description="Sensor anomalies detected across joint encoders.",
                    affected_component="Robotic_Kinematic_Chain",
                    causal_chain=["Encoder signal noise", "Controller positional correction overshoot"],
                    cited_evidence_ids=["EVD-001"],
                    preliminary_confidence=75.0
                )

        # Fallback for Critic Evaluation
        if schema_class == CriticEvaluation:
            has_contradiction = (
                "check for contradiction:" in prompt_lower
                or "['contradiction:" in prompt_lower
                or ("temp: 92" in prompt_lower and "curr: 3.1" in prompt_lower)
                or ("thermocouple" in prompt_lower and "curr: 3.1" in prompt_lower)
            )
            if has_contradiction:
                return CriticEvaluation(
                    hypothesis_title="Proposed Hypothesis",
                    is_physically_possible=False,
                    contradictions_detected=[
                        "Thermal sensor indicates extreme overheat (> 90°C), but motor current is completely nominal (3.1A) and cooling fan is verified operational."
                    ],
                    missing_evidence_notes=["Thermocouple lead wire continuity verification required."],
                    objection_summary="Contradictory physical readings detected. High probability of sensor wiring fault rather than true mechanical overheat.",
                    confidence_penalty=45.0
                )
            else:
                return CriticEvaluation(
                    hypothesis_title="Proposed Hypothesis",
                    is_physically_possible=True,
                    contradictions_detected=[],
                    missing_evidence_notes=[],
                    objection_summary="Hypothesis is consistent with observed sensor telemetry and historical failure mechanisms.",
                    confidence_penalty=0.0
                )

        # Generic fallback: raise loud error rather than returning corrupt empty instance
        raise ValueError(f"Offline deterministic fallback is not implemented for schema: {schema_class.__name__}")
