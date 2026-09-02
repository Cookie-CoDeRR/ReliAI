#!/bin/bash
set -e

echo "=== Initializing ReliAI Local Ollama Models ==="
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"

echo "1. Checking Ollama connection at $OLLAMA_HOST..."
curl -s "$OLLAMA_HOST/api/tags" > /dev/null || (echo "Error: Ollama is not running at $OLLAMA_HOST" && exit 1)

echo "2. Pulling Primary Reasoning Model: qwen2.5:7b-instruct-q4_K_M..."
curl -X POST "$OLLAMA_HOST/api/pull" -d '{"name": "qwen2.5:7b-instruct-q4_K_M"}'

echo "3. Pulling Adversarial Critic Model: deepseek-r1:7b..."
curl -X POST "$OLLAMA_HOST/api/pull" -d '{"name": "deepseek-r1:7b"}'

echo "=== All ReliAI Investigation Models Initialized Successfully ==="
