"""
ToolGatewayAdapter — Bridge interface for Tarun's Investigation Control Layer & ToolGateway.
Routes tool invocations to Kushagra's underlying ToolAccessService and EvidenceService.
"""

import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from web_backend.services.tool_service import ToolAccessService
from web_backend.services.evidence_service import EvidenceService

logger = logging.getLogger(__name__)


def _safe_int(val: Any, default: int) -> int:
    """Safely coerces parameter value to integer or falls back to default."""
    if val is None:
        return default
    try:
        res = int(val)
        return res if res >= 0 else default
    except (ValueError, TypeError):
        return default


class ToolGatewayAdapter:
    def __init__(
        self,
        tool_service: Optional[ToolAccessService] = None,
        evidence_service: Optional[EvidenceService] = None
    ):
        self.tool_service = tool_service or ToolAccessService()
        self.evidence_service = evidence_service or EvidenceService(tool_service=self.tool_service)

    def get_registered_tools(self) -> List[str]:
        """Returns the list of tool identifiers supported by Kushagra's backend vertical."""
        return [
            "search_logs",
            "get_maintenance_history",
            "find_similar_incidents",
            "get_incident_evidence",
            "search_documents"
        ]

    async def invoke_tool(
        self,
        tool_name: str,
        params: Optional[Dict[str, Any]] = None,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Generic dispatch entry point for Tarun's ToolGateway.
        Routes tool invocation to the corresponding async service method.
        """
        params = params or {}
        tool_name = (tool_name or "").strip()

        try:
            if tool_name == "search_logs":
                if not db:
                    return {
                        "status": "ERROR",
                        "error": "Database session required for tool 'search_logs'"
                    }
                return await self.tool_service.search_logs(
                    db=db,
                    query=params.get("query"),
                    incident_id=params.get("incident_id"),
                    agent_name=params.get("agent_name"),
                    limit=_safe_int(params.get("limit"), 50),
                    offset=_safe_int(params.get("offset"), 0)
                )

            elif tool_name == "get_maintenance_history":
                if not db:
                    return {
                        "status": "ERROR",
                        "error": "Database session required for tool 'get_maintenance_history'"
                    }
                return await self.tool_service.get_maintenance_history(
                    db=db,
                    component=params.get("component"),
                    incident_id=params.get("incident_id"),
                    limit=_safe_int(params.get("limit"), 50)
                )

            elif tool_name == "find_similar_incidents":
                if not db:
                    return {
                        "status": "ERROR",
                        "error": "Database session required for tool 'find_similar_incidents'"
                    }
                return await self.tool_service.find_similar_incidents(
                    db=db,
                    station_id=params.get("station_id"),
                    domain=params.get("domain"),
                    severity=params.get("severity"),
                    search=params.get("search"),
                    limit=_safe_int(params.get("limit"), 10)
                )

            elif tool_name == "get_incident_evidence":
                incident_id = params.get("incident_id")
                if not incident_id:
                    return {
                        "status": "ERROR",
                        "error": "Missing required parameter 'incident_id' for tool 'get_incident_evidence'"
                    }
                if not db:
                    return {
                        "status": "ERROR",
                        "error": "Database session required for tool 'get_incident_evidence'"
                    }
                return await self.evidence_service.get_incident_evidence(db=db, incident_id=incident_id)

            elif tool_name == "search_documents":
                query = params.get("query")
                if not query or not str(query).strip():
                    return {
                        "status": "ERROR",
                        "error": "Missing required parameter 'query' for tool 'search_documents'"
                    }
                return await self.tool_service.search_documents(
                    query=str(query).strip(),
                    limit=_safe_int(params.get("limit"), 10),
                    db=db
                )

            else:
                return {
                    "status": "ERROR",
                    "error": f"Unknown or unsupported tool '{tool_name}'. Registered tools: {self.get_registered_tools()}"
                }

        except ValueError as e:
            logger.warning(f"Validation error invoking tool '{tool_name}': {e}")
            return {
                "status": "NOT_FOUND",
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected failure invoking tool '{tool_name}': {e}", exc_info=True)
            return {
                "status": "ERROR",
                "error": f"Tool execution failed: {str(e)}"
            }

    async def execute_tool(
        self,
        tool_name: str,
        params: Optional[Dict[str, Any]] = None,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Alias for invoke_tool."""
        return await self.invoke_tool(tool_name=tool_name, params=params, db=db)
