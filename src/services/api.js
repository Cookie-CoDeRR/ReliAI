const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeIncident(incidentData) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(incidentData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ReliAI backend error: ${response.status} ${errorText}`);
  }

  return response.json();
}


export async function submitApproval(incidentId, decision) {
  const response = await fetch(`${API_BASE_URL}/approval`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      incident_id: incidentId,
      decision: decision,
      reviewer: "Engineer"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Approval failed: ${response.status} ${errorText}`
    );
  }

  return response.json();
}
