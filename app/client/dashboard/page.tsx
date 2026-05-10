"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FolderOpen, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDonut } from "@/components/charts/StatusDonut";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { calcOverallProgress, type Project, type ProjectUpdate, type ProjectStatus } from "@/types";

export default function ClientDashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => { setProjects(d); setLoading(false); });
  }, []);

  const inProgress = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completed  = projects.filter((p) => p.status === "COMPLETED").length;
  const avgProgress = projects.length
    ? Math.round(projects.reduce((s, p) => s + calcOverallProgress(p.stages ?? []), 0) / projects.length)
    : 0;

  const statusCounts = {
    IN_PROGRESS: inProgress,
    COMPLETED:   completed,
    DELAYED:     projects.filter((p) => p.status === "DELAYED").length,
  } as Partial<Record<ProjectStatus, number>>;

  const recentActivity: ProjectUpdate[] = projects
    .flatMap((p) => (p as any).updates ?? [])
    .sort((a: ProjectUpdate, b: ProjectUpdate) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    { label: "Total Projects", value: projects.length, icon: FolderOpen,  color: "text-blue-600",  bg: "bg-blue-50" },
    { label: "In Progress",    value: inProgress,       icon: TrendingUp,  color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Completed",      value: completed,        icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg Progress",   value: `${avgProgress}%`, icon: Clock,      color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-slate-500">Track your construction progress</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{loading ? "—" : s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Active Projects</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} href={`/client/projects/${p.id}`} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Project Status</CardTitle></CardHeader>
            <CardContent><StatusDonut counts={statusCounts} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent><UpdateFeed updates={recentActivity} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
