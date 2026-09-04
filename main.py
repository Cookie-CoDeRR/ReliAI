import os
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    InvestigationVerdict
)
from harness.orchestrator import InvestigationOrchestrator
from harness.ollama_client import AsyncOllamaClient
from harness.baseline_engine import BaselineEngine
from web_backend.database import init_db, get_db
from web_backend.service import IncidentService
from web_backend.router import router as web_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("reliai-harness")

# Singleton service instances
ollama_client = AsyncOllamaClient()
baseline_engine = BaselineEngine()
orchestrator = InvestigationOrchestrator(ollama_client=ollama_client, baseline_engine=baseline_engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables & store singleton references
    logger.info("Initializing SQLite/PostgreSQL database tables...")
    await init_db()
    app.state.orchestrator = orchestrator
    logger.info("ReliAI Platform ready.")
    yield


app = FastAPI(
    title="ReliAI — Industrial AI Investigation Harness Service",
    description="Autonomous Multi-Agent Investigation Engine with Adversarial Anti-Hallucination Critic Loop",
    version="1.0.0",
    lifespan=lifespan
)

# Parse allowed origins from environment or default to common dev ports
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

# Enable CORS with explicit origin allowlist
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount Web Platform REST Router (/api/v1)
app.include_router(web_router)


@app.get("/harness/health")
async def health_check():
    """
    Health check verifying the Uvicorn harness and local Ollama daemon status.
    """
    ollama_ready = await ollama_client.is_available()
    return {
        "status": "HEALTHY",
        "service": "ReliAI Industrial Investigation Harness",
        "ollama_connected": ollama_ready,
        "default_model": ollama_client.model
    }


@app.get("/harness/baselines")
async def get_golden_baselines():
    """
    Returns active Golden Run engineering specifications and operating limits.
    """
    return baseline_engine.golden_specs


@app.get("/harness/sops")
async def get_maintenance_sops():
    """
    Returns the Standard Operating Procedures (SOPs) and historical failure knowledge base.
    """
    return baseline_engine.sops


@app.post("/harness/investigate", response_model=InvestigationVerdict)
async def investigate_incident(snapshot: MultimodalTelemetrySnapshot, incident_id: Optional[str] = None):
    """
    Synchronous batch investigation endpoint.
    Runs the full multi-agent pipeline and returns the finalized InvestigationVerdict.
    """
    try:
        verdict = await orchestrator.run_investigation(snapshot, incident_id=incident_id)
        return verdict
    except Exception as e:
        logger.error(f"Investigation execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")


@app.post("/harness/investigate/stream")
async def stream_incident_investigation(
    snapshot: MultimodalTelemetrySnapshot,
    incident_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits real-time progress events as each agent deliberates:
    Triage ➔ Evidence RAG ➔ Domain Analysis ➔ Root Cause ➔ Critic Falsification ➔ Confidence Engine.
    Persists intermediate agent traces and verdict details to SQLite.
    """
    async def event_generator():
        try:
            async for event in IncidentService.stream_and_investigate_incident(
                db=db,
                snapshot=snapshot,
                orchestrator=orchestrator,
                incident_id=incident_id
            ):
                yield f"data: {json.dumps(event)}\n\n"
            yield "event: complete\ndata: {}\n\n"
        except Exception as err:
            logger.error(f"Error in SSE event stream: {err}", exc_info=True)
            yield f"event: error\ndata: {json.dumps({'error': str(err)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Required for Nginx SSE pass-through
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True, log_level="info")
