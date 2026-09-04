import InvestigationPanel from "./components/InvestigationPanel";
import { analyzeIncident } from "./services/api";
import { mockIncident } from "./data/mockIncident";
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RobotViewer from './components/RobotViewer';
import TelemetryPanels from './components/TelemetryPanels';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [activeMode, setActiveMode] = useState('human-follow');
  const [isLevitating, setIsLevitating] = useState(true);
  const [isEStop, setIsEStop] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handleAnalyzeIncident = async () => {
    try {
      setAnalysisLoading(true);

      const result = await analyzeIncident(mockIncident);

      setAnalysis(result);
    } catch (error) {
      console.error('ReliAI investigation failed:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Joint Angles (Degrees) for the 6-DOF KUKA Arm
  const [jointAngles, setJointAngles] = useState({
    j1: 0.0,    // Base Yaw
    j2: 0.0,    // Shoulder Pitch
    j3: 0.0,    // Elbow / Ankle Pitch
    j4: 0.0,    // Wrist Roll
    j5: 0.0,    // Wrist Pitch
    j6: 0.0,    // Tool Flange
  });
  
  const controlsRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Reset 3D Camera View to default perspective
  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Trajectory & Calibrate Animation Loop
  useEffect(() => {
    if (isEStop || activeMode === 'manual' || activeMode === 'human-follow') return;

    let frameId;
    let startTime = Date.now();

    const animateJoints = () => {
      const elapsed = (Date.now() - startTime) / 1000;

      if (activeMode === 'trajectory') {
        // Pre-computed kinematic trajectory spline
        setJointAngles({
          j1: Math.sin(elapsed * 1.5) * 45,
          j2: -25 + Math.sin(elapsed * 1.2) * 20,
          j3: 35 + Math.cos(elapsed * 1.4) * 25,
          j4: Math.sin(elapsed * 2.0) * 60,
          j5: -15 + Math.sin(elapsed * 1.8) * 30,
          j6: Math.cos(elapsed * 2.5) * 90,
        });
      } else if (activeMode === 'calibrate') {
        // Smooth homing to zero position
        setJointAngles((prev) => ({
          j1: prev.j1 * 0.92,
          j2: prev.j2 * 0.92,
          j3: prev.j3 * 0.92,
          j4: prev.j4 * 0.92,
          j5: prev.j5 * 0.92,
          j6: prev.j6 * 0.92,
        }));
      }

      frameId = requestAnimationFrame(animateJoints);
    };

    frameId = requestAnimationFrame(animateJoints);
    return () => cancelAnimationFrame(frameId);
  }, [activeMode, isEStop]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Navigation Header */}
      <Header
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        isEStop={isEStop}
        setIsEStop={setIsEStop}
        onResetView={handleResetView}
        isLevitating={isLevitating}
        setIsLevitating={setIsLevitating}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar Diagnostics & Controls */}
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          jointAngles={jointAngles}
          setJointAngles={setJointAngles}
        />

        {/* Central 3D Viewport with Modular Telemetry Overlays */}
        <main className="flex-1 relative bg-[#050811] overflow-hidden">
          {/* Emergency Stop Lockout Overlay */}
          {isEStop && (
            <div className="absolute inset-0 bg-red-950/70 backdrop-blur-md z-40 flex flex-col items-center justify-center space-y-4 text-center p-6 animate-pulse">
              <div className="p-4 rounded-full bg-red-600/30 border-2 border-red-500 glow-rose">
                <ShieldAlert className="w-16 h-16 text-red-400" />
              </div>
              <h2 className="text-3xl font-black font-mono tracking-widest text-white uppercase">
                EMERGENCY STOP ENGAGED
              </h2>
              <p className="text-sm font-mono text-red-200 max-w-md">
                Hardware motor power rails disengaged. All actuators locked in mechanical brake state.
              </p>
              <button
                onClick={() => setIsEStop(false)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg border border-red-400 transition-all cursor-pointer shadow-lg glow-rose"
              >
                Clear Safety Interlock & Resume
              </button>
            </div>
          )}

          {/* 3D Robot Viewer Canvas */}
          <RobotViewer
            jointAngles={jointAngles}
            setJointAngles={setJointAngles}
            activeMode={activeMode}
            isLevitating={isLevitating}
            controlsRef={controlsRef}
            mousePositionRef={mousePositionRef}
          />

          {/* Modular Telemetry Panels Overlay */}
          <TelemetryPanels
            jointAngles={jointAngles}
            setJointAngles={setJointAngles}
            activeMode={activeMode}
            isLevitating={isLevitating}
            isEStop={isEStop}
          />

          <InvestigationPanel
            analysis={analysis}
            loading={analysisLoading}
            onAnalyze={handleAnalyzeIncident}
          />
        </main>
      </div>
    </div>
  );
  
}




