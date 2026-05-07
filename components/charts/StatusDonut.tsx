"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ProjectStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

interface Props {
  counts: Partial<Record<ProjectStatus, number>>;
}

const COLORS: Record<ProjectStatus, string> = {
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#22c55e",
  DELAYED: "#ef4444",
};

export function StatusDonut({ counts }: Props) {
  const data = (Object.keys(counts) as ProjectStatus[])
    .filter((k) => (counts[k] ?? 0) > 0)
    .map((k) => ({ name: STATUS_LABELS[k].en, value: counts[k]!, color: COLORS[k] }));

  if (!data.length) return <p className="text-sm text-slate-400 text-center py-8">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip formatter={(v) => [v, "Projects"]} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
