"use client";

import dynamic from "next/dynamic";
import type { Stage } from "@/types";

const StageProgressChart = dynamic(() => import("./StageProgressChart").then((m) => m.StageProgressChart), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />,
});

export function StageProgressChartDynamic({ stages, locale }: { stages: Stage[]; locale?: "en" | "el" }) {
  return <StageProgressChart stages={stages} locale={locale} />;
}
