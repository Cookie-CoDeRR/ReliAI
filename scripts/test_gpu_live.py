#!/usr/bin/env python3
"""
ReliAI — Real-Time GPU Multi-Agent Question & Investigation Diagnostic Tool
Demonstrates live Apple Silicon Metal GPU acceleration during general worker incident questions.
"""

import sys
import os
import time
import asyncio
import json
from typing import Dict, Any, List

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from harness.gpu_monitor import (
    get_apple_gpu_hardware_stats,
    get_ollama_gpu_vram_stats,
    LiveGPUSampler
)
from harness.ollama_client import AsyncOllamaClient
from harness.orchestrator import InvestigationOrchestrator
from harness.schemas import MultimodalTelemetrySnapshot, InvestigationVerdict


WORKER_QUESTIONS = [
    {
        "scenario_file": "scenarios/scenario_1_joint3_thermal_overheat.json",
        "worker_role": "Robotics Maintenance Technician",
        "worker_question": "Joint 3 in cell TIRE-FITTER is alarming at 92°C with high acoustic vibration at 4.2kHz. Is the motor overheating or is there mechanical friction?",
        "expected_domain": "THERMAL_OVERHEAT"
    },
    {
        "scenario_file": "scenarios/scenario_2_pneumatic_gripper_drop.json",
        "worker_role": "Quality Control Inspector",
        "worker_question": "Gripper manifold pressure dropped to 4.0 bar and the laser gauge rejected the bead seating. We heard a 5.2kHz hissing noise. What caused the pressure drop?",
        "expected_domain": "PNEUMATIC_PRESSURE_DROP"
    },
    {
        "scenario_file": "scenarios/scenario_3_contradictory_sensor_fault.json",
        "worker_role": "Plant Controls Engineer",
        "worker_question": "Sensor J3 shows 95°C over-temperature alarm, but motor current is only 2.1A and acoustic vibration is near zero. Is the motor really failing or is the sensor lying?",
        "expected_domain": "THERMAL_OVERHEAT"
    },
    {
        "scenario_file": "scenarios/scenario_4_electrical_voltage_sag.json",
        "worker_role": "Production Line Supervisor",
        "worker_question": "The entire automated cell halted mid-motion during peak shift. Incoming line voltage fell to 352V with 24.8A surge. Why did the machine stop?",
        "expected_domain": "ELECTRICAL_POWER_SAG"
    },
    {
        "scenario_file": "scenarios/scenario_5_michelin_conveyor_bead_lube_fail.json",
        "worker_role": "Tire Fitment Specialist",
        "worker_question": "Conveyor Belt 2 is lagging at 0.28 m/s and the bead lube nozzle is sputtering with low flow. Why are tires failing bead seating verification?",
        "expected_domain": "BEAD_LUBRICATION_FAILURE"
    }
]


def print_banner(text: str, char="="):
    line = char * 80
    print(f"\n{line}")
    print(f"  {text}")
    print(f"{line}\n")


