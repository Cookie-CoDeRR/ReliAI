import time
import asyncio
from typing import AsyncGenerator, Dict, Any, Optional
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    InvestigationVerdict,
    TriageAssessment,
    RootCauseHypothesis,
    CriticEvaluation,
    EvidenceItem
)
from harness.ollama_client import AsyncOllamaClient
from harness.baseline_engine import BaselineEngine
from harness.agents.triage_agent import TriageAgent
from harness.agents.evidence_rag_agent import EvidenceRAGAgent
from harness.agents.telemetry_agent import TelemetryAgent
from harness.agents.quality_fit_agent import QualityFitAgent
from harness.agents.maintenance_agent import MaintenanceAgent
from harness.agents.vision_agent import VisionAgent
from harness.agents.root_cause_agent import RootCauseAgent
from harness.agents.critic_agent import CriticAgent
from harness.agents.confidence_engine import ConfidenceEngine
from harness.guardrails import IndustrialHallucinationGuardrail


class InvestigationOrchestrator:
    def __init__(
        self,
        ollama_client: Optional[AsyncOllamaClient] = None,
        baseline_engine: Optional[BaselineEngine] = None,
        max_concurrent: int = 2,
        semaphore_timeout_sec: float = 120.0
    ):
        self.client = ollama_client or AsyncOllamaClient()
        self.baseline_engine = baseline_engine or BaselineEngine()
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.semaphore_timeout_sec = semaphore_timeout_sec

        # Initialize specialized domain agents (Consolidated on Gemma + Qwen2.5-VL for vision)
        self.triage_agent = TriageAgent(self.client)
        self.evidence_agent = EvidenceRAGAgent(self.baseline_engine)
        self.telemetry_agent = TelemetryAgent()
        self.quality_agent = QualityFitAgent()
        self.maintenance_agent = MaintenanceAgent()
        self.vision_agent = VisionAgent(self.client)
        self.root_cause_agent = RootCauseAgent(self.client)
        self.critic_agent = CriticAgent(self.client)
        self.confidence_engine = ConfidenceEngine()

    async def run_investigation_stream(
        self,
        snapshot: MultimodalTelemetrySnapshot,
        incident_id: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Executes the step-by-step multi-agent investigation pipeline as an async generator
        for live Server-Sent Events (SSE) streaming.
        Guarded by a concurrency semaphore to prevent edge device VRAM over-allocation.
        Raises asyncio.TimeoutError (→ 503) if no capacity slot opens within semaphore_timeout_sec.
        """
        try:
            await asyncio.wait_for(
                self.semaphore.acquire(),
                timeout=self.semaphore_timeout_sec
            )
        except asyncio.TimeoutError:
            raise RuntimeError(
                f"Investigation queue at capacity. All {self.semaphore._value} slots busy. "
                "Retry after the current investigation completes."
            )
        try:
            start_time = time.perf_counter()
            inc_id = incident_id or f"INC-{int(start_time)}"
            station_id = snapshot.station_id

            # -------------------------------------------------------------
            # STEP 1: TRIAGE AGENT
            # -------------------------------------------------------------
            yield {
                "incident_id": inc_id,
                "agent": "TRIAGE_AGENT",
                "step": "STARTED",
                "message": f"Triaging multimodal telemetry alert from {station_id} using Gemma..."
            }

            triage: TriageAssessment = await self.triage_agent.evaluate(snapshot)
            yield {
                "incident_id": inc_id,
                "agent": "TRIAGE_AGENT",
                "step": "COMPLETED",
                "payload": triage.model_dump()
            }

            # -------------------------------------------------------------
            # STEP 2: EVIDENCE & BASELINE RAG AGENT
            # -------------------------------------------------------------
            yield {
                "incident_id": inc_id,
                "agent": "EVIDENCE_RAG_AGENT",
                "step": "STARTED",
                "message": "Computing mathematical deviations from Golden Baselines and querying SOP store..."
            }

            evidence_data = await self.evidence_agent.collect_evidence(snapshot)
            evidence_items = list(evidence_data["evidence_items"])
            matched_sops = evidence_data["matched_sops"]

            yield {
                "incident_id": inc_id,
                "agent": "EVIDENCE_RAG_AGENT",
                "step": "COMPLETED",
                "payload": {
                    "evidence_items": [e.model_dump() if hasattr(e, "model_dump") else e for e in evidence_items],
                    "matched_sops": [s.model_dump() if hasattr(s, "model_dump") else s for s in matched_sops]
                }
            }

            # -------------------------------------------------------------
            # STEP 3: PARALLEL DOMAIN & MULTIMODAL VISION ANALYSIS
            # -------------------------------------------------------------
            yield {
                "incident_id": inc_id,
                "agent": "DOMAIN_ANALYSIS",
                "step": "STARTED",
                "message": "Executing parallel domain analysis (Kinematics, Quality, Maintenance, and Qwen2.5-VL Vision Inspection)..."
            }

            telemetry_task = self.telemetry_agent.analyze(snapshot, evidence_items)
            quality_task = self.quality_agent.analyze(snapshot)
            maintenance_task = self.maintenance_agent.correlate(snapshot, evidence_items)
            vision_task = self.vision_agent.evaluate(snapshot)

            telemetry_res, quality_res, maintenance_res, vision_res = await asyncio.gather(
                telemetry_task, quality_task, maintenance_task, vision_task
            )

            # Merge any detected visual evidence into the empirical evidence list
            for v_ev in vision_res.get("visual_evidence", []):
                evidence_items.append(EvidenceItem.model_validate(v_ev))

            yield {
                "incident_id": inc_id,
                "agent": "DOMAIN_ANALYSIS",
                "step": "COMPLETED",
                "payload": {
                    "telemetry": telemetry_res,
                    "quality": quality_res,
                    "maintenance": maintenance_res,
                    "vision": vision_res
                }
            }

            # -------------------------------------------------------------
            # STEP 4: ROOT CAUSE GENERATION AGENT
            # -------------------------------------------------------------
            yield {
                "incident_id": inc_id,
                "agent": "ROOT_CAUSE_AGENT",
                "step": "STARTED",
                "message": "Formulating ranked causal hypotheses grounded in empirical evidence via Gemma..."
            }

            hypothesis: RootCauseHypothesis = await self.root_cause_agent.formulate_hypothesis(
                snapshot=snapshot,
                triage=triage,
                evidence_data={"evidence_items": evidence_items, "matched_sops": matched_sops},
                telemetry_data=telemetry_res,
                quality_data=quality_res,
                maintenance_data=maintenance_res
            )

            # Apply Anti-Hallucination & Evidence Grounding Guardrail
            hypothesis = IndustrialHallucinationGuardrail.ground_hypothesis_in_telemetry(
                hypothesis=hypothesis,
                snapshot=snapshot,
                evidence_items=evidence_items,
                triage=triage
            )

            yield {
                "incident_id": inc_id,
                "agent": "ROOT_CAUSE_AGENT",
                "step": "COMPLETED",
                "payload": hypothesis.model_dump()
            }

            # -------------------------------------------------------------
            # STEP 5: ADVERSARIAL CRITIC AGENT (CONSOLIDATED ON GEMMA)
            # -------------------------------------------------------------
            yield {
                "incident_id": inc_id,
                "agent": "CRITIC_AGENT",
                "step": "STARTED",
                "message": f"Adversarial Critic auditing hypothesis '{hypothesis.title}' for physical contradictions..."
            }

            critic_eval: CriticEvaluation = await self.critic_agent.evaluate_hypothesis(
                hypothesis=hypothesis,
                snapshot=snapshot,
                evidence_items=evidence_items
            )

            # Apply Anti-Hallucination Guardrail on Critic Output
            critic_eval = IndustrialHallucinationGuardrail.filter_critic_numeric_hallucinations(
                critic_eval=critic_eval,
                snapshot=snapshot
            )

            yield {
                "incident_id": inc_id,
                "agent": "CRITIC_AGENT",
                "step": "COMPLETED",
                "payload": critic_eval.model_dump()
            }

            # -------------------------------------------------------------
            # STEP 6: DETERMINISTIC RISK & CONFIDENCE ENGINE
            # -------------------------------------------------------------
            duration_ms = (time.perf_counter() - start_time) * 1000.0

            verdict: InvestigationVerdict = self.confidence_engine.calculate_verdict(
                incident_id=inc_id,
                station_id=station_id,
                hypothesis=hypothesis,
                critic_report=critic_eval,
                evidence_items=evidence_items,
                matched_sops=matched_sops,
                duration_ms=round(duration_ms, 2)
            )

            # Generate High-Contrast Operator Summary Card
            verdict.operator_summary_card = IndustrialHallucinationGuardrail.build_simplified_operator_card(
                verdict=verdict,
                snapshot=snapshot
            )

            yield {
                "incident_id": inc_id,
                "agent": "CONFIDENCE_ENGINE",
                "step": "FINAL_VERDICT",
                "verdict": verdict.model_dump()
            }
        finally:
            # Always release the semaphore slot, even on error or cancellation
            self.semaphore.release()

    async def run_investigation(
        self,
        snapshot: MultimodalTelemetrySnapshot,
        incident_id: Optional[str] = None
    ) -> InvestigationVerdict:
        """
        Synchronous batch runner returning the final InvestigationVerdict.
        """
        final_verdict = None
        async for event in self.run_investigation_stream(snapshot, incident_id):
            if event.get("step") == "FINAL_VERDICT":
                final_verdict = InvestigationVerdict.model_validate(event["verdict"])

        return final_verdict
