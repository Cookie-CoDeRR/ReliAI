import logging
from typing import List, Dict, Any, Optional
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    EvidenceItem,
    VisualDefectItem,
    MachineryImageFrame
)
from harness.ollama_client import AsyncOllamaClient

logger = logging.getLogger("reliai-harness.vision_agent")


class VisionAgent:
    """
    Multimodal Vision Inspection Agent.
    Leverages Qwen2.5-VL to inspect FLIR IR thermography and optical macro defect images
    of machinery assemblies (gearboxes, harmonic drives, pneumatic seals).
    """

    def __init__(self, ollama_client: Optional[AsyncOllamaClient] = None):
        self.client = ollama_client or AsyncOllamaClient()

    async def evaluate(self, snapshot: MultimodalTelemetrySnapshot) -> Dict[str, Any]:
        logger.info("Vision Agent inspecting machinery image frames and visual defect anomalies...")

        detected_defects: List[VisualDefectItem] = list(snapshot.visual_defects)
        visual_evidence: List[EvidenceItem] = []

        # If raw image frames exist in telemetry, analyze via Vision Model
        for idx, frame in enumerate(snapshot.image_frames):
            frame_prompt = f"""
            INDUSTRIAL MACHINE DEFECT INSPECTION:
            Camera ID: {frame.camera_id}
            Image Modality: {frame.image_type}
            Thermal Limits: {frame.min_temp_c}°C to {frame.max_temp_c}°C
            
            TASK:
            Inspect this machinery visual frame for:
            1. Surface micro-pitting or tooth spalling on gears.
            2. Thermal hotspots or abnormal heating patterns.
            3. Pneumatic seal extrusions, tears, or valve leaks.
            4. Lubricant degradation / burnt oil discoloration.
            """

            try:
                # Call vision model if image data exists
                defect = await self.client.generate_structured(
                    prompt=frame_prompt,
                    system_instruction="You are an industrial computer vision failure inspection specialist. Output valid JSON.",
                    schema_class=VisualDefectItem,
                    image_base64=frame.image_base64,
                    use_vision=True
                )
                detected_defects.append(defect)
            except Exception as e:
                logger.warning(f"Vision model evaluation failed on frame {frame.camera_id}: {e}")

        # Convert detected defects into standardized Evidence Items
        for idx, defect in enumerate(detected_defects):
            ev_id = f"EVD-VISUAL-{idx+1:03d}"
            visual_evidence.append(
                EvidenceItem(
                    evidence_id=ev_id,
                    source=f"Vision_Model_{defect.location}",
                    observation=f"Visual defect detected: {defect.defect_type} at {defect.location}. {defect.description} (Confidence: {defect.confidence:.1f}%)",
                    is_abnormal=True,
                    severity="CRITICAL" if defect.confidence > 80.0 else "MODERATE"
                )
            )

        return {
            "agent": "VISION_AGENT",
            "detected_defects": [d.model_dump() for d in detected_defects],
            "visual_evidence": [e.model_dump() for e in visual_evidence],
            "total_defects_found": len(detected_defects)
        }
