"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, User, Box, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedProgress } from "@/components/ui/AnimatedProgress";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { MilestoneTracker } from "@/components/milestones/MilestoneTracker";
import { ModelViewerClient as ModelViewer } from "@/components/viewer/ModelViewerClient";
import { PhasePhotoGallery } from "@/components/viewer/PhasePhotoGallery";
import { useProject } from "@/lib/hooks/useProjects";
import { useT, useLanguage } from "@/lib/i18n/LanguageContext";
import {
  STATUS_LABELS, stageColor,
  type Phase, type PhaseStageSnapshot, type ProjectUpdate,
} from "@/types";

export default function ClientProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { project, isLoading } = useProject(id);
  const t = useT();
  const { locale } = useLanguage();
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [requested3D, setRequested3D]     = useState(false);
  const [requesting3D, setRequesting3D]   = useState(false);
  const [viewerMode, setViewerMode]       = useState<"photos" | "3d">("photos");

  useEffect(() => {
    if (project) {
      const phases = project.phases ?? [];
      if (phases.length > 0) setSelectedPhase(phases[phases.length - 1]);
    }
  }, [project?.id]);

  useEffect(() => {
    if (selectedPhase) {
      const photos: string[] = selectedPhase.photoUrls ? JSON.parse(selectedPhase.photoUrls) : [];
      setViewerMode(photos.length > 0 ? "photos" : "3d");
    }
  }, [selectedPhase?.id]);

  async function request3D() {
    setRequesting3D(true);
    await fetch(`/api/projects/${id}/request-3d`, { method: "POST" });
    setRequested3D(true);
    setRequesting3D(false);
  }

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        {t("loading")}
      </div>
    );
  }

  const phases = project.phases ?? [];
  const updates: ProjectUpdate[] = (project as any).updates ?? [];
  const milestones = (project as any).milestones ?? [];
  const statusInfo = STATUS_LABELS[project.status];

  // Live stages — always current, used for Stage Progress bars and overall %
  const liveStages = (project.stages ?? []).map((s) => ({
    nameEn: s.nameEn, nameEl: s.nameEl, progress: s.progress,
  }));

  // Snapshot stages — used only for 3D viewer placeholder colouring
  const snapshotStages: PhaseStageSnapshot[] = selectedPhase
    ? JSON.parse(selectedPhase.stageSnapshot)
    : liveStages;

  const overallProgress = liveStages.length
    ? Math.round(liveStages.reduce((s, st) => s + st.progress, 0) / liveStages.length)
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
                {statusInfo[locale]}
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
          <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">{t("overallProgress")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* 3D Viewer card — or request card if no phases yet */}
          {phases.length === 0 ? (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-aeromine-400" />
                  <CardTitle className="text-base">{t("threeConstructionModel")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-8 flex flex-col items-center text-center gap-4">
                {requested3D ? (
                  <>
                    <CheckCircle className="h-10 w-10 text-green-500" />
                    <div>
                      <p className="font-semibold text-slate-800">{t("requestSent")}</p>
                      <p className="text-sm text-slate-500 mt-1">{t("projectManagerNotified")}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-14 w-14 rounded-full bg-aeromine-50 flex items-center justify-center">
                      <Box className="h-7 w-7 text-aeromine-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{t("no3DModelYet")}</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-xs">{t("droneWalkthroughInfo")}</p>
                    </div>
                    <button
                      onClick={request3D}
                      disabled={requesting3D}
                      className="rounded-lg bg-aeromine-600 hover:bg-aeromine-700 disabled:opacity-60 text-white px-5 py-2 text-sm font-medium transition-colors"
                    >
                      {requesting3D ? t("sendingRequest") : t("request3DWalkthrough")}
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base">{t("threeConstructionModel")}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">{t("viewPhase")}</span>
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
                        <span className="ml-1.5 font-normal opacity-75">{phase.overallProgress}%</span>
                      </button>
                    ))}
                  </div>
                </div>
                {selectedPhase && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("droneCapture", { date: format(new Date(selectedPhase.capturedAt), "MMMM d, yyyy") })}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  const photos: string[] = selectedPhase?.photoUrls ? JSON.parse(selectedPhase.photoUrls) : [];
                  const hasPhotos = photos.length > 0;
                  const hasModel  = !!selectedPhase?.modelPath;
                  return (
                    <>
                      {hasPhotos && hasModel && (
                        <div className="flex gap-1 px-4 pt-3">
                          {(["photos", "3d"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setViewerMode(mode)}
                              className={`rounded-lg px-3 py-1 text-xs font-semibold border transition-colors ${
                                viewerMode === mode
                                  ? "bg-aeromine-600 text-white border-aeromine-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-aeromine-400"
                              }`}
                            >
                              {mode === "photos" ? "Photos" : "3D Model"}
                            </button>
                          ))}
                        </div>
                      )}
                      {hasPhotos && (!hasModel || viewerMode === "photos") ? (
                        <PhasePhotoGallery photos={photos} />
                      ) : (
                        <ModelViewer
                          stages={(project.stages ?? []).map((s, i) => ({
                            ...s,
                            progress: snapshotStages[i]?.progress ?? s.progress,
                          }))}
                          modelUrl={selectedPhase?.modelPath ?? null}
                        />
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Stage Progress bars */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("stageProgress")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {liveStages.map((stage) => (
                <div key={stage.nameEn} className="flex items-center gap-3">
                  <span className="w-36 flex-shrink-0 text-sm text-slate-600 truncate">
                    {locale === "el" ? stage.nameEl : stage.nameEn}
                  </span>
                  <AnimatedProgress
                    value={stage.progress}
                    color={stageColor(stage.progress)}
                    className="flex-1 h-3"
                  />
                  <span className="w-10 flex-shrink-0 text-right text-sm font-semibold text-slate-700">
                    {stage.progress}%
                  </span>
                </div>
              ))}

            </CardContent>
          </Card>

          {/* Overall Completion bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("overallCompletion")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">{t("progress")}</span>
                <span className="font-bold text-slate-900">{overallProgress}%</span>
              </div>
              <AnimatedProgress value={overallProgress} className="h-3" />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>{t("started", { date: format(new Date(project.startDate), "MMM d, yyyy") })}</span>
                <span>{t("target", { date: format(new Date(project.estimatedEnd), "MMM d, yyyy") })}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("projectUpdates")}</CardTitle>
            </CardHeader>
            <CardContent>
              <UpdateFeed updates={updates} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("milestones")}</CardTitle>
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
