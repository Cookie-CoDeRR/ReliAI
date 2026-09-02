import React, { useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Float, 
  useGLTF, 
  Environment,
  Html,
  Ring
} from '@react-three/drei';
import * as THREE from 'three';

// Futuristic Electromagnetic Levitation Plinth Base with zero depth-fighting
function LevitationPlinth({ isLevitating }) {
  const ringRef1 = useRef();
  const ringRef2 = useRef();
  const ringRef3 = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef1.current) ringRef1.current.rotation.z = t * 0.4;
    if (ringRef2.current) ringRef2.current.rotation.z = -t * 0.65;
    if (ringRef3.current) {
      ringRef3.current.scale.setScalar(1 + Math.sin(t * 3.2) * 0.03);
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Heavy Circular Plinth Base Rim */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.9, 0.35, 64]} />
        <meshStandardMaterial 
          color="#0b1120" 
          roughness={0.25} 
          metalness={0.9} 
        />
      </mesh>

      {/* Internal Core Platform */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.05, 64]} />
        <meshStandardMaterial 
          color="#030712" 
          roughness={0.35} 
          metalness={0.95} 
        />
      </mesh>

      {/* Outer Cyan Glowing Emitter Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.95, 2.15, 64]} />
        <meshBasicMaterial 
          color="#06b6d4" 
          side={THREE.DoubleSide} 
          transparent 
          depthWrite={false}
          opacity={isLevitating ? 0.9 : 0.25} 
        />
      </mesh>

      {/* Rotating Cyber Pattern Ring 1 */}
      <group ref={ringRef1} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Ring args={[1.5, 1.68, 64, 1, 0, Math.PI * 1.6]}>
          <meshBasicMaterial 
            color="#38bdf8" 
            side={THREE.DoubleSide} 
            transparent 
            depthWrite={false}
            opacity={isLevitating ? 0.95 : 0.25} 
          />
        </Ring>
      </group>

      {/* Rotating Cyber Pattern Ring 2 */}
      <group ref={ringRef2} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Ring args={[1.05, 1.25, 48, 1, 0, Math.PI * 1.3]}>
          <meshBasicMaterial 
            color="#0ea5e9" 
            side={THREE.DoubleSide} 
            transparent 
            depthWrite={false}
            opacity={isLevitating ? 0.85 : 0.2} 
          />
        </Ring>
      </group>

      {/* Pulsing Core Induction Coil */}
      <group ref={ringRef3} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Ring args={[0.25, 0.7, 64]}>
          <meshBasicMaterial 
            color="#22d3ee" 
            side={THREE.DoubleSide} 
            transparent 
            depthWrite={false}
            opacity={isLevitating ? 0.85 : 0.3} 
          />
        </Ring>
      </group>

      {/* Upward Volumetric Levitation Field Light */}
      {isLevitating && (
        <pointLight 
          position={[0, 0.6, 0]} 
          color="#06b6d4" 
          intensity={4.5} 
          distance={5} 
        />
      )}
    </group>
  );
}

