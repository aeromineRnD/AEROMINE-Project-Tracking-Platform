"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF } from "@react-three/drei";
import type { Stage } from "@/types";
import { stageColor } from "@/types";

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function PlaceholderBuilding({ stages }: { stages: Stage[] }) {
  const boxes = stages.slice(0, Math.min(stages.length, 6));
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {boxes.map((stage, i) => {
        const w = 2.4 - i * 0.12;
        return (
          <mesh key={stage.id} position={[0, i * 0.7 + 0.35, 0]} castShadow>
            <boxGeometry args={[w, 0.65, w]} />
            <meshStandardMaterial
              color={stageColor(stage.progress)}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

interface Props {
  stages: Stage[];
  /** Direct URL to a .gltf file — if provided, loads it instead of the placeholder. */
  modelUrl?: string | null;
  /** Legacy: stage-based model selection (used by admin detail page). */
  selectedStageId?: string;
}

export function ModelViewer({ stages, modelUrl, selectedStageId }: Props) {
  // Support both usage patterns:
  // 1. Client page: passes modelUrl directly from selected Phase
  // 2. Admin page: passes selectedStageId → derives URL from that stage
  const resolvedUrl =
    modelUrl !== undefined
      ? modelUrl
      : (stages.find((s) => s.id === selectedStageId)?.modelPath ?? null);

  return (
    <div className="relative w-full h-[420px] bg-[#0f172a]">
      {/* Colour legend — top-left */}
      <div className="absolute top-3 left-3 z-10 rounded-lg bg-black/60 px-3 py-2 text-xs text-white space-y-1 pointer-events-none">
        {[
          { label: "Completed",   color: "#22c55e" },
          { label: "In Progress", color: "#f59e0b" },
          { label: "Not Started", color: "#94a3b8" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Stage progress overlay — bottom-left */}
      {stages.length > 0 && (
        <div className="absolute bottom-10 left-3 z-10 rounded-lg bg-black/60 px-3 py-2 text-xs text-white space-y-1 pointer-events-none">
          {stages.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: stageColor(s.progress) }} />
              <span className="truncate max-w-[120px]">{s.nameEn}</span>
              <span className="ml-auto pl-3 font-semibold">{s.progress}%</span>
            </div>
          ))}
          {stages.length > 5 && (
            <p className="text-slate-400 text-[10px] mt-0.5">+{stages.length - 5} more stages</p>
          )}
        </div>
      )}

      <p className="absolute bottom-3 right-3 z-10 text-[11px] text-slate-500 pointer-events-none">
        Drag to rotate · Scroll to zoom
      </p>

      <Canvas shadows camera={{ position: [8, 6, 8], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.4} castShadow />
        <Grid
          args={[20, 20]}
          position={[0, -0.06, 0]}
          cellColor="#1e3a5f"
          sectionColor="#1e3a5f"
          fadeDistance={25}
        />

        <Suspense fallback={null}>
          {resolvedUrl ? (
            <GltfModel url={resolvedUrl} />
          ) : (
            <PlaceholderBuilding stages={stages} />
          )}
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}
