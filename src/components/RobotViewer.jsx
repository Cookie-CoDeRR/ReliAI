import React, { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows
} from "@react-three/drei";
import * as THREE from "three";
import {
  Flame,
  Maximize2,
  ScanLine,
  Crosshair
} from "lucide-react";

function PreparedRobot({
  activeFaultJoint,
  isLevitating = false
}) {
  const { scene } = useGLTF("/roboticArm.glb");
  const groupRef = useRef();

  const prepared = useMemo(() => {
    const clone = scene.clone(true);

    const hideKeywords = [
      "mittel",
      "ketten",
      "zahrn",
      "atraktor",
      "guideline",
      "transformation",
      "orientation",
      "icon",
      "custom-bone",
      "stoper",
      "schine",
      "wagen",
      "plane.039",
      "plane.012"
    ];

    clone.traverse((child) => {
      const name = (child.name || "").trim();
      const nameLower = name.toLowerCase();

      // Specifically hide stray rail/track, dogbone, axis icon nodes, and unattached rail bolts/nuts
      if (
        hideKeywords.some((key) => nameLower.includes(key)) ||
        name === "Bolt" ||
        name === "Nut"
      ) {
        child.visible = false;
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material = child.material.clone();
        }

        const isFaulty =
          activeFaultJoint &&
          (
            nameLower.includes(activeFaultJoint.toLowerCase()) ||
            (
              activeFaultJoint.includes("Joint_3") &&
              (
                nameLower.includes("joint3") ||
                nameLower.includes("elbow") ||
                nameLower.includes("arm_2") ||
                nameLower.includes("kuka_3")
              )
            )
          );

        if (isFaulty) {
          child.material = new THREE.MeshStandardMaterial({
            color: "#fb7185",
            emissive: "#e11d48",
            emissiveIntensity: 1.15,
            roughness: 0.24,
            metalness: 0.72
          });
        }
      }
    });

    clone.updateMatrixWorld(true);

    const box = new THREE.Box3();

    clone.traverse((child) => {
      if (
        !child.visible ||
        !child.isMesh ||
        !child.geometry
      ) {
        return;
      }

      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }

      if (!child.geometry.boundingBox) return;

      const meshBox = child.geometry.boundingBox.clone();
      meshBox.applyMatrix4(child.matrixWorld);
      box.union(meshBox);
    });

    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.sub(center);

    return clone;
  }, [scene, activeFaultJoint]);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (isLevitating) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.04;
    } else {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={prepared} />
    </group>
  );
}

export default function RobotViewer({
  activeFaultJoint = null,
  jointsData = {},
  isLevitating = false,
  variant = "glass", // "glass" | "full"
  className = ""
}) {
  const isGlass = variant === "glass";

  return (
    <section className={`relative w-full h-full overflow-hidden ${
      isGlass 
        ? "bg-transparent " + className
        : "min-h-[500px] rounded-2xl border border-slate-800/90 bg-[#040913] shadow-2xl " + className
    }`}>

      {/* Ambient background for dark/full mode */}
      {!isGlass && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-500/[0.04] to-transparent" />
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-cyan-500/[0.035]" />
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-indigo-500/[0.04]" />
        </div>
      )}

      {/* HUD - Only in full mode (removed from clean glass render per user request) */}
      {!isGlass && (
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-3 pointer-events-none">
          <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono shadow-sm border border-cyan-500/25 bg-[#07111d]/90 backdrop-blur-xl text-cyan-300">
              <ScanLine className="w-3.5 h-3.5 text-[#d48a60]" />
              KUKA KR-210 / DIGITAL TWIN
            </div>

            {activeFaultJoint && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold shadow-sm border border-rose-500/35 bg-rose-950/70 backdrop-blur-xl text-rose-300">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                {activeFaultJoint} ANOMALY
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono border border-slate-800 bg-slate-950/75 text-slate-500">
              <Maximize2 className="w-3 h-3 text-[#d48a60]" />
              DRAG • ZOOM
            </div>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        dpr={[1, 1.5]}
        shadows
        camera={{
          position: [3.9, 1.65, 4.1],
          fov: 33,
          near: 0.1,
          far: 100
        }}
        gl={{
          alpha: true,
          powerPreference: "high-performance",
          antialias: true
        }}
      >
        <React.Suspense fallback={null}>
          <ambientLight intensity={isGlass ? 1.5 : 0.82} />

          <hemisphereLight
            intensity={isGlass ? 1.15 : 0.75}
            color={isGlass ? "#ffffff" : "#dbeafe"}
            groundColor={isGlass ? "#f6ede6" : "#07101c"}
          />

          <directionalLight
            position={[5, 8, 6]}
            intensity={isGlass ? 2.8 : 2.15}
            castShadow
          />

          <pointLight
            position={[-3, 2.5, -2]}
            color={isGlass ? "#fff0e0" : "#22d3ee"}
            intensity={isGlass ? 1.5 : 1.8}
          />

          <pointLight
            position={[3, 2, 2]}
            color={isGlass ? "#e8aa82" : "#6366f1"}
            intensity={isGlass ? 1.3 : 1.05}
          />

          {activeFaultJoint && (
            <pointLight
              position={[0.3, 1.3, 0]}
              color="#fb7185"
              intensity={5}
              distance={6}
            />
          )}

          <PreparedRobot
            activeFaultJoint={activeFaultJoint}
            isLevitating={isLevitating}
          />

          {/* Hide grid in clean glass mode */}
          {!isGlass && (
            <gridHelper
              args={[9, 24, "#183149", "#0b1726"]}
              position={[0, -1.075, 0]}
            />
          )}

          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={isGlass ? 0.22 : 0.38}
            scale={8}
            blur={2.4}
            far={5}
          />

          <OrbitControls
            makeDefault
            target={[0, 0, 0]}
            enableDamping
            dampingFactor={0.07}
            enablePan={false}
            minDistance={2.0}
            maxDistance={8.0}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.05}
          />

          <Environment preset={isGlass ? "apartment" : "city"} />
        </React.Suspense>
      </Canvas>

      {/* Joint telemetry dock (for full mode) */}
      {!isGlass && (
        <div className="absolute bottom-3 left-3 right-3 z-10 grid grid-cols-3 lg:grid-cols-6 gap-1.5">
          {[
            "Joint_1",
            "Joint_2",
            "Joint_3",
            "Joint_4",
            "Joint_5",
            "Joint_6"
          ].map((key, index) => {
            const data = jointsData[key];
            const isFault = activeFaultJoint?.toLowerCase().includes(key.toLowerCase());
            const isHot = data && Number(data.temp_c) > 65;

            return (
              <div
                key={key}
                className={`rounded-lg border px-2 py-1.5 backdrop-blur-xl transition ${
                  isFault || isHot
                    ? "border-rose-500/55 bg-rose-950/80 shadow-[0_0_18px_rgba(244,63,94,0.08)]"
                    : "border-slate-800 bg-[#07111d]/88"
                }`}
              >
                <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                  <span>J{index + 1}</span>
                  {(isFault || isHot) && <Flame className="w-2.5 h-2.5 text-rose-400" />}
                </div>
                <div className={`mt-0.5 text-[11px] font-mono font-bold ${isFault || isHot ? "text-rose-300" : "text-slate-200"}`}>
                  {data ? `${Number(data.temp_c).toFixed(1)}°C` : "42.0°C"}
                </div>
                <div className="text-[8px] font-mono text-slate-600">
                  {data ? `${Number(data.torque_nm).toFixed(0)} Nm` : "120 Nm"}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}

useGLTF.preload("/roboticArm.glb");
