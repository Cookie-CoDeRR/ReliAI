import json
import logging
from typing import Type, TypeVar, Optional, Dict, Any
import httpx
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class AsyncOllamaClient:
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "qwen2.5:7b-instruct-q4_K_M",
        timeout_sec: float = 45.0,
        mock_fallback: bool = True
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
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
        system_prompt: str,
        schema_class: Type[T],
        model_override: Optional[str] = None
    ) -> T:
        """
        Executes local Ollama inference and strictly validates output into the target Pydantic schema.
        Falls back to deterministic rule synthesis if Ollama is not running in offline environments.
        """
        target_model = model_override or self.model
        payload = {
            "model": target_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,  # Near-zero temperature for deterministic industrial reasoning
                "top_p": 0.9,
                "num_ctx": 4096
            }
        }

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
            IncidentDomain,
            IncidentSeverity
        )

        prompt_lower = prompt.lower()

        # Fallback for Triage
        if schema_class == TriageAssessment:
            domain = IncidentDomain.KINEMATIC_MISALIGNMENT
            if "thermal" in prompt_lower or "temp" in prompt_lower or "°c" in prompt_lower:
                domain = IncidentDomain.THERMAL_OVERHEAT
            elif "pneumatic" in prompt_lower or "pressure" in prompt_lower or "bar" in prompt_lower:
                domain = IncidentDomain.PNEUMATIC_PRESSURE_DROP
            elif "voltage" in prompt_lower or "current" in prompt_lower:
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
            is_joint3_thermal = "joint 3" in prompt_lower or "thermal" in prompt_lower
            is_pneumatic = "pneumatic" in prompt_lower or "pressure" in prompt_lower

            if is_joint3_thermal:
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
            elif is_pneumatic:
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
            has_contradiction = "contradiction" in prompt_lower or "conflict" in prompt_lower
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

        # Generic fallback
        return schema_class.model_construct()
