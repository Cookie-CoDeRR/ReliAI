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


