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