// Rigged KUKA GLB Model Component with Armature Data and Dynamic Kinematics
function LoadedKukaModel({ mousePositionRef, activeMode, jointAngles, setJointAngles, isLevitating }) {
  const { scene, nodes } = useGLTF('/kuka_robot.glb');

  // Store rest quaternions to prevent gimbal lock flips
  const restQuats = useRef({});

  // Dynamic smoothed angles ref for smooth spring-inertia kinematics
  const currentJoints = useRef({
    baseYaw: 0,
    shoulderPitch: 0,
    elbowPitch: 0,
    wristPitch: 0,
    wristRoll: 0,
  });

  // On mount: Dynamically center the robot turntable at origin (0, 0, 0) and hide linear track
  useEffect(() => {
    // 1. Hide ground rail track and transformation gizmos first
    const hideKeywords = ['mittel', 'ketten', 'zahrn', 'atraktor', 'guideline', 'transformation', 'bolt.046', 'bolt.047', 'bolt.048', 'bolt.049', 'bolt.050'];
    scene.traverse((child) => {
      const name = (child.name || '').toLowerCase();
      if (hideKeywords.some((kw) => name.includes(kw))) {
        child.visible = false;
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 1.2;
        }
      }
    });

    // 2. Reset scene matrix and dynamically calculate exact offset to center waistjoint1 / Base
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const baseTurntable = scene.getObjectByName('waistjoint1') || scene.getObjectByName('Base') || scene.children[0];
    if (baseTurntable) {
      const worldPos = new THREE.Vector3();
      baseTurntable.getWorldPosition(worldPos);
      // Offset so the base turntable is centered at (0, 0.15, 0)
      scene.position.set(-worldPos.x, -worldPos.y + 0.15, -worldPos.z);
    } else {
      // Fallback exact measured offset from GLTF analysis
      scene.position.set(3.48996, -0.7696, 3.78228);
    }

    // 3. Capture rest quaternions
    if (nodes.shoulderjoint) restQuats.current.shoulder = nodes.shoulderjoint.quaternion.clone();
    if (nodes.anklejoint1) restQuats.current.ankle1 = nodes.anklejoint1.quaternion.clone();
    if (nodes.anklejoint2) restQuats.current.ankle2 = nodes.anklejoint2.quaternion.clone();
    if (nodes.wristjoint1) restQuats.current.wrist1 = nodes.wristjoint1.quaternion.clone();
    if (nodes.wristjoint2) restQuats.current.wrist2 = nodes.wristjoint2.quaternion.clone();
  }, [scene, nodes]);

  useFrame(({ clock }) => {
    if (!nodes) return;

    const t = clock.getElapsedTime();

    if (activeMode === 'human-follow' && mousePositionRef?.current) {
      const { x, y } = mousePositionRef.current;

      // --- DYNAMIC MULTI-JOINT KINEMATICS MAPPING ---
      // 1. Base Yaw Joint (Sweep left/right following mouse X, smooth damping)
      const targetBaseYaw = x * 1.6; // ±90° range
      currentJoints.current.baseYaw = THREE.MathUtils.lerp(
        currentJoints.current.baseYaw,
        targetBaseYaw,
        0.065
      );

      // 2. Shoulder Pitch Joint (Reach forward/back with mouse Y)
      const targetShoulder = -y * 0.65;
      currentJoints.current.shoulderPitch = THREE.MathUtils.lerp(
        currentJoints.current.shoulderPitch,
        targetShoulder,
        0.075
      );

      // 3. Elbow / Ankle Joints (Dynamic articulation in harmony with shoulder)
      const targetElbow = y * 0.55 - 0.15;
      currentJoints.current.elbowPitch = THREE.MathUtils.lerp(
        currentJoints.current.elbowPitch,
        targetElbow,
        0.075
      );

      // 4. Wrist Joints (Dexterous pitch/roll following target)
      const targetWristPitch = -y * 0.45 - currentJoints.current.elbowPitch * 0.3;
      const targetWristRoll = x * 0.55;
      currentJoints.current.wristPitch = THREE.MathUtils.lerp(
        currentJoints.current.wristPitch,
        targetWristPitch,
        0.1
      );
      currentJoints.current.wristRoll = THREE.MathUtils.lerp(
        currentJoints.current.wristRoll,
        targetWristRoll,
        0.1
      );

      // --- APPLY ROTATIONS CLEANLY RELATIVE TO REST POSE ---
      // A. Base Yaw on waistjoint1 (rotates entire arm around Y axis)
      if (nodes.waistjoint1) {
        nodes.waistjoint1.rotation.y = currentJoints.current.baseYaw;
      }

      // B. Shoulder Pitch (Local X axis)
      if (nodes.shoulderjoint && restQuats.current.shoulder) {
        const qPitch = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          currentJoints.current.shoulderPitch
        );
        nodes.shoulderjoint.quaternion.copy(restQuats.current.shoulder).multiply(qPitch);
      }

      // C. Elbow Pitch (Local X axis on anklejoint1 & anklejoint2)
      if (nodes.anklejoint1 && restQuats.current.ankle1) {
        const qElbow1 = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          currentJoints.current.elbowPitch
        );
        nodes.anklejoint1.quaternion.copy(restQuats.current.ankle1).multiply(qElbow1);
      }
      if (nodes.anklejoint2 && restQuats.current.ankle2) {
        const qElbow2 = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          -currentJoints.current.elbowPitch * 0.4
        );
        nodes.anklejoint2.quaternion.copy(restQuats.current.ankle2).multiply(qElbow2);
      }

      // D. Wrist Articulation (wristjoint1 roll, wristjoint2 pitch)
      if (nodes.wristjoint1 && restQuats.current.wrist1) {
        const qW1 = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          currentJoints.current.wristRoll
        );
        nodes.wristjoint1.quaternion.copy(restQuats.current.wrist1).multiply(qW1);
      }
      if (nodes.wristjoint2 && restQuats.current.wrist2) {
        const qW2 = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          currentJoints.current.wristPitch
        );
        nodes.wristjoint2.quaternion.copy(restQuats.current.wrist2).multiply(qW2);
      }

      // Stream computed joint angles to UI state
      setJointAngles({
        j1: (currentJoints.current.baseYaw * 180) / Math.PI,
        j2: (currentJoints.current.shoulderPitch * 180) / Math.PI,
        j3: (currentJoints.current.elbowPitch * 180) / Math.PI,
        j4: (currentJoints.current.wristRoll * 180) / Math.PI,
        j5: (currentJoints.current.wristPitch * 180) / Math.PI,
        j6: ((t * 25) % 360) - 180,
      });

    } else if (activeMode === 'manual') {
      const j1Rad = (jointAngles.j1 * Math.PI) / 180;
      const j2Rad = (jointAngles.j2 * Math.PI) / 180;
      const j3Rad = (jointAngles.j3 * Math.PI) / 180;
      const j4Rad = (jointAngles.j4 * Math.PI) / 180;
      const j5Rad = (jointAngles.j5 * Math.PI) / 180;

      if (nodes.waistjoint1) nodes.waistjoint1.rotation.y = j1Rad;
      if (nodes.shoulderjoint && restQuats.current.shoulder) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), j2Rad);
        nodes.shoulderjoint.quaternion.copy(restQuats.current.shoulder).multiply(q);
      }
      if (nodes.anklejoint1 && restQuats.current.ankle1) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), j3Rad);
        nodes.anklejoint1.quaternion.copy(restQuats.current.ankle1).multiply(q);
      }
      if (nodes.wristjoint1 && restQuats.current.wrist1) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), j4Rad);
        nodes.wristjoint1.quaternion.copy(restQuats.current.wrist1).multiply(q);
      }
      if (nodes.wristjoint2 && restQuats.current.wrist2) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), j5Rad);
        nodes.wristjoint2.quaternion.copy(restQuats.current.wrist2).multiply(q);
      }

    } else if (activeMode === 'trajectory') {
      const j1Rad = (jointAngles.j1 * Math.PI) / 180;
      const j2Rad = (jointAngles.j2 * Math.PI) / 180;
      const j3Rad = (jointAngles.j3 * Math.PI) / 180;
      const j4Rad = (jointAngles.j4 * Math.PI) / 180;
      const j5Rad = (jointAngles.j5 * Math.PI) / 180;

      if (nodes.waistjoint1) nodes.waistjoint1.rotation.y = j1Rad;
      if (nodes.shoulderjoint && restQuats.current.shoulder) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), j2Rad);
        nodes.shoulderjoint.quaternion.copy(restQuats.current.shoulder).multiply(q);
      }
      if (nodes.anklejoint1 && restQuats.current.ankle1) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), j3Rad);
        nodes.anklejoint1.quaternion.copy(restQuats.current.ankle1).multiply(q);
      }
      if (nodes.wristjoint1 && restQuats.current.wrist1) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), j4Rad);
        nodes.wristjoint1.quaternion.copy(restQuats.current.wrist1).multiply(q);
      }
      if (nodes.wristjoint2 && restQuats.current.wrist2) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), j5Rad);
        nodes.wristjoint2.quaternion.copy(restQuats.current.wrist2).multiply(q);
      }
    }
  });

  return isLevitating ? (
    <Float 
      speed={2.2} 
      rotationIntensity={0.08} 
      floatIntensity={0.3} 
      floatingRange={[0.12, 0.35]}
    >
      <group position={[0, 0, 0]}>
        <primitive object={scene} scale={[0.75, 0.75, 0.75]} />
      </group>
    </Float>
  ) : (
    <group position={[0, 0, 0]}>
      <primitive object={scene} scale={[0.75, 0.75, 0.75]} />
    </group>
  );
}