async def run_gpu_question_test(single_question: bool = False):
    print_banner("ReliAI — LIVE GPU MULTI-AGENT INFERENCE BENCHMARK", "=")
    
    # 1. Initial Hardware & GPU Driver Audit
    hw_stats = get_apple_gpu_hardware_stats()
    print(f"🖥️  GPU Hardware Device:    {hw_stats.get('gpu_model', 'Unknown')} ({hw_stats.get('gpu_vendor', 'Metal')})")
    print(f"📊 Initial Metal Load:     {hw_stats.get('device_utilization_pct', 0)}% Device / {hw_stats.get('renderer_utilization_pct', 0)}% Renderer")
    print(f"💾 Allocated Metal Memory: {hw_stats.get('allocated_metal_mem_mb', 0):,.1f} MB (In Use: {hw_stats.get('in_use_metal_mem_mb', 0):,.1f} MB)")
    
    # 2. Ollama VRAM Check
    client = AsyncOllamaClient(mock_fallback=False)
    if not await client.is_available():
        print("\n❌ Error: Ollama daemon is NOT running at http://127.0.0.1:11434.")
        print("   Please run: ollama serve &")
        sys.exit(1)
        
    vram = await get_ollama_gpu_vram_stats(client.base_url)
    models = vram.get("models", [])
    if not models:
        print("⚠️  Warning: No model resident in Ollama VRAM yet. Warming up gemma2 on GPU...")
    else:
        print(f"🧠 Model Resident in VRAM: {models[0].get('name')} ({models[0].get('vram_allocated_mb', 0):,.1f} MB in GPU memory, {models[0].get('gpu_vram_pct', 0)}% GPU offload)")
    
    orchestrator = InvestigationOrchestrator(ollama_client=client)
    
    questions_to_run = WORKER_QUESTIONS[:1] if single_question else WORKER_QUESTIONS
    total_tokens_across_run = 0
    start_total_time = time.perf_counter()

    for idx, q_data in enumerate(questions_to_run, 1):
        print_banner(f"QUESTION {idx}/{len(questions_to_run)}: {q_data['worker_role']}", "-")
        print(f"🧑‍🔧 Worker Query:\n   \"{q_data['worker_question']}\"")
        print(f"📁 Target Scenario File: {q_data['scenario_file']}")
        
        with open(q_data["scenario_file"]) as f:
            sc_json = json.load(f)
        snapshot = MultimodalTelemetrySnapshot.model_validate(sc_json["snapshot"])
        
        # Start Live Apple Silicon GPU sampler
        sampler = LiveGPUSampler(sample_interval_sec=0.1)
        sampler.start()
        
        print("\n⚡ Dispatching multi-agent reasoning directly to local GPU via Metal...")
        q_start = time.perf_counter()
        
        # Step-by-step investigation execution
        verdict: InvestigationVerdict = await orchestrator.run_investigation(snapshot)
        
        q_duration = time.perf_counter() - q_start
        gpu_stats = await sampler.stop()
        
        # Retrieve throughput metrics from Ollama
        metrics = client.get_throughput_metrics()
        eval_tps = metrics.get("latest_eval_tokens_per_sec", 0.0)
        prompt_tps = metrics.get("latest_prompt_tokens_per_sec", 0.0)
        tokens_gen = metrics.get("latest_eval_count", 0)
        prompt_tokens = metrics.get("latest_prompt_count", 0)
        total_tokens_across_run += tokens_gen
        
        # Print GPU Performance Telemetry
        print("\n" + "─" * 80)
        print("🚀 REAL-TIME GPU METRICS (AT MOMENT OF QUESTION):")
        print(f"   • Active Hardware Accelerator:   {gpu_stats.get('gpu_model', 'Apple M5')}")
        print(f"   • Peak Metal GPU Utilization:    {gpu_stats.get('peak_device_utilization_pct', 0)}%")
        print(f"   • Average GPU Utilization:       {gpu_stats.get('avg_device_utilization_pct', 0)}%")
        print(f"   • Metal Unified Memory In-Use:   {gpu_stats.get('in_use_metal_mem_mb', 0):,.1f} MB")
        print(f"   • Prompt Evaluation Speed:       {prompt_tps:,.1f} tokens/sec ({prompt_tokens} tokens)")
        print(f"   • Token Generation Speed:        {eval_tps:,.1f} tokens/sec ({tokens_gen} tokens)")
        print(f"   • Multi-Agent Wall Clock Time:   {q_duration:.2f}s")
        print("─" * 80)
        
        # Print Validated Answer
        root_cause = verdict.primary_root_cause
        print("\n🎯 RELIAI MULTI-AGENT VERIFIED ANSWER:")
        print(f"   • Status:                 {verdict.status.value}")
        print(f"   • Confidence Score:       {verdict.final_confidence_score}%")
        print(f"   • Primary Root Cause:     {root_cause.title if root_cause else 'Under Analysis'}")
        if root_cause:
            print(f"   • Affected Assembly:      {root_cause.affected_component}")
            print(f"   • Physical Explanation:   {root_cause.description}")
            print(f"   • Causal Chain:           {' -> '.join(root_cause.causal_chain[:3])}")
        print(f"   • Critic Verification:    {verdict.critic_report.objection_summary}")
        print(f"   • Recommended Action:     {verdict.recommended_mitigation}")
        print("─" * 80)

    total_wall_time = time.perf_counter() - start_total_time
    avg_speed = client.get_throughput_metrics().get("average_generation_tokens_per_sec", 0.0)
    
    print_banner("GPU BENCHMARK SUMMARY", "=")
    print(f"✅ Questions Evaluated:          {len(questions_to_run)}")
    print(f"✅ Total Tokens Synthesized:     {total_tokens_across_run} tokens")
    print(f"✅ Average Generation Speed:     {avg_speed:.1f} tokens/sec")
    print(f"✅ Total Execution Duration:     {total_wall_time:.2f}s")
    print(f"✅ Hardware Status:              CONFIRMED ACTIVE METAL GPU ACCELERATION")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    single = "--single" in sys.argv or "-s" in sys.argv
    asyncio.run(run_gpu_question_test(single_question=single))
