"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { MilestoneTracker } from "@/components/milestones/MilestoneTracker";
import { ModelViewerClient as ModelViewer } from "@/components/viewer/ModelViewerClient";
import {
  STATUS_LABELS, stageColor,
  type Project, type Phase, type PhaseStageSnapshot, type ProjectUpdate,
} from "@/types";

export default function ClientProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d: Project) => {
        setProject(d);
        const phases = d.phases ?? [];
        // Default: most recent phase (last by order)
        if (phases.length > 0) setSelectedPhase(phases[phases.length - 1]);
      });
  }, [id]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading project…
      </div>
    );
  }

  const phases = project.phases ?? [];
  const updates: ProjectUpdate[] = (project as any).updates ?? [];
  const milestones = (project as any).milestones ?? [];
  const statusInfo = STATUS_LABELS[project.status];

  // Stage rows: from selected phase snapshot, or fall back to current stage values
  const activeStages: PhaseStageSnapshot[] = selectedPhase
    ? JSON.parse(selectedPhase.stageSnapshot)
    : (project.stages ?? []).map((s) => ({ nameEn: s.nameEn, nameEl: s.nameEl, progress: s.progress }));

  const overallProgress = selectedPhase
    ? selectedPhase.overallProgress
    : activeStages.length
      ? Math.round(activeStages.reduce((s, st) => s + st.progress, 0) / activeStages.length)
      : 0;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/client/projects">
            <button className="mt-1 text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <Badge
                variant={
                  project.status === "IN_PROGRESS" ? "inprogress"
                  : project.status === "COMPLETED"  ? "completed"
                  : "delayed"
                }
              >
                {statusInfo.en}
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />{project.location}
              </span>
              {(project as any).admin && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />{(project as any).admin.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(project.startDate), "MMM d, yyyy")}
              </span>
              <span className="text-slate-400">
                Est. {format(new Date(project.estimatedEnd), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>

        {/* Big overall % — top right, matching the reference */}
        <div className="text-right flex-shrink-0">
          <p className="text-4xl font-bold text-aeromine-600 leading-none">{overallProgress}%</p>
          <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">Overall Progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* 3D Viewer card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base">3D Construction Model</CardTitle>

                {/* Phase selector buttons */}
                {phases.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">View phase:</span>
                    {phases.map((phase) => (
                      <button
                        key={phase.id}
                        onClick={() => setSelectedPhase(phase)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                          selectedPhase?.id === phase.id
                            ? "bg-aeromine-600 text-white border-aeromine-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-aeromine-400 hover:text-aeromine-600"
                        }`}
                      >
                        {phase.name}
                        <span className="ml-1.5 font-normal opacity-75">
                          {phase.overallProgress}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPhase && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Drone capture: {format(new Date(selectedPhase.capturedAt), "MMMM d, yyyy")}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ModelViewer
                stages={(project.stages ?? []).map((s, i) => ({
                  ...s,
                  progress: activeStages[i]?.progress ?? s.progress,
                }))}
                modelUrl={selectedPhase?.modelPath ?? null}
              />
            </CardContent>
          </Card>

          {/* Stage Progress bars */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stage Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {activeStages.map((stage) => (
                <div key={stage.nameEn} className="flex items-center gap-3">
                  <span className="w-36 flex-shrink-0 text-sm text-slate-600 truncate">
                    {stage.nameEn}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${stage.progress}%`,
                        backgroundColor: stageColor(stage.progress),
                      }}
                    />
                  </div>
                  <span className="w-10 flex-shrink-0 text-right text-sm font-semibold text-slate-700">
                    {stage.progress}%
                  </span>
                </div>
              ))}

              {/* Dot summary row — matches the reference screenshot */}
              <div className="flex flex-wrap gap-x-5 gap-y-3 pt-3 mt-2 border-t">
                {activeStages.map((stage) => (
                  <div key={stage.nameEn} className="flex flex-col items-center gap-1 min-w-[60px]">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stageColor(stage.progress) }}
                    />
                    <span className="text-[10px] text-slate-400 text-center leading-tight">
                      {stage.nameEn}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{stage.progress}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Completion bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Overall Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-slate-900">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>Started {format(new Date(project.startDate), "MMM d, yyyy")}</span>
                <span>Target {format(new Date(project.estimatedEnd), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Project Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <UpdateFeed updates={updates} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTracker milestones={milestones} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
