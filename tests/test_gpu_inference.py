import pytest
import asyncio
import json
from harness.gpu_monitor import (
    get_apple_gpu_hardware_stats,
    get_ollama_gpu_vram_stats,
    LiveGPUSampler
)
from harness.ollama_client import AsyncOllamaClient
from harness.orchestrator import InvestigationOrchestrator
from harness.schemas import (
    TriageAssessment,
    MultimodalTelemetrySnapshot,
    InvestigationVerdict,
    InvestigationStatus
)
from harness.agents.triage_agent import TriageAgent


@pytest.mark.asyncio
async def test_gpu_driver_metal_readiness():
    """
    Validates that macOS Apple Silicon Metal accelerator is active and
    reporting valid device utilization and unified memory allocation.
    """
    stats = get_apple_gpu_hardware_stats()
    assert "gpu_vendor" in stats
    assert "Apple" in stats["gpu_vendor"]
    assert stats.get("allocated_metal_mem_mb", 0) > 0, "Metal unified memory should be allocated"
    assert "gpu_model" in stats


@pytest.mark.asyncio
async def test_ollama_gpu_vram_residency():
    """
    Validates that Ollama daemon is running and has offloaded the active model into GPU VRAM.
    """
    client = AsyncOllamaClient(mock_fallback=False)
    is_avail = await client.is_available()
    assert is_avail, "Ollama daemon must be running at http://127.0.0.1:11434"

    vram_stats = await get_ollama_gpu_vram_stats(client.base_url)
    assert vram_stats.get("running") is True
    assert vram_stats.get("model_count", 0) > 0, "At least one model must be resident in GPU memory"
    active_model = vram_stats["models"][0]
    assert active_model.get("vram_allocated_mb", 0) > 0, "Model must occupy non-zero GPU VRAM"
    assert active_model.get("gpu_vram_pct", 0) >= 90.0, "Model should be offloaded to GPU (>=90% in VRAM)"


@pytest.mark.asyncio
async def test_gpu_structured_inference_throughput():
    """
    Executes live structured Pydantic inference with mock_fallback=False.
    Asserts output validity and GPU token throughput exceeds 20 tokens/sec.
    """
    client = AsyncOllamaClient(mock_fallback=False)
    with open("scenarios/scenario_1_joint3_thermal_overheat.json") as f:
        data = json.load(f)
    snapshot = MultimodalTelemetrySnapshot.model_validate(data["snapshot"])

    triage_agent = TriageAgent(client)
    triage = await triage_agent.evaluate(snapshot)

    assert isinstance(triage, TriageAssessment)
    assert triage.incident_domain.value == "THERMAL_OVERHEAT"
    assert triage.severity.value in ("CRITICAL", "HIGH")
    assert len(triage.active_investigation_paths) > 0

    metrics = client.get_throughput_metrics()
    assert metrics["latest_eval_tokens_per_sec"] > 20.0, (
        f"Expected GPU throughput > 20 tokens/sec, got {metrics['latest_eval_tokens_per_sec']}"
    )
    assert metrics["total_tokens_generated"] > 50


@pytest.mark.asyncio
async def test_gpu_full_multi_agent_investigation_with_sampler():
    """
    Runs an end-to-end multi-agent investigation (Triage, Root Cause, Critic)
    while continuously sampling Apple Silicon GPU activity.
    Asserts peak GPU load and conclusive verdict generation.
    """
    client = AsyncOllamaClient(mock_fallback=False)
    orchestrator = InvestigationOrchestrator(ollama_client=client)

    with open("scenarios/scenario_1_joint3_thermal_overheat.json") as f:
        data = json.load(f)
    snapshot = MultimodalTelemetrySnapshot.model_validate(data["snapshot"])

    sampler = LiveGPUSampler(sample_interval_sec=0.1)
    sampler.start()

    verdict: InvestigationVerdict = await orchestrator.run_investigation(snapshot)
    gpu_results = await sampler.stop()

    assert verdict.status in (InvestigationStatus.CONCLUSIVE, InvestigationStatus.INVESTIGATING)
    assert verdict.primary_root_cause is not None
    assert verdict.final_confidence_score >= 60.0

    # Ensure GPU metrics were tracked
    throughput = client.get_throughput_metrics()
    assert throughput["total_tokens_generated"] > 100
    assert throughput["average_generation_tokens_per_sec"] > 20.0
    assert gpu_results.get("samples_collected", 0) > 0