// Fallback procedural robot preview during GLTF loading
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 glow-cyan font-mono text-xs text-cyan-300 backdrop-blur-md space-y-2">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span>CALIBRATING KUKA KR210 ARMATURE...</span>
      </div>
    </Html>
  );
}

export default function RobotViewer({ 
  jointAngles, 
  setJointAngles,
  activeMode,
  isLevitating = true,
  controlsRef,
  mousePositionRef
}) {
  return (
    <div 
      className="relative w-full h-full bg-[#050811] overflow-hidden select-none cursor-crosshair"
      onMouseMove={(e) => {
        if (!mousePositionRef) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mousePositionRef.current = {
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
        };
      }}
    >
      {/* 3D R3F Canvas */}
      <Canvas
        shadows
        camera={{ position: [3.4, 2.6, 3.8], fov: 42 }}
        className="w-full h-full"
      >
        <color attach="background" args={['#050811']} />
        <fog attach="fog" args={['#050811', 9, 22]} />

        {/* Studio Ambient & Directional Lighting */}
        <ambientLight intensity={0.7} color="#e0f2fe" />
        
        {/* Main Overhead Key Light */}
        <directionalLight
          position={[5, 10, 6]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          color="#ffffff"
        />

        {/* Orange Accent Rim Light */}
        <directionalLight
          position={[-6, 4, -4]}
          intensity={1.5}
          color="#f97316"
        />

        {/* Cyan Ambient Fill */}
        <directionalLight
          position={[0, -2, 4]}
          intensity={0.7}
          color="#06b6d4"
        />

        {/* 3D Scene Elements */}
        <group position={[0, -0.4, 0]}>
          {/* Antigravity Levitation Plinth Base */}
          <LevitationPlinth isLevitating={isLevitating} />

          {/* GLB Model Loader with Centered Position & Kinematics */}
          <Suspense fallback={<LoadingFallback />}>
            <LoadedKukaModel
              mousePositionRef={mousePositionRef}
              activeMode={activeMode}
              jointAngles={jointAngles}
              setJointAngles={setJointAngles}
              isLevitating={isLevitating}
            />
          </Suspense>

          {/* Spatial Grid Floor */}
          <Grid
            position={[0, -0.19, 0]}
            args={[22, 22]}
            cellSize={0.5}
            cellThickness={1}
            cellColor="#0284c7"
            sectionSize={2.5}
            sectionThickness={1.5}
            sectionColor="#38bdf8"
            fadeDistance={14}
            fadeStrength={1.2}
          />
        </group>

        {/* Environment preset for realistic PBR metallic reflections */}
        <Environment preset="city" />

        {/* Camera Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={2.0}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 0.8, 0]}
        />
      </Canvas>

      {/* Floating Canvas Watermark HUD */}
      <div className="absolute top-4 left-4 pointer-events-none z-10 flex items-center space-x-2 font-mono text-[10px] text-cyan-400/80 bg-slate-950/70 border border-cyan-500/20 px-2.5 py-1 rounded backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>ARMATURE: KUKA KR210 // 6-AXIS DYNAMIC KINEMATICS</span>
      </div>

      {/* Clean Bottom-Centered Interactive Hint Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 font-mono text-[10px] text-slate-300 bg-slate-950/85 border border-cyan-500/30 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-2xl flex items-center space-x-2.5">
        <span className="text-cyan-400 font-semibold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>DYNAMIC TRACK:</span>
        </span>
        <span>Move cursor to guide arm</span>
        <span className="text-slate-600">|</span>
        <span>ORBIT: Left Drag</span>
        <span className="text-slate-600">|</span>
        <span>ZOOM: Scroll</span>
      </div>
    </div>
  );
}

// Preload the GLTF asset
useGLTF.preload('/kuka_robot.glb');
