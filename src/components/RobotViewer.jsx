import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Eye, Flame, Activity, Zap } from 'lucide-react';

function RobotArmModel({ activeFaultJoint, jointsData, isLevitating = false }) {
  const { scene } = useGLTF('/roboticArm.glb');
  const robotRef = useRef();

  useEffect(() => {
    // Hide floor clutter / ground rails from raw CAD model
    const hideKeywords = ['mittel', 'ketten', 'zahrn', 'atraktor', 'guideline', 'transformation'];
    
    scene.traverse((child) => {
      const name = (child.name || '').toLowerCase();
      if (hideKeywords.some((kw) => name.includes(kw))) {
        child.visible = false;
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Apply dynamic fault glow to the affected joint or housing
        const isFaulty = activeFaultJoint && (
          name.includes(activeFaultJoint.toLowerCase()) ||
          (activeFaultJoint.includes('Joint_3') && (name.includes('joint3') || name.includes('elbow') || name.includes('arm_2') || name.includes('kuka_3')))
        );

        if (isFaulty) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#ef4444',
            emissive: '#dc2626',
            emissiveIntensity: 0.9,
            roughness: 0.25,
            metalness: 0.8
          });
        }
      }
    });
  }, [scene, activeFaultJoint]);

  useFrame((state) => {
    if (isLevitating && robotRef.current) {
      robotRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.04 - 0.45;
    }
  });

  return (
    <primitive
      ref={robotRef}
      object={scene}
      scale={1.2}
      position={[0, -0.5, 0]}
    />
  );
}

export default function RobotViewer({ activeFaultJoint = null, jointsData = {}, isLevitating = false }) {
  const [showWireframe, setShowWireframe] = useState(false);

  return (
    <div className="relative w-full h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* HUD Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>6-DOF KUKA KR-210 DIGITAL TWIN</span>
        </div>

        {activeFaultJoint && (
          <div className="flex items-center gap-1.5 bg-rose-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-rose-600/80 text-xs font-mono text-rose-300 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>FAULT: {activeFaultJoint} OVERHEAT</span>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [2.8, 2.2, 3.2], fov: 42 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.8} castShadow />
        <pointLight position={[-3, 2, -2]} color="#06b6d4" intensity={2} />
        {activeFaultJoint && (
          <pointLight position={[0, 1.2, 0]} color="#ef4444" intensity={4} distance={6} />
        )}

        <RobotArmModel
          activeFaultJoint={activeFaultJoint}
          jointsData={jointsData}
          isLevitating={isLevitating}
        />

        <ContactShadows position={[0, -0.51, 0]} opacity={0.65} scale={10} blur={2.2} />
        <OrbitControls enablePan={true} maxPolarAngle={Math.PI / 2 + 0.05} minDistance={1.5} maxDistance={7.0} />
        <Environment preset="city" />
      </Canvas>

      {/* Floating Joint Overlay Badges */}
      <div className="absolute bottom-3 left-3 right-3 z-10 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {["Joint_1", "Joint_2", "Joint_3", "Joint_4", "Joint_5", "Joint_6"].map((jKey, idx) => {
          const jData = jointsData[jKey];
          const isFault = activeFaultJoint && activeFaultJoint.toLowerCase().includes(jKey.toLowerCase());
          const isOverheat = jData && jData.temp_c > 65.0;

          return (
            <div
              key={jKey}
              className={`px-2 py-1.5 rounded-lg backdrop-blur-md border text-[11px] font-mono transition ${
                isFault || isOverheat
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>J{idx + 1}</span>
                {isOverheat && <Flame className="w-3 h-3 text-rose-400 animate-bounce" />}
              </div>
              <div className="font-semibold">{jData ? `${jData.temp_c.toFixed(1)}°C` : '42.0°C'}</div>
              <div className="text-[9px] text-slate-500">{jData ? `${jData.torque_nm.toFixed(0)} Nm` : '120 Nm'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

useGLTF.preload('/roboticArm.glb');

