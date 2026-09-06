/**
 * Grounded Machinery Projects & Incident Scenarios for ReliAI
 * Binds each physical manufacturing cell to its EtherCAT node, sensor baselines, and empirical audit data.
 */

export const MACHINERY_PROJECTS = [
  {
    id: "KR-210-R2700",
    name: "KUKA KR-210 R2700",
    brand: "KUKA",
    modelCode: "KR-210-2",
    nodeId: "HARNESS-A4",
    cellLocation: "Cell 04 • Heavy Handling",
    scenarioId: "SCENARIO-01-THERMAL-OVERHEAT",
    incidentTitle: "Joint 3 Harmonic Drive Lubricant Breakdown & Thermal Overheat",
    faultJoint: "Joint_3",
    domain: "THERMAL_OVERHEAT",
    stationId: "STATION-TIRE-FITTER-01",
    severity: "CRITICAL",
    isoStandard: "ISO 10218-1 / CSG-25-100",
    description: "Elbow axis joint 3 exhibits severe thermal runaway (82.4°C / peak 88.5°C) and torque saturation during descent motion, accompanied by 73.5 Hz 3X mechanical vibration harmonics.",
    snapshot: {
      timestamp: new Date().toISOString(),
      station_id: "STATION-TIRE-FITTER-01",
      joints: {
        Joint_1: { joint_name: "Base Turntable", angle_deg: 45.0, velocity_deg_s: 15.0, torque_nm: 130.0, temp_c: 44.0, motor_current_a: 2.9 },
        Joint_2: { joint_name: "Shoulder Pitch", angle_deg: 35.0, velocity_deg_s: 8.0, torque_nm: 260.0, temp_c: 51.0, motor_current_a: 4.1 },
        Joint_3: { joint_name: "Elbow Pitch", angle_deg: 85.0, velocity_deg_s: 4.5, torque_nm: 345.0, temp_c: 82.4, motor_current_a: 7.8 },
        Joint_4: { joint_name: "Wrist Roll", angle_deg: 12.0, velocity_deg_s: 10.0, torque_nm: 65.0, temp_c: 49.0, motor_current_a: 1.5 },
        Joint_5: { joint_name: "Wrist Pitch", angle_deg: -20.0, velocity_deg_s: 12.0, torque_nm: 50.0, temp_c: 46.8, motor_current_a: 1.2 },
        Joint_6: { joint_name: "Tool Flange", angle_deg: 5.0, velocity_deg_s: 5.0, torque_nm: 30.0, temp_c: 43.5, motor_current_a: 0.9 }
      },
      line_voltage_v: 400.2,
      inverter_ripple_pct: 0.82
    },
    verifiedReport: {
      report_id: "RPT-KUKA-KR210-TH01",
      generated_at: new Date().toISOString(),
      incident_summary: {
        incident_id: "INC-KUKA-824",
        title: "KUKA KR-210 R2700: Joint 3 Harmonic Drive Lubricant Breakdown & Thermal Overheat",
        station_id: "STATION-TIRE-FITTER-01",
        severity: "CRITICAL",
        status: "CONCLUSIVE",
        domain: "THERMAL_OVERHEAT"
      },
      investigation_results: {
        status: "CONCLUSIVE",
        final_confidence_score: 98.6,
        primary_claim: "Empirical CAN bus thermal telemetry (82.4°C) and 73.5Hz 3X FFT harmonics confirm flexspline oil breakdown.",
        contradiction_detected: false
      },
      root_cause: {
        title: "Joint 3 Harmonic Drive Lubricant Breakdown & Flexspline Galling",
        description: "Elbow Joint 3 operating temperature reached 82.4°C against the ISO 10218-1 golden limit of 55°C. Combined with a 73.5 Hz 3X harmonic vibration resonance of 0.38g, empirical data confirms elastohydrodynamic oil film degradation under Harmonic Drive CSG-25-100 specification.",
        affected_component: "Joint_3_Harmonic_Drive",
        causal_chain: [
          "Flexspline Lubricant Starvation",
          "Micro-asperity Metal Friction",
          "73.5Hz 3X Harmonic Vibration Peak (0.38g)",
          "Thermal Runaway to 82.4°C (Limit: 55°C)",
          "Torque Saturation Throttling"
        ],
        cited_evidence_ids: ["EV-THERM-J3", "EV-FFT-73HZ", "EV-CAN-CURRENT"]
      },
      critic_findings: {
        adversarial_critique_passed: true,
        summary: "Critic Agent examined bus ripple (0.82%) to test stator phase short hypothesis. Nominal electrical current rules out stator short; physical acoustic & thermal coupling confirms mechanical friction."
      },
      evidence: [
        { id: "EV-THERM-J3", type: "TELEMETRY", title: "Joint 3 Thermal Elevation", value: "82.4°C", baseline: "< 55.0°C", status: "BREACH" },
        { id: "EV-FFT-73HZ", type: "VIBRATION_FFT", title: "3X Fundamental Harmonic", value: "0.38 g at 73.5 Hz", baseline: "< 0.10 g", status: "ALERT" },
        { id: "EV-CURRENT-J3", type: "CAN_BUS", title: "Motor Phase Current", value: "7.8 A", baseline: "3.5 A nominal", status: "ELEVATED" },
        { id: "EV-RIPPLE-INV", type: "ELECTRICAL", title: "Inverter DC Bus Ripple", value: "0.82%", baseline: "< 2.0%", status: "NORMAL" }
      ]
    }
  },
  {
    id: "ABB-IRB-6700",
    name: "ABB IRB 6700 PowerSpot",
    brand: "ABB",
    modelCode: "IRB 6700-205/2.80",
    nodeId: "HARNESS-C3",
    cellLocation: "Cell 03 • Spot-Welding & Clamping",
    scenarioId: "SCENARIO-02-PNEUMATIC-DROP",
    incidentTitle: "Pneumatic Solenoid Seal Leak & Incomplete Clamping Pressure",
    faultJoint: "Joint_4",
    domain: "PNEUMATIC_PRESSURE_DROP",
    stationId: "STATION-TIRE-FITTER-01",
    severity: "HIGH",
    isoStandard: "ISO 4414 / Festo MS6-LFR",
    description: "Gripper manifold supply pressure sags from 6.2 bar to 4.0 bar during clamping stroke, causing 1.8mm bead eccentricity and ultrasonic air leak hissing at 5.2kHz.",
    snapshot: {
      timestamp: new Date().toISOString(),
      station_id: "STATION-TIRE-FITTER-01",
      joints: {
        Joint_1: { joint_name: "Base Turntable", angle_deg: 10.0, velocity_deg_s: 0.0, torque_nm: 80.0, temp_c: 38.0, motor_current_a: 1.8 },
        Joint_2: { joint_name: "Shoulder Pitch", angle_deg: 25.0, velocity_deg_s: 0.0, torque_nm: 190.0, temp_c: 42.0, motor_current_a: 3.0 },
        Joint_3: { joint_name: "Elbow Pitch", angle_deg: 65.0, velocity_deg_s: 0.0, torque_nm: 140.0, temp_c: 41.0, motor_current_a: 2.5 },
        Joint_4: { joint_name: "Wrist Roll", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 45.0, temp_c: 35.0, motor_current_a: 1.0 },
        Joint_5: { joint_name: "Wrist Pitch", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 40.0, temp_c: 34.0, motor_current_a: 0.9 },
        Joint_6: { joint_name: "Tool Flange", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 30.0, temp_c: 33.0, motor_current_a: 0.7 }
      },
      line_voltage_v: 401.0,
      pneumatic_pressure_bar: 4.02
    },
    verifiedReport: {
      report_id: "RPT-ABB-IRB6700-PN02",
      generated_at: new Date().toISOString(),
      incident_summary: {
        incident_id: "INC-ABB-402",
        title: "ABB IRB 6700: Pneumatic Solenoid Seal Leak & Incomplete Clamping Pressure",
        station_id: "STATION-TIRE-FITTER-01",
        severity: "HIGH",
        status: "CONCLUSIVE",
        domain: "PNEUMATIC_PRESSURE_DROP"
      },
      investigation_results: {
        status: "CONCLUSIVE",
        final_confidence_score: 96.4,
        primary_claim: "Pneumatic regulator pressure drop (4.02 bar vs 6.2 bar nominal) verified via piezoelectric sensor bus.",
        contradiction_detected: false
      },
      root_cause: {
        title: "End-Effector Pneumatic Solenoid Valve O-Ring Extrusion",
        description: "Manifold supply pressure decayed rapidly to 4.02 bar under clamping duty cycle. Coupled with 5.2 kHz ultrasonic acoustic emission, evidence indicates high-cycle elastomeric seal extrusion on valve bank solenoid 2A.",
        affected_component: "Pneumatic_Gripper_Assembly",
        causal_chain: [
          "O-Ring Nitrile Seal Degradation",
          "Valve Port Blow-by & 5.2kHz Acoustic Leak",
          "Manifold Line Pressure Drop (4.02 bar)",
          "Clamp Cylinder Force Deficit (1800N -> 1150N)",
          "1.8mm Tire Bead Seating Eccentricity"
        ],
        cited_evidence_ids: ["EV-PNEU-BAR", "EV-ACOUSTIC-5KHZ", "EV-BEAD-OFFSET"]
      },
      critic_findings: {
        adversarial_critique_passed: true,
        summary: "Investigated whether motor current sag on Joint 4 caused clamp failure. Joint current was completely steady at 1.0A; pressure loss is purely pneumatic."
      },
      evidence: [
        { id: "EV-PNEU-BAR", type: "PRESSURE", title: "Gripper Manifold Pressure", value: "4.02 bar", baseline: "6.20 bar ± 0.3", status: "BREACH" },
        { id: "EV-ACOUSTIC-5KHZ", type: "ACOUSTIC", title: "Ultrasonic Leak Peak", value: "74 dB at 5.2 kHz", baseline: "< 30 dB", status: "ALERT" },
        { id: "EV-CLAMP-FORCE", type: "LOAD_CELL", title: "Jaw Clamping Force", value: "1,150 N", baseline: "1,800 N min", status: "DEFICIT" }
      ]
    }
  },
  {
    id: "FANUC-M900IB",
    name: "FANUC M-900iB/700 Ultra",
    brand: "FANUC",
    modelCode: "M-2000iA/700",
    nodeId: "HARNESS-D2",
    cellLocation: "Cell 02 • Heavy Ingot Foundry",
    scenarioId: "SCENARIO-03-CONTRADICTORY-FAULT",
    incidentTitle: "Thermocouple Wire Short vs Sensor Telemetry Contradiction",
    faultJoint: "Joint_3",
    domain: "CONTRADICTORY_SENSOR_FAULT",
    stationId: "STATION-TIRE-FITTER-01",
    severity: "MEDIUM",
    isoStandard: "IEC 60584 / Anti-Hallucination Gate",
    description: "Thermocouple reports an abrupt 92°C thermal spike, yet motor current is completely idle/nominal (3.1A) and acoustic baseline is silent (0 dB). Tests anti-hallucination refusal.",
    snapshot: {
      timestamp: new Date().toISOString(),
      station_id: "STATION-TIRE-FITTER-01",
      joints: {
        Joint_1: { joint_name: "Base Turntable", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 110.0, temp_c: 40.0, motor_current_a: 2.4 },
        Joint_2: { joint_name: "Shoulder Pitch", angle_deg: 30.0, velocity_deg_s: 0.0, torque_nm: 220.0, temp_c: 45.0, motor_current_a: 3.6 },
        Joint_3: { joint_name: "Elbow Pitch", angle_deg: 80.0, velocity_deg_s: 0.0, torque_nm: 190.0, temp_c: 92.0, motor_current_a: 3.1 },
        Joint_4: { joint_name: "Wrist Roll", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 50.0, temp_c: 38.0, motor_current_a: 1.2 },
        Joint_5: { joint_name: "Wrist Pitch", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 42.0, temp_c: 36.0, motor_current_a: 1.0 },
        Joint_6: { joint_name: "Tool Flange", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 25.0, temp_c: 34.0, motor_current_a: 0.8 }
      },
      line_voltage_v: 399.8,
      inverter_ripple_pct: 0.45
    },
    verifiedReport: {
      report_id: "RPT-FANUC-M900-CT03",
      generated_at: new Date().toISOString(),
      incident_summary: {
        incident_id: "INC-FANUC-903",
        title: "FANUC M-900iB: Thermocouple Wire Short & False Overheat Readout",
        station_id: "STATION-TIRE-FITTER-01",
        severity: "MEDIUM",
        status: "INCONCLUSIVE_CONTRADICTIONS",
        domain: "CONTRADICTORY_SENSOR_FAULT"
      },
      investigation_results: {
        status: "INCONCLUSIVE_CONTRADICTIONS",
        final_confidence_score: 94.2,
        primary_claim: "Anti-hallucination safety gate engaged. Thermal sensor reading (92°C) is physically impossible without motor current elevation.",
        contradiction_detected: true
      },
      root_cause: {
        title: "Thermocouple Signal Lead Ground Short (False Alarm)",
        description: "Joint 3 thermocouple spiked instantly to 92°C with 0ms thermal ramp. Motor current remained at baseline 3.1A, acoustic emission was silent (0 dB), and adjacent stator thermistor reads 41.5°C. Multi-agent critic refused hardware shutdown and flagged sensor harness short.",
        affected_component: "Thermal_Sensor_Telemetry",
        causal_chain: [
          "Cable Carrier Flex Fatigue",
          "K-Type Thermocouple Shield Breach",
          "Intermittent Ground Short causing Voltage Step",
          "ADC Conversion Artifact (Instant 92°C Spike)",
          "Adversarial Critic Cross-Examination Flagged Contradiction"
        ],
        cited_evidence_ids: ["EV-THERM-STEP", "EV-MOTOR-IDLE", "EV-ACOUSTIC-SILENT"]
      },
      critic_findings: {
        adversarial_critique_passed: true,
        summary: "Contradiction explicitly proven: Law of Thermodynamics prohibits 50°C thermal jump without energy dissipation. Critic vetoed thermal shutdown and dispatched harness inspection."
      },
      evidence: [
        { id: "EV-THERM-STEP", type: "TEMPERATURE", title: "Thermocouple J3 Readout", value: "92.0°C (Instant)", baseline: "41.5°C stator ref", status: "CONTRADICTION" },
        { id: "EV-MOTOR-IDLE", type: "ELECTRICAL", title: "Stator Motor Current", value: "3.1 A (Idle)", baseline: "3.0 A nominal", status: "NOMINAL" },
        { id: "EV-ACOUSTIC-SILENT", type: "VIBRATION", title: "Acoustic Spectrum", value: "0 dB elevation", baseline: "< 5 dB", status: "NORMAL" }
      ]
    }
  },
  {
    id: "KR-QUANTUM-300",
    name: "KUKA KR-QUANTUM 300",
    brand: "KUKA",
    modelCode: "KR-QUANTUM-300",
    nodeId: "HARNESS-B1",
    cellLocation: "Cell 01 • Fast Palletizing",
    scenarioId: "SCENARIO-04-VOLTAGE-SAG",
    incidentTitle: "3-Phase Power Undervoltage Sag & Synchronous Servo Drive Trip",
    faultJoint: "Joint_1",
    domain: "ELECTRICAL_POWER_SAG",
    stationId: "STATION-PALLETIZER-01",
    severity: "CRITICAL",
    isoStandard: "IEC 60204-1 / NFPA 79",
    description: "Grid voltage drops to 365V RMS under heavy plant transformer load, triggering synchronous multi-axis current surges and DC bus undervoltage emergency stop.",
    snapshot: {
      timestamp: new Date().toISOString(),
      station_id: "STATION-PALLETIZER-01",
      joints: {
        Joint_1: { joint_name: "Base Turntable", angle_deg: 90.0, velocity_deg_s: 25.0, torque_nm: 210.0, temp_c: 44.0, motor_current_a: 14.2 },
        Joint_2: { joint_name: "Shoulder Pitch", angle_deg: 40.0, velocity_deg_s: 18.0, torque_nm: 310.0, temp_c: 48.0, motor_current_a: 16.5 },
        Joint_3: { joint_name: "Elbow Pitch", angle_deg: 55.0, velocity_deg_s: 15.0, torque_nm: 280.0, temp_c: 47.0, motor_current_a: 15.1 },
        Joint_4: { joint_name: "Wrist Roll", angle_deg: 10.0, velocity_deg_s: 20.0, torque_nm: 85.0, temp_c: 41.0, motor_current_a: 5.2 },
        Joint_5: { joint_name: "Wrist Pitch", angle_deg: 0.0, velocity_deg_s: 15.0, torque_nm: 75.0, temp_c: 39.0, motor_current_a: 4.8 },
        Joint_6: { joint_name: "Tool Flange", angle_deg: 0.0, velocity_deg_s: 10.0, torque_nm: 45.0, temp_c: 36.0, motor_current_a: 3.1 }
      },
      line_voltage_v: 364.5,
      inverter_ripple_pct: 4.85
    },
    verifiedReport: {
      report_id: "RPT-KUKA-QUANTUM-VS04",
      generated_at: new Date().toISOString(),
      incident_summary: {
        incident_id: "INC-QUANTUM-365",
        title: "KUKA KR-QUANTUM: 3-Phase Power Undervoltage Sag & Servo Inverter Trip",
        station_id: "STATION-PALLETIZER-01",
        severity: "CRITICAL",
        status: "CONCLUSIVE",
        domain: "ELECTRICAL_POWER_SAG"
      },
      investigation_results: {
        status: "CONCLUSIVE",
        final_confidence_score: 99.2,
        primary_claim: "AC line supply dropped to 364.5V RMS (-17% breach of IEC 60204-1 specification), causing DC bus undervoltage trip.",
        contradiction_detected: false
      },
      root_cause: {
        title: "Plant Substation Transformer Tap Droop Under Peak Load",
        description: "3-Phase utility line voltage collapsed from nominal 440V to 364.5V RMS during synchronous multi-axis pallet acceleration. Stator currents surged to compensate, driving inverter DC bus ripple to 4.85% before triggering internal drive undervoltage protection.",
        affected_component: "Electrical_Power_Supply",
        causal_chain: [
          "Primary 11kV/440V Substation Sag",
          "Input Line Voltage Drop to 364.5V",
          "Drive Capacitor DC Bus Sags to 480VDC",
          "Synchronous Multi-Axis Current Surge (16.5A)",
          "IEC 60204-1 Undervoltage E-Stop Trip"
        ],
        cited_evidence_ids: ["EV-VOLT-LINE", "EV-RIPPLE-INV", "EV-CURR-SURGE"]
      },
      critic_findings: {
        adversarial_critique_passed: true,
        summary: "Investigated whether robot servo brake locked up. Telemetry confirms all 6 axes drew proportional surge simultaneously, proving external line grid fault rather than internal mechanical seizure."
      },
      evidence: [
        { id: "EV-VOLT-LINE", type: "ELECTRICAL", title: "3-Phase Line Voltage", value: "364.5 V RMS", baseline: "400V ± 10% (360V trip)", status: "BREACH" },
        { id: "EV-RIPPLE-INV", type: "ELECTRICAL", title: "Inverter DC Bus Ripple", value: "4.85%", baseline: "< 2.0%", status: "ALERT" },
        { id: "EV-CURR-SURGE", type: "CURRENT", title: "Joint 2 Stator Current", value: "16.5 A", baseline: "8.5 A nominal", status: "SURGE" }
      ]
    }
  },
  {
    id: "MICHELIN-CONVEYOR",
    name: "Michelin Conveyor Line 3",
    brand: "Michelin",
    modelCode: "MICH-CONV-L3",
    nodeId: "HARNESS-D4",
    cellLocation: "Cell 03 • Assembly & Infeed",
    scenarioId: "SCENARIO-05-MICHELIN-CONVEYOR-LUBE-FAIL",
    incidentTitle: "Bead Lube Nozzle Clog & Dry-Friction Seating Offset",
    faultJoint: "Joint_3",
    domain: "CONVEYOR_BEAD_LUBE",
    stationId: "MICHELIN-CLERMONT-LINE03-FITTER01",
    severity: "HIGH",
    isoStandard: "ISO 13849-1 / Michelin Q-Spec",
    description: "Infeed conveyor belt tension drop combined with automated spray nozzle clog leads to dry rubber-on-rim friction, excessive mounting torque, and 1.55mm laser bead seating offset.",
    snapshot: {
      timestamp: new Date().toISOString(),
      station_id: "MICHELIN-CLERMONT-LINE03-FITTER01",
      joints: {
        Joint_1: { joint_name: "Infeed Drive Roll", angle_deg: 0.0, velocity_deg_s: 30.0, torque_nm: 290.0, temp_c: 48.0, motor_current_a: 6.2 },
        Joint_2: { joint_name: "Tensioner Carriage", angle_deg: 15.0, velocity_deg_s: 0.0, torque_nm: 180.0, temp_c: 42.0, motor_current_a: 3.5 },
        Joint_3: { joint_name: "Mounting Arm Head", angle_deg: 45.0, velocity_deg_s: 8.0, torque_nm: 420.0, temp_c: 64.0, motor_current_a: 9.8 },
        Joint_4: { joint_name: "Rim Centering Indexer", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 120.0, temp_c: 39.0, motor_current_a: 2.4 },
        Joint_5: { joint_name: "Tire Bead Press Roll", angle_deg: 0.0, velocity_deg_s: 12.0, torque_nm: 310.0, temp_c: 55.0, motor_current_a: 7.1 },
        Joint_6: { joint_name: "Ejector Push Flange", angle_deg: 0.0, velocity_deg_s: 0.0, torque_nm: 50.0, temp_c: 35.0, motor_current_a: 1.1 }
      },
      line_voltage_v: 400.5,
      bead_lube_flow_ml_min: 12.4
    },
    verifiedReport: {
      report_id: "RPT-MICHELIN-CONV-BL05",
      generated_at: new Date().toISOString(),
      incident_summary: {
        incident_id: "INC-MICH-512",
        title: "Michelin Line 3: Bead Lube Nozzle Clog & Dry-Friction Seating Offset",
        station_id: "MICHELIN-CLERMONT-LINE03-FITTER01",
        severity: "HIGH",
        status: "CONCLUSIVE",
        domain: "CONVEYOR_BEAD_LUBE"
      },
      investigation_results: {
        status: "CONCLUSIVE",
        final_confidence_score: 97.4,
        primary_claim: "Bead lubricant delivery dropped to 12.4 ml/min (78% deficit against 55 ml/min specification).",
        contradiction_detected: false
      },
      root_cause: {
        title: "Automated Lube Spray Nozzle Tip Polymeric Coagulation",
        description: "Dry friction between green tire bead and wheel rim raised mounting torque to 420 Nm (limit: 250 Nm). Laser profile gauge measured 1.55mm axial bead seating runout. Flow meter verifies nozzle orifice blockage due to coagulated lubricant emulsion.",
        affected_component: "Lube_Delivery_Subsystem",
        causal_chain: [
          "Ambient Thermal Drying in Nozzle Orifice",
          "Lubricant Flow Restriction (12.4 ml/min vs 55 ml/min)",
          "Dry Rubber-on-Steel Friction Spike",
          "Mounting Head Torque Overload (420 Nm)",
          "1.55mm Laser Bead Seating Runout Rejection"
        ],
        cited_evidence_ids: ["EV-LUBE-FLOW", "EV-TORQUE-SPIKE", "EV-LASER-BEAD"]
      },
      critic_findings: {
        adversarial_critique_passed: true,
        summary: "Investigated whether tire carcass dimensional variance caused high mounting torque. RFID bead lot verification confirms rubber batch dimensions within golden tolerance. Failure is localized to lubrication delivery."
      },
      evidence: [
        { id: "EV-LUBE-FLOW", type: "FLOW", title: "Bead Lube Delivery Rate", value: "12.4 ml/min", baseline: "55.0 ml/min ± 5.0", status: "BREACH" },
        { id: "EV-TORQUE-SPIKE", type: "TORQUE", title: "Mounting Head Peak Torque", value: "420.0 Nm", baseline: "< 250.0 Nm", status: "OVERLOAD" },
        { id: "EV-LASER-BEAD", type: "LASER_METROLOGY", title: "Axial Bead Seating Runout", value: "1.55 mm", baseline: "< 0.50 mm", status: "DEFECT" }
      ]
    }
  }
];
