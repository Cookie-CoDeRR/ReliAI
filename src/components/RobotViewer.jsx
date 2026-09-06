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
      "transformation"
    ];

    clone.traverse((child) => {
      const name = (child.name || "").toLowerCase();

      if (hideKeywords.some((key) => name.includes(key))) {
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
            name.includes(activeFaultJoint.toLowerCase()) ||
            (
              activeFaultJoint.includes("Joint_3") &&
              (
                name.includes("joint3") ||
                name.includes("elbow") ||
                name.includes("arm_2") ||
                name.includes("kuka_3")
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

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const targetHeight = 3.35;
    const scale =
      size.y > 0
        ? targetHeight / size.y
        : 1;

    return {
      object: clone,
      scale,
      center,
      minY: box.min.y
    };
  }, [scene, activeFaultJoint]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;

    groupRef.current.rotation.y =
      Math.sin(t * 0.16) * 0.035;

    groupRef.current.position.y =
      isLevitating
        ? Math.sin(t * 1.5) * 0.025 - 1.08
        : -1.08;
  });

  return (
    <group
      ref={groupRef}
      scale={prepared.scale}
      position={[0, -1.08, 0]}
    >
      <primitive
        object={prepared.object}
        position={[
          -prepared.center.x,
          -prepared.minY,
          -prepared.center.z
        ]}
      />
    </group>
  );
}

export default function RobotViewer({
  activeFaultJoint = null,
  jointsData = {},
  isLevitating = false
}) {
  return (
    <section className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800/90 bg-[#040913] shadow-2xl">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-500/[0.04] to-transparent" />

        <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-cyan-500/[0.035]" />

        <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-indigo-500/[0.04]" />
      </div>

      {/* HUD */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-cyan-500/25 bg-[#07111d]/90 backdrop-blur-xl text-[9px] font-mono text-cyan-300">
            <ScanLine className="w-3.5 h-3.5" />
            DIGITAL TWIN
            <span className="text-slate-600">/</span>
            KUKA KR-210
          </div>

          {activeFaultJoint && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/35 bg-rose-950/70 backdrop-blur-xl text-[9px] font-mono text-rose-300">
              <Flame className="w-3.5 h-3.5" />
              {activeFaultJoint} ANOMALY
            </div>
          )}

        </div>

        <div className="flex items-center gap-2">

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-800 bg-slate-950/75 text-[8px] font-mono text-slate-500">
            <Crosshair className="w-3 h-3 text-cyan-500" />
            LIVE FAULT LOCALIZATION
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-800 bg-slate-950/75 text-[8px] font-mono text-slate-500">
            <Maximize2 className="w-3 h-3" />
            DRAG • ZOOM
          </div>

        </div>
      </div>

      {/* 3D */}
      <Canvas
        dpr={[1, 1.35]}
        shadows
        camera={{
          position: [4.6, 2.65, 4.8],
          fov: 33,
          near: 0.1,
          far: 100
        }}
        gl={{
          powerPreference: "high-performance",
          antialias: true
        }}
      >
        <ambientLight intensity={0.82} />

        <hemisphereLight
          intensity={0.75}
          color="#dbeafe"
          groundColor="#07101c"
        />

        <directionalLight
          position={[4, 7, 5]}
          intensity={2.15}
          castShadow
        />

        <pointLight
          position={[-3, 2.5, -2]}
          color="#22d3ee"
          intensity={1.8}
        />

        <pointLight
          position={[3, 2, 2]}
          color="#6366f1"
          intensity={1.05}
        />

        {activeFaultJoint && (
          <pointLight
            position={[0.3, 1.3, 0]}
            color="#fb7185"
            intensity={4}
            distance={5}
          />
        )}

        <PreparedRobot
          activeFaultJoint={activeFaultJoint}
          isLevitating={isLevitating}
        />

        <gridHelper
          args={[
            9,
            28,
            "#183149",
            "#0b1726"
          ]}
          position={[0, -1.075, 0]}
        />

        <ContactShadows
          position={[0, -1.07, 0]}
          opacity={0.38}
          scale={8}
          blur={2.8}
          far={5}
        />

        <OrbitControls
          makeDefault
          target={[0, 0.55, 0]}
          enableDamping
          dampingFactor={0.07}
          enablePan={false}
          minDistance={2.5}
          maxDistance={7}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2.04}
        />

        <Environment preset="city" />
      </Canvas>

      {/* Joint telemetry dock */}
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

          const isFault =
            activeFaultJoint
              ?.toLowerCase()
              .includes(key.toLowerCase());

          const isHot =
            data &&
            Number(data.temp_c) > 65;

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

                {(isFault || isHot) && (
                  <Flame className="w-2.5 h-2.5 text-rose-400" />
                )}
              </div>

              <div className={`mt-0.5 text-[11px] font-mono font-bold ${
                isFault || isHot
                  ? "text-rose-300"
                  : "text-slate-200"
              }`}>
                {data
                  ? `${Number(data.temp_c).toFixed(1)}°C`
                  : "42.0°C"}
              </div>

              <div className="text-[8px] font-mono text-slate-600">
                {data
                  ? `${Number(data.torque_nm).toFixed(0)} Nm`
                  : "120 Nm"}
              </div>
            </div>
          );
        })}

      </div>

    </section>
  );
}

useGLTF.preload("/roboticArm.glb");
