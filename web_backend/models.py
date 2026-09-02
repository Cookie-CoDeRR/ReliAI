import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from web_backend.database import Base


class IncidentRecord(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    station_id = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(20), default="HIGH")
    status = Column(String(50), default="DETECTED", index=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)

    # Telemetry JSON payload
    telemetry_json = Column(JSON, nullable=False)

    # Investigation Results
    domain = Column(String(50), nullable=True)
    root_cause_title = Column(String(255), nullable=True)
    root_cause_description = Column(Text, nullable=True)
    affected_component = Column(String(100), nullable=True)
    final_confidence_score = Column(Float, nullable=True)
    contradiction_detected = Column(Boolean, default=False)
    recommended_mitigation = Column(Text, nullable=True)
    requires_human_inspection = Column(Boolean, default=False)
    verdict_json = Column(JSON, nullable=True)

    # Relationships
    agent_traces = relationship("AgentTraceRecord", back_populates="incident", cascade="all, delete-orphan")
    approval_audits = relationship("ApprovalAuditRecord", back_populates="incident", cascade="all, delete-orphan")


class AgentTraceRecord(Base):
    __tablename__ = "agent_traces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False, index=True)
    agent_name = Column(String(50), nullable=False)
    step_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    payload_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    incident = relationship("IncidentRecord", back_populates="agent_traces")


class ApprovalAuditRecord(Base):
    __tablename__ = "approval_audits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False) # APPROVE | OVERRIDE | DISPATCH_TECH
    engineer_id = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    incident = relationship("IncidentRecord", back_populates="approval_audits")
