"use client";

import { Suspense, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF } from "@react-three/drei";
import type { Stage } from "@/types";
import { stageColor } from "@/types";

// ── Error boundary — catches model load failures, shows placeholder ──────────
class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

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
  modelUrl?: string | null;
  selectedStageId?: string;
}

export function ModelViewer({ stages, modelUrl, selectedStageId }: Props) {
  const resolvedUrl =
    modelUrl !== undefined
      ? modelUrl
      : (stages.find((s) => s.id === selectedStageId)?.modelPath ?? null);

  const placeholder = <PlaceholderBuilding stages={stages} />;

  return (
    <div className="relative w-full h-[420px] bg-[#0f172a]">
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
            <ModelErrorBoundary fallback={placeholder}>
              <GltfModel url={resolvedUrl} />
            </ModelErrorBoundary>
          ) : (
            placeholder
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
