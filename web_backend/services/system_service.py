import time
import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from harness.ollama_client import AsyncOllamaClient
from web_backend.services.tool_service import ToolAccessService


class ComponentStatus(BaseModel):
    status: str = Field(description="HEALTHY | DEGRADED | UNAVAILABLE")
    details: Dict[str, Any] = Field(default_factory=dict)


class SystemStatusResponse(BaseModel):
    status: str = Field(description="HEALTHY | DEGRADED | UNHEALTHY")
    timestamp: str = Field(description="ISO 8601 status timestamp")
    database: ComponentStatus
    llm: ComponentStatus
    storage: ComponentStatus
    tools: ComponentStatus


class SystemService:
    @staticmethod
    async def get_system_status(
        db: AsyncSession,
        ollama_client: Optional[AsyncOllamaClient] = None
    ) -> SystemStatusResponse:
        """
        Gathers comprehensive system status across DB, local LLM, storage, and registered tools.
        Exposes zero credentials, secrets, or internal filesystem paths.
        """
        client = ollama_client or AsyncOllamaClient()
        tool_service = ToolAccessService()

        # 1. Database Health Check
        db_details: Dict[str, Any] = {}
        try:
            start_time = time.perf_counter()
            await db.execute(select(1))
            latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
            db_status_str = "HEALTHY"
            db_details = {
                "connected": True,
                "latency_ms": latency_ms,
                "engine": "sqlite"
            }
        except Exception as e:
            db_status_str = "UNAVAILABLE"
            db_details = {
                "connected": False,
                "error": "Database connectivity check failed"
            }

        # 2. Local LLM / Ollama Availability Check
        llm_details: Dict[str, Any] = {}
        try:
            is_ready = await client.is_available()
            llm_status_str = "HEALTHY" if is_ready else "DEGRADED"
            llm_details = {
                "connected": is_ready,
                "default_model": client.model,
                "provider": "Local Ollama Inference Engine"
            }
        except Exception as e:
            llm_status_str = "UNAVAILABLE"
            llm_details = {
                "connected": False,
                "error": "LLM daemon unreachable"
            }

        # 3. Storage & Artifact Availability Check
        base_dir = Path(__file__).resolve().parent.parent.parent
        db_exists = (base_dir / "reliai.db").exists()
        scenarios_exists = (base_dir / "scenarios").exists()
        sops_exists = (base_dir / "sops").exists()

        storage_healthy = db_exists and scenarios_exists and sops_exists
        storage_status_str = "HEALTHY" if storage_healthy else "DEGRADED"
        storage_details = {
            "database_file_present": db_exists,
            "scenario_presets_present": scenarios_exists,
            "sops_knowledge_base_present": sops_exists
        }

        # 4. Data Tools Availability Check
        available_tools = tool_service.get_available_tools()
        tools_status_str = "HEALTHY"
        tools_details = {
            "registered_tools_count": len(available_tools),
            "available_tools": list(available_tools.keys())
        }

        # Determine overall system health
        if db_status_str == "UNAVAILABLE":
            overall_status = "UNHEALTHY"
        elif llm_status_str != "HEALTHY" or storage_status_str != "HEALTHY":
            overall_status = "DEGRADED"
        else:
            overall_status = "HEALTHY"

        return SystemStatusResponse(
            status=overall_status,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            database=ComponentStatus(status=db_status_str, details=db_details),
            llm=ComponentStatus(status=llm_status_str, details=llm_details),
            storage=ComponentStatus(status=storage_status_str, details=storage_details),
            tools=ComponentStatus(status=tools_status_str, details=tools_details)
        )
