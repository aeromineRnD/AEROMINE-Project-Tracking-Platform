"use client";

import { useSession } from "next-auth/react";
import { FolderOpen, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDonutDynamic as StatusDonut } from "@/components/charts/StatusDonutDynamic";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { useProjects } from "@/lib/hooks/useProjects";
import { calcOverallProgress, type ProjectUpdate, type ProjectStatus } from "@/types";

const statIcons  = [FolderOpen, TrendingUp, CheckCircle, Clock];
const statBgs    = ["bg-blue-50", "bg-amber-50", "bg-green-50", "bg-purple-50"];
const statColors = ["text-blue-600", "text-amber-600", "text-green-600", "text-purple-600"];

export default function ClientDashboardPage() {
  const { data: session } = useSession();
  const { projects, isLoading } = useProjects();

  const inProgress  = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completed   = projects.filter((p) => p.status === "COMPLETED").length;
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
    { label: "Total Projects", value: projects.length },
    { label: "In Progress",    value: inProgress },
    { label: "Completed",      value: completed },
    { label: "Avg Progress",   value: `${avgProgress}%` },
  ];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-slate-500">Track your construction progress</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = statIcons[i];
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${statBgs[i]}`}>
                  <Icon className={`h-5 w-5 ${statColors[i]}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                  {isLoading
                    ? <Skeleton className="mt-1 h-7 w-12" />
                    : <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  }
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Active Projects</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-5 space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
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
            <CardContent>
              {isLoading
                ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                : <UpdateFeed updates={recentActivity} />
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
