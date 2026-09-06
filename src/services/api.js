/**
 * ReliAI Industrial Command Center - API Client Service
 * Encapsulates REST and investigation endpoints for backend communication.
 */

const API_BASE_URL = "";

export async function fetchScenarios() {
  const response = await fetch(`${API_BASE_URL}/api/v1/scenarios`);
  if (!response.ok) {
    throw new Error(`Failed to load scenarios: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerScenarioInvestigation(scenarioId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/scenarios/${encodeURIComponent(scenarioId)}/trigger`,
    { method: "POST" }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Investigation trigger failed: ${response.status} ${errText}`);
  }
  return response.json();
}

export async function fetchIncidentDetails(incidentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch incident ${incidentId}: ${response.statusText}`);
  }
  return response.json();
}

export async function submitHumanApproval(incidentId, { action, engineer_id, notes }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, engineer_id, notes })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Approval submission failed: ${response.status} ${errText}`);
  }
  return response.json();
}

export async function cancelInvestigation(incidentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/cancel`, {
    method: "POST"
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cancellation failed: ${response.status} ${errText}`);
  }
  return response.json();
}

export async function submitFollowUp(incidentId, { operator_notes, telemetry_override }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/follow-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operator_notes, telemetry_override })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Follow-up investigation failed: ${response.status} ${errText}`);
  }
  return response.json();
}

export async function fetchModelStatus() {
  const response = await fetch(`${API_BASE_URL}/api/v1/system/model-status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch model readiness: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchIncidents(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents${queryString}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch incidents: ${response.statusText}`);
  }
  return response.json();
}

export async function streamScenarioInvestigation(
  scenarioId,
  { onEvent, onError, onComplete, signal } = {}
) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/scenarios/${encodeURIComponent(scenarioId)}/stream`,
    {
      method: "POST",
      headers: { Accept: "text/event-stream" },
      signal
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`Investigation streaming failed: ${response.status} ${errText}`);
    if (onError) onError(err);
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete tail in buffer

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (onEvent) onEvent(parsed);
            } catch (err) {
              console.warn("Failed to parse SSE data chunk:", dataStr, err);
            }
          }
        } else if (line.startsWith("event: complete")) {
          if (onComplete) onComplete();
        }
      }
    }
    if (onComplete) onComplete();
  } catch (err) {
    if (err.name !== "AbortError") {
      if (onError) onError(err);
      throw err;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchAnalyticsSummary() {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/summary`);
  if (!response.ok) {
    throw new Error(`Failed to load analytics summary: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDomainBreakdown() {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/domain-breakdown`);
  if (!response.ok) {
    throw new Error(`Failed to load domain breakdown: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchConfidenceDistribution() {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/confidence-distribution`);
  if (!response.ok) {
    throw new Error(`Failed to load confidence distribution: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchApprovalBreakdown() {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/approval-breakdown`);
  if (!response.ok) {
    throw new Error(`Failed to load approval breakdown: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGpuDiagnostics() {
  const response = await fetch(`${API_BASE_URL}/api/v1/system/gpu`);
  if (!response.ok) {
    throw new Error(`Failed to load GPU diagnostics: ${response.statusText}`);
  }
  return response.json();
}

// =============================================================================
// KUSHAGRA PHASE 1: TOOL ACCESS LAYER & SYSTEM STATUS
// =============================================================================

export async function fetchSystemStatus() {
  const response = await fetch(`${API_BASE_URL}/api/v1/system/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch system status: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAvailableTools() {
  const response = await fetch(`${API_BASE_URL}/api/v1/tools/available`);
  if (!response.ok) {
    throw new Error(`Failed to load available tools: ${response.statusText}`);
  }
  return response.json();
}

export async function searchLogs({ query, incident_id, agent_name, limit = 50, offset = 0 } = {}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/tools/search-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, incident_id, agent_name, limit, offset })
  });
  if (!response.ok) {
    throw new Error(`Log search failed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMaintenanceHistory({ component, incident_id, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (component) params.append("component", component);
  if (incident_id) params.append("incident_id", incident_id);
  params.append("limit", limit);

  const response = await fetch(`${API_BASE_URL}/api/v1/tools/maintenance-history?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load maintenance history: ${response.statusText}`);
  }
  return response.json();
}

export async function findSimilarIncidents({ station_id, domain, severity, search, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (station_id) params.append("station_id", station_id);
  if (domain) params.append("domain", domain);
  if (severity) params.append("severity", severity);
  if (search) params.append("search", search);
  params.append("limit", limit);

  const response = await fetch(`${API_BASE_URL}/api/v1/tools/similar-incidents?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to find similar incidents: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSensorData({ incident_id, station_id } = {}) {
  const params = new URLSearchParams();
  if (incident_id) params.append("incident_id", incident_id);
  if (station_id) params.append("station_id", station_id);

  const response = await fetch(`${API_BASE_URL}/api/v1/tools/sensor-data?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sensor data: ${response.statusText}`);
  }
  return response.json();
}

export async function searchDocuments(query, limit = 10) {
  const params = new URLSearchParams({ query, limit });
  const response = await fetch(`${API_BASE_URL}/api/v1/tools/search-documents?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Document search failed: ${response.statusText}`);
  }
  return response.json();
}

// =============================================================================
// KUSHAGRA PHASE 2: EVIDENCE & REPORT APIS
// =============================================================================

export async function fetchIncidentEvidence(incidentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${encodeURIComponent(incidentId)}/evidence`);
  if (!response.ok) {
    throw new Error(`Failed to fetch evidence for ${incidentId}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchIncidentReport(incidentId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${encodeURIComponent(incidentId)}/report`);
  if (!response.ok) {
    throw new Error(`Failed to generate report for ${incidentId}: ${response.statusText}`);
  }
  return response.json();
}

// =============================================================================
// KUSHAGRA PHASE 3: UPLOAD & INGESTION APIS
// =============================================================================

export async function uploadDocument(file, incidentId = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (incidentId) {
    formData.append("incident_id", incidentId);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/uploads`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errText}`);
  }
  return response.json();
}

export async function listUploads({ incident_id, file_type, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (incident_id) params.append("incident_id", incident_id);
  if (file_type) params.append("file_type", file_type);
  params.append("limit", limit);
  params.append("offset", offset);

  const response = await fetch(`${API_BASE_URL}/api/v1/uploads?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to list uploads: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchUploadMetadata(uploadId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/uploads/${encodeURIComponent(uploadId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch upload ${uploadId}: ${response.statusText}`);
  }
  return response.json();
}

export function getUploadFileUrl(uploadId) {
  return `${API_BASE_URL}/api/v1/uploads/${encodeURIComponent(uploadId)}/file`;
}

export async function deleteUpload(uploadId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/uploads/${encodeURIComponent(uploadId)}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error(`Failed to delete upload ${uploadId}: ${response.statusText}`);
  }
  return response.json();
}

// Convenience Aliases
export const fetchIncidentHistory = fetchIncidents;
export const fetchDomainAnalytics = fetchDomainBreakdown;
export const fetchHumanApprovalStats = fetchApprovalBreakdown;
export const sendCopilotFollowUp = submitFollowUp;




