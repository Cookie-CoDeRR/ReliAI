import pytest
from harness.schemas import TriageAssessment, RootCauseHypothesis, CriticEvaluation, IncidentDomain
from harness.ollama_client import AsyncOllamaClient


@pytest.mark.asyncio
async def test_ollama_client_structured_fallback_triage():
    client = AsyncOllamaClient(mock_fallback=True)
    
    prompt = "Incident alert: Joint 3 thermal sensor reached 88.5°C."
    system = "You are an industrial triage AI."
    
    assessment = await client.generate_structured(prompt, system, TriageAssessment)
    assert isinstance(assessment, TriageAssessment)
    assert assessment.incident_domain == IncidentDomain.THERMAL_OVERHEAT
    assert len(assessment.active_investigation_paths) > 0


@pytest.mark.asyncio
async def test_ollama_client_structured_fallback_root_cause():
    client = AsyncOllamaClient(mock_fallback=True)
    
    prompt = "Abnormal thermal readings on Joint 3 with acoustic grind."
    system = "You are a root cause generator."
    
    hypothesis = await client.generate_structured(prompt, system, RootCauseHypothesis)
    assert isinstance(hypothesis, RootCauseHypothesis)
    assert "Harmonic Drive" in hypothesis.title or "Joint 3" in hypothesis.title
    assert hypothesis.preliminary_confidence > 70.0
    assert len(hypothesis.cited_evidence_ids) > 0


@pytest.mark.asyncio
async def test_ollama_client_structured_fallback_critic_contradiction():
    client = AsyncOllamaClient(mock_fallback=True)
    
    prompt = "Check for contradiction: Thermal sensor > 90°C but motor current is nominal 3.1A."
    system = "You are an adversarial critic."
    
    critic_eval = await client.generate_structured(prompt, system, CriticEvaluation)
    assert isinstance(critic_eval, CriticEvaluation)
    assert len(critic_eval.contradictions_detected) > 0
    assert critic_eval.confidence_penalty > 30.0
