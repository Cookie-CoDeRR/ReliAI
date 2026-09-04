from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import httpx
import json


app = FastAPI(
    title="ReliAI Investigation API",
    version="0.2.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "qwen3:8b"


class Telemetry(BaseModel):
    temperature: float
    voltage: float
    motor_current: float
    vibration: float


class VisionData(BaseModel):
    orientation_error: float


class AudioData(BaseModel):
    anomaly_detected: bool


class Incident(BaseModel):
    machine_id: str
    incident_type: str
    telemetry: Telemetry
    vision: VisionData
    audio: AudioData


class AIResult(BaseModel):
    root_cause: str
    confidence: int = Field(ge=0, le=100)
    risk: str
    affected_component: str
    evidence: List[str]
    recommended_action: str


class AnalysisResponse(BaseModel):
    incident_id: str
    status: str
    root_cause: str
    confidence: int
    risk: str
    affected_component: str
    evidence: List[str]
    recommended_action: str


@app.get("/")
def root():
    return {
        "system": "ReliAI",
        "status": "online",
        "ai_model": OLLAMA_MODEL
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "ReliAI Investigation API",
        "ai_model": OLLAMA_MODEL
    }


def build_prompt(incident: Incident) -> str:

    return f"""
You are ReliAI, an industrial robotic fault investigation system.

Analyze the incident using ONLY the evidence supplied below.

MACHINE
Machine ID: {incident.machine_id}
Incident Type: {incident.incident_type}

TELEMETRY
Temperature: {incident.telemetry.temperature} C
Voltage: {incident.telemetry.voltage} V
Motor Current: {incident.telemetry.motor_current} A
Vibration: {incident.telemetry.vibration}

VISION
Orientation Error: {incident.vision.orientation_error} degrees

AUDIO
Abnormal Sound Detected: {incident.audio.anomaly_detected}

Your task:

1. Identify the most likely root cause.
2. Give confidence from 0 to 100.
3. Classify risk as LOW, MEDIUM, HIGH, or CRITICAL.
4. Identify the most likely affected component.
5. Give 2 to 5 evidence statements based only on supplied data.
6. Recommend a safe inspection or maintenance action.

Important rules:

- Do not invent sensor readings.
- Do not claim certainty when evidence is weak.
- Do not recommend bypassing safety systems.
- Confidence must reflect evidence quality.
- Return concise technical results.
"""


async def run_ollama(incident: Incident) -> AIResult:

    prompt = build_prompt(incident)

    payload = {
        "model": OLLAMA_MODEL,

        "messages": [
            {
                "role": "system",
                "content": (
                    "You are ReliAI, an industrial incident investigation AI. "
                    "Return only valid structured JSON matching the requested schema."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],

        "stream": False,

        "format": {
            "type": "object",
            "properties": {
                "root_cause": {
                    "type": "string"
                },
                "confidence": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100
                },
                "risk": {
                    "type": "string",
                    "enum": [
                        "LOW",
                        "MEDIUM",
                        "HIGH",
                        "CRITICAL"
                    ]
                },
                "affected_component": {
                    "type": "string"
                },
                "evidence": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "minItems": 2,
                    "maxItems": 5
                },
                "recommended_action": {
                    "type": "string"
                }
            },

            "required": [
                "root_cause",
                "confidence",
                "risk",
                "affected_component",
                "evidence",
                "recommended_action"
            ]
        },

        "options": {
            "temperature": 0.1,
            "num_predict": 300,
            "num_ctx": 2048
        }
    }

    try:

        async with httpx.AsyncClient(timeout=120.0) as client:

            response = await client.post(
                OLLAMA_URL,
                json=payload
            )

            response.raise_for_status()

            ollama_response = response.json()

            raw_content = ollama_response["message"]["content"]

            parsed = json.loads(raw_content)

            return AIResult(**parsed)

    except httpx.ConnectError:

        raise HTTPException(
            status_code=503,
            detail="Ollama service is not reachable."
        )

    except httpx.TimeoutException:

        raise HTTPException(
            status_code=504,
            detail="Ollama analysis timed out."
        )

    except (json.JSONDecodeError, KeyError, ValueError) as error:

        raise HTTPException(
            status_code=500,
            detail=f"Invalid AI response: {str(error)}"
        )

    except httpx.HTTPStatusError as error:

        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned an error: {str(error)}"
        )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_incident(incident: Incident):

    ai_result = await run_ollama(incident)

    return {
        "incident_id": "INC-001",
        "status": "completed",
        "root_cause": ai_result.root_cause,
        "confidence": ai_result.confidence,
        "risk": ai_result.risk,
        "affected_component": ai_result.affected_component,
        "evidence": ai_result.evidence,
        "recommended_action": ai_result.recommended_action
    }


class ApprovalRequest(BaseModel):
    incident_id: str
    decision: str
    reviewer: str = "Engineer"


class ApprovalResponse(BaseModel):
    incident_id: str
    decision: str
    reviewer: str
    status: str


@app.post("/approval", response_model=ApprovalResponse)
async def submit_approval(approval: ApprovalRequest):

    decision = approval.decision.upper()

    if decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=400,
            detail="Decision must be APPROVED or REJECTED"
        )

    print(
        f"[HUMAN REVIEW] "
        f"{approval.incident_id} -> "
        f"{decision} by {approval.reviewer}"
    )

    return {
        "incident_id": approval.incident_id,
        "decision": decision,
        "reviewer": approval.reviewer,
        "status": "recorded"
    }
