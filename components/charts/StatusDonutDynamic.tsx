"use client";

import dynamic from "next/dynamic";
import type { ProjectStatus } from "@/types";

const StatusDonut = dynamic(() => import("./StatusDonut").then((m) => m.StatusDonut), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse rounded-lg bg-slate-100" />,
});

export function StatusDonutDynamic({ counts }: { counts: Partial<Record<ProjectStatus, number>> }) {
  return <StatusDonut counts={counts} />;
}
