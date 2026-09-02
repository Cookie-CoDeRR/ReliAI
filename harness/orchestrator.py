import time
import asyncio
from typing import AsyncGenerator, Dict, Any, Optional
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    InvestigationVerdict,
    TriageAssessment,
    RootCauseHypothesis,
    CriticEvaluation
)
from harness.ollama_client import AsyncOllamaClient
from harness.baseline_engine import BaselineEngine
from harness.agents.triage_agent import TriageAgent
from harness.agents.evidence_rag_agent import EvidenceRAGAgent
from harness.agents.telemetry_agent import TelemetryAgent
from harness.agents.quality_fit_agent import QualityFitAgent
from harness.agents.maintenance_agent import MaintenanceAgent
from harness.agents.root_cause_agent import RootCauseAgent
from harness.agents.critic_agent import CriticAgent
from harness.agents.confidence_engine import ConfidenceEngine


class InvestigationOrchestrator:
    def __init__(
        self,
        ollama_client: Optional[AsyncOllamaClient] = None,
        baseline_engine: Optional[BaselineEngine] = None
    ):
        self.client = ollama_client or AsyncOllamaClient()
        self.baseline_engine = baseline_engine or BaselineEngine()

        # Initialize specialized agents
        self.triage_agent = TriageAgent(self.client)
        self.evidence_agent = EvidenceRAGAgent(self.baseline_engine)
        self.telemetry_agent = TelemetryAgent()
        self.quality_agent = QualityFitAgent()
        self.maintenance_agent = MaintenanceAgent()
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
        """
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
            "message": f"Triaging multimodal telemetry alert from {station_id}..."
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
        evidence_items = evidence_data["evidence_items"]
        matched_sops = evidence_data["matched_sops"]

        yield {
            "incident_id": inc_id,
            "agent": "EVIDENCE_RAG_AGENT",
            "step": "COMPLETED",
            "evidence_count": len(evidence_items),
            "critical_count": evidence_data["critical_count"],
            "matched_sops_count": len(matched_sops),
            "payload": {
                "evidence_items": [e.model_dump() for e in evidence_items],
                "matched_sops": matched_sops
            }
        }

        # -------------------------------------------------------------
        # STEP 3: PARALLEL DOMAIN ANALYSIS
        # -------------------------------------------------------------
        yield {
            "incident_id": inc_id,
            "agent": "DOMAIN_ANALYSIS",
            "step": "STARTED",
            "message": "Executing parallel domain analysis (Kinematics, Quality Tolerances, Maintenance History)..."
        }

        telemetry_task = self.telemetry_agent.analyze(snapshot, evidence_items)
        quality_task = self.quality_agent.analyze(snapshot)
        maintenance_task = self.maintenance_agent.correlate(snapshot, evidence_items)

        telemetry_res, quality_res, maintenance_res = await asyncio.gather(
            telemetry_task, quality_task, maintenance_task
        )

        yield {
            "incident_id": inc_id,
            "agent": "DOMAIN_ANALYSIS",
            "step": "COMPLETED",
            "payload": {
                "telemetry": telemetry_res,
                "quality": quality_res,
                "maintenance": maintenance_res
            }
        }

        # -------------------------------------------------------------
        # STEP 4: ROOT CAUSE GENERATION AGENT
        # -------------------------------------------------------------
        yield {
            "incident_id": inc_id,
            "agent": "ROOT_CAUSE_AGENT",
            "step": "STARTED",
            "message": "Formulating ranked causal hypotheses grounded in empirical evidence..."
        }

        hypothesis: RootCauseHypothesis = await self.root_cause_agent.formulate_hypothesis(
            snapshot=snapshot,
            triage=triage,
            evidence_data=evidence_data,
            telemetry_data=telemetry_res,
            quality_data=quality_res,
            maintenance_data=maintenance_res
        )

        yield {
            "incident_id": inc_id,
            "agent": "ROOT_CAUSE_AGENT",
            "step": "COMPLETED",
            "payload": hypothesis.model_dump()
        }

        # -------------------------------------------------------------
        # STEP 5: ADVERSARIAL CRITIC AGENT (FALSIFICATION LOOP)
        # -------------------------------------------------------------
        yield {
            "incident_id": inc_id,
            "agent": "CRITIC_AGENT",
            "step": "STARTED",
            "message": f"Adversarial Critic testing hypothesis '{hypothesis.title}' for physical contradictions..."
        }

        critic_eval: CriticEvaluation = await self.critic_agent.evaluate_hypothesis(
            hypothesis=hypothesis,
            snapshot=snapshot,
            evidence_items=evidence_items
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

        yield {
            "incident_id": inc_id,
            "agent": "CONFIDENCE_ENGINE",
            "step": "FINAL_VERDICT",
            "verdict": verdict.model_dump()
        }

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
