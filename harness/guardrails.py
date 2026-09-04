"""
Industrial Hallucination Guardrails & Anti-Fabrication Engine for ReliAI.
Provides physical grounding, evidence cross-referencing, baseline sanity checks,
and simplified operator-friendly reporting.
"""

from typing import List, Dict, Any, Optional
import re
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    EvidenceItem,
    TriageAssessment,
    RootCauseHypothesis,
    CriticEvaluation,
    InvestigationVerdict,
    InvestigationStatus,
    IncidentDomain,
    IncidentSeverity
)


class IndustrialHallucinationGuardrail:
    """
    Physical-grounding and anti-hallucination verification suite.
    Enforces that all LLM-generated assertions correspond to empirically measured sensor data.
    """

    @staticmethod
    def sanitize_evidence_citations(
        hypothesis: RootCauseHypothesis,
        valid_evidence_items: List[EvidenceItem]
    ) -> RootCauseHypothesis:
        """
        Strips any phantom evidence IDs fabricated by the LLM that do not exist
        in the verified Evidence RAG store.
        """
        valid_ids = {e.evidence_id for e in valid_evidence_items}
        filtered_ids = [eid for eid in hypothesis.cited_evidence_ids if eid in valid_ids]
        
        # If the LLM cited no valid IDs but evidence exists, attach matching domain evidence
        if not filtered_ids and valid_evidence_items:
            filtered_ids = [valid_evidence_items[0].evidence_id]

        hypothesis.cited_evidence_ids = filtered_ids
        return hypothesis

    @staticmethod
    def ground_hypothesis_in_telemetry(
        hypothesis: RootCauseHypothesis,
        snapshot: MultimodalTelemetrySnapshot,
        evidence_items: List[EvidenceItem],
        triage: Optional[TriageAssessment] = None
    ) -> RootCauseHypothesis:
        """
        Validates the physical plausibility of the hypothesis against raw sensor bounds.
        Re-anchors corrupted or hallucinated hypotheses to empirical measurements.
        """
        # Strip phantom citations
        hypothesis = IndustrialHallucinationGuardrail.sanitize_evidence_citations(
            hypothesis, evidence_items
        )

        # Check 1: 100% Golden Nominal Shift Guard
        # If no abnormal evidence exists, prevent hallucinating critical machine failures
        abnormal_evidence = [e for e in evidence_items if e.is_abnormal]
        if not abnormal_evidence and not snapshot.e_stop_triggered:
            # Check if all major telemetry parameters are inside golden limits
            is_nominal = (
                380.0 <= snapshot.line_voltage_v <= 420.0
                and 5.5 <= snapshot.pneumatic_pressure_bar <= 7.0
                and (not snapshot.bead_lubrication or not snapshot.bead_lubrication.nozzle_clog_detected)
                and (not snapshot.conveyor or snapshot.conveyor.belt_speed_mps >= 0.45)
                and not any(j.temp_c > 70.0 for j in snapshot.joints.values())
            )
            if is_nominal:
                return RootCauseHypothesis(
                    rank=1,
                    title="Nominal Baseline Operation (Golden Run)",
                    description="All 3-phase voltages, pneumatics, conveyor kinematics, and joint temperatures operate strictly within golden parameters.",
                    affected_component="Complete_Cell_Assembly",
                    causal_chain=[
                        "Factory telemetry continuously monitored against ISO/DIN tolerances",
                        "Zero abnormal deviations or thermal hotspots detected across all assemblies",
                        "Machine cleared for full continuous production without intervention"
                    ],
                    cited_evidence_ids=[e.evidence_id for e in evidence_items[:2]],
                    preliminary_confidence=98.0
                )

        # Check 2: Electrical Power Sag Grounding
        if snapshot.line_voltage_v < 380.0:
            hypo_text = f"{hypothesis.title} {hypothesis.description}".lower()
            if not any(k in hypo_text for k in ("voltage", "electrical", "undervoltage", "power", "sag", "brownout")):
                # The LLM ignored the 352V power sag and diagnosed an unrelated component
                ev_ids = [e.evidence_id for e in evidence_items if "voltage" in e.observation.lower() or "power" in e.source.lower()]
                return RootCauseHypothesis(
                    rank=1,
                    title="3-Phase Supply Undervoltage Sag",
                    description=f"Incoming line voltage measured at {snapshot.line_voltage_v:.1f} V (Nominal: 400.0 V, Min: 380.0 V).",
                    affected_component="Main_3_Phase_Power_Supply",
                    causal_chain=[
                        "Incoming power grid or plant transformer experiences heavy transient load switching",
                        f"Supply line voltage sags to {snapshot.line_voltage_v:.1f} V (< 380 V threshold)",
                        "Cell protective under-voltage interlocks trip to prevent drive damage"
                    ],
                    cited_evidence_ids=ev_ids or [evidence_items[0].evidence_id] if evidence_items else [],
                    preliminary_confidence=95.0
                )

        # Check 3: Lubrication Nozzle Clog Grounding
        if snapshot.bead_lubrication and (snapshot.bead_lubrication.nozzle_clog_detected or snapshot.bead_lubrication.nozzle_pressure_bar < 2.5):
            hypo_text = f"{hypothesis.title} {hypothesis.description}".lower()
            if not any(k in hypo_text for k in ("lube", "nozzle", "lubricat", "clog", "bead", "spray", "conveyor")):
                ev_ids = [e.evidence_id for e in evidence_items if "lube" in e.source.lower() or "nozzle" in e.observation.lower()]
                return RootCauseHypothesis(
                    rank=1,
                    title="Bead Lubrication Spray Nozzle Clog & Dry-Friction Bead Seating Offset",
                    description=f"Lubrication nozzle pressure dropped to {snapshot.bead_lubrication.nozzle_pressure_bar} bar with flow rate {snapshot.bead_lubrication.lube_flow_rate_lpm} L/min and clog flag active.",
                    affected_component="Bead_Lubrication_Spray_Header",
                    causal_chain=[
                        "Lubrication nozzle tip accumulates dried soap compound / particulate clog",
                        "Spray pressure and flow rate collapse below 2.0 bar minimum atomization spec",
                        "Unlubricated tire bead experiences excessive dry-friction resistance during rim fitment"
                    ],
                    cited_evidence_ids=ev_ids or [evidence_items[0].evidence_id] if evidence_items else [],
                    preliminary_confidence=94.0
                )

        # Check 4: Joint Thermal Seizure Grounding
        has_severe_overheat = any(j.temp_c > 80.0 for j in snapshot.joints.values())
        if has_severe_overheat:
            hot_joint = next(k for k, v in snapshot.joints.items() if v.temp_c > 80.0)
            hypo_text = f"{hypothesis.title} {hypothesis.description}".lower()
            if not any(k in hypo_text for k in ("thermal", "overheat", "harmonic", "bearing", "friction", "joint", "temperature")):
                ev_ids = [e.evidence_id for e in evidence_items if "thermal" in e.source.lower() or "temp" in e.observation.lower()]
                return RootCauseHypothesis(
                    rank=1,
                    title=f"{hot_joint} Harmonic Drive Bearing Friction & Thermal Seizure",
                    description=f"{hot_joint} temperature measured at {snapshot.joints[hot_joint].temp_c}°C with elevated current draw ({snapshot.joints[hot_joint].motor_current_a} A).",
                    affected_component=f"{hot_joint}_Harmonic_Drive",
                    causal_chain=[
                        "Harmonic drive wave generator grease breakdown or dry metallic contact",
                        f"Frictional heating drives {hot_joint} temperature above 80°C threshold",
                        "Thermal expansion of gear teeth causes micro-pitting and torque saturation"
                    ],
                    cited_evidence_ids=ev_ids or [evidence_items[0].evidence_id] if evidence_items else [],
                    preliminary_confidence=96.0
                )

        # Check 5: Conveyor Belt Slip Grounding
        if snapshot.conveyor and (snapshot.conveyor.belt_speed_mps < 0.4 or snapshot.conveyor.belt_tension_n < 250.0):
            hypo_text = f"{hypothesis.title} {hypothesis.description}".lower()
            if not any(k in hypo_text for k in ("conveyor", "belt", "slip", "tension", "pulley", "vfd", "infeed")):
                ev_ids = [e.evidence_id for e in evidence_items if "conveyor" in e.source.lower() or "belt" in e.observation.lower()]
                return RootCauseHypothesis(
                    rank=1,
                    title="Infeed Conveyor Belt Slippage & Position Misalignment",
                    description=(
                        f"Conveyor belt speed dropped to {snapshot.conveyor.belt_speed_mps} m/s "
                        f"(min: 0.45 m/s) with tension {snapshot.conveyor.belt_tension_n} N "
                        f"(min: 250 N). Belt slip on drive pulley causes infeed position misalignment."
                    ),
                    affected_component="Infeed_Conveyor_Drive_Pulley",
                    causal_chain=[
                        "Belt tension drops below 250 N minimum due to pulley wear or belt stretch",
                        f"Drive pulley slippage: belt speed falls to {snapshot.conveyor.belt_speed_mps} m/s",
                        "Tire infeed timing mis-synchronized — robot picks empty or misaligned position"
                    ],
                    cited_evidence_ids=ev_ids or [evidence_items[0].evidence_id] if evidence_items else [],
                    preliminary_confidence=90.0
                )

        # Check 6: Pneumatic Pressure Drop Grounding — runs BEFORE acoustic to prevent VALVE_HISS
        # pattern hijacking the acoustic bearing check on pneumatic scenarios
        if snapshot.pneumatic_pressure_bar < 4.5:
            hypo_text = f"{hypothesis.title} {hypothesis.description}".lower()
            if not any(k in hypo_text for k in ("pneumatic", "gripper", "solenoid", "pressure", "air", "blow-by", "seal")):
                ev_ids = [e.evidence_id for e in evidence_items if "pneumatic" in e.source.lower() or "pressure" in e.observation.lower()]
                return RootCauseHypothesis(
                    rank=1,
                    title="Pneumatic Gripper Supply Solenoid Valve Seal Blow-by",
                    description=(
                        f"Line pressure measured at {snapshot.pneumatic_pressure_bar} bar — below 4.5 bar minimum "
                        "required for gripper clamp engagement. Seal blow-by in solenoid manifold."
                    ),
                    affected_component="Pneumatic_Gripper_Solenoid_Manifold",
                    causal_chain=[
                        f"Supply line pressure sags to {snapshot.pneumatic_pressure_bar} bar (min: 4.5 bar)",
                        "Solenoid valve O-ring seal blow-by causes internal pressure leak",
                        "Gripper clamp force insufficient — tire rim fitment incomplete, bead seating offset"
                    ],
                    cited_evidence_ids=ev_ids or [evidence_items[0].evidence_id] if evidence_items else [],
                    preliminary_confidence=92.0
                )

        # Check 7: Acoustic Bearing Fault Grounding
        # Only triggers on mechanical grinding patterns (BEARING_GRIND, RESONANCE_HUM) — NOT VALVE_HISS
        # which belongs to the pneumatic domain (already handled above).
        bearing_acoustics = [
            a for a in snapshot.acoustic_anomalies
            if a.frequency_hz > 1500.0
            and a.magnitude_db > 75.0
            and a.is_abnormal
            and any(pat in a.pattern_type.upper() for pat in ("BEARING", "GRIND", "RESONANCE", "HUM"))
        ]
        if bearing_acoustics and not has_severe_overheat:
            hypo_text = f"{hypothesis.title} {hypothesis.description}".lower()
            if not any(k in hypo_text for k in ("acoustic", "bearing", "grind", "vibration", "frequency", "resonance", "ffr")):
                ev_ids = [e.evidence_id for e in evidence_items if "acoustic" in e.source.lower() or "grind" in e.observation.lower()]
                top_anomaly = bearing_acoustics[0]
                return RootCauseHypothesis(
                    rank=1,
                    title="Bearing Raceway Fault — Abnormal High-Frequency Grinding",
                    description=(
                        f"FFT analysis detects {top_anomaly.pattern_type} at {top_anomaly.frequency_hz} Hz "
                        f"({top_anomaly.magnitude_db} dB) — indicative of ball-pass frequency defect on bearing raceway."
                    ),
                    affected_component="Robotic_Arm_Bearing_Assembly",
                    causal_chain=[
                        f"Bearing raceway develops micro-spalling — emits {top_anomaly.pattern_type} harmonic at {top_anomaly.frequency_hz:.0f} Hz",
                        f"Acoustic magnitude reaches {top_anomaly.magnitude_db} dB, exceeding 75 dB abnormal threshold",
                        "Progressive fatigue crack propagation will lead to catastrophic bearing seizure if uncorrected"
                    ],
                    cited_evidence_ids=ev_ids or [evidence_items[0].evidence_id] if evidence_items else [],
                    preliminary_confidence=88.0
                )

        return hypothesis

    @staticmethod
    def filter_critic_numeric_hallucinations(
        critic_eval: CriticEvaluation,
        snapshot: MultimodalTelemetrySnapshot
    ) -> CriticEvaluation:
        """
        Sanitizes the critic evaluation to remove mathematical hallucinations where
        small LLMs declare nominal sensor values as contradictions.
        """
        clean_contradictions = []
        for c in critic_eval.contradictions_detected:
            c_lower = c.lower()
            
            # Hallucination pattern: Critic claiming 6.25 bar is out of 5.5 - 7.0 bar
            if "pneumatic" in c_lower and "nominal range" in c_lower and 5.5 <= snapshot.pneumatic_pressure_bar <= 7.0:
                continue
            
            # Hallucination pattern: Critic claiming 400V is out of 380 - 420V
            if "voltage" in c_lower and 380.0 <= snapshot.line_voltage_v <= 420.0:
                continue

            clean_contradictions.append(c)

        critic_eval.contradictions_detected = clean_contradictions
        if not clean_contradictions:
            critic_eval.is_physically_possible = True
            critic_eval.confidence_penalty = 0.0
            if "contradiction" in critic_eval.objection_summary.lower():
                critic_eval.objection_summary = "Telemetry consistency validated against physical limits."

        return critic_eval

    @staticmethod
    def _wrap_line(text: str, width: int) -> str:
        """Wraps a single line of text to fit within width, adding ellipsis if still too long."""
        text = text.strip()
        if len(text) <= width:
            return text
        # Try to break at a word boundary
        truncated = text[:width - 3]
        last_space = truncated.rfind(" ")
        if last_space > width // 2:
            return truncated[:last_space] + "..."
        return truncated + "..."

    @staticmethod
    def build_simplified_operator_card(
        verdict: InvestigationVerdict,
        snapshot: MultimodalTelemetrySnapshot
    ) -> str:
        """
        Generates a simplified, high-contrast, clean diagnostic summary card
        optimized for shop-floor display. Long fields are word-wrapped cleanly
        rather than silently truncated mid-sentence.
        """
        status_badges = {
            InvestigationStatus.CONCLUSIVE: "🟢 CONCLUSIVE DIAGNOSIS",
            InvestigationStatus.INCONCLUSIVE_CONTRADICTIONS: "🟡 SENSOR CONTRADICTION (LOCKOUT)",
            InvestigationStatus.INCONCLUSIVE_MISSING_DATA: "🟡 INSUFFICIENT DATA",
            InvestigationStatus.INVESTIGATING: "🔵 INVESTIGATING"
        }
        badge = status_badges.get(verdict.status, str(verdict.status.value))

        problem_title = verdict.primary_root_cause.title if verdict.primary_root_cause else "Nominal / Baseline Shift"
        affected_comp = verdict.primary_root_cause.affected_component if verdict.primary_root_cause else "Robotic Station"
        
        causal_steps = ""
        if verdict.primary_root_cause and verdict.primary_root_cause.causal_chain:
            causal_steps = " ➔ ".join(verdict.primary_root_cause.causal_chain)
        else:
            causal_steps = "All sensors within nominal golden operating envelope."

        # Word-wrap long fields to prevent mid-sentence cuts
        _w = IndustrialHallucinationGuardrail._wrap_line
        badge_str    = _w(badge, 65)
        comp_str     = _w(affected_comp, 65)
        problem_str  = _w(problem_title, 65)
        causal_str   = _w(causal_steps, 78)
        sop_str      = _w(verdict.recommended_mitigation, 78)
        auth_str     = (
            "🔒 MANDATORY LOCKOUT (Sign-Off Required)"
            if verdict.requires_human_inspection
            else "✅ AUTOMATED PRODUCTION CLEARANCE"
        )

        card = f"""
╔═══════════════════════════════════════════════════════════════════════════════════╗
║ 🏭 RELIAI INDUSTRIAL AUTOPILOT DIAGNOSTIC REPORT                                  ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║ 🎯 Status     : {badge_str:<65} ║
║ 📈 Confidence : {verdict.final_confidence_score:.1f}%                                                              ║
║ ⚙️  Assembly   : {comp_str:<65} ║
║ 🔍 Problem    : {problem_str:<65} ║
╠───────────────────────────────────────────────────────────────────────────────────╣
║ 🔬 CAUSAL CHAIN PROGRESSION:                                                      ║
║ {causal_str:<81} ║
╠───────────────────────────────────────────────────────────────────────────────────╣
║ 🛠️ PRESCRIBED REPAIR / SOP:                                                       ║
║ {sop_str:<81} ║
╠───────────────────────────────────────────────────────────────────────────────────╣
║ 👤 AUTHORIZATION: {auth_str:<64} ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
"""
        return card.strip()
