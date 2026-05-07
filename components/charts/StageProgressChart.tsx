"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Stage } from "@/types";
import { stageColor } from "@/types";

interface Props {
  stages: Stage[];
  locale?: "en" | "el";
}

export function StageProgressChart({ stages, locale = "en" }: Props) {
  const data = stages.map((s) => ({
    name: locale === "el" ? s.nameEl : s.nameEn,
    progress: s.progress,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [`${v}%`, "Progress"]} />
        <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={stageColor(entry.progress)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
