#!/bin/bash
set -e

echo "=== Initializing ReliAI Lean Multi-Model Stack (Gemma + Qwen2.5-VL) ==="
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"

echo "1. Checking Ollama connection at $OLLAMA_HOST..."
curl -s "$OLLAMA_HOST/api/tags" > /dev/null || (echo "Error: Ollama is not running at $OLLAMA_HOST" && exit 1)

echo "2. Pulling Unified Reasoning & Adversarial Critic Brain: gemma2:latest (or gemma:4b)..."
curl -X POST "$OLLAMA_HOST/api/pull" -d '{"name": "gemma2:latest"}'

echo "3. Pulling Multimodal Machine Vision Specialist: qwen2.5-vl:7b-instruct-q4_K_M..."
curl -X POST "$OLLAMA_HOST/api/pull" -d '{"name": "qwen2.5-vl:7b-instruct-q4_K_M"}'

echo "=== All ReliAI Investigation Models Initialized Successfully (RAM-Optimized Stack) ==="
