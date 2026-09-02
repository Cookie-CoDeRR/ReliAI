import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from harness.schemas import (
    MultimodalTelemetrySnapshot,
    EvidenceItem,
    IncidentDomain,
    IncidentSeverity
)


class BaselineEngine:
    def __init__(self, specs_path: Optional[Path] = None, sops_path: Optional[Path] = None):
        base_dir = Path(__file__).resolve().parent.parent
        self.specs_path = specs_path or (base_dir / "baselines" / "golden_run_specs.json")
        self.sops_path = sops_path or (base_dir / "sops" / "maintenance_sops.json")
        
        self.golden_specs = self._load_json(self.specs_path)
        self.sops = self._load_json(self.sops_path)

    @staticmethod
    def _load_json(path: Path) -> Any:
        if not path.exists():
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def evaluate_telemetry(self, telemetry: MultimodalTelemetrySnapshot) -> List[EvidenceItem]:
        """
        Compares live telemetry snapshot against Golden Run specifications.
        Returns a list of structured EvidenceItem objects.
        """
        evidence: List[EvidenceItem] = []
        counter = 1

        # 1. Joint-level checks (Torque, Temperature, Current)
        joint_specs = self.golden_specs.get("joints", {})
        for j_key, j_data in telemetry.joints.items():
            specs = joint_specs.get(j_key)
            if not specs:
                continue

            # A. Temperature Check
            if j_data.temp_c >= specs.get("max_temp_c", 65.0):
                dev_pct = ((j_data.temp_c - specs["max_temp_c"]) / specs["max_temp_c"]) * 100
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source=f"{specs.get('name', j_key)} Thermal Sensor",
                    observation=f"Temperature reached {j_data.temp_c:.1f}°C, exceeding max allowable limit of {specs['max_temp_c']}°C",
                    is_abnormal=True,
                    severity="CRITICAL",
                    deviation_percent=round(dev_pct, 1),
                    golden_baseline_reference=f"Nominal: < {specs.get('warning_temp_c', 55.0)}°C (Max: {specs['max_temp_c']}°C)"
                ))
                counter += 1
            elif j_data.temp_c >= specs.get("warning_temp_c", 55.0):
                dev_pct = ((j_data.temp_c - specs["warning_temp_c"]) / specs["warning_temp_c"]) * 100
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source=f"{specs.get('name', j_key)} Thermal Sensor",
                    observation=f"Temperature elevated at {j_data.temp_c:.1f}°C, exceeding warning threshold of {specs['warning_temp_c']}°C",
                    is_abnormal=True,
                    severity="MODERATE",
                    deviation_percent=round(dev_pct, 1),
                    golden_baseline_reference=f"Warning: {specs['warning_temp_c']}°C"
                ))
                counter += 1

            # B. Torque Overload Check
            if j_data.torque_nm > specs.get("max_torque_nm", 300.0):
                dev_pct = ((j_data.torque_nm - specs["max_torque_nm"]) / specs["max_torque_nm"]) * 100
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source=f"{specs.get('name', j_key)} Torque Transducer",
                    observation=f"Torque spiked to {j_data.torque_nm:.1f} Nm, exceeding limit of {specs['max_torque_nm']} Nm",
                    is_abnormal=True,
                    severity="CRITICAL",
                    deviation_percent=round(dev_pct, 1),
                    golden_baseline_reference=f"Max Limit: {specs['max_torque_nm']} Nm"
                ))
                counter += 1

            # C. Motor Current Check
            if j_data.motor_current_a > specs.get("max_current_a", 6.0):
                dev_pct = ((j_data.motor_current_a - specs["max_current_a"]) / specs["max_current_a"]) * 100
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source=f"{specs.get('name', j_key)} Servo Inverter",
                    observation=f"Motor current draw spiked to {j_data.motor_current_a:.2f} A (Max: {specs['max_current_a']} A)",
                    is_abnormal=True,
                    severity="CRITICAL",
                    deviation_percent=round(dev_pct, 1),
                    golden_baseline_reference=f"Nominal: {specs.get('nominal_current_a', 3.0)} A"
                ))
                counter += 1

        # 2. Electrical Power Grid Check
        elec_specs = self.golden_specs.get("electrical", {})
        if telemetry.line_voltage_v < elec_specs.get("min_allowed_voltage_v", 380.0):
            dev_pct = ((telemetry.line_voltage_v - elec_specs["nominal_line_voltage_v"]) / elec_specs["nominal_line_voltage_v"]) * 100
            evidence.append(EvidenceItem(
                evidence_id=f"EVD-{counter:03d}",
                source="Main 3-Phase Power Monitor",
                observation=f"Line voltage dropped to {telemetry.line_voltage_v:.1f}V RMS (Undervoltage Sag)",
                is_abnormal=True,
                severity="CRITICAL",
                deviation_percent=round(dev_pct, 1),
                golden_baseline_reference=f"Nominal: 400V ± 5% (Min: {elec_specs.get('min_allowed_voltage_v', 380)}V)"
            ))
            counter += 1

        # 3. Pneumatic Pressure Check
        pneu_specs = self.golden_specs.get("pneumatic", {})
        if telemetry.pneumatic_pressure_bar < pneu_specs.get("min_allowed_pressure_bar", 5.5):
            dev_pct = ((telemetry.pneumatic_pressure_bar - pneu_specs["nominal_pressure_bar"]) / pneu_specs["nominal_pressure_bar"]) * 100
            evidence.append(EvidenceItem(
                evidence_id=f"EVD-{counter:03d}",
                source="Pneumatic Gripper Supply Sensor",
                observation=f"Pneumatic pressure dropped to {telemetry.pneumatic_pressure_bar:.2f} bar (Insufficient Clamping Force)",
                is_abnormal=True,
                severity="CRITICAL",
                deviation_percent=round(dev_pct, 1),
                golden_baseline_reference=f"Nominal: {pneu_specs.get('nominal_pressure_bar', 6.2)} bar (Min: {pneu_specs.get('min_allowed_pressure_bar', 5.5)} bar)"
            ))
            counter += 1

        # 4. Conveyor Telemetry Checks (Michelin Infeed / Outfeed Belt)
        if telemetry.conveyor:
            c_specs = self.golden_specs.get("conveyor", {})
            conv = telemetry.conveyor
            min_speed = c_specs.get("min_belt_speed_mps", 0.35)
            min_tension = c_specs.get("min_tension_n", 240.0)

            if conv.belt_speed_mps < min_speed:
                dev_pct = ((conv.belt_speed_mps - c_specs.get("nominal_belt_speed_mps", 0.5)) / c_specs.get("nominal_belt_speed_mps", 0.5)) * 100
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source="Infeed Conveyor VFD Speed Encoder",
                    observation=f"Conveyor belt speed slowed to {conv.belt_speed_mps:.2f} m/s (Belt slippage detected)",
                    is_abnormal=True,
                    severity="HIGH",
                    deviation_percent=round(dev_pct, 1),
                    golden_baseline_reference=f"Nominal: {c_specs.get('nominal_belt_speed_mps', 0.5)} m/s (Min: {min_speed} m/s)"
                ))
                counter += 1

            if conv.belt_tension_n < min_tension:
                dev_pct = ((conv.belt_tension_n - c_specs.get("nominal_tension_n", 320.0)) / c_specs.get("nominal_tension_n", 320.0)) * 100
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source="Conveyor Tension Load Cell",
                    observation=f"Conveyor belt tension dropped to {conv.belt_tension_n:.1f} N (Slack belt)",
                    is_abnormal=True,
                    severity="HIGH",
                    deviation_percent=round(dev_pct, 1),
                    golden_baseline_reference=f"Nominal: {c_specs.get('nominal_tension_n', 320.0)} N"
                ))
                counter += 1

        # 5. Bead Lubrication System Checks
        if telemetry.bead_lubrication:
            l_specs = self.golden_specs.get("bead_lubrication", {})
            lube = telemetry.bead_lubrication
            min_p = l_specs.get("min_pressure_bar", 2.5)
            min_flow = l_specs.get("min_flow_rate_lpm", 0.30)

            if lube.nozzle_pressure_bar < min_p or lube.nozzle_clog_detected or lube.lube_flow_rate_lpm < min_flow:
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source="Bead Lubrication Atomizer Nozzle Sensor",
                    observation=f"Lubrication delivery anomaly: Nozzle pressure {lube.nozzle_pressure_bar:.2f} bar, flow rate {lube.lube_flow_rate_lpm:.2f} LPM (Clog detected: {lube.nozzle_clog_detected})",
                    is_abnormal=True,
                    severity="CRITICAL",
                    deviation_percent=round(((lube.nozzle_pressure_bar - l_specs.get("nominal_pressure_bar", 3.5)) / l_specs.get("nominal_pressure_bar", 3.5)) * 100, 1),
                    golden_baseline_reference=f"Nominal: {l_specs.get('nominal_pressure_bar', 3.5)} bar (Min: {min_p} bar, Flow: > {min_flow} LPM)"
                ))
                counter += 1

        # 6. Acoustic Spectrum Check
        ac_specs = self.golden_specs.get("acoustic", {})
        bearing_band = ac_specs.get("bearing_fault_frequency_band_hz", [2200, 3500])
        hiss_band = ac_specs.get("pneumatic_hiss_band_hz", [4500, 7000])

        for acoustic in telemetry.acoustic_anomalies:
            if bearing_band[0] <= acoustic.frequency_hz <= bearing_band[1]:
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source="Acoustic FFT Hydrophone/Microphone",
                    observation=f"Mechanical friction harmonic peak at {acoustic.frequency_hz:.0f} Hz ({acoustic.magnitude_db:.1f} dB)",
                    is_abnormal=True,
                    severity="HIGH" if acoustic.magnitude_db > 80 else "MODERATE",
                    deviation_percent=None,
                    golden_baseline_reference=f"Nominal harmonics: {ac_specs.get('nominal_harmonics_hz', [120, 240])} Hz"
                ))
                counter += 1
            elif hiss_band[0] <= acoustic.frequency_hz <= hiss_band[1]:
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source="Ultrasonic Acoustic Leak Sensor",
                    observation=f"High-frequency pneumatic air escape hiss at {acoustic.frequency_hz:.0f} Hz ({acoustic.magnitude_db:.1f} dB)",
                    is_abnormal=True,
                    severity="MODERATE",
                    deviation_percent=None,
                    golden_baseline_reference="Absence of ultrasonic hiss (> 4500 Hz)"
                ))
                counter += 1

        # 7. Tire Fitment Quality Metrics
        if telemetry.tire_fitment:
            fit_specs = self.golden_specs.get("tire_fitment", {})
            tf = telemetry.tire_fitment

            if tf.bead_seating_offset_mm > fit_specs.get("max_radial_offset_mm", 0.8):
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source="Tire Bead Laser Alignment Gauge",
                    observation=f"Bead seating radial offset is {tf.bead_seating_offset_mm:.2f} mm (Exceeds tolerance)",
                    is_abnormal=True,
                    severity="CRITICAL",
                    deviation_percent=round(((tf.bead_seating_offset_mm - fit_specs['max_radial_offset_mm']) / fit_specs['max_radial_offset_mm']) * 100, 1),
                    golden_baseline_reference=f"Max Allowed Offset: ± {fit_specs.get('max_radial_offset_mm', 0.8)} mm"
                ))
                counter += 1

            if tf.angular_misalignment_deg > fit_specs.get("max_angular_deviation_deg", 0.35):
                evidence.append(EvidenceItem(
                    evidence_id=f"EVD-{counter:03d}",
                    source="End-Effector Orientation Sensor",
                    observation=f"Tire mounting angular deviation is {tf.angular_misalignment_deg:.2f}° (Misaligned)",
                    is_abnormal=True,
                    severity="HIGH",
                    deviation_percent=round(((tf.angular_misalignment_deg - fit_specs['max_angular_deviation_deg']) / fit_specs['max_angular_deviation_deg']) * 100, 1),
                    golden_baseline_reference=f"Max Allowed Angle Deviation: ± {fit_specs.get('max_angular_deviation_deg', 0.35)}°"
                ))
                counter += 1

        return evidence

    def match_sops(self, evidence_list: List[EvidenceItem]) -> List[Dict[str, Any]]:
        """
        Matches detected evidence against the maintenance SOP knowledge base.
        """
        matched_sops = []
        raw_text = " ".join([e.observation.lower() for e in evidence_list])
        # Normalize punctuation, hyphens, and underscores for token comparison
        evidence_tokens = set(re.findall(r"[a-z0-9]+", raw_text))

        for sop in self.sops:
            relevance_score = 0
            for symptom in sop.get("symptoms", []):
                symptom_tokens = [w for w in re.findall(r"[a-z0-9]+", symptom.lower()) if len(w) > 3]
                matched_keywords = [w for w in symptom_tokens if w in evidence_tokens]
                if matched_keywords:
                    relevance_score += len(matched_keywords)

            if relevance_score > 0:
                matched_sops.append({
                    "sop_id": sop["id"],
                    "title": sop["title"],
                    "component": sop["component"],
                    "causal_mechanism": sop["causal_mechanism"],
                    "corrective_actions": sop["corrective_actions"],
                    "relevance_score": relevance_score
                })

        # Sort by relevance
        matched_sops.sort(key=lambda x: x["reverter_score"] if "reverter_score" in x else x["relevance_score"], reverse=True)
        return matched_sops
