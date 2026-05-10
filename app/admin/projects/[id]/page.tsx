"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StageProgressChartDynamic as StageProgressChart } from "@/components/charts/StageProgressChartDynamic";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { MilestoneTracker } from "@/components/milestones/MilestoneTracker";
import { ModelViewerClient as ModelViewer } from "@/components/viewer/ModelViewerClient";
import { useProject } from "@/lib/hooks/useProjects";
import { calcOverallProgress, STATUS_LABELS, type Project, type Phase, type Stage, type ProjectUpdate } from "@/types";

export default function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { project: swrProject, isLoading, mutate } = useProject(id);
  const [project, setProject]             = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [postTitle, setPostTitle]         = useState("");
  const [postContent, setPostContent]     = useState("");
  const [posting, setPosting]             = useState(false);

  // Milestone add form
  const [msTitle, setMsTitle]       = useState("");
  const [msDueDate, setMsDueDate]   = useState("");
  const [msDesc, setMsDesc]         = useState("");
  const [msStageId, setMsStageId]   = useState("");
  const [showMsForm, setShowMsForm] = useState(false);
  const [addingMs, setAddingMs]     = useState(false);

  // Hydrate local state from SWR on first load
  useEffect(() => {
    if (swrProject && !project) {
      setProject(swrProject);
      const phases = swrProject.phases ?? [];
      if (phases.length > 0) setSelectedPhase(phases[phases.length - 1]);
    }
  }, [swrProject]);

  async function updateStageProgress(stageId: string, progress: number) {
    await fetch(`/api/projects/${id}/stages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId, progress }),
    });

    setProject((prev) => {
      if (!prev) return prev;
      const updatedStages = prev.stages!.map((s) =>
        s.id === stageId ? { ...s, progress } : s
      );
      const allDone = updatedStages.every((s) => s.progress === 100);
      const now = new Date().toISOString();

      // When project completes, mark all pending milestones as done instantly
      const updatedMilestones = allDone
        ? ((prev as any).milestones ?? []).map((m: any) =>
            m.completed ? m : { ...m, completed: true, completedAt: now }
          )
        : (prev as any).milestones;

      return {
        ...prev,
        stages: updatedStages,
        status: allDone ? "COMPLETED" : "IN_PROGRESS",
        milestones: updatedMilestones,
      };
    });
  }

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/projects/${id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: postTitle, content: postContent, type: "TEXT" }),
    });
    if (res.ok) {
      const update = await res.json();
      setProject((prev) => prev ? { ...prev, updates: [update, ...(prev as any).updates ?? []] } : prev);
      setPostTitle(""); setPostContent("");
    }
    setPosting(false);
  }

  async function deleteProject() {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/admin/projects");
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!msTitle.trim() || !msDueDate) return;
    setAddingMs(true);
    const res = await fetch(`/api/projects/${id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: msTitle, description: msDesc, dueDate: msDueDate, stageId: msStageId || null }),
    });
    if (res.ok) {
      const ms = await res.json();
      setProject((prev) => prev
        ? { ...prev, milestones: [...((prev as any).milestones ?? []), ms] }
        : prev
      );
      setMsTitle(""); setMsDueDate(""); setMsDesc(""); setMsStageId(""); setShowMsForm(false);
    }
    setAddingMs(false);
  }

  if (isLoading || !project) return <div className="text-sm text-slate-400">Loading…</div>;

  const stages: Stage[]         = project.stages ?? [];
  const phases: Phase[]         = project.phases ?? [];
  const updates: ProjectUpdate[] = (project as any).updates ?? [];
  const milestones               = (project as any).milestones ?? [];
  const overall                  = calcOverallProgress(stages);
  const statusInfo               = STATUS_LABELS[project.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/projects">
            <button className="mt-1 text-slate-400 hover:text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <Badge variant={project.status === "IN_PROGRESS" ? "inprogress" : project.status === "COMPLETED" ? "completed" : "delayed"}>
                {statusInfo.en}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>📍 {project.location}</span>
              <span>📅 Started {format(new Date(project.startDate), "MMM d, yyyy")}</span>
              <span>🎯 Est. {format(new Date(project.estimatedEnd), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/projects/${id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4" /> Edit</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={deleteProject} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 3D Viewer — uses phase models, same as client view */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">3D Construction Model</CardTitle>

            {phases.length > 0 ? (
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
                    <span className="ml-1.5 font-normal opacity-75">{phase.overallProgress}%</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No drone captures uploaded yet</p>
            )}
          </div>
          {selectedPhase && (
            <p className="text-xs text-slate-400 mt-0.5">
              Drone capture: {format(new Date(selectedPhase.capturedAt), "MMMM d, yyyy")}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ModelViewer stages={stages} modelUrl={selectedPhase?.modelPath ?? null} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stage Progress + sliders */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Stage Progress</CardTitle></CardHeader>
            <CardContent>
              <StageProgressChart stages={stages} />
              <div className="mt-6 space-y-3 border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Update Stage Progress</p>
                {stages.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-40 truncate text-xs text-slate-600">{s.nameEn}</span>
                    <input
                      type="range" min={0} max={100} step={5}
                      value={s.progress}
                      onChange={(e) => updateStageProgress(s.id, Number(e.target.value))}
                      className="flex-1 accent-aeromine-600"
                    />
                    <span className="w-10 text-right text-xs font-medium">{s.progress}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Completion */}
          <Card>
            <CardHeader><CardTitle>Overall Completion</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-semibold text-slate-900">{overall}%</span>
              </div>
              <Progress value={overall} className="h-3" />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>Started {format(new Date(project.startDate), "MMM d, yyyy")}</span>
                <span>Target {format(new Date(project.estimatedEnd), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Post Update */}
          <Card>
            <CardHeader><CardTitle>Post an Update</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={postUpdate} className="space-y-3">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                  placeholder="Update title"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 resize-none"
                  placeholder="Describe the progress…"
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={posting}>
                  <Plus className="h-4 w-4" /> {posting ? "Posting…" : "Post Update"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Project Updates</CardTitle></CardHeader>
            <CardContent><UpdateFeed updates={updates} /></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Milestones</CardTitle>
                <button
                  onClick={() => setShowMsForm((v) => !v)}
                  className="text-xs text-aeromine-600 hover:text-aeromine-800 font-medium transition-colors"
                >
                  {showMsForm ? "Cancel" : "+ Add"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Prominent prompt when no milestones yet */}
              {milestones.length === 0 && !showMsForm && (
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center">
                  <p className="text-sm text-slate-500 mb-2">No milestones set yet.</p>
                  <button
                    onClick={() => setShowMsForm(true)}
                    className="text-xs font-semibold text-aeromine-600 hover:text-aeromine-800 transition-colors"
                  >
                    + Add first milestone
                  </button>
                </div>
              )}

              {/* Inline add form */}
              {showMsForm && (
                <form onSubmit={addMilestone} className="space-y-2 rounded-lg border border-aeromine-200 bg-aeromine-50 p-3">
                  <input
                    required
                    placeholder="Milestone title"
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white"
                  />
                  <input
                    type="date"
                    required
                    value={msDueDate}
                    onChange={(e) => setMsDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white"
                  />
                  {/* Stage link — auto-completes milestone when stage hits 100% */}
                  <select
                    value={msStageId}
                    onChange={(e) => setMsStageId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white"
                  >
                    <option value="">No stage link (manual or project completion)</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameEn}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Description (optional)"
                    value={msDesc}
                    onChange={(e) => setMsDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white resize-none"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addingMs}>
                      {addingMs ? "Saving…" : "Save Milestone"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMsForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <MilestoneTracker milestones={milestones} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Assigned Clients</CardTitle></CardHeader>
            <CardContent>
              {(project.clients ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No clients assigned.</p>
              ) : (
                <div className="space-y-2">
                  {(project.clients ?? []).map((c: any) => (
                    <div key={c.client.id} className="flex items-center gap-2 text-sm">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aeromine-100 text-aeromine-700 text-xs font-semibold">
                        {c.client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{c.client.name}</p>
                        <p className="text-xs text-slate-400">{c.client.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
