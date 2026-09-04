export const mockIncident = {
  machine_id: "robot_arm_01",
  incident_type: "tire_orientation_anomaly",

  telemetry: {
    temperature: 58.4,
    voltage: 238.2,
    motor_current: 14.7,
    vibration: 3.2
  },

  vision: {
    orientation_error: 8.2
  },

  audio: {
    anomaly_detected: true
  }
};
