"use client";

import dynamic from "next/dynamic";
import type { Stage } from "@/types";

// Three.js / React Three Fiber must NEVER run on the server (SSR).
// This wrapper ensures the Canvas is only mounted in the browser.
const ModelViewer = dynamic(
  () => import("./ModelViewer").then((m) => ({ default: m.ModelViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] bg-[#0f172a] flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="h-8 w-8 border-2 border-aeromine-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading 3D model…</p>
        </div>
      </div>
    ),
  }
);

interface Props {
  stages: Stage[];
  modelUrl?: string | null;
  selectedStageId?: string;
}

export function ModelViewerClient(props: Props) {
  return <ModelViewer {...props} />;
}
